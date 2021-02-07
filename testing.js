import { Template } from "./build/memoized/template.js";
import { html } from "./build/memoized/raw.js";

const value = "div";
const raw = html`
  <div class="a-${value}">${html`I hate you`}</div>
  <div id="display">Value is currently: ${String(value)}</div>
  <button id="increment">Click to increment</button>
  ${[...Array(value).keys()].map((x) => `<div>${x}</div>`).join("")}
`;
const template = new Template(raw);

console.log(template);

const main = document.createElement("div");

document.body.append(main);
main.append(template.fragment.cloneNode(true));
