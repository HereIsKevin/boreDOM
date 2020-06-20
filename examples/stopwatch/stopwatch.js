import { component } from "/dist/index.esm.js";

class StopwatchApp extends component.Component {
  constructor() {
    super();

    this.run = false;
    this.view = undefined;
    this.interval = undefined;

    this.onStartStop = this.onStartStop.bind(this);
    this.onReset = this.onReset.bind(this);
  }

  onStartStop() {
    this.view = this.root.children[0];
    this.run = !this.run;

    if (this.run) {
      this.interval = setInterval(() => {
        this.view.properties.seconds =
          Number(this.view.properties.seconds) + 0.01;
      }, 10);
    } else {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  onReset() {
    this.view.properties.seconds = 0;
  }

  render() {
    return component.html`
      <stopwatch-view></stopwatch-view>
      <button onclick=${this.onStartStop}>Start/Stop</button>
      <button onclick=${this.onReset}>Reset</button>
    `;
  }
}

class StopwatchView extends component.Component {
  static observedAttributes = ["seconds"];

  constructor() {
    super();

    this.properties.seconds = 0;
  }

  render() {
    return component.html`
      <stopwatch-numbers
        seconds="${this.properties.seconds}"
      ></stopwatch-numbers>
    `;
  }
}

class StopwatchNumbers extends component.Component {
  static observedAttributes = ["seconds"];

  render() {
    return component.html`<div>${Number(this.properties.seconds).toFixed(2)}</div>`;
  }
}

window.customElements.define("stopwatch-app", StopwatchApp);
window.customElements.define("stopwatch-view", StopwatchView);
window.customElements.define("stopwatch-numbers", StopwatchNumbers);
