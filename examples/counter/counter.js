import { element } from "/dist/index.js";

class Counter extends element.Component {
  constructor(properties, mount) {
    super(properties, mount);

    this.state = { seconds: 0 };
    this.interval = undefined;

    this.onClick = element.exportHandler(this.onClick.bind(this));

    this.interval = setInterval(() => this.state["seconds"]++, 1000);
  }

  onClick() {
    alert(`You clicked me! Seconds was ${this.state["seconds"]} during click.`);
  }

  render() {
    return `
      <p>Seconds: ${this.state["seconds"]}</p>
      <input type="button" onclick="${this.onClick()}" value="Click Me!">
    `;
  }
}

element.mount(document.getElementById("root"), element.create(Counter));
