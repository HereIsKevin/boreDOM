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

function render(node: Node, template: DocumentFragment): void {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }

  node.appendChild(template);
}

function template(value: number) {
  return html`<div id="display">Value is currently: ${String(value)}</div>
    <button id="increment">Click to increment</button>
    ${[...Array(value).keys()].map((x) => `<div>${x}</div>`).join("")}`;
}

function update(node: Element, value: number) {
  console.time("render");
  render(node, template(value));
  console.timeEnd("render");

  document.getElementById("increment")?.addEventListener("click", () => {
    value++;

    if (target === null) {
      throw new Error("target missing");
    }

    update(target, value);
  });
}

let value = 0;

const target = document.getElementById("app");

if (target === null) {
  throw new Error("target missing");
}

update(target, value);
