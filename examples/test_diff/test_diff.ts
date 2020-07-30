import { memoized } from "../../dist/esm/index.js";

const { html, render } = memoized;

const createRows = (count: number) =>
  [...Array(count + 100).keys()].slice(count).map((x) => `<div>${x}</div>`);

const template = (rows: string[]) =>
  html`
    <div>
      <button id="add">Add</button>
      <button id="clear">Clear</button>
      <button id="swap">Swap</button>
      <button id="update">Update</button>
    </div>
    <div>
      ${rows}
    </div>
  `;

const add = (target: Element, rows: string[]) => {
  const newRows = [...rows, ...createRows(rows.length)];

  render(target, template(newRows));

  return newRows;
};

const clear = (target: Element) => {
  const newRows: string[] = [];

  render(target, template(newRows));

  return newRows;
};

const swap = (target: Element, rows: string[]) => {
  const newRows = [...rows];

  [newRows[1], newRows[newRows.length - 2]] = [
    newRows[newRows.length - 2],
    newRows[1],
  ];

  render(target, template(newRows));

  return newRows;
};

const update = (target: Element, rows: string[]) => {
  const newRows = [...rows];

  for (let index = 0; index < newRows.length; index += 10) {
    newRows[index] = `<div>${newRows[index].slice(
      5,
      newRows[index].length - 6
    )} !!!</div>`;
  }

  render(target, template(newRows));

  return newRows;
};

const initialize = () => {
  let rows = createRows(0);
  let target = document.getElementById("root");

  if (target === null) {
    throw new Error("target missing");
  }

  render(target, template(rows));

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
