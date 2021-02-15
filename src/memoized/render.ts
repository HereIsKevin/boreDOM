export { Target, render };

import { RawTemplate, RawValue } from "./raw";
import { Template } from "./template";

type Target = Element | ShadowRoot;

const templates = new WeakMap<Target, Template>();

/**
 * Renders a template created with {@link html} to the targeted element.
 *
 * @param target Target element for rendering.
 * @param rawTemplate Template created with {@link html} to be rendered.
 *
 * @example Rendering "Hello, world!" and "Hello, universe!"
 *
 * ```typescript
 * const template = (value) => html`<div>Hello, ${value}!</div>`;
 *
 * // renders elements and fully caches template
 * render(document.body, template("world"));
 *
 * // only updates changes without virtual DOM diffing!
 * render(document.body, template("universe"));
 * ```
 */

function render(target: Target, rawTemplate: RawTemplate): void {
  const cache = templates.get(target);

  if (!templates.has(target) || typeof cache === "undefined") {
    const fullTemplate = new Template(rawTemplate);

    while (target.lastChild) {
      target.lastChild.remove();
    }

    target.append(fullTemplate.fragment);
    templates.set(target, fullTemplate);

    return;
  }

  cache.update(rawTemplate.values);

  cache.raw.values = rawTemplate.values;
  templates.set(target, cache);
}
