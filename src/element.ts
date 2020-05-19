export {
  exportHandler,
  create,
  mount,
  unmount,
  Stateless,
  Component,
};

import { html, render } from "./dom";

type Dictionary = { [key: string]: any };
type StateHandler = () => void;
type EventHandler = (event?: Event) => void;
type Mount = Stateless | Element | Component;

interface IMountable<T extends Component | Stateless> {
  new (properties: Dictionary, mount?: Mount): T;
}

function isStateless(value: any): value is Stateless {
  return value instanceof Stateless;
}

function isComponent(value: any): value is Component {
  return value instanceof Component;
}

class Stateless {
  protected readonly properties: Dictionary;

  public mount?: Mount;
  public destroyed: boolean;
  public rendered: boolean;

  public constructor(properties: Dictionary, mount?: Mount) {
    this.properties = properties;

    this.mount = mount;
    this.rendered = false;
    this.destroyed = false;
  }

  public paint(): void {
    if (typeof this.mount === "undefined") {
      throw "error: cannot paint without mount";
    }

    this.rendered = true;

    if (isComponent(this.mount) || isStateless(this.mount)) {
      this.mount.paint();
    } else {
      render(this.mount, html(this.render()));
    }
  }

  public destroy(): void {
    if (typeof this.mount === "undefined") {
      throw "error: cannot destroy without mount";
    }

    this.rendered = false;
    this.destroyed = true;

    if (isComponent(this.mount) || isStateless(this.mount)) {
      this.mount.paint();
    } else {
      render(this.mount, html(""));
    }

    this.destroyed = false;
  }

  public render(): string {
    throw "error: render is not implemented";
  }

  public generate(
    strings: string[],
    ...elements: (Stateless | Component | string)[]
  ): string {
    let final: string[] = [strings[0]];

    for (let [index, item] of strings.slice(1, strings.length).entries()) {
      const element: Stateless | Component | string = elements[index];

      if (isStateless(element) || isComponent(element)) {
        element.mount = this;

        if (element.destroyed) {
          element.rendered = false;
          final.push("");
        } else {
          element.rendered = true;
          final.push(element.render());
        }
      } else {
        final.push(element);
      }

      final.push(item);
    }

    return final.join("");
  }
}

class Component {
  private internalState: Dictionary;
  private stateHandlers: { [on: string]: StateHandler };
  private defaultStateHandler: StateHandler;

  protected readonly properties: Dictionary;

  public mount?: Mount;
  public destroyed: boolean;
  public rendered: boolean;

  public constructor(properties: Dictionary, mount?: Mount) {
    this.mount = mount;
    this.internalState = {};
    this.stateHandlers = {};
    this.defaultStateHandler = () => {};
    this.destroyed = false;
    this.rendered = false;

    this.properties = properties;
  }

  public bindState(handler: StateHandler, on: string = ""): void {
    if (on === "") {
      this.defaultStateHandler = handler;
    } else {
      this.stateHandlers[on] = handler;
    }
  }

  public unbindState(on: string = ""): void {
    if (on === "") {
      this.defaultStateHandler = () => {};
    } else {
      delete this.stateHandlers[on];
    }
    ``;
  }

  public get state(): Dictionary {
    const proxify = (dictionary: Dictionary): Dictionary => {
      return new Proxy(dictionary, {
        get: (target: Dictionary, name: string): any => {
          if (typeof target[name] === "object") {
            return proxify(target[name]);
          } else {
            return target[name];
          }
        },
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
    };

    return proxify(this.internalState);
  }

  public set state(value: Dictionary) {
    this.internalState = value;

    for (let key of Object.keys(this.internalState)) {
      this.runCallback(key);
    }
  }

  private runCallback(key: string): void {
    if (!this.rendered) {
      return;
    }

    if (Object.keys(this.stateHandlers).includes(key)) {
      this.stateHandlers[key]();
    } else {
      this.defaultStateHandler();
    }

    if (typeof this.mount !== "undefined") {
      this.paint();
    }
  }

  public paint(): void {
    if (typeof this.mount === "undefined") {
      throw "error: cannot paint without mount";
    }

    this.rendered = true;

    if (isComponent(this.mount) || isStateless(this.mount)) {
      this.mount.paint();
    } else {
      render(this.mount, html(this.render()));
    }
  }

  public destroy(): void {
    if (typeof this.mount === "undefined") {
      throw "error: cannot destroy without mount";
    }

    this.rendered = false;
    this.destroyed = true;

    if (isComponent(this.mount) || isStateless(this.mount)) {
      this.mount.paint();
    } else {
      render(this.mount, html(""));
    }

    this.destroyed = false;
  }

  public render(): string {
    throw "error: render is not implemented";
  }

  public generate(
    strings: string[],
    ...elements: (Stateless | Component | string)[]
  ): string {
    let final: string[] = [strings[0]];

    for (let [index, item] of strings.slice(1, strings.length).entries()) {
      const element: Stateless | Component | string = elements[index];

      if (isStateless(element) || isComponent(element)) {
        element.mount = this;

        if (element.destroyed) {
          element.rendered = false;
          final.push("");
        } else {
          element.rendered = true;
          final.push(element.render());
        }
      } else {
        final.push(element);
      }

      final.push(item);
    }

    return final.join("");
  }
}

interface IWindow extends Window {
  BoreHandlers: { [key: string]: EventHandler };
  BoreHandlersIndex: number;
}

declare const window: IWindow;

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

function create<T extends Component | Stateless>(
  component: IMountable<T>,
  properties?: Dictionary
): Component | Stateless {
  return new component(properties || {});
}

function mount(parent: Element, component: Component | Stateless): void {
  if (component.rendered) {
    throw "error: component already mounted";
  } else {
    component.mount = parent;
    component.paint();
  }
}

function unmount(component: Component | Stateless): void {
  if (!component.rendered) {
    throw "error: component already unmounted";
  } else {
    component.destroy();
    component.mount = undefined;
  }
}
