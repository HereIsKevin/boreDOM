export { render };

/* eslint-disable sort-imports */

import { diffNodes, eraseNodes } from "./diff";
import { RawTemplate, RawValues } from "./raw";
import { TemplateAttribute, TemplateElement, TemplateText, template } from "./template";

/* eslint-enable sort-imports */

interface Cache {
  values: RawValues
  attributes: Record<number, TemplateAttribute>;
  elements: Record<number, TemplateElement>;
  texts: Record<number, TemplateText>;
}

declare global {
  interface Window {
    templates?: WeakMap<Element, Cache>;
  }
}

function objectZip<K extends string | number, V>(
  keys: K[],
  values: V[]
): Record<K, V> {
  const result = {} as Record<K, V>;

  for (const [index, key] of keys.entries()) {
    result[key] = values[index];
  }

  return result;
}

function render(target: Element, rawTemplate: RawTemplate): void {
  // initialize cache if missing, using WeakMap to prevent memory leaks
  if (typeof window.templates === "undefined") {
    window.templates = new WeakMap();
  }

  // attempt to get cache
  const cache = window.templates.get(target);

  // fully cache if cache is missing or if it is the first render
  if (!window.templates.has(target) || typeof cache === "undefined") {
    // generate a full template with cache, very slow
    const fullTemplate = template(rawTemplate);

    // remove all existing children from target
    while (target.lastChild) {
      target.lastChild.remove();
    }

    // add the document fragment of the template to the target
    target.append(fullTemplate.fragment);

    // filter out the indexes of all the attributes
    const attributeIndexes = fullTemplate.attributes.map((x) => x.index);
    const elementIndexes = fullTemplate.elements.map((x) => x.index);
    const textIndexes = fullTemplate.texts.map((x) => x.index);

    // cache the template values and zipped index-based dynamic items
    window.templates.set(target, {
      values: fullTemplate.values,
      attributes: objectZip(attributeIndexes, fullTemplate.attributes),
      elements: objectZip(elementIndexes, fullTemplate.elements),
      texts: objectZip(textIndexes, fullTemplate.texts)
    });

    return;
  }

  for (let index = 0; index < cache.values.length; index++) {
    const oldValue = cache.values[index];
    const newValue = rawTemplate.values[index];

    if (oldValue === newValue) {
      continue;
    }

    if (index in cache.attributes) {
      const { element, name } = cache.attributes[index];

      if (Array.isArray(newValue)) {
        throw new TypeError("attribute value cannot be an array");
      }

      element.setAttribute(name, newValue);
    } else if (index in cache.texts) {
      const { text } = cache.texts[index];

      if (Array.isArray(newValue)) {
        throw new TypeError("text value cannot be an array");
      }

      text.nodeValue = newValue;
    } else if (index in cache.elements) {
      const { start, end } = cache.elements[index];
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

  cache.values = rawTemplate.values;
  window.templates.set(target, cache);
}
