export { Component, bound, element, html, property, state };

import * as dom from "./dom";

declare global {
  interface Window {
    eventHandlers?: { [key: string]: EventHandler };
    eventHandlersCount?: number;
  }
}

interface Component {
  constructor: typeof Component;
}

type EventHandler = <T extends Event>(event: T) => void;
type Constructable<T> = new () => T;
type Primitive = string | number | boolean;
type Structure = Record<string, unknown> | unknown[];

function isPrimitive(value: unknown): value is Primitive {
  return ["string", "number", "boolean"].includes(typeof value);
}

function bindHandler(handler: EventHandler): string {
  // initialize handlers object if it does not exist
  if (typeof window.eventHandlers === "undefined") {
    window.eventHandlers = {};
  }

  // initialize count if it does not exist
  if (typeof window.eventHandlersCount === "undefined") {
    window.eventHandlersCount = 0;
  }

  // find name of first matched handler in handlers object
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

    // bind new handler it does not already exist
    window.eventHandlers[`handler$${count}`] = handler;

    return `window.eventHandlers.handler$${count}`;
  } else {
    // return existing handler otherwise
    return `window.eventHandlers.${handlerName}`;
  }
}

function kebabCase(value: string): string {
  if (/[A-Z]/.test(value[0])) {
    throw new Error("cannot start with uppercase character");
  }

  if (!/^[A-Za-z]+$/.test(value)) {
    throw new Error("may only contain alphabetical characters");
  }

  // replace all uppercase letters with - plus it, then convert to lowercase
  return value.replace(/A-Z/g, "-$&").toLowerCase();
}

function convert(value: string, finalType: string): Primitive {
  switch (finalType) {
    case "number":
      // convert to number with number constructor on number
      return Number(value);
    case "boolean":
      // return false for any falsy values, true otherwise
      return !["0", "null", "undefined", "false", "NaN", ""].includes(value);
    case "string":
      // return a string on string type
      return String(value);
    default:
      // throw error otherwise
      throw new TypeError("value must be string, number, or boolean");
  }
}

function bound(
  target: Component,
  key: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  let cache: EventHandler | undefined;
  let method: EventHandler = descriptor.value;
  let updated = true;

  return {
    configurable: true,
    get(): EventHandler {
      if (updated || typeof cache === "undefined") {
        // cache bound method if cache is missing or method is updated
        cache = method.bind(this);
        updated = false;
      }

      return cache;
    },
    set(value: EventHandler): void {
      method = value;

      // set method to be updated
      updated = true;
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" && value !== null && value.constructor === Object
  );
}

function recursiveProxy(value: Structure, handler: () => void): unknown {
  return new Proxy(value, {
    get(target: Structure, key: string | number): unknown {
      let current: unknown;

      if (Array.isArray(target)) {
        current = target[Number(key)];
      } else if (isRecord(target)) {
        current = target[String(key)];
      } else {
        throw new TypeError("cannot access properties of proxy target");
      }

      if (Array.isArray(current) || isRecord(current)) {
        return recursiveProxy(current, handler);
      } else {
        return current;
      }
    },
    set(target: Structure, key: string | number, value: unknown): boolean {
      if (Array.isArray(target)) {
        target[Number(key)] = value;
      } else if (isRecord(target)) {
        target[String(key)] = value;
      } else {
        throw new TypeError("cannot access properties of proxy target");
      }

      handler();
      return true;
    },
  });
}

function state(target: Component, key: string): void {
  let stateValue: unknown;

  Object.defineProperty(target, key, {
    get(): unknown {
      if (Array.isArray(stateValue) || isRecord(stateValue)) {
        return recursiveProxy(stateValue, this.update.bind(this));
      } else {
        return stateValue;
      }
    },
    set(value: unknown): void {
      stateValue = value;
      this.update();
    },
  });
}

function property(target: Component, key: string): void {
  // prepare property type cache for automatic type conversion
  let propertyType = "string";

  // define observedAttributes for component subclass if it does not exist to
  // prevent adding attribute watching to parent component class
  if (
    !Object.prototype.hasOwnProperty.call(
      target.constructor,
      "observedAttributes"
    )
  ) {
    Object.defineProperty(target.constructor, "observedAttributes", {
      value: [],
    });
  }

  // push property to observed if not already observed
  if (!target.constructor.observedAttributes.includes(kebabCase(key))) {
    target.constructor.observedAttributes.push(kebabCase(key));
  }

  Object.defineProperty(target, key, {
    get(): Primitive {
      if (!(this instanceof Component)) {
        throw new TypeError("property decorator must be used on Component");
      }

      // convert to kebab case before retrieving attribute
      const attribute: string | null = this.getAttribute(kebabCase(key));

      if (typeof attribute !== "string") {
        throw new Error(`attribute ${key} does not exist`);
      }

      // convert attribute with cached type
      return convert(attribute, propertyType);
    },
    set(value: Primitive): void {
      if (!isPrimitive(value)) {
        throw new TypeError("value must be string, number, or boolean");
      }

      // cache current value type
      propertyType = typeof value;

      if (this instanceof Component) {
        if (!this.hasAttribute(kebabCase(key))) {
          // stringify before setting attribute
          this.setAttribute(kebabCase(key), String(value));
        }
      } else {
        throw new TypeError("property decorator must be used on component");
      }
    },
  });
}

function element(
  name: string
): <T extends Component>(component: Constructable<T>) => void {
  return <T extends Component>(component: Constructable<T>): void =>
    window.customElements.define(name, component);
}

function html(
  strings: TemplateStringsArray,
  ...values: (EventHandler | Primitive)[]
): DocumentFragment {
  // take leading string first
  const output: string[] = [strings[0]];

  // process value push, then push next string from strings
  for (const [index, item] of strings.slice(1, strings.length).entries()) {
    const value: EventHandler | Primitive = values[index];

    if (isPrimitive(value)) {
      // stringify types all types except event handlers automatically
      output.push(String(value));
    } else {
      // bind and process event handlers
      output.push(`"${bindHandler(value)}(event);"`);
    }

    output.push(item);
  }

  // concat processed strings and generate document fragment
  return dom.html(output.join(""));
}

class Component extends HTMLElement {
  public root: ShadowRoot;
  public static observedAttributes: string[] = [];

  public constructor() {
    super();

    // initialize shadow root for rendering
    this.root = this.attachShadow({ mode: "open" });
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
    // user-defined handler for connectedCallback
  }

  protected disconnected(): void {
    // user-defined handler for disconnectedCallback
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */

  protected changed(name: string, oldValue: string, newValue: string): void {
    // user-defined handler for attributeChangedCallback
  }

  /* eslint-enable @typescript-eslint/no-unused-vars */

  protected update(): void {
    dom.render(this.root, this.render());
  }

  protected render(): DocumentFragment {
    throw new Error("render is not implemented");
  }
}
