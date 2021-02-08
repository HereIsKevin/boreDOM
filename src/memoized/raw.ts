export { RawHandler, RawTemplate, RawValues, html, rawFragment };

type RawHandler = (event: Event) => void;
type RawValues = (RawHandler | string | string[])[];

interface RawTemplate {
  strings: TemplateStringsArray;
  values: RawValues;
}

function rawFragment(value: string): DocumentFragment {
  // create a template for parsing the html value
  const template = document.createElement("template");
  // parse the value through innerHTML
  template.innerHTML = value;

  // retrieve the template content as a document fragment
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
  ...values: RawValues
): RawTemplate {
  return { strings, values };
}
