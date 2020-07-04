import { component } from "../../dist/index.esm.js";

const { Component, property, bound, element, html } = component;

@element("counter-app")
class Counter extends Component {
  @property seconds: number = 0;

  connected() {
    window.setInterval(() => this.seconds++, 1000);
  }

  @bound
  onClick() {
    alert(`You clicked me! Seconds was ${this.seconds} during click.`);
  }

  render() {
    return html`
      <p>Seconds: ${this.seconds}</p>
      <input type="button" onclick=${this.onClick} value="Click Me!" />
    `;
  }
}
