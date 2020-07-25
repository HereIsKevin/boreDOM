export { RawTemplate, RawValues, html, rawFragment };

type RawValues = (string | string[])[];

interface RawTemplate {
  strings: TemplateStringsArray;
  values: RawValues;
}

function rawFragment(template: string): DocumentFragment {
  // create a document fragment from the string provided
  return document.createRange().createContextualFragment(template);
}

function html(
  strings: TemplateStringsArray,
  ...values: RawValues
): RawTemplate {
  return { strings, values };
}
