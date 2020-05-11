export { BoreElement, mount, unmount };

import { html, render } from "./dom";

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

const isElement = (value: any): value is Element =>
  value instanceof Element;

const isBoreElement = (value: any): value is BoreElement =>
  value instanceof BoreElement;

class BoreElement {
  protected mount: Element | BoreElement;

  private callbacks: { [on: string]: Callback };
  private defaultCallback: Callback;
  private stateInternal: Dictionary;
  private painted: boolean;

  public constructor(mount: Element | BoreElement) {
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

    this.paint();

    if (isBoreElement(this.mount)) {
      this.mount.paint();
    }
  }

  public paint(): void {
    this.painted = true;

    if (isElement(this.mount)) {
      render(this.mount, html(this.render()));
    } else {
      this.mount.paint();
    }
  }

  public destroy(): void {
    this.painted = false;

    if (isElement(this.mount)) {
      render(this.mount, html(""));
    } else {
      this.mount.paint();
    }
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

    const index = window.BoreHandlersIndex;

    window.BoreHandlers[`handler${index}`] = handler;

    return () => `BoreHandlers.handler${index}();`;
  }

  public render(): string {
    return "";
  }

  public process(
    strings: string[],
    ...elements: (BoreElement | string)[]
  ): string {
    let final: string[] = [strings[0]];

    for (let [index, item] of strings.slice(1, strings.length).entries()) {
      const element: BoreElement | string = elements[index];

      if (isBoreElement(element)) {
        element.painted = true;
        final.push(element.render());
      } else if (typeof element === "string") {
        final.push(element);
      }

      final.push(item);
      index++;
    }

    return final.join("");
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
