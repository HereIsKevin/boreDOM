export { RawTemplate, RawValues, html, rawFragment };

type RawValues = (string | RawTemplate | RawTemplate[])[];

interface RawTemplate {
  strings: TemplateStringsArray;
  values: RawValues;
}

function rawFragment(value: string): DocumentFragment {
  const template = document.createElement("template");
  template.innerHTML = value;

  return template.content;
}

function html(
  strings: TemplateStringsArray,
  ...values: RawValues
): RawTemplate {
  return { strings, values };
}
