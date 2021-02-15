import { alinav } from "../../dist/esm/index.js";

const template = alinav.html`
  <div id="display">Value is currently: ${alinav.text("value")}</div>
  <button id="increment">Click to increment</button>
  <table>
    <tbody>
      ${alinav.element("table")}
    </tbody>
  </table>
`;

const update = () => {
  console.time("render");

  (data.table as string[]).push(`<tr><td>${data.value}</td></tr>`);
  data.value = String(Number(data.value) + 1);

  console.timeEnd("render");
};

const target = document.getElementById("app");

const { rendered, data } = alinav.render(template, { value: "0", table: [] });

target?.append(rendered);
document.getElementById("increment")?.addEventListener("click", update);
