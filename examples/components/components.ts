import { memoized } from "../../dist/esm/index.js";

const { Component, property, bound, element, html, state } = memoized;

@element("example-component")
class ExampleComponent extends Component {
  @state data: { [key: string]: number } = { count: 1 };

  @bound
  decrement() {
    this.data.count = this.data.count - 1;
  }

  @bound
  increment() {
    this.data.count = this.data.count + 1;
  }

  render() {
    return html`
      <div>${String(this.data.count)}</div>
      <button onclick=${this.decrement}>Decrement</button>
      <button onclick=${this.increment}>Increment</button>
    `;
  }
}
