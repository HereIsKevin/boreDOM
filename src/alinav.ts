export { text, attribute, element, html, render };

type TemplateValue = {
  kind: "text" | "attribute" | "element" | "elements";
  key: string;
};

type TemplateAttribute = {
  element: Element;
  name: string;
  key: string;
};

type TemplateText = {
  text: Text;
  key: string;
};

type TemplateElement = {
  start: Comment;
  end: Comment;
  key: string;
};

type Value = string | string[];
type Data = Record<string, Value>;

type Cache = {
  attributes: TemplateAttribute[];
  texts: TemplateText[];
  elements: TemplateElement[];
};

const attribute = (key: string): TemplateValue => ({ kind: "attribute", key });
const text = (key: string): TemplateValue => ({ kind: "text", key });
const element = (key: string): TemplateValue => ({ kind: "element", key });

const fragment = (value: string): DocumentFragment => {
  const template = document.createElement("template");
  template.innerHTML = value;

  return template.content;
};

const html = (
  strings: TemplateStringsArray,
  ...values: TemplateValue[]
): DocumentFragment => {
  let result = strings[0];

  for (let index = 1; index < strings.length; index++) {
    const { kind, key } = values[index - 1];

    result += `<!--allinav-${kind} ${key}-->`;
    result += strings[index];
  }

  return fragment(result);
};

const interpolateAttributes = (element: Element): TemplateAttribute[] => {
  const attributes: TemplateAttribute[] = [];

  for (const name of element.getAttributeNames()) {
    const value = element.getAttribute(name) ?? "";

    if (/^<!--allinav-attribute .*-->$/.test(value)) {
      const matches = value.match(/^<!--allinav-attribute (.*)-->$/);

      if (matches === null || matches[1].length === 0) {
        throw new Error("attribute is missing a key");
      }

      attributes.push({ element, name, key: matches[1] });
    }
  }

  return attributes;
};

const interpolateValues = (
  element: Node
): { texts: TemplateText[]; elements: TemplateElement[] } => {
  const texts: TemplateText[] = [];
  const elements: TemplateElement[] = [];

  for (const node of element.childNodes) {
    if (!(node instanceof Comment)) {
      continue;
    }

    const value = node.nodeValue ?? "";

    if (/^allinav-text .*$/.test(value)) {
      const matches = value.match(/^allinav-text (.*)$/);

      if (matches === null || matches[1].length === 0) {
        throw new Error("text is missing a key");
      }

      const text = new Text();

      texts.push({ text, key: matches[1] });
      node.replaceWith(text);
    } else if (/^allinav-element .*$/.test(value)) {
      const matches = value.match(/^allinav-element (.*)$/);

      if (matches === null || matches[1].length === 0) {
        throw new Error("element is missing a key");
      }

      const start = new Comment("allinav-start");
      const end = new Comment("allinav-end");

      elements.push({ start, end, key: matches[1] });
      node.replaceWith(start, end);
    }
  }

  return { texts, elements };
};

const interpolate = (
  element: Node
): {
  attributes: TemplateAttribute[];
  texts: TemplateText[];
  elements: TemplateElement[];
} => {
  const attributes: TemplateAttribute[] = [];
  const texts: TemplateText[] = [];
  const elements: TemplateElement[] = [];

  if (element instanceof Element) {
    attributes.push(...interpolateAttributes(element));
  }

  if (element.hasChildNodes()) {
    const values = interpolateValues(element);

    texts.push(...values.texts);
    elements.push(...values.elements);
  }

  for (const node of element.childNodes) {
    if (node instanceof Element) {
      const values = interpolate(node);

      attributes.push(...values.attributes);
      texts.push(...values.texts);
      elements.push(...values.elements);
    }
  }

  return { attributes, texts, elements };
};

const renderAttributes = (
  attributes: TemplateAttribute[],
  data: Data
): void => {
  for (const { element, key, name } of attributes) {
    const value = data[key];

    if (Array.isArray(value)) {
      throw new TypeError("attributes cannot be arrays");
    }

    element.setAttribute(name, value);
  }
};

