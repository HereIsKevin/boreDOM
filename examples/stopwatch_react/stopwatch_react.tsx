declare namespace React {
  class Component {
    state: Record<string, any>;
    props: Record<string, any>;

    setState(
      updater: (state: Record<string, any>) => Record<string, any>
    ): void;
    render(): JSX.IntrinsicElements;
  }
}

declare namespace ReactDOM {
  function render(element: JSX.IntrinsicElements, node: Node | null): void;
}

declare namespace JSX {
  interface IntrinsicElements {
    button: { onClick: () => void };
    div: {};
  }
}

class StopwatchApp extends React.Component {
  run: boolean = false;
  interval?: number = undefined;

  constructor() {
    super();

    this.state = { seconds: 0 };

    this.onStartStop = this.onStartStop.bind(this);
    this.onReset = this.onReset.bind(this);
  }

  onStartStop() {
    this.run = !this.run;

    if (this.run) {
      this.interval = window.setInterval(() => {
        this.setState((state) => ({
          seconds: state.seconds + 0.01,
        }));
      }, 10);
    } else {
      window.clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  onReset() {
    this.setState((state) => ({
      seconds: 0,
    }));
  }

  render() {
    console.time("render");

    return (
      <div>
        <StopwatchView seconds={this.state.seconds} />
        <button onClick={this.onStartStop}>Start/Stop</button>
        <button onClick={this.onReset}>Reset</button>
      </div>
    );
  }

  componentDidUpdate() {
    console.timeEnd("render");
  }
}

class StopwatchView extends React.Component {
  render() {
    return <div>{Number(this.props.seconds).toFixed(2)}</div>;
  }
}

ReactDOM.render(<StopwatchApp />, document.getElementById("root"));
