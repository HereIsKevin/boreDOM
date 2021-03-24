export { TemplateAttribute, TemplateValue, Template };

import { RawTemplate, RawValue, rawFragment } from "./raw";

interface TemplateAttribute {
  name: string;
  element: Element;
}

interface TemplateValue {
  start: Comment;
  end: Comment;
}

const groups = new WeakMap<Comment, Node[][]>();

function isChildNode(value: Node): value is ChildNode {
  return value.parentNode !== null;
}

function indexOf(nodes: Node[], value: Node): number {
  for (let index = 0; index < nodes.length; index++) {
    if (nodes[index].isEqualNode(value)) {
      return index;
    }
  }

  return -1;
}

function includes(nodes: Node[], value: Node): boolean {
  return indexOf(nodes, value) !== -1;
}

function collect(start: Comment, end: Comment): Node[] {
  const nodes: Node[] = [];

  let current = start.nextSibling;

  while (current !== end && current !== null) {
    nodes.push(current);
    current = current.nextSibling;
  }

  return nodes;
}

function sanitize(nodes: ArrayLike<Node>): void {
  let index = 0;

  while (index < nodes.length) {
    const node = nodes[index];

    if (
      node instanceof Comment ||
      (node instanceof Text && /^\s*$/.test(node.textContent ?? ""))
    ) {
      node.remove();

      if (Array.isArray(nodes)) {
        nodes.splice(index, 1);
      }

      continue;
    }

    index++;
  }
}

function wipe(start: Comment, end: Comment): void {
  let current = start.nextSibling;

  while (current !== null && current !== end) {
    current.remove();
    current = start.nextSibling;
  }
}


function mark(values: string[]): string {
  let output = "";

  for (const value of values) {
    output += "<!--separator-->";
    output += value;
  }

  return output;
}

function group(start: Comment, end: Comment): Node[][] {
  const nodes: Node[][] = [];

  let current = start.nextSibling;

  while (current !== end && current !== null) {
    if (current instanceof Comment && current.nodeValue === "separator") {
      nodes.push([]);
    }

    nodes[nodes.length - 1].push(current);
    current = current.nextSibling;
  }

  return nodes;
}

function clear(nodes: Node[]): void {
  for (const node of nodes) {
    if (isChildNode(node)) {
      node.remove();
    } else {
      throw new TypeError("node must be a child node");
    }
  }
}

function insert(reference: Node[], nodes: Node[]): void {
  const point = reference[0];

  if (!isChildNode(point)) {
    throw new TypeError("reference point must be a child node");
  }

  point.before(...nodes);
}

function diff(
  start: Comment,
  end: Comment,
  [...oldValues]: string[],
  newValues: string[]
): void {
  const nodes = groups.get(start) ?? group(start, end);

  if (oldValues.length === 0) {
    start.after(...rawFragment(mark(newValues)).childNodes);
    return;
  }

  if (newValues.length === 0) {
    let next = start.nextSibling;

    while (next !== null && next !== end) {
      next.remove();
      next = start.nextSibling;
    }

    return;
  }

  const cache: Record<string, Node[]> = {};
  const length = Math.max(newValues.length, oldValues.length);

  let modifier = 0;

  for (let place = 0; place < length; place++) {
    const position = place - modifier;
    const value = oldValues[position];

    if (
      typeof value !== "undefined" &&
      value !== newValues[position] &&
      value !== newValues[place]
    ) {
      oldValues.splice(position, 1);
      clear(nodes[position]);
      cache[value] = nodes.splice(position, 1)[0];
      modifier++;
    }
  }

  let index = 0;

  while (index < newValues.length) {
    const oldValue = oldValues[index];
    const newValue = newValues[index];

    if (newValue === oldValue) {
      index++;
      continue;
    }

    let node: Node[];

    if (typeof cache[newValue] !== "undefined") {
      node = cache[newValue];
      delete cache[newValue];
    } else {
      const fragment = rawFragment(`<!--separator-->${newValue}`);
      node = [...fragment.childNodes];
    }

    if (
      typeof oldValue !== "undefined" &&
      typeof nodes[index] !== "undefined" &&
      isChildNode(nodes[index][0])
    ) {
      insert(nodes[index], node);
    } else {
      end.before(...node);
    }

    nodes.splice(index, 0, node);
    oldValues.splice(index, 0, newValue);
  }

  groups.set(start, nodes);
}

