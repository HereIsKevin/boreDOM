import { component } from "../../dist/index.esm.js";

const { Component, attributes, html } = component;

class Counter extends Component {
  static observedAttributes = attributes(["seconds"]);

  constructor() {
    super();

    this.properties = { seconds: 0 };
    this.onClick = this.onClick.bind(this);

    window.setInterval(() => {
      if (typeof this.properties.seconds === "number") {
        this.properties.seconds++;
      } else {
        throw new Error("faulty type conversion");
      }
    }, 1000);
  }

  onClick() {
    alert(
      `You clicked me! Seconds was ${this.properties.seconds} during click.`
    );
  }

  render() {
    return html`
      <p>Seconds: ${this.properties.seconds}</p>
      <input type="button" onclick=${this.onClick} value="Click Me!" />
    `;
  }
}

window.customElements.define("counter-app", Counter);
