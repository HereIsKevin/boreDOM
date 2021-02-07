export { Template, TemplateAttribute, TemplateNode, TemplateValue };

import { RawTemplate, RawValues, rawFragment } from "./raw.js";

type TemplateValue = string | Template | Template[];

interface TemplateAttribute {
  element: Element;
  name: string;
  parts: string[];
  indexes: number[];
  value?: string;
}

interface TemplateNode {
  start: Comment;
  end: Comment;
  index: number;
  value?: TemplateValue;
}

class Template {
  public strings: ReadonlyArray<string>;
  public values: RawValues;
  public attributes: TemplateAttribute[];
  public nodes: TemplateNode[];
  public fragment: DocumentFragment;

  public constructor(raw: RawTemplate) {
    this.strings = raw.strings;
    this.values = raw.values;
    this.attributes = [];
    this.nodes = [];
    this.fragment = rawFragment(this.prepare());
    
    this.interpolate(this.fragment);
  }

  private prepare(): string {
    let result = this.strings[0];

    for (let index = 1; index < this.strings.length; index++) {
      result += `<!--${index - 1}-->`;
      result += this.strings[index];
    }

    return result;
  }

  private interpolateAttribute(template: TemplateAttribute): void {
    template.value = template.parts[0];

    for (let index = 1; index < template.parts.length; index++) {
      const current = this.values[template.indexes[index - 1]];

      if (typeof current !== "string") {
        throw new TypeError("attribute value must be a string");
      }

      template.value += current;
      template.value += template.parts[index];
    }

    template.element.setAttribute(template.name, template.value);
  }

  private buildAttribute(element: Element): void {
    for (const name of element.getAttributeNames()) {
      const value = element.getAttribute(name) ?? "";

      if (/<!--[0-9]+-->/.test(value)) {
        const values = value.split(/(<!--[0-9]+-->)/);
        const parts = values.filter((_, index) => index % 2 === 0);
        const indexes = values
          .filter((_, index) => index % 2 === 1)
          .map((value) => Number(value.match(/[0-9]+/)));

        const attribute = { element, name, parts, indexes };

        this.interpolateAttribute(attribute);
        this.attributes.push(attribute);
      }
    }
  }

  private interpolateArray(
    raw: RawTemplate[]
  ): [DocumentFragment, Template[]] {
    const result = new DocumentFragment();
    const templates: Template[] = [];

    for (const value of raw) {
      const template = new Template(value);

      templates.push(template);
      result.append(rawFragment("<!--separator-->"));
      result.append(template.fragment);
    }

    return [result, templates];
  }

  private interpolateString(raw: string): [DocumentFragment, string] {
    return [rawFragment(raw), raw];
  }

  private interpolateTemplate(raw: RawTemplate): [DocumentFragment, Template] {
    const template = new Template(raw);
    
    return [template.fragment, template];
  }

  private interpolateNode(template: TemplateNode): void {
    const raw = this.values[template.index];

    let fragment: DocumentFragment;
    let result: TemplateValue;

    if (Array.isArray(raw)) {
      [fragment, result] = this.interpolateArray(raw);
    } else if (typeof raw === "string") {
      [fragment, result] = this.interpolateString(raw);
    } else {
      [fragment, result] = this.interpolateTemplate(raw);
    }

    template.value = result;
    template.start.after(fragment);
  }

  private prepareNode(element: Node): void {
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

  private buildNode(element: Node): void {
    this.prepareNode(element);

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
        const node = { start: current, end: next, index: Number(value) };

        this.interpolateNode(node);
        this.nodes.push(node);
      }
    }
  }

  private interpolate(element: Node): void {
    if (element instanceof Element) {
      this.buildAttribute(element);
    }

    if (element.hasChildNodes()) {
      this.buildNode(element);
    }

    for (const node of element.childNodes) {
      if (node instanceof Element) {
        this.interpolate(node);
      }
    }
  }
}
