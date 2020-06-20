// Original source code

/*

import { component } from "/dist/index.esm.js";

const { Component, boundMethod, customElement } = component;

@customElement("example-component")
class ExampleComponent extends Component {
  static observedAttributes = ["count"];

  @boundMethod
  decrement() {
    this.properties.count = String(Number(this.properties.count) - 1);
  }

  @boundMethod
  increment() {
    this.properties.count = String(Number(this.properties.count) + 1);
  }

  render() {
    return this.html`
      <div>${this.properties.count}</div>
      <button onclick=${this.decrement}>Decrement</button>
      <button onclick=${this.increment}>Increment</button>
    `;
  }
}

*/

// TypeScript compiled output

var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
          ? (desc = Object.getOwnPropertyDescriptor(target, key))
          : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };

import { component } from "/dist/index.esm.js";

const { Component, boundMethod, customElement } = component;

let ExampleComponent = /** @class */ (() => {
  let ExampleComponent = class ExampleComponent extends Component {
    decrement() {
      this.properties.count = String(Number(this.properties.count) - 1);
    }
    increment() {
      this.properties.count = String(Number(this.properties.count) + 1);
    }
    render() {
      return this.html`
      <div>${this.properties.count}</div>
      <button onclick=${this.decrement}>Decrement</button>
      <button onclick=${this.increment}>Increment</button>
    `;
    }
  };
  ExampleComponent.observedAttributes = ["count"];
  __decorate([boundMethod], ExampleComponent.prototype, "decrement", null);
  __decorate([boundMethod], ExampleComponent.prototype, "increment", null);
  ExampleComponent = __decorate(
    [customElement("example-component")],
    ExampleComponent
  );
  return ExampleComponent;
})();
