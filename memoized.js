import { html, render, update as falseUpdate } from "./build/memoized.js";

let value = 0;
let template = (value) => html`<p>Hello, world</p>
    <p id="value">Value is ${value}</p>
    <button id="increment">Increment</button>`;

render(
  document.getElementById("app"),
  template(value)
);

function update(x, y) {
  console.time("update");
  falseUpdate(x, y);
  console.timeEnd("update")
}

document.getElementById("increment").addEventListener("click", () => {
  value++;
  update(document.getElementById("app"), template(value));
});

// const child = document.getElementById("value").childNodes[2];

// document.getElementById("increment").onclick = () => {
//   console.time("render");
//   child.textContent = ++value;
//   console.timeEnd("render");
// };