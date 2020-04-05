import { render, html } from "/diffydom.js";

const beep = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=")

class Timer {
  constructor(root) {
    this.root = root;
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
    this.milliseconds = 0;
    this.running = false;
    this.setTo = "00:00:00";
    this.mode = "timer";
    this.interval = null;
  }

  render() {
    render(
      this.root,
      html(`
        <div id="menu">
          <button>Timer</button>
          <button>Stopwatch</button>
        </div>
        <div id="display">00:00:00</div>
        <div id="controls">
          <button>Start/Stop</button>
          <button>Reset</button>
        </div>
      `)
    );

    const menu = this.root.querySelectorAll("#menu button");
    menu[0].addEventListener("click", () => {
      this.timerMode();
    });
    menu[1].addEventListener("click", () => {
      this.stopwatchMode();
    });

    document.getElementById("display").addEventListener("click", () => {
      this.editTime();
    });

    const controls = this.root.querySelectorAll("#controls button");
    controls[0].addEventListener("click", () => {
      this.startStop();
    });
    controls[1].addEventListener("click", () => {
      this.reset();
    });
  }

  timerMode() {
    this.mode = "timer";
    this.running = false;
    clearInterval(this.interval);

    render(document.getElementById("display"), html(this.setTo));
  }

  stopwatchMode() {
    this.mode = "stopwatch";
    this.running = false;
    clearInterval(this.interval);
    this.reset();

    render(document.getElementById("display"), html("00:00<sub>00</sub>"));
  }

  editTime() {
    if (this.mode === "timer" && !this.running) {
      document.getElementById("display").setAttribute("contentEditable", true);
      document.getElementById("display").focus();

      // this.hours = prompt("Hours") || 0;

      // while (Number.isNaN(Number(this.hours))) {
      //   alert("Hours is not a number");
      //   this.hours = prompt("Hours");
      // }

      // this.minutes = prompt("Minutes") || 0;

      // while (Number.isNaN(Number(this.minutes))) {
      //   alert("Minutes is not a number");
      //   this.minutes = prompt("Minutes");
      // }

      // this.seconds = prompt("Seconds") || 0;

      // while (Number.isNaN(Number(this.seconds))) {
      //   alert("Seconds is not a number");
      //   this.seconds = prompt("Seconds");
      // }

      document.getElementById("display").addEventListener("blur", (event) => {
        document.getElementById("display").removeAttribute("contentEditable");
        const time = document.getElementById("display").textContent.split(":");

        for (let item of time) {
          if (!Number.isInteger(Number(item))) {
            render(document.getElementById("display"), html(this.setTo));
            return;
          }
        }

        this.seconds = Number(time[time.length - 1]) || 0;
        this.minutes = Number(time[time.length - 2]) || 0;
        this.hours = Number(time[time.length - 3]) || 0;

        while (this.seconds > 59) {
          this.seconds -= 60;
          this.minutes++;
        }

        while (this.minutes > 59) {
          this.minutes -= 60;
          this.hours++;
        }

        this.setTo = `${this.normalize(this.hours)}:${this.normalize(
          this.minutes
        )}:${this.normalize(this.seconds)}`;
        render(
          document.getElementById("display"),
          html(
            `${this.normalize(this.hours)}:${this.normalize(
              this.minutes
            )}:${this.normalize(this.seconds)}`
          )
        );
      });
    }
  }

  reset() {
    if (this.mode === "timer") {
      clearInterval(this.interval);
      this.running = false;
      [this.hours, this.minutes, this.seconds] = this.setTo
        .split(":")
        .map((x) => this.normalize(x));
      render(document.getElementById("display"), html(this.setTo));
    } else if (this.mode === "stopwatch") {
      clearInterval(this.interval);
      this.running = false;
      this.hours = 0;
      this.minutes = 0;
      this.seconds = 0;
      this.milliseconds = 0;
      render(document.getElementById("display"), html("00:00<sub>00</sub>"));
    }
  }

  normalize(number) {
    if (String(number).length === 1) {
      return `0${number}`;
    } else {
      return number;
    }
  }

  startStop() {
    if (this.mode === "timer") {
      if (!this.running) {
        this.running = true;
        this.interval = setInterval(() => {
          this.seconds--;

          if (this.seconds < 0) {
            this.seconds += 60;
            this.minutes--;
          }

          if (this.minutes < 0) {
            this.minutes += 60;
            this.hours--;
          }

          if (this.hours < 0) {
            this.running = false;
            clearInterval(this.interval);

            this.interval = setInterval(() => {
              beep.play();
            }, 100);

            this.hours = 0;
            this.minutes = 0;
            this.seconds = 0;
          }

          render(
            document.getElementById("display"),
            html(
              `${this.normalize(this.hours)}:${this.normalize(
                this.minutes
              )}:${this.normalize(this.seconds)}`
            )
          );
        }, 1000);
      } else {
        clearInterval(this.interval);
        this.running = false;
      }
    } else if (this.mode === "stopwatch") {
      if (!this.running) {
        this.running = true;
        this.interval = setInterval(() => {
          this.milliseconds++;

          if (this.milliseconds > 99) {
            this.milliseconds -= 100;
            this.seconds++;
          }

          if (this.seconds > 59) {
            this.seconds -= 60;
            this.minutes++;
          }

          render(
            document.getElementById("display"),
            html(
              `${this.normalize(this.minutes)}:${this.normalize(
                this.seconds
              )}<sub>${this.normalize(this.milliseconds)}</sub>`
            )
          );
        }, 10);
      } else {
        clearInterval(this.interval);
        this.running = false;
      }
    }
  }
}

// function timeFromSeconds(seconds) {
//   let date = new Date(0);
//   date.setSeconds(time);
//   return date.toISOString().substr(11, 8);
// }

// const root = document.getElementById("root");
// let time = 0;
// let timerStarted = false;

// let tick;

// function startTimer() {
//   if (!timerStarted) {
//     timerStarted = true;

//     tick = setInterval(() => {
//       if (time === 0) {
//         timerStarted = false;
//         clearInterval(tick);
//       } else {
//         time--;
//         render(
//           document.getElementById("display"),
//           html(`<h1>${timeFromSeconds(time)}</h1>`)
//         );
//       }
//     }, 1000);
//   }
// }

// function setTimer() {
//   const hours = prompt("Hours");
//   const minutes = prompt("Minutes");
//   const seconds = prompt("Seconds");

//   time = (hours * 60 * 60) + (minutes * 60) + (seconds * 60);

//   render(
//     document.getElementById("display"),
//     html(`<h1>${timeFromSeconds(time)}</h1>`)
//   )
// }

// function stopTimer() {
//   if (timerStarted) {
//     timerStarted = false;
//     clearInterval(tick);
//   }
// }

// render(
//   root,
//   html(`
//     <h3>Timer</h3>
//     <div id="display"><h1>00:00:00</h1></div>
//     <div id="controls">
//       <button>Start</button>
//       <button>Set</button>
//       <button>Stop</button>
//     </div>
//   `)
// );

// const controls = document.querySelectorAll("#controls button")
// controls[0].addEventListener("click", startTimer);
// controls[1].addEventListener("click", setTimer);
// controls[2].addEventListener("click", stopTimer);

let timer = new Timer(document.getElementById("root"));
timer.render();
