import { dom } from "../../dist/esm/index.js";

const { html, render } = dom;

function template(value: number) {
  return html(`
    <div id="display">Value is currently: ${String(value)}</div>
    <button id="increment">Click to increment</button>
    ${[...Array(value).keys()].map((x) => `<div>${x}</div>`).join("")}
  `);
}

function update(node: Element, value: number) {
  console.time("render");
  render(node, template(value));
  console.timeEnd("render");
}

let value = 0;

const target = document.getElementById("app");

if (target === null) {
  throw new Error("target missing");
}

update(target, value);

document.getElementById("increment")?.addEventListener("click", () => {
  value++;
  update(target, value);
});
