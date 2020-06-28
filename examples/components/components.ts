import { component } from "../../dist/index.esm.js";

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
