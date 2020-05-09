import { BoreElement, mount } from "/build/boreElement.js";

class Counter extends BoreElement {
  constructor(mount) {
    super(mount);

    this.state = { seconds: 0 };
    this.interval = undefined;

    this.onClick = this.exports(this.onClick);
  }

  onMount() {
    this.interval = setInterval(
      () => this.setState("seconds", this.state["seconds"] + 1),
      1000
    );
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

mount(document.getElementById("root"), Counter);
