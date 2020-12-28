import { html, render } from "https://cdn.skypack.dev/lit-html";

declare global {
  interface Window {
    removeValues: (event: Event) => void;
  }
}

const createRows = (count: number) =>
  [...Array(count + 1000).keys()]
    .slice(count)
    .map((x) => html`<button onclick="window.removeValues(event);">${x}</button>`);

const template = (rows: string[]) =>
  html`
    <div>
      <button id="add">Add</button>
      <button id="clear">Clear</button>
      <button id="swap">Swap</button>
      <button id="update">Update</button>
    </div>
    <div class="items">${rows}</div>
  `;

const add = (target: Element, rows: string[]) => {
  const newRows = [...rows, ...createRows(rows.length)];

  console.time();
  render(template(newRows), target);
  console.timeEnd();

  return newRows;
};

const remove = (target: Element, rows: string[], index: number) => {
  const newRows = [...rows.slice(0, index), ...rows.slice(index + 1)];

  console.time();
  render(template(newRows), target);
  console.timeEnd();

  return newRows;
};

const clear = (target: Element) => {
  const newRows: string[] = [];

  console.time();
  render(template(newRows), target);
  console.timeEnd();

  return newRows;
};

const swap = (target: Element, rows: string[]) => {
  const newRows = [...rows];

  [newRows[1], newRows[newRows.length - 2]] = [
    newRows[newRows.length - 2],
    newRows[1],
  ];

  console.time();
  render(template(newRows), target);
  console.timeEnd();

  return newRows;
};

const update = (target: Element, rows: string[]) => {
  const newRows = [...rows];

  for (let index = 0; index < newRows.length; index += 10) {
    newRows[index] = `
      <button onclick="window.removeValues(event);">
        ${`${newRows[index].slice(46, newRows[index].length - 9)} !!!`.trim()}
      </button>
    `.trim();
  }

  console.time();
  render(template(newRows), target);
  console.timeEnd();

  return newRows;
};

const initialize = () => {
  let rows = createRows(0);
  let target = document.getElementById("root");

  if (target === null) {
    throw new Error("target missing");
  }

  render(template(rows), target);

  window.removeValues = (event: Event) => {
    if (!(event.target instanceof HTMLElement)) {
      throw new TypeError("event target must be HTMLElement");
    }

    if (target === null) {
      throw new Error("target missing");
    }

    const childNodes = target.children[1].childNodes;

    for (let index = -1; index < childNodes.length - 2; index++) {
      if (childNodes[index + 1] === event.target) {
        rows = remove(target, rows, Number(index));
      }
    }
  };

  document.getElementById("add")?.addEventListener("click", () => {
    if (target === null) {
      throw new Error("target missing");
    }

    rows = add(target, rows);
  });

  document.getElementById("clear")?.addEventListener("click", () => {
    if (target === null) {
      throw new Error("target missing");
    }

    rows = clear(target);
  });

  document.getElementById("swap")?.addEventListener("click", () => {
    if (target === null) {
      throw new Error("target missing");
    }

    rows = swap(target, rows);
  });

  document.getElementById("update")?.addEventListener("click", () => {
    if (target === null) {
      throw new Error("target missing");
    }

    rows = update(target, rows);
  });
};

initialize();
