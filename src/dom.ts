/**
 * The "dom" module is a simple, low-level, and fast DOM rendering system with
 * diffing built in for performance. In order to use it, download it from
 * [GitHub](https://github.com/HereIsKevin/boreDOM/releases/latest) and extract
 * it, install the release with `npm install`, or build it from source.
 *
 * The two main functions are `html`, which takes a string and turns it into a
 * HTML elements, and `render`, which updates a node with the output of HTML.
 * To begin, install boreDOM through the tarball:
 *
 * **HTML (index.html)**
 * ```html
 * <!DOCTYPE html>
 * <html>
 *   <head>
 *     <title>Hello, world</title>
 *   </head>
 *   <body>
 *     <div id="root"></div>
 *     <script type="module" src="hello.js"></script>
 *   </body>
 * </html>
 * ```
 *
 * **JavaScript (hello.js)**
 * ```javascript
 * import { dom } from "./path/to/boreDOM.js";
 *
 * // path is:
 * //   - `./package/dist/index.esm.min.js` from extracted package
 * //   - `./node_modules/boredom/dist/index.esm.min.js` from NPM
 * //   - `./path/to/boreDOM/dist/index.esm.min.js` from source
 *
 * dom.render(
 *   document.getElementById("root"),
 *   dom.html("<p>Hello, world from boreDOM!</p>")
 * )
 * ```
 *
 * Then serve the directory with the example through `python3 -m http.server`
 * or any other simple static server and got to http://localhost:8000 or
 * whatever url the static server served to.
 *
 * @packageDocumentation
 */

export { html, render };

/**
 * Type guard for checking of a node is a text node
 *
 * @param node Node to be checked
 *
 * @returns Node is text node or not
 */

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

/**
 * Type guard for checking of a node is an element node
 *
 * @param node Node to be checked
 *
 * @returns Node is element node or not
 */

