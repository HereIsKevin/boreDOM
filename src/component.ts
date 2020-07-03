export {
  Component,
  EventHandler,
  attribute,
  attributes,
  boundMethod,
  customElement,
  html,
};

import * as dom from "./dom";

type EventHandler = (event: Event) => void;
type Constructable<T> = { new (): T };

declare global {
  interface Window {
    eventHandlers?: { [key: string]: EventHandler };
    eventHandlersCount?: number;
  }
}

function toKebabCase(value: string): string {
  if (/[A-Z]/.test(value[0])) {
    throw new Error("cannot start with uppercase character");
  }

  if (!/^[A-Za-z]+$/.test(value)) {
    throw new Error("may only contain alphabetical characters");
  }

  return value.replace(/[A-Z]/g, "-$&").toLowerCase();
}

function attributes(value: string[]): string[] {
  return value.map((x) => toKebabCase(x));
}

function html(
  strings: TemplateStringsArray,
  ...values: (EventHandler | string | number | boolean)[]
): DocumentFragment {
  const output: string[] = [strings[0]];

  for (const [index, item] of strings.slice(1, strings.length).entries()) {
    const value: EventHandler | string | number | boolean = values[index];

    if (typeof value === "string") {
      output.push(value);
    } else if (typeof value === "number" || typeof value === "boolean") {
      output.push(String(value));
    } else {
      output.push(`"${eventHandler(value)}(event);"`);
    }

    output.push(item);
  }

  return dom.html(output.join(""));
}

function boundMethod(
  target: Component,
  key: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  let method: EventHandler = descriptor.value;
  let cache: EventHandler | undefined = undefined;
  let updated = true;

  return {
    configurable: true,
    get(): EventHandler {
      if (updated || typeof cache === "undefined") {
        const bound = method.bind(this);
        cache = bound;
        updated = false;
        return bound;
      } else {
        return cache;
      }
    },
    set(value: EventHandler): void {
      method = value;
      updated = true;
    },
  };
}

function attribute(target: Component, key: string): void {
  let primitiveType = "string";

  if (!target.constructor.hasOwnProperty("observedAttributes")) {
    Object.defineProperty(target.constructor, "observedAttributes", {
      value: [],
    });
  }

  (target.constructor as typeof Component).observedAttributes.push(
    toKebabCase(key)
  );

  Object.defineProperty(target, key, {
    get(): string | number | boolean {
      if (!(this instanceof Component)) {
        throw new TypeError("attribute decorator must be used on Component");
      }

      const attribute: string | null = this.getAttribute(toKebabCase(key));

      if (typeof attribute !== "string") {
        throw new Error(`attribute ${key} does not exist`);
      }

      switch (primitiveType) {
        case "number":
          return Number(attribute);
          break;
        case "boolean":
          if (attribute === "true") {
            return true;
          } else if (attribute === "false") {
            return false;
          } else {
            return Boolean(attribute);
          }
          break;
        default:
          return String(attribute);
          break;
      }
    },
    set(value: string | number | boolean): void {
      primitiveType = typeof value;

      if (this instanceof Component) {
        this.setAttribute(toKebabCase(key), String(value));
      } else {
        throw new TypeError("attribute decorator must be used on Component");
      }
    },
  });
}

function customElement<T extends Component>(
  name: string
): <T extends Component>(component: Constructable<T>) => void {
  return <T extends Component>(component: Constructable<T>): void =>
    window.customElements.define(name, component);
}

function eventHandler(handler: EventHandler): string {
  if (typeof window.eventHandlers === "undefined") {
    window.eventHandlers = {};
  }

  if (typeof window.eventHandlersCount === "undefined") {
    window.eventHandlersCount = 0;
  }

  const handlerName: string | undefined = Object.keys(
    window.eventHandlers
  ).find((key: string): boolean =>
    typeof window.eventHandlers === "undefined"
      ? false
      : window.eventHandlers[key] === handler
  );

  if (typeof handlerName === "undefined") {
    window.eventHandlersCount++;

    const count: number = window.eventHandlersCount;
    window.eventHandlers[`handler${count}`] = handler;

    return `window.eventHandlers.handler${count}`;
  } else {
    return `window.eventHandlers.${handlerName}`;
  }
}

class Component extends HTMLElement {
  protected root: ShadowRoot;

  public static observedAttributes: string[] = [];
  private propertyTypes: { [key: string]: string };

  public constructor() {
    super();

    this.root = this.attachShadow({ mode: "open" });
    this.propertyTypes = {};
  }

  public get properties(): { [key: string]: string | number | boolean } {
    return new Proxy(
      {},
      {
        get: (
          target: { [key: string]: string },
          name: string
        ): string | number | boolean => {
          const attribute: string | null = this.getAttribute(toKebabCase(name));

          if (typeof attribute !== "string") {
            throw new Error(`attribute ${name} does not exist`);
          }

          switch (this.propertyTypes[name]) {
            case "number":
              return Number(attribute);
              break;
            case "boolean":
              if (attribute === "true") {
                return true;
              } else if (attribute === "false") {
                return false;
              } else {
                return Boolean(attribute);
              }
              break;
            default:
              return String(attribute);
              break;
          }
        },
        set: (
          target: { [key: string]: string | number | boolean },
          name: string,
          value: string | number | boolean
        ): boolean => {
          this.propertyTypes[name] = typeof value;
          this.setAttribute(toKebabCase(name), String(value));
          return true;
        },
      }
    );
  }

  public set properties(properties: {
    [key: string]: string | number | boolean;
  }) {
    for (const [name, value] of Object.entries(properties)) {
      this.propertyTypes[name] = typeof value;
      this.setAttribute(toKebabCase(name), String(value));
    }
  }

  private connectedCallback(): void {
    this.connected();
    this.update();
  }

  private disconnectedCallback(): void {
    this.disconnected();
  }

  private attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    this.changed(name, oldValue, newValue);
    this.update();
  }

  protected connected(): void {
    // optional connected callback to be implemented in subclass
  }

  protected disconnected(): void {
    // optional disconnected callback to be implemented in subclass
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */

  protected changed(name: string, oldValue: string, newValue: string): void {
    // optional changed callback to be implemented in subclass
  }

  /* eslint-enable @typescript-eslint/no-unused-vars */

  protected update(): void {
    dom.render(this.root, this.render());
  }

  protected render(): DocumentFragment {
    throw new Error("render is not implemented");
  }
}
