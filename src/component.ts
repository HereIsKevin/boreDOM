export { boundMethod, customElement, Component };

import { html, render } from "./dom";

type Dictionary<T> = { [key: string]: T };
type Method = (...args: any[]) => any;
type EventHandler = (event: Event) => void;
type Primitive = number | string | boolean;
type ComponentDecorator = <T extends Component>(
  componentClass: IConstructable<T>
) => void;
type ChangeHandler = (newValue: string, oldValue: string) => void;

interface IConstructable<T> {
  new (...parameters: any[]): T;
}

interface IWindow extends Window {
  eventHandlers?: Dictionary<EventHandler>;
  eventHandlersIndex?: number;
}

declare const window: IWindow;

function boundMethod(
  target: object,
  key: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  let method: Method = descriptor.value;

  return {
    configurable: true,
    get(): Method {
      return method.bind(this);
    },
    set(value: Method): void {
      method = value;
    },
  };
}

function customElement<T extends Component>(
  name: string,
  component?: IConstructable<T>
): ComponentDecorator | undefined {
  if (typeof component !== "undefined") {
    window.customElements.define(name, component);
  } else {
    return <T extends Component>(componentClass: IConstructable<T>): void =>
      window.customElements.define(name, componentClass);
  }
}

function eventHandler(handler: EventHandler): string {
  if (typeof window.eventHandlers === "undefined") {
    window.eventHandlers = {};
  }

  if (typeof window.eventHandlersIndex === "undefined") {
    window.eventHandlersIndex = 0;
  } else {
    window.eventHandlersIndex++;
  }

  const index = window.eventHandlersIndex;
  window.eventHandlers[`handler${index}`] = handler;

  return `window.eventHandlers.handler${index}(event);`;
}

function isPrimitive(value: any): value is Primitive {
  const type: string = typeof value;
  return type === "string" || type === "number" || type === "boolean";
}

class Component extends HTMLElement {
  protected static readonly observedAttributes: string[] = [];

  protected shadow: ShadowRoot;
  protected changeHandlers: Dictionary<ChangeHandler>;

  public constructor() {
    super();

    this.shadow = this.attachShadow({ mode: "open" });
    this.changeHandlers = {};
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
    const handler: ChangeHandler | undefined = this.changeHandlers[name];

    if (typeof handler !== "undefined") {
      handler(oldValue, newValue);
    }

    this.changed(name, oldValue, newValue);
    this.update();
  }

  protected connected(): void {}

  protected disconnected(): void {}

  protected changed(name: string, oldValue: string, newValue: string): void {}

  protected html(
    strings: TemplateStringsArray,
    ...values: (EventHandler | Primitive | Primitive[])[]
  ): DocumentFragment {
    let output: string[] = [strings[0]];

    for (let [index, item] of strings.slice(1, strings.length).entries()) {
      const code: EventHandler | Primitive | Primitive[] = values[index];

      if (isPrimitive(code)) {
        output.push(String(code));
      } else if (Array.isArray(code)) {
        output.push(code.join(""));
      } else {
        output.push(`"${eventHandler(code)}"`);
      }

      output.push(item);
    }

    return html(output.join(""));
  }

  protected update(): void {
    render(this.shadow, this.render());
  }

  protected render(): DocumentFragment {
    return this.html`<p>Hello, world!</p>`;
  }

  public get properties(): Dictionary<string> {
    return new Proxy(
      {},
      {
        get: (target: Dictionary<string>, name: string): string =>
          this.getAttribute(name) || "",
        set: (
          target: Dictionary<string>,
          name: string,
          value: string
        ): boolean => {
          this.setAttribute(name, value);
          return true;
        },
      }
    );
  }
}
