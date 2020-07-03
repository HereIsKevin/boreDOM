import { component } from "../../dist/index.esm.js";

const { Component, attribute, boundMethod, customElement, html } = component;

@customElement("example-component")
class ExampleComponent extends Component {
  @attribute currentCount: number = 1;
  @attribute blah: number = 1;

  @boundMethod
  decrement() {
    this.currentCount = this.currentCount - 1;
  }

  @boundMethod
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

window.Component = Component;
window.ExampleComponent = ExampleComponent;
