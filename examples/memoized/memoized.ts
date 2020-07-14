import { memoized } from "../../dist/esm/index.js";

const { html, render } = memoized;

function template(value: number) {
  return html`<div id="display">Value is currently: ${String(value)}</div>
    <button id="increment">Click to increment</button>`;
}

function update(node: Element, value: number) {
  render(node, template(value));
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
