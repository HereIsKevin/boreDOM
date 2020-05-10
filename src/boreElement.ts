export { BoreElement, mount, unmount };

import { html, render } from "./boreDOM.js";

type Dictionary = { [key: string]: any };
type Callback = () => void;

interface IConstructable<T> {
  new (...args: any[]): T;
}

interface IWindow extends Window {
  BoreHandlers: { [key: string]: Callback };
  BoreHandlersIndex: number;
}

declare const window: IWindow;

class BoreElement {
  protected mount: Element;

  private callbacks: { [on: string]: Callback };
  private defaultCallback: Callback;
  private stateInternal: Dictionary;
  private painted: boolean;

  public constructor(mount: Element) {
    this.mount = mount;

    this.callbacks = {};
    this.defaultCallback = () => {};
    this.stateInternal = {};
    this.painted = false;
  }

  public bind(callback: Callback, on: string = ""): void {
    if (on === "") {
      this.defaultCallback = callback;
    } else {
      this.callbacks[on] = callback;
    }
  }

  public unbind(item: string = ""): void {
    if (item === "") {
      this.defaultCallback = () => {};
    } else {
      delete this.callbacks[item];
    }
  }

  public get state(): Dictionary {
    return new Proxy(this.stateInternal, {
      get: (target: Dictionary, name: string): any => target[name],
      set: (
        target: Dictionary,
        name: string,
        value: any,
        receiver: any
      ): boolean => {
        target[name] = value;
        this.runCallback(name);
        return true;
      },
    });
  }

  public set state(value: Dictionary) {
    this.stateInternal = value;

    for (let value of Object.keys(this.stateInternal)) {
      this.runCallback(value);
    }
  }

  private runCallback(property: string): void {
    if (!this.painted) {
      return;
    }

    let calledBack: boolean = false;

    for (let key of Object.keys(this.callbacks)) {
      if (key === property) {
        calledBack = true;
        this.callbacks[key]();
        break;
      }
    }

    if (!calledBack) {
      this.defaultCallback();
    }

    this.paint()
  }

  public paint(): void {
    this.painted = true;
    render(this.mount, html(this.render()));
  }

  public destroy(): void {
    this.painted = false;
    render(this.mount, html(""));
  }

  public onMount(): void {}

  public onUnmount(): void {}

  public exports(handler: Callback): () => string {
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
    return "";
  }
}

/*
function exports(target: Callback, propertyKey: string, descriptor: PropertyDescriptor): void {
  if (typeof window.BoreHandlers === "undefined") {
    window.BoreHandlers = {};
  }

  if (typeof window.BoreHandlersIndex === "undefined") {
    window.BoreHandlersIndex = 0;
  } else {
    window.BoreHandlersIndex++;
  }

  window.BoreHandlers[`handler${window.BoreHandlers}`] = descriptor.value;
  descriptor.value = () => `BoreHandlers.handler${window.BoreHandlersIndex}()`;
}
*/

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
