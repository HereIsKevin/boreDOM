export { Component, EventHandler, attribute, boundMethod, customElement, html };

import * as dom from "./dom";

type EventHandler = (event: Event) => void;
type Constructable<T> = { new (): T };

declare global {
  interface Window {
    eventHandlers?: { [key: string]: EventHandler };
    eventHandlersCount?: number;
  }
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
  target: object,
  key: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  let method: Function = descriptor.value;
  let cache: Function | undefined = undefined;
  let updated = true;

  return {
    configurable: true,
    get(): Function {
      if (updated || typeof cache === "undefined") {
        const bound = method.bind(this);
        cache = bound;
        updated = false;
        return bound;
      } else {
        return cache;
      }
    },
    set(value: Function): void {
      method = value;
      updated = true;
    },
  };
}

function attribute(target: Component, key: string): void {
  let primitiveType = "string";

  Object.defineProperty(target, key, {
    get(): string | number | boolean {
      if (!(this instanceof Component)) {
        throw new TypeError("attribute decorator must be used on Component");
      }

      const attribute: string | null = this.getAttribute(key);

      if (typeof attribute !== "string") {
        throw new Error(`attribute ${key} does not exist`);
      }

      switch (typeof attribute) {
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
        this.setAttribute(key, String(value));
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

  public constructor() {
    super();

    this.root = this.attachShadow({ mode: "open" });
  }

  public get properties(): { [key: string]: string } {
    return new Proxy(
      {},
      {
        get: (target: object, name: string): string =>
          this.getAttribute(name) || "",
        set: (target: object, name: string, value: string): boolean => {
          this.setAttribute(name, value);
          return true;
        },
      }
    );
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

  protected connected(): void {}

  protected disconnected(): void {}

  protected changed(name: string, oldValue: string, newValue: string): void {}

  protected update(): void {
    dom.render(this.root, this.render());
  }

  protected render(): DocumentFragment {
    throw new Error("render is not implemented");
  }
}
