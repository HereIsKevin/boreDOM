export { render };

import { diffNodes, eraseNodes } from "./diff";
import { RawTemplate } from "./raw";
import { Template, template } from "./template";

interface Cache {
  template: Template;
  attributeIndexes: number[];
  elementIndexes: number[];
  textIndexes: number[];
}

declare global {
  interface Window {
    templates?: WeakMap<Element, Cache>;
  }
}

function render(target: Element, rawTemplate: RawTemplate): void {
  if (typeof window.templates === "undefined") {
    window.templates = new WeakMap();
  }

  const cache = window.templates.get(target);

  if (!window.templates.has(target) || typeof cache === "undefined") {
    const fullTemplate = template(rawTemplate);

    while (target.lastChild) {
      target.lastChild.remove();
    }

    target.append(fullTemplate.fragment);

    const attributes = fullTemplate.attributes.map((x) => x.index);
    const elements = fullTemplate.elements.map((x) => x.index);
    const texts = fullTemplate.texts.map((x) => x.index);

    window.templates.set(target, {
      template: fullTemplate,
      attributeIndexes: attributes,
      elementIndexes: elements,
      textIndexes: texts,
    });

    return;
  }

  for (let index = 0; index < cache.template.values.length; index++) {
    const oldValue = cache.template.values[index];
    const newValue = rawTemplate.values[index];

    if (oldValue === newValue) {
      continue;
    }

    if (cache.attributeIndexes.includes(index)) {
      const attributeIndex = cache.attributeIndexes.indexOf(index);
      const { element, name } = cache.template.attributes[attributeIndex];

      if (Array.isArray(newValue)) {
        throw new TypeError("attribute value cannot be an array");
      }

      element.setAttribute(name, newValue);
    } else if (cache.textIndexes.includes(index)) {
      const textIndex = cache.textIndexes.indexOf(index);
      const { text } = cache.template.texts[textIndex];

      if (Array.isArray(newValue)) {
        throw new TypeError("text value cannot be an array");
      }

      text.nodeValue = newValue;
    } else if (cache.elementIndexes.includes(index)) {
      const elementIndex = cache.elementIndexes.indexOf(index);
      const { start, end } = cache.template.elements[elementIndex];
      const parent = start.parentNode;

      if (parent === null) {
        throw new Error("parent node is missing for start");
      }

      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        diffNodes(start, end, newValue, oldValue);
      } else {
        eraseNodes(
          start,
          end,
          Array.isArray(newValue) ? newValue.join("") : newValue
        );
      }
    }
  }

  cache.template.values = rawTemplate.values;
  window.templates.set(target, cache);
}
