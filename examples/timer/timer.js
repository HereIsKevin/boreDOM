import { element } from "/dist/index.js";

const alarm = new Audio("alarm.mp3");
alarm.loop = true;

function toSeconds(value) {
  let seconds = 0;
  let modifiers = {
    0: 1,
    1: 60,
    2: 3600,
  };

  for (let [index, part] of value.trim().split(":").reverse().entries()) {
    if (index <= 2 && /^\d+$/.test(part)) {
      seconds += Number(part) * modifiers[index];
    } else {
      throw "improper format";
    }
  }

  return seconds;
}

function toText(value) {
  let rawSeconds = Number(value);
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  hours = Math.floor(rawSeconds / 3600);
  rawSeconds -= hours * 3600;
  minutes = Math.floor(rawSeconds / 60);
  rawSeconds -= minutes * 60;
  seconds = Math.floor(rawSeconds);

  const pad = (value) =>
    value.length < 2 ? `${"0" * (2 - value.length)}${value}` : value;

  return `${pad(String(hours))}:${pad(String(minutes))}:${pad(
    String(seconds)
  )}`;
}

class TimerView extends element.Component {
  constructor(properties, mount) {
    super(properties, mount);

    this.state = {
      seconds: 0,
      editable: false,
      rawValue: "0",
    };

    this.running = false;

    this.onChange = element.exportHandler(this.onChange.bind(this));
    this.onClick = element.exportHandler(this.onClick.bind(this));
  }

  reset() {
    console.log(this.state["rawValue"]);
    this.state["seconds"] = toSeconds(this.state["rawValue"]);
  }

  onChange(event) {
    if (!this.state["editable"]) {
      return;
    }

    const oldSeconds = this.state["seconds"];
    const oldRawValue = this.state["rawValue"];

    this.state["rawValue"] = event.target.textContent;
    this.state["editable"] = false;

    try {
      this.state["seconds"] = toSeconds(this.state["rawValue"]);
    } catch (error) {
      this.state["rawValue"] = oldRawValue;
      this.state["seconds"] = oldSeconds;
      return;
    }
  }

  onClick(event) {
    if (this.running) {
      return;
    }

    this.state["editable"] = true;
    event.target.focus();
  }

  render() {
    return this.generate`
      <div
        contenteditable="${this.state["editable"]}"
        onblur="${this.onChange()}"
        onclick="${this.onClick()}"
      >
        ${toText(this.state["seconds"])}
      </div>
    `;
  }
}

class TimerApp extends element.Component {
  constructor(properties, mount) {
    super(properties, mount);

    this.running = false;
    this.view = element.create(TimerView);
    this.interval = undefined;

    this.onStartStop = element.exportHandler(this.onStartStop.bind(this));
    this.onReset = element.exportHandler(this.onReset.bind(this));
  }

  onStartStop() {
    if (this.running) {
      clearInterval(this.interval);
      this.running = false;
    } else {
      this.running = true;
      this.interval = setInterval(() => {
        this.view.state["seconds"]--;

        if (this.view.state["seconds"] <= 0) {
          alarm.play();
          this.view.state["seconds"] = 0;
          clearInterval(this.interval);
          this.running = false;
        }
      }, 1000);
    }
  }

  onReset() {
    alarm.pause();
    this.view.reset();
  }

  render() {
    return this.generate`
      ${this.view}
      <div>
        <input type="button" value="Start/Stop" onclick="${this.onStartStop()}">
        <input type="button" value="Reset" onclick="${this.onReset()}">
      </div>
    `;
  }
}

element.mount(document.getElementById("root"), element.create(TimerApp));
