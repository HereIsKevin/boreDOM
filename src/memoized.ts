export { html, render };

interface RawTemplate {
  strings: TemplateStringsArray;
  values: (string | string[])[];
}

interface AttributeTemplate {
  element: Element;
  name: string;
  index: number;
}

interface TextTemplate {
  text: Text;
  index: number;
}

interface ElementTemplate {
  start: Comment;
  end: Comment;
  index: number;
}

interface Template {
  strings: TemplateStringsArray;
  values: (string | string[])[];
  fragment: DocumentFragment;
  texts: TextTemplate[];
  elements: ElementTemplate[];
  attributes: AttributeTemplate[];
}

interface Indexes {
  attributes: number[];
  elements: number[];
  texts: number[];
}

interface MemoizedElement extends Element {
  memoized?: Template;
  indexes?: Indexes;
}

function html(
  strings: TemplateStringsArray,
  ...values: (string | string[])[]
): RawTemplate {
  return { strings, values };
}

function markValues(template: RawTemplate): string {
  const result = [template.strings[0]];

  for (const [index, value] of template.strings.slice(1).entries()) {
    result.push(`{${index}}`);
    result.push(value);
  }

  return result.join("");
}

function rawFragment(template: string): DocumentFragment {
  return document.createRange().createContextualFragment(template);
}

function interpolateAttributes(
  element: Element,
  values: (string | string[])[]
): AttributeTemplate[] {
  const attributes: AttributeTemplate[] = [];

  for (const name of element.getAttributeNames()) {
    const value = element.getAttribute(name) ?? "";

    if (/\{[0-9]+\}/.test(value)) {
      const index = Number(value.slice(1, value.length - 1));

      element.setAttribute(name, String(values[index]));
      attributes.push({ element, name, index });
    }
  }

  return attributes;
}

function markElements(values: string[]): string {
  const output: string[] = [];

  for (const value of values) {
    output.push("<!--separator-->");
    output.push(value);
  }

  return output.join("");
}

function interpolateValues(element: Node, values: (string | string[])[]): void {
  let index = 0;

  while (index < element.childNodes.length) {
    const current = element.childNodes[index];
    const value = current.nodeValue ?? "";

    if (!(current instanceof Text) && !/\{[0-9]+\}/.test(value)) {
      index++;
      continue;
    }

    const interpolated = value.replace(/\{[0-9]+\}/g, (match) => {
      const currentIndex = Number(match.slice(1, match.length - 1));
      const currentValue = values[currentIndex];

      return `<!--${currentIndex}-->${
        Array.isArray(currentValue) ? markElements(currentValue) : currentValue
      }<!--${currentIndex}-->`;
    });

    const fragment = rawFragment(interpolated);
    const length = fragment.childNodes.length;

    element.insertBefore(fragment, current);
    element.removeChild(current);

    index += length;
  }
}

function interpolateNodes(
  element: Node,
  values: (string | string[])[]
): [TextTemplate[], ElementTemplate[]] {
  const texts: TextTemplate[] = [];
  const elements: ElementTemplate[] = [];

  interpolateValues(element, values);

  let start: Comment | undefined;
  let end: Comment | undefined;
  let index: number | undefined;

  for (const node of element.childNodes) {
    if (!(node instanceof Comment)) {
      continue;
    }

    const value = (node.nodeValue ?? "").trim();

    if (typeof start === "undefined" && /^\d+$/.test(value)) {
      start = node;
      index = Number(value);
    } else if (typeof end === "undefined" && Number(value) === index) {
      end = node;
    }

    if (
      typeof start === "undefined" ||
      typeof end === "undefined" ||
      typeof index === "undefined"
    ) {
      continue;
    }

    if (
      start?.nextSibling instanceof Text &&
      start?.nextSibling?.nextSibling === end
    ) {
      texts.push({ index, text: start.nextSibling });
    } else {
      elements.push({ index, start, end });
    }

    start = undefined;
    end = undefined;
    index = undefined;
  }

  return [texts, elements];
}

function interpolate(
  element: Node,
  values: (string | string[])[]
): [AttributeTemplate[], TextTemplate[], ElementTemplate[]] {
  const attributes: AttributeTemplate[] = [];
  const texts: TextTemplate[] = [];
  const elements: ElementTemplate[] = [];

  if (element instanceof Element) {
    attributes.push(...interpolateAttributes(element, values));
  }

  if (element.hasChildNodes()) {
    const interpolated = interpolateNodes(element, values);

    texts.push(...interpolated[0]);
    elements.push(...interpolated[1]);
  }

  for (const node of element.childNodes) {
    if (node instanceof Element) {
      const interpolated = interpolate(node, values);

      attributes.push(...interpolated[0]);
      texts.push(...interpolated[1]);
      elements.push(...interpolated[2]);
    }
  }

  return [attributes, texts, elements];
}

