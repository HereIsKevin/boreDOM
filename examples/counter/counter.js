import { BoreElement, mount } from "/build/boreDOM.js";

class Counter extends BoreElement {
  constructor(mount) {
    super(mount);

    this.state = { seconds: 0 };
    this.interval = undefined;

    this.onClick = this.exports(this.onClick.bind(this));
  }

  onMount() {
    this.interval = setInterval(
      () => this.state["seconds"]++,
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
