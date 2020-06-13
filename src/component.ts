export { IConstructable, defineElement, exportHandler, Component };

import { html, render } from "./dom";

interface IConstructable<T> {
  new (...parameters: any[]): T;
}

interface IWindow extends Window {
  BoreHandlers?: { [key: string]: EventHandler };
  BoreHandlersIndex?: number;
}

declare const window: IWindow;

type ComponentWrapper = <T extends Component>(
  componentClass: IConstructable<T>
) => void;

type ChangeHandler = (newValue: string, oldValue: string) => void;
type EventHandler = (event: Event) => void;

function defineElement<T extends Component>(
  name: string,
  component?: IConstructable<T>
): ComponentWrapper | undefined {
  if (typeof component !== "undefined") {
    window.customElements.define(name, component);
  } else {
    return <T extends Component>(componentClass: IConstructable<T>): void =>
      window.customElements.define(name, componentClass);
  }
}

function exportHandler(handler: EventHandler): () => string {
  if (typeof window.BoreHandlers === "undefined") {
    window.BoreHandlers = {};
  }

  if (typeof window.BoreHandlersIndex === "undefined") {
    window.BoreHandlersIndex = 0;
  } else {
    window.BoreHandlersIndex++;
  }

  const index = window.BoreHandlersIndex;
  window.BoreHandlers[`handler${index}`] = handler;

  return () => `BoreHandlers.handler${index}(event);`;
}

class Component extends HTMLElement {
  protected static readonly observedAttributes: string[] = [];

  protected shadow: ShadowRoot;
  protected changeHandlers: { [key: string]: ChangeHandler };

  public constructor() {
    super();

    this.changeHandlers = {};
    this.shadow = this.attachShadow({ mode: "open" });
  }

  protected exportHandler(handler: EventHandler): () => string {
    if (typeof window.BoreHandlers === "undefined") {
      window.BoreHandlers = {};
    }

    if (typeof window.BoreHandlersIndex === "undefined") {
      window.BoreHandlersIndex = 0;
    } else {
      window.BoreHandlersIndex++;
    }

    handler = handler.bind(this);

    const index = window.BoreHandlersIndex;
    window.BoreHandlers[`handler${index}`] = handler;

    return () => `BoreHandlers.handler${index}(event);`;
  }

  private connectedCallback(): void {
    this.connected();
    this.paint();
  }

  private disconnectedCallback(): void {
    this.disconnected();
  }

  private attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    for (const [key, callback] of Object.entries(this.changeHandlers)) {
      if (key === name) {
        callback(oldValue, newValue);
      }
    }

    this.changed(name, oldValue, newValue);
    this.paint();
  }

  private paint(): void {
    render(this.shadow, this.render());
  }

  protected connected(): void {}

  protected disconnected(): void {}

  protected changed(name: string, oldValue: string, newValue: string): void {}

  protected html(
    strings: TemplateStringsArray,
    ...items: string[]
  ): DocumentFragment {
    let contents: string[] = [strings[0]];

    for (let [index, item] of strings.slice(1, strings.length).entries()) {
      contents.push(items[index]);
      contents.push(item);
    }

    return html(contents.join(""));
  }

  public get properties(): string[] {
    return new Proxy([], {
      get: (target: string[], name: string): string =>
        this.getAttribute(name) || "",
      set: (target: string[], name: string, value: string): boolean => {
        this.setAttribute(name, value);
        return true;
      },
    });
  }

  protected render(): DocumentFragment {
    return this.html``;
  }
}
