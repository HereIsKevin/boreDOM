export { render };

import { rawFragment, RawTemplate, RawValues } from "./raw";
import { Template } from "./template";

const templates: WeakMap<Node, Template> = new WeakMap();

function collapseAttribute(parts: string[], values: RawValues): string {
  let result = parts[0];

  for (let index = 1; index < parts.length; index++) {
    const value = values[index - 1];

    if (typeof value !== "string") {
      throw new TypeError("attribute value must be a string");
    }

    result += value;
    result += parts[index];
  }

  return result;
}

function render(target: Node, rawTemplate: RawTemplate): void {
  const template = templates.get(target);

  if (!templates.has(target) || typeof template === "undefined") {
    const template = new Template(rawTemplate);

    while (target.lastChild) {
      target.lastChild.remove();
    }

    target.appendChild(template.fragment);
    templates.set(target, template);

    return;
  }

  for (const attribute of template.attributes) {
    const oldValue = attribute.value;
    const newValue = collapseAttribute(
      attribute.parts,
      attribute.indexes.map((index) => rawTemplate.values[index])
    );

    if (oldValue !== newValue) {
      attribute.element.setAttribute(attribute.name, newValue);
      attribute.value = newValue;
    }
  }

  for (const node of template.nodes) {
    const oldValue = node.value;
    const newValue = rawTemplate.values[node.index];

    if (
      (typeof oldValue === "string" && typeof newValue !== "string") ||
      (Array.isArray(oldValue) && !Array.isArray(newValue)) ||
      (oldValue instanceof Template &&
        typeof newValue !== "string" &&
        !Array.isArray(newValue))
    ) {
      while (node.start.nextSibling !== null && node.start.nextSibling !== node.end) {
        node.start.nextSibling.remove();
      }

      if (typeof newValue === "string") {
        node.start.after(rawFragment(newValue));
        node.value = newValue
      } else if (Array.isArray(newValue)) {
        const result = new DocumentFragment();
        const templates: Template[] = [];
    
        for (const value of newValue) {
          const template = new Template(value);
    
          templates.push(template);
          result.append(rawFragment("<!--separator-->"));
          result.append(template.fragment);
        }

        node.start.after(result);
        node.value = templates;
      } else {
        const template = new Template(newValue);

        node.start.after(template.fragment);
        node.value = template;
      }

      continue;
    }

    if (typeof newValue === "string") {
      
    }
  }
}
