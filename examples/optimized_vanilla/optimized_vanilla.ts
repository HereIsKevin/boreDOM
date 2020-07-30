export {};

function html(
  strings: TemplateStringsArray,
  ...values: string[]
): DocumentFragment {
  const result: string[] = [strings[0]];

  for (const [index, value] of strings.slice(1).entries()) {
    result.push(values[index]);
    result.push(value);
  }

  return document.createRange().createContextualFragment(result.join(""));
}

function initialize() {
  console.time("render");

  const app = document.getElementById("app");

  if (app === null)  {
    throw new Error("app missing");
  }

  app.appendChild(
    html`<div id="display">
        Value is currently:
        <!--separator-->0
      </div>
      <button id="increment">Click to increment</button>`
  );

  const display = document.getElementById("display")?.childNodes[2];
  let value = 0;

  if (typeof display === "undefined") {
    throw new Error("display missing");
  }

  document.getElementById("increment")?.addEventListener("click", () => {
    console.time("render");
    value++;
    display.nodeValue = String(value);
    app.appendChild(html`<div>${String(value - 1)}</div>`)
    console.timeEnd("render");
  })

  console.timeEnd("render");
}

initialize();
