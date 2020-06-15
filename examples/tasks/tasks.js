import { component } from "/dist/index.esm.js";

class TasksView extends component.Component {
  static observedAttributes = ["number"];

  render() {
    return this.html`<p>Count is currently: ${this.properties.number}</p>`;
  }
}

class TasksApp extends component.Component {
  static observedAttributes = ["number"];

  constructor() {
    super();

    this.decrement = this.decrement.bind(this);
    this.increment = this.increment.bind(this);
  }

  decrement() {
    this.properties.number--;
  }

  increment() {
    this.properties.number++;
  }

  render() {
    return this.html`
      <tasks-view number="${this.properties.number}"></tasks-view>
      <button onclick=${this.decrement}>Decrement</button>
      <button onclick=${this.increment}>Increment</button>
    `;
  }
}

component.customElement("tasks-app", TasksApp);
component.customElement("tasks-view", TasksView);
