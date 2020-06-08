import { element } from "/dist/index.esm.js";

class StopwatchApp extends element.Component {
  constructor(properties, mount) {
    super(properties, mount);

    this.state = { run: false };
    this.view = element.create(StopwatchView);
    this.interval = undefined;

    this.onStartStop = element.exportHandler(this.onStartStop.bind(this));
    this.onReset = element.exportHandler(this.onReset.bind(this));
  }

  onStartStop() {
    this.state["run"] = !this.state["run"];

    if (this.state["run"]) {
      this.interval = setInterval(() => {
        this.view.state["seconds"] += 0.01;
      }, 10);
    } else {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  onReset() {
    this.view.state["seconds"] = 0;
  }

  render() {
    return this.generate`
      ${this.view}
      <button onclick="${this.onStartStop()}">Start/Stop</button>
      <button onclick="${this.onReset()}">Reset</button>
    `;
  }
}

class StopwatchView extends element.Component {
  constructor(properties, mount) {
    super(properties, mount);

    this.state = { seconds: 0 };
  }

  render() {
    return this.generate`
      <div>
        ${element.create(Numbers, { seconds: this.state["seconds"] })}
      </div>
    `;
  }
  // this.state["seconds"].toFixed(2)
}

class Numbers extends element.Stateless {
  render() {
    return this.properties["seconds"].toFixed(2);
  }
}

element.mount(document.getElementById("root"), element.create(StopwatchApp));
