export { template };

import { RawTemplate, RawValues, rawFragment } from "./raw.js";

interface TemplateAttribute {
  element: Element;
  name: string;
  parts: string[];
  indexes: number[];
}

interface TemplateValue {
  start: Comment;
  end: Comment;
  index: number;
}

interface Template {
  strings: ReadonlyArray<string>;
  rawValues: RawValues;
  fragment: DocumentFragment;
  attributes: TemplateAttribute[];
  values: TemplateValue[];
}

function prepare(strings: ReadonlyArray<string>): string {
  let result = strings[0];

  for (let index = 1; index < strings.length; index++) {
    result += `<!--${index - 1}-->`;
    result += strings[index];
  }

  return result;
}

function interpolateAttribute(
  { element, name, parts, indexes }: TemplateAttribute,
  values: RawValues
): void {
  let actual = parts[0];

  for (let index = 1; index < parts.length; index++) {
    const value = values[indexes[index - 1]];

    if (typeof value !== "string") {
      throw new TypeError("attribute value must be a string");
    }

    actual += value;
    actual += parts[index];
  }

  element.setAttribute(name, actual);
}

function templateAttribute(element: Element, rawValues: RawValues): TemplateAttribute[] {
  const attributes: TemplateAttribute[] = [];

  for (const name of element.getAttributeNames()) {
    const value = element.getAttribute(name) ?? "";

    if (/<!--[0-9]+-->/.test(value)) {
      const values = value.split(/(<!--[0-9]+-->)/);

      const parts = values.filter((_, index) => index % 2 === 0);
      const indexes = values
        .filter((_, index) => index % 2 === 1)
        .map((value) => Number(value.match(/\d+/)));

      attributes.push({ element, name, parts, indexes });
    }
  }

  for (const attribute of attributes) {
    interpolateAttribute(attribute, rawValues);
  }

  return attributes;
}

function prepareValue(element: Node): void {
  let index = 0;

  while (index < element.childNodes.length) {
    const current = element.childNodes[index];
    const value = current.nodeValue ?? "";

    if (current instanceof Comment && /^[0-9]+$/.test(value)) {
      const position = Number(value);
      const fragment = rawFragment(`<!--${position}--><!--${position}-->`);

      current.replaceWith(fragment);
      index++;
    }

    index++;
  }
}

function isStringArray(value: unknown[]): value is string[] {
  return value.every((item) => typeof item === "string");
}

function interpolateStringArray(values: string[]): DocumentFragment {
  let result = "";

  for (const value of values) {
    result += "<!--separator-->";
    result += value;
  }

  return rawFragment(result);
}

function interpolateTemplateArray(values: RawTemplate[]): [DocumentFragment, Template[]] {
  const result = new DocumentFragment();
  const templates: Template[] = [];

  for (const value of values) {
    const templated = template(value);

    templates.push(templated);
    result.append(rawFragment("<!--separator-->"));
    result.append(templated.fragment);
  }

  return [result, templates];
}

function interpolateValue(
  { index, start, end }: TemplateValue,
  values: RawValues
): void {
  let value = values[index];
  let fragment: DocumentFragment;

  if (Array.isArray(value)) {
    if (isStringArray(value)) {
      fragment = interpolateStringArray(value);
    } else {
      fragment = interpolateTemplateArray(value);
    }
  } else if (typeof value === "string") {
    interpolateString(value);
  } else {
    interpolateTemplate(value);
  }
}

function templateValue(element: Node, rawValues: RawValues): TemplateValue[] {
  const values: TemplateValue[] = [];

  for (let index = 0; index < element.childNodes.length; index++) {
    const current = element.childNodes[index];
    const next = element.childNodes[index + 1];
    const value = current.nodeValue ?? "";

    if (
      current instanceof Comment &&
      next instanceof Comment &&
      /^[0-9]+$/.test(value) &&
      value === next.nodeValue
    ) {
      values.push({ index: Number(value), start: current, end: next });
    }
  }

  for (const value of values) {
    interpolateValue(value, rawValues);
  }

  return values;
}

function interpolate(element: Node, rawValues: RawValues): [TemplateAttribute[], TemplateValue[]] {
  const attributes: TemplateAttribute[] = [];
  const values: TemplateValue[] = [];

  if (element instanceof Element) {
    attributes.push(...templateAttribute(element, rawValues));
  }

  if (element.hasChildNodes()) {
    prepareValue(element);
    values.push(...templateValue(element, rawValues));
  }

  for (const node of element.childNodes) {
    if (node instanceof Element) {
      const templated = interpolate(node, rawValues);

      attributes.push(...templated[0]);
      values.push(...templated[1]);
    }
  }

  return [attributes, values];
}

function template(raw: RawTemplate): Template {
  const prepared = prepare(raw.strings);
  const fragment = rawFragment(prepared);
  const [attributes, values] = interpolate(fragment, raw.values);

  return {
    strings: raw.strings,
    rawValues: raw.values,
    fragment,
    attributes,
    values,
  }
}
