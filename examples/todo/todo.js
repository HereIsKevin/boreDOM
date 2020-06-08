import { dom } from "/dist/index.esm.js";

const { html, render } = dom;

class ToDo {
  constructor(root) {
    this.root = root;
    this.items = [];

    this.render();

    document
      .getElementById("todo-controls-add")
      .addEventListener("click", (event) => {
        const content = document.getElementById("todo-controls-content");
        this.items.push([content.value, false]);
        content.value = "";
        this.render();
      });

    document.getElementById("todo-items").addEventListener("click", (event) => {
      const index = event.target
        .closest(".todo-item")
        .getAttribute("data-index");

      if (event.target.className === "todo-item-remove") {
        this.items.splice(index, 1);
      } else if (event.target.className === "todo-item-checkbox") {
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

let todo = new ToDo(document.getElementById("root"));