function template(raw: RawTemplate): Template {
  const marked = markValues(raw);
  const fragment = rawFragment(marked);
  const [attributes, texts, elements] = interpolate(fragment, raw.values);

  return {
    strings: raw.strings,
    values: raw.values,
    fragment,
    texts,
    elements,
    attributes,
  };
}

function eraseNodes(
  node: Node,
  start: Comment,
  end: Comment,
  newValue: string
): void {
  while (start.nextSibling !== end) {
    const sibling = start.nextSibling;

    if (sibling === null) {
      break;
    }

    node.removeChild(sibling);
  }

  node.insertBefore(rawFragment(newValue), end);
}

function diffValues(
  newValues: string[],
  oldValues: string[]
): [number[], number[]] {
  const filtered: [number, number][] = [];

  for (const [newIndex, newValue] of newValues.entries()) {
    for (const [oldIndex, oldValue] of oldValues.entries()) {
      if (newValue === oldValue) {
        filtered.push([newIndex, oldIndex]);
      }
    }
  }

  const keep: [number, number][] = [];
  let last = [-1, -1];

  for (const point of filtered) {
    if (point[0] > last[0] && point[1] > last[1]) {
      keep.push(point);
      last = point;
    }
  }

  const keepOld = keep.map((x) => x[1]);
  const keepNew = keep.map((x) => x[0]);

  const remove = [...oldValues.keys()].filter((x) => !keepOld.includes(x));
  const insert = [...newValues.keys()].filter((x) => !keepNew.includes(x));

  return [remove, insert];
}

function diffNodes(
  node: Node,
  start: Comment,
  end: Comment,
  newValue: string[],
  oldValue: string[]
): void {
  const [remove, insert] = diffValues(newValue, oldValue);

  let current: Node | null = start;
  let index = -1;

  while (!(current === end.nextSibling || current === null)) {
    let next: Node | null = current.nextSibling;

    if (
      current instanceof Comment &&
      (current.textContent?.trim() === "separator" || current === end)
    ) {
      if (insert.includes(index + 1)) {
        node.insertBefore(
          rawFragment(`<!--separator-->${newValue[index + 1]}`),
          current
        );
      }

      index++;
    }

    if (remove.includes(index) && current !== null) {
      node.removeChild(current);
      current = next;
    } else {
      current = current.nextSibling;
    }
  }
}

function render(target: MemoizedElement, rawTemplate: RawTemplate): void {
  if (
    !Object.prototype.hasOwnProperty.call(target, "memoized") ||
    typeof target.memoized === "undefined"
  ) {
    const fullTemplate = template(rawTemplate);

    target.appendChild(fullTemplate.fragment);
    Object.defineProperty(target, "memoized", { value: fullTemplate });

    return;
  }

  if (
    !Object.prototype.hasOwnProperty.call(target, "indexes") ||
    typeof target.indexes === "undefined"
  ) {
    const attributes = target.memoized.attributes.map((x) => x.index);
    const elements = target.memoized.elements.map((x) => x.index);
    const texts = target.memoized.texts.map((x) => x.index);

    Object.defineProperty(target, "indexes", {
      value: { attributes, elements, texts },
    });
  }

  const attributeIndexes = target.indexes?.attributes ?? [];
  const elementIndexes = target.indexes?.elements ?? [];
  const textIndexes = target.indexes?.texts ?? [];

  for (const [index, oldValue] of target.memoized.values.entries()) {
    const newValue = rawTemplate.values[index];

    if (oldValue === newValue) {
      continue;
    }

    if (attributeIndexes.includes(index)) {
      const { element, name } = target.memoized.attributes[
        attributeIndexes.indexOf(index)
      ];

      element.setAttribute(name, String(newValue));
    } else if (textIndexes.includes(index)) {
      const { text } = target.memoized.texts[textIndexes.indexOf(index)];

      text.nodeValue = String(newValue);
    } else if (elementIndexes.includes(index)) {
      const { start, end } = target.memoized.elements[
        elementIndexes.indexOf(index)
      ];
      const parent = start.parentNode;

      if (parent === null) {
        continue;
      }

      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        diffNodes(parent, start, end, newValue, oldValue);
      } else {
        eraseNodes(
          parent,
          start,
          end,
          Array.isArray(newValue) ? newValue.join("") : newValue
        );
      }
    }
  }

  target.memoized.values = rawTemplate.values;
}
