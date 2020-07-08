import { component } from "../../dist/index.esm.js";

const { Component, property, bound, element, html } = component;

class TimedComponent extends Component {
  update() {
    console.time("render");
    super.update();
    console.timeEnd("render");
  }
}

@element("stopwatch-app")
class StopwatchApp extends TimedComponent {
  run: boolean = false;
  interval?: number = undefined;

  @bound
  onStartStop() {
    const view = this.root.children[0];
    this.run = !this.run;

    if (!(view instanceof StopwatchView)) {
      throw new Error("could not find view");
    }

    if (this.run) {
      this.interval = window.setInterval(() => {
        view.seconds += 0.01;
      }, 10);
    } else {
      window.clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  @bound
  onReset() {
    const view = this.root.children[0];

    if (!(view instanceof StopwatchView)) {
      throw new Error("could not find view");
    }

    view.seconds = 0;
  }

  render() {
    return html`
      <stopwatch-view></stopwatch-view>
      <button onclick=${this.onStartStop}>Start/Stop</button>
      <button onclick=${this.onReset}>Reset</button>
    `;
  }
}

@element("stopwatch-view")
class StopwatchView extends TimedComponent {
  @property seconds: number = 0;

  render() {
    return html` <div>${this.seconds.toFixed(2)}</div> `;
  }
}
