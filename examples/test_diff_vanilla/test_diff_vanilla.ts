const button = (value: string, onclick: (event: Event) => void) => {
  const button = document.createElement("button");

  button.onclick = onclick;
  button.textContent = value;

  return button;
};

const add = (target: Element, count: number) => {
  console.time();

  for (let index = count; index < count + 1000; index++) {
    target.append(button(String(index), remove));
  }

  console.timeEnd();
};

const remove = (event: Event) => {
  console.time();

  const target = event.target;

  if (target instanceof Element) {
    target.remove();
  }

  console.timeEnd();
};

const clear = (target: Element) => {
  console.time();

  while (target.lastChild) {
    target.lastChild.remove();
  }

  console.timeEnd();
};

const swap = (target: Element) => {
  console.time();

  const first = target.childNodes[1];
  const last = target.childNodes[target.childNodes.length - 2];

  first.remove();
  last.remove();

  target.childNodes[0].after(last);
  target.childNodes[target.childNodes.length - 1].before(first);

  console.timeEnd();
};

const update = (target: Element) => {
  console.time();

  for (let index = 0; index < target.childNodes.length; index += 10) {
    const node = target.childNodes[index];
    node.textContent = `${node.textContent} !!!`;
  }

  console.timeEnd();
};

const initialize = (target: Element) => {
  let count = 0;

  const items = document.createElement("div");
  items.className = "items";

  const buttons = document.createElement("div");

  buttons.append(
    button("Add", () => {
      add(items, count);
      count += 1000;
    })
  );

  buttons.append(
    button("Clear", () => {
      clear(items);
      count = 0;
    })
  );

  buttons.append(button("Swap", () => swap(items)));
  buttons.append(button("Update", () => update(items)));

  add(items, count);
  count += 1000;

  target.append(buttons);
  target.append(items);
};

const target = document.getElementById("root");

if (target === null) {
  throw new TypeError("target is missing");
}

initialize(target);
