export { html, render, update };

function rawHtml(template: string): DocumentFragment {
  return document.createRange().createContextualFragment(template);
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function isElementNode(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function isCommentNode(node: Node): node is Comment {
  return node.nodeType === Node.COMMENT_NODE;
}

interface Template {
  type: "static" | "dynamic";
  value: string;
}

function html(strings: TemplateStringsArray, ...values: string[]): Template[] {
  const output: Template[] = [{ type: "static", value: strings[0] }];
  let dynamicIndex = 0;

  for (const [index, item] of strings.slice(1).entries()) {
    const value = values[index];
    const last = output[output.length - 1];

    if (/([a-z]|-)=\"$/.test(last.value)) {
      output[output.length - 1] = {
        type: "static",
        value: last.value.replace(
          /([a-z]|-)=\"$/,
          (x) => `${x.slice(0, x.length - 2)}-attribute-${dynamicIndex}=\"`
        ),
      };
      output.push({ type: "dynamic", value: value });
    } else {
      output.push({
        type: "static",
        value: `<!-- node-start-${dynamicIndex} -->`,
      });
      output.push({ type: "dynamic", value: value });
      output.push({
        type: "static",
        value: `<!-- node-end-${dynamicIndex} -->`,
      });
    }

    dynamicIndex++;
    output.push({ type: "static", value: item });
  }

  return output;
}

function syncAttributes(node: Element, template: Template[]): void {
  for (const attribute of node
    .getAttributeNames()
    .filter((x) => /-attribute-[0-9]*$/.test(x))) {
    const value = node.getAttribute(attribute) || "";
    const index = Number((value.match(/[0-9]*$/) || []).pop());
    const templateValue = template[index].value;

    if (value !== templateValue) {
      node.setAttribute(attribute, templateValue);
    }
  }
}

function render(node: Node, template: Template[]): void {
  const contents = rawHtml(template.map((x) => x.value).join(""));

  while (contents.firstChild) {
    node.appendChild(contents.firstChild);
  }
}

function update(node: Node, template: Template[]): void {
  const templateValues = template
    .filter((x) => x.type === "dynamic")
    .map((x) => x.value);

  let updateNodes = false;
  let index = 0;

  while (index < node.childNodes.length && index < 100) {
    const currentNode = node.childNodes[index];

    if (
      isCommentNode(currentNode) &&
      /node-end-[0-9]*$/.test((currentNode.nodeValue || "").trim())
    ) {
      updateNodes = false;

      const templateIndex = Number(
        ((currentNode.nodeValue || "").match(/[0-9]*$/) || []).pop()
      );
      const contents = rawHtml(templateValues[templateIndex]);

      while (contents.firstChild) {
        node.insertBefore(contents.firstChild, currentNode);
        index++;
      }
    } else if (updateNodes) {
      node.removeChild(currentNode);
      index--;
    } else if (
      isCommentNode(currentNode) &&
      /node-start-[0-9]*$/.test((currentNode.nodeValue || "").trim())
    ) {
      updateNodes = true;
    } else if (isElementNode(currentNode)) {
      syncAttributes(currentNode, template);
      update(currentNode, template);
    }

    index++;
  }
}