const renderTexts = (texts: TemplateText[], data: Data): void => {
  for (const { text, key } of texts) {
    const value = data[key];

    if (Array.isArray(value)) {
      throw new TypeError("texts cannot be arrays");
    }

    text.nodeValue = value;
  }
};

const renderElements = (elements: TemplateElement[], data: Data): void => {
  for (const { start, end, key } of elements) {
    const value = data[key];
    const stringified = Array.isArray(value)
      ? value.map((value) => `<!--allinav-separator-->${value}`).join("")
      : value;

    start.after(fragment(stringified));
  }
};

const updateAttribute = (
  { element, name }: TemplateAttribute,
  oldValue: Value,
  newValue: Value
): void => {
  if (typeof oldValue !== "string" || typeof newValue !== "string") {
    throw new TypeError("attribute values must be strings");
  }

  element.setAttribute(name, newValue);
};

const updateText = (
  { text }: TemplateText,
  oldValue: Value,
  newValue: Value
): void => {
  if (typeof oldValue !== "string" || typeof newValue !== "string") {
    throw new TypeError("text values must be strings");
  }

  text.nodeValue = newValue;
};

const updateElement = (
  { start, end }: TemplateElement,
  oldValue: Value,
  newValue: Value
): void => {
  let current = start.nextSibling;

  while (current !== null && current !== end) {
    current.remove();
    current = start.nextSibling;
  }

  const stringified = Array.isArray(newValue)
    ? newValue.map((value) => `<!--allinav-separator-->${value}`).join("")
    : newValue;

  start.after(fragment(stringified));
};

const watchify = (array: string[], { end }: TemplateElement): string[] => {
  return new Proxy(array, {
    get(
      target: string[],
      key: number | string
    ): string | ((value: string) => void) {
      const numericKey = Number(key);
      const value = typeof !Number.isNaN(numericKey)
        ? target[numericKey]
        : undefined;

      if (typeof value === "string") {
        return value;
      } else if (key === "push") {
        return (value: string): void => {
          array.push(value);
          end.before(fragment(`<!--allinav-separator-->${value}`));
        };
      } else {
        throw new Error("cannot retrieve other methods");
      }
    },
  });
};

const proxify = (data: Data, cache: Cache): Data => {
  const attributes = Object.fromEntries(
    cache.attributes.map((attribute) => [attribute.key, attribute])
  );

  const texts = Object.fromEntries(cache.texts.map((text) => [text.key, text]));

  const elements = Object.fromEntries(
    cache.elements.map((element) => [element.key, element])
  );

  const watchified: Record<string, string[]> = {};

  return new Proxy(data, {
    get(target: Data, key: string): Value {
      const value = target[key];

      if (Array.isArray(value) && key in elements) {
        if (!(key in watchified)) {
          watchified[key] = watchify(value, elements[key]);
        }

        return watchified[key];
      } else if (typeof value === "string") {
        return value;
      } else {
        throw new Error("cannot call object methods on data");
      }
    },
    set(target: Data, key: string, value: Value): boolean {
      if (key in attributes) {
        updateAttribute(attributes[key], target[key], value);
      } else if (key in texts) {
        updateText(texts[key], target[key], value);
      } else if (key in elements) {
        updateElement(elements[key], target[key], value);
      } else {
        throw new Error("cannot add new key to data");
      }

      target[key] = value;
      return true;
    },
  });
};

const render = (template: Node, data: Data): { rendered: Node; data: Data } => {
  const cloned = template.cloneNode(true);
  const { attributes, texts, elements } = interpolate(cloned);
  const cache = { attributes, texts, elements };

  renderAttributes(attributes, data);
  renderTexts(texts, data);
  renderElements(elements, data);

  return { rendered: cloned, data: proxify(data, cache) };
};

/*
let value = 0;
const template = html`
  <button>Button</button>
  <div>${allinav.text("count")}</div>
  <div>${allinav.elements("elements")}</div>
`;

const element = allinav.render(template, { count: 10, elements: [] });
document.append(element);


allinav.update(element, {})
*/
