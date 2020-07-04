import { component } from "../../dist/index.esm.js";

const { Component, property, bound, element, html } = component;

@element("example-component")
class ExampleComponent extends Component {
  @property currentCount: number = 1;

  @bound
  decrement() {
    this.currentCount = this.currentCount - 1;
  }

  @bound
  increment() {
    this.currentCount = this.currentCount + 1;
  }

  render() {
    return html`
      <div>${this.currentCount}</div>
      <button onclick=${this.decrement}>Decrement</button>
      <button onclick=${this.increment}>Increment</button>
    `;
  }
}
