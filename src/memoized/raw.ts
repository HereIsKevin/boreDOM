export { RawTemplate, RawValues, html, rawFragment };

type RawValues = string[];

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

function html(
  strings: TemplateStringsArray,
  ...values: RawValues
): RawTemplate {
  return { strings, values };
}
