export { RawHandler, RawTemplate, RawValue, html, rawFragment };

type RawHandler = (event: Event) => void;
type RawValue = RawHandler | string | string[];

interface RawTemplate {
  strings: TemplateStringsArray;
  values: RawValue[];
}

function rawFragment(value: string): DocumentFragment {
  const template = document.createElement("template");
  template.innerHTML = value;

  return template.content;
}

/**
 * Creates a raw template from template literals.
 *
 * @param strings Static parts of the template.
 * @param values Dynamic parts of the template.
 *
 * @returns Raw template created from strings and values.
 *
 * @example Template for counter
 *
 * ```typescript
 * let value = 0;
 * const history = [];
 *
 * const store = () => history.push(`${value} came before current value`);
 * const update = () => render(document.body, template(value, history));
 *
 * const decrement = () => {
 *   store();
 *   value--;
 *   update();
 * };
 *
 * const increment = () => {
 *   store();
 *   value++;
 *   update();
 * };
 *
 * const template = (value, history) =>
 *   html`
 *     <button onclick=${decrement}>-</button>
 *     <div>${value}</div>
 *     <button onclick=${increment}>+</button>
 *     <div>${history}</div>
 *   `;
 * ```
 */

function html(
  strings: TemplateStringsArray,
  ...values: RawValue[]
): RawTemplate {
  return { strings, values };
}
