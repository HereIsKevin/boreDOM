export { Component, bound, element, html, property, state };

import * as dom from "./dom";

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

function kebabCase(value: string): string {
  if (/[A-Z]/.test(value[0])) {
    throw new Error("cannot start with uppercase character");
  }

  if (!/^[A-Za-z]+$/.test(value)) {
    throw new Error("may only contain alphabetical characters");
  }

  // replace all uppercase letters with - plus it, then convert to lowercase
  return value.replace(/[A-Z]/g, "-$&").toLowerCase();
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
        // pretend key is a number to allow fetching methods
        current = target[key as number];
      } else if (isRecord(target)) {
        // pretend key is a string to allow strange behavior
        current = target[key as string];
      } else {
        // throw error if trying to proxy constructable objects or primitives
        throw new TypeError("cannot access properties of proxy target");
      }

      if (Array.isArray(current) || isRecord(current)) {
        // continue adding proxies if result is a array or record
        return recursiveProxy(current, handler);
      } else {
        // return value otherwise
        return current;
      }
    },
    set(target: Structure, key: string | number, value: unknown): boolean {
      if (Array.isArray(target)) {
        // pretend key is a number to allow setting methods
        target[key as number] = value;
      } else if (isRecord(target)) {
        // pretend key is a string to allow strange behavior
        target[key as string] = value;
      } else {
        // throw error if constructable object of primitive is in a proxy
        throw new TypeError("cannot access properties of proxy target");
      }

      // run event handler
      handler();

      // allow normal action to occur
      return true;
    },
  });
}

function state(target: Component, key: string): void {
  // types do not matter as much here, as all state does is add proxies, which
  // should allow strange behavior in order to allow any possible case to pass.
  // any problems should be caught by the type checker for the decorated
  // property, all state is is sort of a wrapper.

  Object.defineProperty(target, key, {
    get(): unknown {
      const stateValue = this.stateValues[key];

      if (Array.isArray(stateValue) || isRecord(stateValue)) {
        // add proxies recursively with updater for arrays and plain objects
        return recursiveProxy(stateValue, this.update.bind(this));
      } else {
        // return value directly otherwise
        return stateValue;
      }
    },
    set(value: unknown): void {
      this.stateValues[key] = value;

      // update after setting value
      this.update();
    },
  });
}

function property(target: Component, key: string): void {
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

      // convert key to HTML attribute form
      const parsedKey = kebabCase(key);

      const attribute: string | null = this.getAttribute(parsedKey);

      if (typeof attribute !== "string") {
        throw new Error(`attribute ${key} does not exist`);
      }

      // convert attribute with cached type
      return convert(attribute, this.attributeTypes[parsedKey]);
    },
    set(value: Primitive): void {
      if (!isPrimitive(value)) {
        throw new TypeError("value must be string, number, or boolean");
      }

      if (!(this instanceof Component)) {
        throw new TypeError("property decorator must be used on component");
      }

      // convert key to HTML attribute form
      const parsedKey = kebabCase(key);

      // cache current value type
      this.attributeTypes[parsedKey] = typeof value;

      if (
        this.initialAttributes.includes(parsedKey) ||
        !this.hasAttribute(parsedKey)
      ) {
        // stringify before setting attribute
        this.setAttribute(parsedKey, String(value));
      } else {
        // do not update if attribute already exists for the first time
        this.initialAttributes.push(parsedKey);
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

  // event handlers
  const eventHandlers: Record<string, EventHandler> = {};

  // current event handler number
  let handlerIndex = 0;

  // process value push, then push next string from strings
  for (const [index, item] of strings.slice(1, strings.length).entries()) {
    const value: EventHandler | Primitive = values[index];

    if (isPrimitive(value)) {
      // stringify types all types except event handlers automatically
      output.push(String(value));
    } else {
      const handlerName = `handler$${handlerIndex}`;

      // cache handler name in attribute on element
      output.push(handlerName);
      // cache actual handler in record
      eventHandlers[`handler$${handlerIndex}`] = value;

      handlerIndex++;
    }

    output.push(item);
  }

  // concat processed strings and generate document fragment
  const result: DocumentFragment = dom.html(output.join(""));

  // add event handlers to result
  addHandlers(result, eventHandlers);

  return result;
}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function addHandlers(node: Node, handlers: Record<string, EventHandler>): void {
  // add event listeners only to an element node
  if (isElement(node)) {
    // get all event names by iterating through "on" prefixed attributes
    for (const name of node
      .getAttributeNames()
      .filter((x: string): boolean => x.slice(0, 2) === "on")) {
      // retrieve handler name from cache on element attribute
      const handlerName: string | null = node.getAttribute(name);

      // stop if the attribute is somehow missing or handler is missing
      if (
        handlerName === null ||
        !Object.keys(handlers).includes(handlerName)
      ) {
        continue;
      }

      // remove cache after retrieving value
      node.removeAttribute(name);

      // add event listener to element
      node.addEventListener(name.slice(2), handlers[handlerName]);
    }
  }

  // recursively add event handlers to child nodes
  for (const child of node.childNodes) {
    addHandlers(child, handlers);
  }
}

class Component extends HTMLElement {
  public static observedAttributes: string[] = [];

  public root: ShadowRoot;

  public initialAttributes: string[] = [];
  public attributeTypes: Record<string, string> = {};
  public stateValues: Record<string, unknown> = {};

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
