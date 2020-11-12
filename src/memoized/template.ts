export { TemplateAttribute, TemplateElement, TemplateText, Template, template };

import { RawTemplate, RawValues, rawFragment } from "./raw";

interface TemplateAttribute {
  element: Element;
  name: string;
  index: number;
}

interface TemplateText {
  text: Text;
  index: number;
}

interface TemplateElement {
  start: Comment;
  end: Comment;
  index: number;
}

interface Template {
  strings: ReadonlyArray<string>;
  values: RawValues;
  fragment: DocumentFragment;
  texts: TemplateText[];
  elements: TemplateElement[];
  attributes: TemplateAttribute[];
}

function prepare(strings: ReadonlyArray<string>): string {
  let result = strings[0];

  // iterate without the first item due to interpolation
  for (let index = 1; index < strings.length; index++) {
    // use <!--index--> as comment markers for interpolation
    result += `<!--${index - 1}-->`;
    // close current item with the string from strings
    result += strings[index];
  }

  return result;
}

function interpolateAttributes(
  element: Element,
  values: RawValues
): TemplateAttribute[] {
  const attributes: TemplateAttribute[] = [];

  // check every attribute on the element for interpolation markers
  for (const name of element.getAttributeNames()) {
    const value = element.getAttribute(name) ?? "";

    // when a marker is found in the attribute value
    if (/^<!--[0-9]+-->$/.test(value)) {
      const index = Number(value.slice(4, value.length - 3));
      const actual = values[index];

      // set the attribute to the actual value
      element.setAttribute(name, actual);
      // mark the attribute as a dynamic item
      attributes.push({ element, name, index });
    }
  }

  return attributes;
}

function interpolateFragment(
  index: number,
  values: RawValues
): DocumentFragment {
  // get the actual value from the values
  const actual = values[index];
  // interpolate and generate value
  const value = `<!--${index}-->${actual}<!--${index}-->`;

  // generate document fragment from interpolated value
  return rawFragment(value);
}

function interpolateValues(element: Node, values: RawValues): void {
  let index = 0;

  // iterate through every single child node
  while (index < element.childNodes.length) {
    const current = element.childNodes[index];
    const value = current.nodeValue ?? "";

    // when the current node is a text node and has markers
    if (current instanceof Comment && /^[0-9]+$/.test(value)) {
      // interpolate the markers and generate document fragment
      const fragment = interpolateFragment(Number(value), values);
      const length = fragment.childNodes.length;

      // replace current node with fragment
      current.replaceWith(fragment);

      index += length;
    } else {
      index++;
    }
  }
}

function interpolateNodes(
  element: Node,
  values: RawValues
): [TemplateText[], TemplateElement[]] {
  const texts: TemplateText[] = [];
  const elements: TemplateElement[] = [];

  // interpolate all values before processing
  interpolateValues(element, values);

  let start: Comment | undefined;
  let end: Comment | undefined;
  let index = -1;

  for (const node of element.childNodes) {
    // proceed only if the current node is a comment
    if (!(node instanceof Comment)) {
      continue;
    }

    const value = node.nodeValue ?? "";

    if (typeof start === "undefined" && /^[0-9]+$/.test(value)) {
      // set start to the current node and index to the node contents when the
      // current node is an index comment and start is undefined
      start = node;
      index = Number(value);
    } else if (typeof end === "undefined" && Number(value) === index) {
      // set end if the value matches the index and end is available
      end = node;
    }

    // proceed only if both the start and end have been found
    if (typeof start === "undefined" || typeof end === "undefined") {
      continue;
    }

    if (
      start.nextSibling instanceof Text &&
      start.nextSibling.nextSibling === end
    ) {
      // add to texts if only one text node is in between ths start and the end
      texts.push({ index, text: start.nextSibling });
    } else {
      // add to elements otherwise
      elements.push({ index, start, end });
    }

    // reset start, end, and index
    start = undefined;
    end = undefined;
    index = -1;
  }

  return [texts, elements];
}

function interpolate(
  element: Node,
  values: RawValues
): [TemplateAttribute[], TemplateText[], TemplateElement[]] {
  const attributes: TemplateAttribute[] = [];
  const texts: TemplateText[] = [];
  const elements: TemplateElement[] = [];

  // find marked attributes and interpolate them for elements
  if (element instanceof Element) {
    attributes.push(...interpolateAttributes(element, values));
  }

  // find marked child nodes and interpolated them for nodes with children
  if (element.hasChildNodes()) {
    const interpolated = interpolateNodes(element, values);

    texts.push(...interpolated[0]);
    elements.push(...interpolated[1]);
  }

  // iterate through the child nodes of the element
  for (const node of element.childNodes) {
    // recursively interpolate elements
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
  // prepare the raw strings by marking interpolated values
  const prepared = prepare(raw.strings);
  // create a document fragment from the prepared string
  const fragment = rawFragment(prepared);
  // find dynamic items and interpolate markers with actual values
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
