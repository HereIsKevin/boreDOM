// Original source code

/*

import { component } from "/dist/index.esm.js";

const { Component, attribute, boundMethod, customElement, html } = component;

@customElement("example-component")
class ExampleComponent extends Component {
  static observedAttributes = ["count"];

  @attribute count: number = 1;

  @boundMethod
  decrement() {
    this.count = this.count - 1;
  }

  @boundMethod
  increment() {
    this.count = this.count + 1;
  }

  render() {
    return html`
      <div>${this.count}</div>
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

const { Component, attribute, boundMethod, customElement, html } = component;

let ExampleComponent = class ExampleComponent extends Component {
  constructor() {
    super(...arguments);
    this.count = 1;
  }
  decrement() {
    this.count = this.count - 1;
  }
  increment() {
    this.count = this.count + 1;
  }
  render() {
    return html`
      <div>${this.count}</div>
      <button onclick=${this.decrement}>Decrement</button>
      <button onclick=${this.increment}>Increment</button>
    `;
  }
};
ExampleComponent.observedAttributes = ["count"];
__decorate([attribute], ExampleComponent.prototype, "count", void 0);
__decorate([boundMethod], ExampleComponent.prototype, "decrement", null);
__decorate([boundMethod], ExampleComponent.prototype, "increment", null);
ExampleComponent = __decorate(
  [customElement("example-component")],
  ExampleComponent
);
