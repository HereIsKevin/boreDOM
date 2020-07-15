export { html, render };

interface RawTemplate {
  strings: TemplateStringsArray;
  values: (string | string[])[];
}

interface ParsedTemplate extends RawTemplate {
  parsed: string;
}

interface CachedAttribute {
  index: number;
  name: string;
  element: Element;
}

interface CachedText {
  index: number;
  node: Text;
}

interface CachedElement {
  index: number;
  start: Comment;
  end: Comment;
}

interface Template {
  strings: TemplateStringsArray;
  values: (string | string[])[];
  fragment: DocumentFragment;
  texts: CachedText[];
  elements: CachedElement[];
  attributes: CachedAttribute[];
}

interface MemoizedElement extends Element {
  memoized?: Template;
}

function isElementNode(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function isCommentNode(node: Node): node is Comment {
  return node.nodeType === Node.COMMENT_NODE;
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function html(
  strings: TemplateStringsArray,
  ...values: (string | string[])[]
): RawTemplate {
  return { strings, values };
}

function rawFragment(template: string): DocumentFragment {
  return document.createRange().createContextualFragment(template);
}

function parseTemplate(template: RawTemplate): ParsedTemplate {
  const result: string[] = [template.strings[0]];

  for (const [index, value] of template.strings.slice(1).entries()) {
    result.push(`{${index}}`);
    result.push(value);
  }

  return { ...template, parsed: result.join("") };
}

function cacheAttributes(node: Element, values: string[]): CachedAttribute[] {
  const cache: CachedAttribute[] = [];

  for (const name of node.getAttributeNames()) {
    if (/^\{[0-9]+\}$/.test(node.getAttribute(name) || "")) {
      const index = Number(name.slice(1, name.length - 1));

      cache.push({
        index: index,
        name: name,
        element: node,
      });

      node.setAttribute(name, values[index]);
    }
  }

  return cache;
}

function cacheElements(node: Node): CachedElement[] {
  const cache: CachedElement[] = [];

  let currentStart: Comment | undefined;
  let currentIndex: number = -1;

  for (const child of node.childNodes) {
    if (!isCommentNode(child)) {
      continue;
    }

    if (
      typeof currentStart === "undefined" &&
      child.nodeValue !== null &&
      /^\d+$/.test(child.nodeValue.trim())
    ) {
      currentStart = child;
      currentIndex = Number(child.nodeValue.trim());
    } else if (
      typeof currentStart !== "undefined" &&
      child.nodeValue !== null &&
      child.nodeValue &&
      Number(child.nodeValue.trim()) === currentIndex
    ) {
      cache.push({
        index: currentIndex,
        start: currentStart,
        end: child,
      });

      currentIndex = -1;
      currentStart = undefined;
    }
  }

  return cache;
}

function cacheTexts(node: Node): CachedText[] {
  const cache: CachedText[] = [];

  for (const child of node.childNodes) {
    if (!isCommentNode(child)) {
      continue;
    }

    if (child.nodeValue !== null && /^\d+$/.test(child.nodeValue.trim())) {
      const index = Number(child.nodeValue.trim());
      const next = child.nextSibling;
      const closure = next?.nextSibling;

      if (next === null || closure === null || typeof closure === "undefined") {
        continue;
      }

      if (
        isTextNode(next) &&
        isCommentNode(closure) &&
        Number(closure.nodeValue?.trim()) === index
      ) {
        cache.push({
          index,
          node: next,
        });
      }
    }
  }

  return cache;
}

function interpolateValues(
  node: Node,
  values: (string | string[])[]
): [CachedText[], CachedElement[]] {
  const cacheText: CachedText[] = [];
  const cacheElement: CachedElement[] = [];

  let index = 0;

  while (index < node.childNodes.length) {
    const currentNode = node.childNodes[index];
    const value = currentNode.nodeValue || "";

    if (!/\{[0-9]+\}/.test(value)) {
      index++;
      continue;
    }

    const fragment = rawFragment(
      value.replace(/\{[0-9]+\}/g, (x) => {
        const valueIndex = Number(x.slice(1, x.length - 1));
        const currentValue = values[valueIndex];
        return `<!--${valueIndex}-->${
          typeof currentValue === "string"
            ? currentValue
            : markElements(currentValue).join("")
        }<!--${valueIndex}-->`;
      })
    );

    const length = fragment.childNodes.length;

    cacheElement.push(...cacheElements(fragment));
    cacheText.push(...cacheTexts(fragment));

    node.insertBefore(fragment, currentNode);
    node.removeChild(currentNode);

    index += length;
  }

  return [cacheText, cacheElement];
}

function cacheAll(
  node: Node,
  template: ParsedTemplate
): [CachedAttribute[], CachedText[], CachedElement[]] {
  const attributesCache: CachedAttribute[] = [];
  const textCache: CachedText[] = [];
  const elementCache: CachedElement[] = [];

  if (node.hasChildNodes()) {
    if (isElementNode(node)) {
      attributesCache.push(
        ...cacheAttributes(
          node,
          template.values.map((x) => String(x))
        )
      );
    }

    const interpolate = interpolateValues(node, template.values);

    textCache.push(...interpolate[0]);
    elementCache.push(...interpolate[1]);
  }

  for (const child of node.childNodes) {
    if (isElementNode(child)) {
      const [attributes, texts, elements] = cacheAll(child, template);

      attributesCache.push(...attributes);
      textCache.push(...texts);
      elementCache.push(...elements);
    }
  }

  return [attributesCache, textCache, elementCache];
}

function cachedTemplate(template: RawTemplate): Template {
  const parsedTemplate = parseTemplate(template);
  const fragment = rawFragment(parsedTemplate.parsed);
  const cachedOutput = cacheAll(fragment, parsedTemplate);

  return {
    strings: parsedTemplate.strings,
    values: parsedTemplate.values,
    fragment: fragment,
    attributes: cachedOutput[0],
    texts: cachedOutput[1],
    elements: cachedOutput[2],
  };
}

function markElements(elements: string[]): string[] {
  const result: string[] = [];

  for (const [index, element] of elements.entries()) {
    result.push(`<!--separator-->`);
    result.push(element);
  }

  return result;
}

function findKeep(
  oldValues: string[],
  newValues: string[]
): [number, number][] {
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

  for (const group of filtered) {
    if (group[0] > last[0] && group[1] > last[1]) {
      keep.push(group);
      last = group;
    }
  }

  return keep;
}

function renderElements(
  node: Node,
  start: Comment,
  end: Comment,
  oldValue: string[],
  newValue: string[]
): void {
  const firstOldNode = start.nextSibling;

  if (firstOldNode === null) {
    return;
  }

  const oldNodes: Node[] = [firstOldNode];

  while (oldNodes[oldNodes.length - 1].nextSibling !== end) {
    const currentOldNode = oldNodes[oldNodes.length - 1].nextSibling;

    if (currentOldNode === null) {
      return;
    }

    oldNodes.push(currentOldNode);
  }

  const keep = findKeep(oldValue, newValue);

  const keepNew = keep.map((x) => x[0]);
  const keepOld = keep.map((x) => x[1]);

  const remove = [...oldValue.keys()].filter((x) => !keepOld.includes(x));
  const insert = [...newValue.keys()].filter((x) => !keepNew.includes(x));

  let currentIndex = -1;
  let oldNodeCollection: Node[][] = [];

  for (const child of oldNodes) {
    if (
      isCommentNode(child) &&
      child.nodeValue !== null &&
      child.nodeValue.trim() === "separator"
    ) {
      currentIndex++;
      oldNodeCollection[currentIndex] = [child];
    } else {
      oldNodeCollection[currentIndex].push(child);
    }
  }

  oldNodeCollection.push([end]);

  // console.log(oldNodeCollection)

  for (const [modifier, index] of remove.entries()) {
    for (const child of oldNodeCollection[modifier - index]) {
      node.removeChild(child);
    }

    oldNodeCollection.splice(modifier - index, 1);
  }

  // console.log(oldNodeCollection)

  for (const index of insert) {
    // console.log(oldNodeCollection, index)
    node.insertBefore(
      rawFragment(`<!--separator-->${newValue[index]}`),
      oldNodeCollection[index][0]
    );
  }
}

function render(target: MemoizedElement, template: RawTemplate): void {
  if (
    !Object.prototype.hasOwnProperty.call(target, "memoized") ||
    typeof target.memoized === "undefined"
  ) {
    const templateCache = cachedTemplate(template);

    target.appendChild(templateCache.fragment);

    Object.defineProperty(target, "memoized", {
      value: templateCache,
    });

    return;
  }

  const attributeIndexes = target.memoized.attributes.map((x) => x.index);
  const elementIndexes = target.memoized.elements.map((x) => x.index);
  const textIndexes = target.memoized.texts.map((x) => x.index);

  for (const [index, value] of target.memoized.values.entries()) {
    if (value === template.values[index]) {
      continue;
    }

    if (attributeIndexes.includes(index)) {
      const { element, name } = target.memoized.attributes[
        attributeIndexes.indexOf(index)
      ];
      const newValue = template.values[index];

      element.setAttribute(name, String(newValue));
    } else if (textIndexes.includes(index)) {
      const { node } = target.memoized.texts[textIndexes.indexOf(index)];
      const newValue = template.values[index];

      node.nodeValue = String(newValue);
    } else if (elementIndexes.includes(index)) {
      const { start, end } = target.memoized.elements[
        elementIndexes.indexOf(index)
      ];
      const newValue = template.values[index];
      const parent = start.parentNode;

      if (parent === null) {
        continue;
      }

      if (typeof newValue === "string" || typeof value === "string") {
        while (start.nextSibling !== end) {
          const sibling = start.nextSibling;

          if (sibling === null) {
            break;
          }

          parent.removeChild(sibling);
        }

        parent.insertBefore(
          rawFragment(
            typeof newValue === "string" ? newValue : newValue.join("")
          ),
          end
        );
      } else {
        renderElements(parent, start, end, value, newValue);
      }
    }
  }

  target.memoized.values = template.values;
}
