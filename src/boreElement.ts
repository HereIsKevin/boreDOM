export { BoreElement, mount, unmount };

import { html, render } from "./boreDOM.js";

class BoreElement {
  protected state: { [key: string]: any };
  protected mount: Element;
  private callbacks: { [on: string]: () => void };
  private allCallback: () => void;

  public constructor(mount: Element) {
    this.state = {};
    this.callbacks = {};
    this.allCallback = () => {};
    this.mount = mount;
  }

  public bind(callback: () => void, on: string | string[] = ""): void {
    if (on === "") {
      this.allCallback = callback;
    } else {
      if (typeof on == "string") {
        this.callbacks[on] = callback;
      } else {
        for (let event of on) {
          this.callbacks[event] = callback;
        }
      }
    }
  }

  public unbind(item: string | string[] = ""): void {
    if (typeof item === "string") {
      if (item === "") {
        this.allCallback = () => {};
      } else {
        delete this.callbacks[item];
      }
    } else {
      for (let event of item) {
        delete this.callbacks[event];
      }
    }
  }

  public getState(property: string): any {
    return this.state[property];
  }

  public setState(property: string, value: any): void {
    this.state[property] = value;
    let calledBack: boolean = false;

    for (let key of Object.keys(this.callbacks)) {
      if (key === property) {
        calledBack = true;
        this.callbacks[key]();
        break;
      }
    }

    if (!calledBack) {
      this.allCallback();
    }

    this.paint();
  }

  public paint(): void {
    render(this.mount, html(this.render()));
  }

  public destroy(): void {
    render(this.mount, html(""));
  }

  public onMount(): void {}

  public onUnmount(): void {}

  public exports(handler: () => void): () => string {
    handler = handler.bind(this);

    if (typeof window.BoreHandlers === "undefined") {
      window.BoreHandlers = {};
    }

    if (typeof window.BoreHandlersIndex === "undefined") {
      window.BoreHandlersIndex = 0;
    } else {
      window.BoreHandlersIndex++;
    }

    window.BoreHandlers[`handler${window.BoreHandlersIndex}`] = handler;

    return () => `BoreHandlers.handler${window.BoreHandlersIndex}();`;
  }

  public render(): string {
    return "<p>Hello, world from boreElement</p>";
  }
}

interface IWindow extends Window {
  BoreHandlers: { [key: string]: () => void };
  BoreHandlersIndex: number;
}

declare const window: IWindow;

interface IConstructable<T> {
  new (...args: any[]): T;
}

function mount<T extends BoreElement>(
  parent: Element,
  element: IConstructable<T>
): BoreElement {
  let item = new element(parent);
  item.onMount();
  item.paint();

  return item;
}

function unmount(item: BoreElement): void {
  item.onUnmount();
  item.destroy();
}
