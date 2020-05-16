import { element } from "/build/boreDOM.js";

class Counter extends element.Component {
  constructor(mount, properties) {
    super(mount, properties);

    this.state = { seconds: 0 };
    this.interval = undefined;

    this.onClick = element.exports(this.onClick.bind(this));

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
