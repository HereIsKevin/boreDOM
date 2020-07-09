import { dom } from "../../dist/esm/index.js";

const { html, render } = dom;

class ToDo {
  root: HTMLElement;
  items: [string, boolean][];

  constructor(root: HTMLElement) {
    this.root = root;
    this.items = [];

    this.render();

    const todoControlsAdd = document.getElementById("todo-controls-add");

    if (todoControlsAdd === null) {
      throw new Error("cannot find todo controls add");
    }

    todoControlsAdd.addEventListener("click", () => {
      const content = document.getElementById("todo-controls-content");

      if (!(content instanceof HTMLInputElement)) {
        throw new Error("cannot find todo controls content");
      }

      this.items.push([content.value, false]);
      content.value = "";
      this.render();
    });

    const todoItems = document.getElementById("todo-items");

    if (todoItems === null) {
      throw new Error("cannot find todo items");
    }

    todoItems.addEventListener("click", (event) => {
      if (event.target === null || !(event.target instanceof HTMLElement)) {
        throw new Error("cannot find todo item");
      }

      const closest = event.target.closest(".todo-item");

      if (closest === null) {
        throw new Error("cannot find todo item");
      }

      const index = Number(closest.getAttribute("data-index"));

      if (event.target.className === "todo-item-remove") {
        this.items.splice(index, 1);
      } else if (
        event.target.className === "todo-item-checkbox" &&
        event.target instanceof HTMLInputElement
      ) {
        this.items[index][1] = event.target.checked;
      }

      this.render();
    });
  }

  render() {
    render(
      this.root,
      html(
        `<div id="todo-controls">
          <input type="text" id="todo-controls-content">
          <input type="button" value="Add" id="todo-controls-add">
        </div>
        <div id="todo-items">
          ${Array.from(this.items.entries(), (x) => {
            const index = x[0];
            const content = x[1][0];
            const checked = x[1][1];

            return `
              <div class="todo-item" data-index="${index}">
                <label
                  ${checked ? 'style="text-decoration: line-through;"' : ""}
                  class="todo-item-label"
                >
                  <input type="checkbox"
                    class="todo-item-checkbox"
                    ${checked ? "checked" : ""}
                  >
                  ${content}
                </label>
                <input type="button" value="Remove" class="todo-item-remove">
              </div>
            `;
          }).join("")}
        </div>`
      )
    );
  }
}

const root = document.getElementById("root");

if (root === null) {
  throw new Error("cannot find app root");
}

new ToDo(root);
