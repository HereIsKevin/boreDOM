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
 * Generates HTML nodes as a document fragment from strings
 *
 * @param value The string to be converted into HTML nodes
 *
 * @returns The HTML nodes as a document fragment
 */

function html(value: string): DocumentFragment {
  // create a template for parsing the html value
  const template = document.createElement("template");
  // parse the value through innerHTML
  template.innerHTML = value;

  // retrieve the template content as a document fragment
  return template.content;
}

/**
 * Removes empty text nodes, comment nodes, or other useless nodes
 *
 * @param element Node or element to be sanitized
 */

function sanitizeNode(element: Node): void {
  for (const node of element.childNodes) {
    if (
      node instanceof Comment ||
      (node instanceof Text && /^\s*$/.test(node.textContent ?? ""))
    ) {
      // remove all comment nodes or empty text nodes
      element.removeChild(node);
    } else if (node instanceof Element) {
      // continue sanitizing element child nodes
      sanitizeNode(node);
    }
  }
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

function findKeepNodes(oldElement: Node, newElement: Node): [number, number][] {
  const filteredNodes: [number, number][] = [];

  for (const [newIndex, newNode] of newElement.childNodes.entries()) {
    for (const [oldIndex, oldNode] of oldElement.childNodes.entries()) {
      if (newNode.nodeName === oldNode.nodeName) {
        // save indexes when the node could be kept
        filteredNodes.push([newIndex, oldIndex]);
      }
    }
  }

  const keepNodes: [number, number][] = [];
  let lastNode: [number, number] = [-1, -1];

  for (const node of filteredNodes) {
    if (node[0] > lastNode[0] && node[1] > lastNode[1]) {
      // keep as many nodes compatible with each other as possible
      keepNodes.push(node);
      lastNode = node;
    }
  }

  return keepNodes;
}

/**
 * Compares the attributes of two nodes and updates to original node
 *
 * @param oldNode Original node to be updated
 * @param newNode New node to be compared to
 */

function patchAttributes(oldNode: Node, newNode: Node): void {
  if (
    oldNode instanceof Text &&
    newNode instanceof Text &&
    oldNode.nodeValue !== newNode.nodeValue
  ) {
    // update text for text nodes
    oldNode.nodeValue = newNode.nodeValue;
  } else if (oldNode instanceof Element && newNode instanceof Element) {
    for (const attribute of newNode.getAttributeNames()) {
      if (oldNode.getAttribute(attribute) !== newNode.getAttribute(attribute)) {
        // update attribute if it is different
        oldNode.setAttribute(attribute, newNode.getAttribute(attribute) ?? "");
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
  const keepNodes = findKeepNodes(oldNode, newNode);
  const keepNodesOld = keepNodes.map((x) => x[1]);
  const keepNodesNew = keepNodes.map((x) => x[0]);
  const allOldNodes = [...oldNode.childNodes.keys()];
  const allNewNodes = [...newNode.childNodes.keys()];
  const removeNodes = allOldNodes.filter((x) => !keepNodesOld.includes(x));
  const insertNodes = allNewNodes.filter((x) => !keepNodesNew.includes(x));

  for (const [newIndex, oldIndex] of keepNodes) {
    const currentOld = oldNode.childNodes[oldIndex];
    const currentNew = newNode.childNodes[newIndex];

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