class Template {
  public raw: RawTemplate;
  public fragment: DocumentFragment;

  private attributes: Record<number, TemplateAttribute>;
  private values: Record<number, TemplateValue>;

  public constructor(raw: RawTemplate) {
    this.raw = raw;
    this.fragment = rawFragment(this.prepare());

    this.attributes = {};
    this.values = {};

    this.findAll(this.fragment);
    this.update(this.raw.values, false);
  }

  private prepare(): string {
    let result = this.raw.strings[0];

    for (let index = 1; index < this.raw.strings.length; index++) {
      const last = index - 1;
      const value = this.raw.values[last];

      if (typeof value !== "string" && !Array.isArray(value)) {
        result += `"<!--${last}-->"`;
      } else {
        result += `<!--${last}-->`;
      }

      result += this.raw.strings[index];
    }

    return result;
  }

  private findAttributes(element: Element): void {
    for (const name of element.getAttributeNames()) {
      const value = element.getAttribute(name) ?? "";
      const matches = value.match(/^<!--([0-9]+)-->$/);

      if (matches !== null && matches[0] === value) {
        const index = Number(matches[1]);

        this.attributes[index] = { name, element };
      }
    }
  }

  private findValues(node: Node): void {
    let current = node.firstChild;

    while (current !== null) {
      if (!(current instanceof Comment)) {
        current = current.nextSibling;
        continue;
      }

      const value = current.nodeValue ?? "";
      const matches = value.match(/^([0-9]+)$/);

      if (matches !== null && matches[0] === value) {
        const index = Number(matches[1]);
        const start = new Comment("start");
        const end = new Comment("end");

        current.replaceWith(start, end);
        current = end.nextSibling;

        this.values[index] = { start, end };
      } else {
        current = current.nextSibling;
      }
    }
  }

  private findAll(node: Node): void {
    if (node instanceof Element) {
      this.findAttributes(node);
    }

    if (node.hasChildNodes()) {
      this.findValues(node);
    }

    for (const child of node.childNodes) {
      if (child.hasChildNodes()) {
        this.findAll(child);
      }
    }
  }

  private updateAttribute(
    index: number,
    oldValue: RawValue,
    newValue: RawValue
  ): void {
    const { name, element } = this.attributes[index];
    const matches = name.match(/^on([a-z]+)$/);

    if (typeof newValue === "string") {
      element.setAttribute(name, newValue);
    } else if (Array.isArray(newValue)) {
      throw new TypeError("attribute cannot be an array");
    } else if (matches !== null && matches[0] === name) {
      const handler = matches[1];

      if (typeof oldValue !== "string" && !Array.isArray(oldValue)) {
        element.removeAttribute(name);
        element.removeEventListener(handler, oldValue);
      }

      if (typeof newValue !== "string" && !Array.isArray(newValue)) {
        element.addEventListener(handler, newValue);
      }
    } else {
      throw new TypeError("non-handler attributes cannot be handlers");
    }
  }

  private updateValues(
    index: number,
    oldValue: RawValue,
    newValue: RawValue
  ): void {
    const { start, end } = this.values[index];

    if (typeof newValue === "string") {
      if (typeof oldValue !== "string") {
        throw new TypeError("value types must be consistent");
      }

      const text = new Text(newValue);

      wipe(start, end);
      start.after(text);
    } else if (Array.isArray(newValue)) {
      if (!Array.isArray(oldValue)) {
        throw new TypeError("value types must be consistent");
      }

      diff(start, end, oldValue, newValue);
    } else {
      throw new TypeError("value cannot be a handler");
    }
  }

  public update(values: RawValue[], compare: boolean = true): void {
    for (let index = 0; index < this.raw.values.length; index++) {
      const oldValue = this.raw.values[index];
      const newValue = values[index];

      if (compare && oldValue === newValue) {
        continue;
      }

      if (index in this.attributes) {
        this.updateAttribute(index, oldValue, newValue);
      } else if (index in this.values) {
        this.updateValues(index, oldValue, newValue);
      }
    }
  }
}
