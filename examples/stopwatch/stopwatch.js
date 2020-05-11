import { BoreElement, mount, unmount } from "/build/boreDOM.js";

class StopwatchApp extends BoreElement {
  constructor(mount) {
    super(mount);

    this.state = { run: false };
    this.view = new StopwatchView(this);
    this.interval = undefined;

    this.onStartStop = this.exports(this.onStartStop.bind(this));
    this.onReset = this.exports(this.onReset.bind(this));
  }

  onStartStop() {
    this.state["run"] = !this.state["run"];

    if (this.state["run"]) {
      this.interval = setInterval(() => {
        this.view.state["seconds"]++;
      }, 1000);
    } else {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  onReset() {
    this.view.state["seconds"] = 0;
  }

  render() {
    return this.process`
      ${this.view}
      <button onclick="${this.onStartStop()}">Start/Stop</button>
      <button onclick="${this.onReset()}">Reset</button>
    `;
  }
}

class StopwatchView extends BoreElement {
  constructor(mount) {
    super(mount);

    this.state = { seconds: 0 };
  }

  render() {
    return `<div>${this.state["seconds"]}</div>`;
  }
}

mount(document.getElementById("root"), StopwatchApp);
