export { Component, EventHandler, boundMethod, customElement };

import { html, render } from "./dom";

type EventHandler = (event: Event) => void;

interface Constructable<T> {
  new (): T;
}

declare global {
  interface Window {
    eventHandlers?: { [key: string]: EventHandler };
    eventHandlersCount?: number;
  }
}

function boundMethod(
  target: object,
  key: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  let method: Function = descriptor.value;
  let cache: Function | undefined = undefined;
  let updated: boolean = true;

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

  public static observedAttributes: string[];

  public constructor() {
    super();

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

  protected connected(): void {}

  protected disconnected(): void {}

  protected changed(name: string, oldValue: string, newValue: string): void {}

  protected update(): void {
    render(this.root, this.render());
  }

  protected render(): DocumentFragment {
    return this.html`<p>Hello, world</p>`;
  }

  protected html(
    strings: TemplateStringsArray,
    ...values: (EventHandler | string)[]
  ): DocumentFragment {
    let output: string[] = [strings[0]];

    for (let [index, item] of strings.slice(1, strings.length).entries()) {
      const value: EventHandler | string = values[index];

      if (typeof value === "string") {
        output.push(value);
      } else {
        output.push(`"${eventHandler(value)}(event);"`);
      }

      output.push(item);
    }

    return html(output.join(""));
  }
}
