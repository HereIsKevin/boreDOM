interface TemplateItem {
  kind: "attribute" | "text" | "node" | "static";
  name?: string;
  value: string;
}

interface CacheInfo {
  element: Element;
  attributes: CacheAttributes[];
  nodes: CacheNodes[];
}

interface CacheAttributes {
  element: Element;
  attributes: [string, string][];
}

interface CacheNodes {
  element: Element;
  texts: [Comment, Comment, string][];
}

function generateFragment(template: string): DocumentFragment {
  return document.createRange().createContextualFragment(template);
}

function html(
  strings: TemplateStringsArray,
  ...values: string[]
): TemplateItem[] {
  const output: TemplateItem[] = [];

  for (const [index, dynamicItem] of values.entries()) {
    const staticItem = strings[index];

    let attribute = false;

    if (/ ([a-z]|-)+=\"$/.test(staticItem)) {
      const attributeName = staticItem.match(/ ([a-z]|-)+=\"$/);

      if (attributeName === null) {
        throw new Error("attribute somehow missing");
      }

      const finalName = attributeName.pop();

      if (finalName === undefined) {
        throw new Error("attribute somehow missing");
      }

      attribute = true;

      const staticPart = staticItem.slice(
        0,
        staticItem.length - (finalName.length + 2)
      );
      const dataPart = `data-attribute-${finalName}="${index}" `;
      const attributePart = `${finalName}="`;

      output.push({
        kind: "static",
        value: `${staticPart}${dataPart}${attributePart}`,
      });
    } else {
      output.push({ kind: "static", value: staticItem });
    }

    if (attribute) {
      const attributeName = staticItem.match(/ ([a-z]|-)+=\"$/);

      if (attributeName === null) {
        throw new Error("attribute somehow missing");
      }

      const finalName = attributeName.pop();

      if (finalName === undefined) {
        throw new Error("attribute somehow missing");
      }

      output.push({
        kind: "attribute",
        name: finalName,
        value: dynamicItem,
      });
    } else {
      output.push({
        kind: "static",
        value: `<!--data-start-${index}-->`,
      });

      output.push({
        kind: /<.+?>/.test(dynamicItem) ? "node" : "text",
        value: dynamicItem,
      });

      output.push({
        kind: "static",
        value: `<!--data-end-${index}-->`,
      });
    }
  }

  output.push({ kind: "static", value: strings[strings.length - 1] });

  return output;
}

function findAttributes(target: Element): CacheAttributes {
  return {
    element: target,
    attributes: target
      .getAttributeNames()
      .filter((x) => x.slice(0, 15) === "data-attribute-")
      .map((y) => [y.slice(15), target.getAttribute(y) || ""]),
  };
}

function findAllAttributes(
  target: Element,
  _attributes: CacheAttributes[] = []
): CacheAttributes[] {
  _attributes.push(findAttributes(target));

  for (const child of target.childNodes) {
    if (isElementNode(child)) {
      findAllAttributes(child, _attributes);
    }
  }

  return _attributes.filter((x) => x.attributes.length !== 0);
}

function isCommentNode(node: Node): node is Comment {
  return node.nodeType === Node.COMMENT_NODE;
}

function findNodes(target: Element): CacheNodes {
  const texts: { [key: string]: [Comment, Comment, string] } = {};

  for (const child of target.childNodes) {
    if (!isCommentNode(child)) {
      continue;
    }

    const contents = (child.textContent || "").trim();

    if (contents.slice(0, 11) === "data-start-") {
      if (typeof texts[contents.slice(11)] === "undefined") {
        texts[contents.slice(11)] = [new Comment(), new Comment(), ""];
      }

      texts[contents.slice(11)][0] = child;
      texts[contents.slice(11)][2] = contents.slice(11);
    } else if (contents.slice(0, 9) === "data-end-") {
      if (typeof texts[contents.slice(9)] === "undefined") {
        texts[contents.slice(9)] = [new Comment(), new Comment(), ""];
      }

      texts[contents.slice(9)][1] = child;
    }
  }

  return {
    element: target,
    texts: Object.values(texts),
  };
}

function findAllNodes(
  target: Element,
  _texts: CacheNodes[] = []
): CacheNodes[] {
  _texts.push(findNodes(target));

  for (const child of target.childNodes) {
    if (isElementNode(child)) {
      findAllNodes(child, _texts);
    }
  }

  return _texts.filter((x) => x.texts.length !== 0);
}

function isElementNode(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function render(target: Element, template: TemplateItem[]): CacheInfo {
  const fragment = generateFragment(template.map((x) => x.value).join(""));

  while (fragment.firstChild) {
    target.appendChild(fragment.firstChild);
  }

  return {
    element: target,
    attributes: findAllAttributes(target),
    nodes: findAllNodes(target),
  };
}

function update(
  target: Element,
  oldTemplate: TemplateItem[],
  template: TemplateItem[],
  cache: CacheInfo
): void {
  let dynamicIndex = 0;

  for (const [index, item] of oldTemplate.entries()) {
    if (item.kind === "static") {
      continue;
    }

    if (item.value === template[index].value) {
      continue;
    }

    if (item.kind === "attribute") {
      let currentElement;
      let currentAttribute;
      let currentIndex;

      for (const element of cache.attributes) {
        for (const attribute of element.attributes) {
          if (Number(attribute[1]) === dynamicIndex) {
            currentElement = element.element;
            currentAttribute = attribute[0];
            currentIndex = Number(attribute[1]);
            break;
          }
        }
      }

      currentElement.setAttribute(currentAttribute, template[index].value);
    } else if (item.kind === "text") {
      let currentElement;
      let currentNode;
      let currentIndex;

      for (const element of cache.nodes) {
        for (const node of element.texts) {
          if (Number(node[2]) === dynamicIndex) {
            currentElement = element.element;
            currentNode = node[0];
            currentIndex = Number(node[2]);
          }
        }
      }

      currentNode.nextSibling.textContent = template[index].value;

      // console.log(cache.nodes);console.log(cache.nodes.filter(
      //   (x) => { console.log(x); return x.texts[0][2] === String(index * 2  -1); }
      // ))
      // const node = cache.nodes.filter(
      //   (x) => x.texts[0][2] === String(index * 2 - 1)
      // )[0].texts[0][0].nextSibling;

      // if (node !== null) {
      //   node.textContent = template[index].value;
      // }
    }

    dynamicIndex++;
  }
}

const element = document.getElementById("app");

if (element === null) {
  throw new Error("cannot find element");
}

console.time("render");

let value = 0;
let template = html`<p>Hello, world</p>
  <p id="value">Value is ${String(value)}</p>
  <button id="increment">Increment</button>`;

const cache = render(element, template);

const item = document.getElementById("increment");

if (item === null) {
  throw new Error("cannot find element");
}

item.addEventListener("click", () => {
  console.time("render");
  value++;
  const newTemplate = html`<p>Hello, world</p>
    <p id="value">Value is ${String(value)}</p>
    <button id="increment">Increment</button>`;
  update(element, template, newTemplate, cache);
  template = newTemplate;
  console.timeEnd("render");
});

console.timeEnd("render");