function isElementNode(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

/**
 * Type guard for checking of a node is a comment node
 *
 * @param node Node to be checked
 *
 * @returns Node is comment node or not
 */

function isCommentNode(node: Node): node is Comment {
  return node.nodeType === Node.COMMENT_NODE;
}

/**
 * Generates HTML nodes as a document fragment from strings
 *
 * @param template The string to be converted into HTML nodes
 *
 * @returns The HTML nodes as a document fragment
 */

function html(template: string): DocumentFragment {
  return document.createRange().createContextualFragment(template);
}

/**
 * Removes empty text nodes, comment nodes, or other useless nodes
 *
 * @param element Node or element to be sanitized
 */

function sanitizeNode(element: Node): void {
  for (const node of element.childNodes) {
    if (
      isCommentNode(node) ||
      (isTextNode(node) && (node.textContent || "").trim() === "")
    ) {
      // remove all comment nodes or empty text nodes
      node.remove();
    } else if (isElementNode(node)) {
      // continue sanitizing element child nodes
      sanitizeNode(node);
    }
  }
}

/**
 * Helper function to check if two nodes are identical, checking to see if they
 * are equal, including their children
 *
 * @param node1 First node to be checked
 * @param node2 Second node to be checked
 *
 * @returns First node is identical second node or not
 */

function isIdenticalNode(node1: Node, node2: Node): boolean {
  return node1.isEqualNode(node2);
}

/**
 * Helper function to check if two nodes are the same, checking to see if they
 * are equal, excluding their children
 *
 * @param node1 First node to be checked
 * @param node2 Second node to be checked
 *
 * @returns First node is the same as the second node or not
 */

function isSameNode(node1: Node, node2: Node): boolean {
  let textNode = true;

  if (node2 instanceof Element && node2.getAttributeNames().length > 0) {
    textNode = false;
  }

  if (textNode) {
    if (node1 instanceof Element && node1.getAttributeNames().length > 0) {
      textNode = false;
    }
  }

  if (textNode) {
    for (const node of node2.childNodes) {
      if (!(node instanceof Text || node instanceof Comment)) {
        textNode = false;
        break;
      }
    }
  }

  if (textNode) {
    for (const node of node1.childNodes) {
      if (!(node instanceof Text || node instanceof Comment)) {
        textNode = false;
        break;
      }
    }
  }

  if (textNode) {
    return node1.isEqualNode(node2);
  } else {
    // make shallow clones of nodes to compare, so children are removed
    return node1.cloneNode(false).isEqualNode(node2.cloneNode(false));
  }
}

/**
 * Helper function to check if two nodes are related, checking to see if they
 * have the same name
 *
 * @param node1 First node to be checked
 * @param node2 Second node to be checked
 *
 * @returns First node has the same name as the second node or not
 */

function isRelatedNode(node1: Node, node2: Node): boolean {
  return node1.nodeName === node2.nodeName;
}

/**
 * Compares the children of two nodes to find the nodes to keep
 *
 * @param oldElement Original node to be updated
 * @param newElement New node to be compared to
 *
 * @returns Indexes for the child nodes to keep in oldElement and their new
 *   locations in newElement
 */

function findKeepNodes(oldElement: Node, newElement: Node): number[][] {
  const keepNodes: number[][] = [];

  let newIndex = 0;
  let oldIndex = 0;

  while (newIndex < newElement.childNodes.length && oldIndex < oldElement.childNodes.length) {
    const newNode = newElement.childNodes[newIndex];
    const oldNode = oldElement.childNodes[oldIndex];

    if (isSameNode(newNode, oldNode)) {
      keepNodes.push([newIndex, oldIndex]);
      oldIndex++;
    }

    newIndex++;
  }

  return keepNodes;

  /*const filteredNodes: number[][] = [];

  console.time("finding");

  for (const [newIndex, newNode] of newElement.childNodes.entries()) {
    let last: number = -1;
    let pushed = false;

    for (const [oldIndex, oldNode] of oldElement.childNodes.entries()) {
      if (isIdenticalNode(newNode, oldNode)) {
        // save indexes when the node could be kept
        filteredNodes.push([newIndex, oldIndex]);
        // console.log([newIndex, oldIndex])
        pushed = true;
        break;
      } else if (isSameNode(newNode, oldNode)) {
        last = oldIndex;
      }
    }

    if (!pushed && last != -1) {
      filteredNodes.push([newIndex, last])
    }
  }

  console.timeEnd("finding");

  const keepNodes: number[][] = [];
  let lastNode: number[] = [-1, -1];

  console.time("filtering");

  for (const node of filteredNodes) {
    if (node[0] > lastNode[0] && node[1] > lastNode[1]) {
      // keep as many nodes compatible with each other as possible
      keepNodes.push(node);
      lastNode = node;
    }
  }

  console.timeEnd("filtering");

  // console.log(keepNodes)

  return keepNodes;*/
}

/**
 * Compares the attributes of two nodes and updates to original node
 *
 * @param oldNode Original node to be updated
 * @param newNode New node to be compared to
 */

function patchAttributes(oldNode: Node, newNode: Node): void {
  if (
    isTextNode(oldNode) &&
    isTextNode(newNode) &&
    oldNode.nodeValue !== newNode.nodeValue
  ) {
    // update text for text nodes
    oldNode.nodeValue = newNode.nodeValue;
  } else if (isElementNode(oldNode) && isElementNode(newNode)) {
    for (const attribute of newNode.getAttributeNames()) {
      if (oldNode.getAttribute(attribute) !== newNode.getAttribute(attribute)) {
        // update attribute if it is different
        oldNode.setAttribute(attribute, newNode.getAttribute(attribute) || "");
      }
    }

    for (const attribute of oldNode.getAttributeNames()) {
      if (!newNode.hasAttribute(attribute)) {
        // remove attributes that are not in the new node
        oldNode.removeAttribute(attribute);
      }
    }
  }
}

/**
 * Recursively compares two nodes and their children, patching, removing, and
 * inserting when necessary
 *
 * @param oldNode Original node to be updated
 * @param newNode New node to be compared to
 */

function patchNode(oldNode: Node, newNode: Node): void {
  const keepNodes: number[][] = findKeepNodes(oldNode, newNode);
  const removeNodes: number[] = [...oldNode.childNodes.keys()].filter(
    (x) => !keepNodes.map((y) => y[1]).includes(x)
  );
  const insertNodes: number[] = [...newNode.childNodes.keys()].filter(
    (x) => !keepNodes.map((y) => y[0]).includes(x)
  );

  for (const [newIndex, oldIndex] of keepNodes) {
    const currentOld: Node = oldNode.childNodes[oldIndex];
    const currentNew: Node = newNode.childNodes[newIndex];

    // patch the attributes of the old node
    patchAttributes(currentOld, currentNew);

    if (!currentNew.isEqualNode(currentOld)) {
      // continue if old node's children are still different
      patchNode(currentOld, currentNew);
    }
  }

  for (const [modifier, index] of removeNodes.entries()) {
    // remove item at index - modifier
    oldNode.removeChild(oldNode.childNodes[index - modifier]);
  }

  for (const [modifier, index] of insertNodes.entries()) {
    // insert items
    oldNode.insertBefore(
      newNode.childNodes[index - modifier],
      oldNode.childNodes[index]
    );
  }
}

/**
 * Diffs and updates a DOM node to be the same as another DOM node
 *
 * @param oldElement Original DOM node
 * @param newElement New node for the original node to be updated into
 */

function render(oldElement: Node, newElement: Node): void {
  sanitizeNode(oldElement);
  sanitizeNode(newElement);

  if (oldElement.childNodes.length === 0) {
    // move all new nodes over if old node does not have any children
    while (newElement.firstChild) {
      oldElement.appendChild(newElement.firstChild);
    }
  } else if (newElement.childNodes.length === 0) {
    // remove all old nodes over if new node does not have any children
    while (oldElement.lastChild) {
      oldElement.removeChild(oldElement.lastChild);
    }
  } else {
    // patch the old node otherwise
    patchNode(oldElement, newElement);
  }
}
