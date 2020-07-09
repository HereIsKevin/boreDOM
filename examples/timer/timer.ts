import { component } from "../../dist/esm/index.js";

const { Component, property, bound, element, html } = component;

const alarm = new Audio("alarm.mp3");
alarm.loop = true;

function toSeconds(value: string) {
  let seconds = 0;
  const modifiers = [1, 60, 3600];

  for (const [index, part] of value.trim().split(":").reverse().entries()) {
    if (index <= 2 && /^\d+$/.test(part)) {
      seconds += Number(part) * modifiers[index];
    } else {
      throw new Error("improper format");
    }
  }

  return seconds;
}

function toText(value: number) {
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  hours = Math.floor(value / 3600);
  value -= hours * 3600;
  minutes = Math.floor(value / 60);
  value -= minutes * 60;
  seconds = Math.floor(value);

  return [hours, minutes, seconds]
    .map((x) => String(x).padStart(2, "0"))
    .join(":");
}

@element("timer-view")
class TimerView extends Component {
  @property seconds = 0;
  @property editable = false;

  rawValue = "0";

  reset() {
    this.seconds = toSeconds(this.rawValue);
  }

  @bound
  onChange(event: Event) {
    const oldSeconds = this.seconds;
    const oldRawValue = this.rawValue;

    if (event.target instanceof HTMLDivElement) {
      this.rawValue = event.target.textContent || "";
    }

    this.editable = false;

    try {
      this.seconds = toSeconds(this.rawValue);
    } catch (error) {
      this.rawValue = oldRawValue;
      this.seconds = oldSeconds;
    }
  }

  @bound
  onClick(event: Event) {
    if (this.parentElement instanceof TimerApp && this.parentElement.running) {
      return;
    }

    this.editable = true;

    if (event.target instanceof HTMLDivElement) {
      event.target.focus();
    }
  }

  render() {
    return html`
      <div
        contenteditable=${this.editable}
        onblur=${this.onChange}
        onclick=${this.onClick}
      >
        ${toText(this.seconds)}
      </div>
    `;
  }
}

@element("timer-app")
class TimerApp extends Component {
  running: boolean = false;
  interval?: number = undefined;

  @bound
  onStartStop() {
    if (this.running) {
      window.clearInterval(this.interval);
      this.running = false;
    } else {
      this.running = true;
      this.interval = window.setInterval(() => {
        const view = this.root.children[0];

        if (!(view instanceof TimerView)) {
          throw new Error("could not find view");
        }

        view.seconds--;

        if (view.seconds <= 0) {
          alarm.play();
          view.seconds = 0;
          window.clearInterval(this.interval);
          this.running = false;
        }
      }, 1000);
    }
  }

  @bound
  onReset() {
    alarm.pause();

    const view = this.root.children[0];

    if (!(view instanceof TimerView)) {
      throw new Error("could not find view");
    }

    view.reset();
  }

  render() {
    return html`
      <timer-view></timer-view>
      <div>
        <input type="button" value="Start/Stop" onclick=${this.onStartStop} />
        <input type="button" value="Reset" onclick=${this.onReset} />
      </div>
    `;
  }
}
