export { render };

/* eslint-disable sort-imports */

import { diffNodes, eraseNodes } from "./diff";
import { RawTemplate, RawValues } from "./raw";
import {
  TemplateAttribute,
  TemplateElement,
  TemplateText,
  template,
} from "./template";

/* eslint-enable sort-imports */

interface Cache {
  values: RawValues;
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
    // set the corresponding value to the key
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
    // filter out the indexes of all the elements
    const elementIndexes = fullTemplate.elements.map((x) => x.index);
    // filter out the indexes of all the texts
    const textIndexes = fullTemplate.texts.map((x) => x.index);

    // cache the template values and zipped index-based dynamic items
    window.templates.set(target, {
      values: fullTemplate.values,
      attributes: objectZip(attributeIndexes, fullTemplate.attributes),
      elements: objectZip(elementIndexes, fullTemplate.elements),
      texts: objectZip(textIndexes, fullTemplate.texts),
    });

    return;
  }

  // iterate through each value in the cache
  for (let index = 0; index < cache.values.length; index++) {
    const oldValue = cache.values[index];
    const newValue = rawTemplate.values[index];

    // proceed only if the old and new values are different
    if (oldValue === newValue) {
      continue;
    }

    if (index in cache.attributes) {
      // extract element nad name of attribute from cache
      const { element, name } = cache.attributes[index];

      // make sure the new value is not an array
      if (Array.isArray(newValue)) {
        throw new TypeError("attribute value cannot be an array");
      }

      // update the attribute
      element.setAttribute(name, newValue);
    } else if (index in cache.texts) {
      // extract the text node from the cache
      const { text } = cache.texts[index];

      // make sure the new value is not an array
      if (Array.isArray(newValue)) {
        throw new TypeError("text value cannot be an array");
      }

      // update the text node value
      text.nodeValue = newValue;
    } else if (index in cache.elements) {
      // extract the start and end comments from the cache
      const { start, end } = cache.elements[index];
      // find the parent node of the nodes
      const parent = start.parentNode;

      // make sure there is a parent
      if (parent === null) {
        throw new Error("parent node is missing for start");
      }

      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        // fully diff the old and new values if both are arrays
        diffNodes(start, end, newValue, oldValue);
      } else {
        // erase and replace to nodes if any one of them are strings
        eraseNodes(
          start,
          end,
          Array.isArray(newValue) ? newValue.join("") : newValue
        );
      }
    }
  }

  // update the values in the cache
  cache.values = rawTemplate.values;
  // update the cache in the WeakMap
  window.templates.set(target, cache);
}