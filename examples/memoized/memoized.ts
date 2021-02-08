import { memoized } from "../../dist/esm/index.js";

const { html, render } = memoized;

const template = (value: number, handler: () => void) =>
  html`
    <div id="display">Value is currently: ${String(value)}</div>
    <button id="increment" onclick=${handler}>Click to increment</button>
    <table>
      <tbody>
        ${[...Array(value).keys()]
          .map((x) => `<tr><td>${x}</td></tr>`)
          .join("")}
      </tbody>
    </table>
  `;

const update = () => {
  console.time("render");

  value++;

  if (target !== null) {
    render(target, template(value, update));
  }

  console.timeEnd("render");
};

let value = 0;

const target = document.getElementById("app");

if (target === null) {
  throw new Error("target missing");
}

render(target, template(value, update));
