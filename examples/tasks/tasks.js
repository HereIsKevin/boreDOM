import { component, dom } from "/dist/index.esm.js";

class TasksApp extends component.Component {
  static observedAttributes = ["number"];

  constructor() {
    super();

    this.increment = this.exportHandler(this.increment);
    this.decrement = this.exportHandler(this.decrement);
  }

  decrement() {
    this.properties.number--;
  }

  increment() {
    this.properties.number++;
  }

  render() {
    return this.html`
      <p>Count is currently: ${this.properties.number}</p>
      <button onclick="${this.decrement()}">Decrement</button>
      <button onclick="${this.increment()}">Increment</button>
    `;
  }
}

component.defineElement("tasks-app", TasksApp);
