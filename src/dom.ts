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
 * @param template The string to be converted into HTML nodes
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

function isSimpleNode(node: Node): boolean {
  if (node instanceof Text) {
    return true;
  } else {
    const attributes =
      node instanceof Element ? node.getAttributeNames().length === 0 : true;

    return (
      node.childNodes.length === 1 &&
      node.childNodes[0] instanceof Text &&
      attributes
    );
  }
}

/**
 * Helper function to check if two nodes are the same based on the algorithm.
 *
 * @param node1 First node to be checked
 * @param node2 Second node to be checked
 *
 * @returns First node is the same as the second node or not
 */

function isSameNode(node1: Node, node2: Node): boolean {
  if (isSimpleNode(node1) && isSimpleNode(node2)) {
    return node1.isEqualNode(node2);
  } else {
    // make shallow clones of nodes to compare, so children are removed
    return node1.cloneNode(false).isEqualNode(node2.cloneNode(false));
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
  // nodes to keep with new and old index pairs
  const keepNodes: [number, number][] = [];

  // current index in new element
  let newIndex = 0;
  // current index in old element
  let oldIndex = 0;

  let oldTemp = 0;

  // length of new element child nodes
  const newLength = newElement.childNodes.length;
  // length of old element child nodes
  const oldLength = oldElement.childNodes.length;

  // continue as long as both indexes have not hit the end
  while (newIndex < newLength && oldIndex < oldLength) {
    // retreive the current node from the new element
    const newNode = newElement.childNodes[newIndex];
    // retreive the current node from the old element
    const oldNode = oldElement.childNodes[oldIndex];

    // check if new node and old node are the same
    if (isSameNode(newNode, oldNode)) {
      // save the indexes for same nodes
      keepNodes.push([newIndex, oldIndex]);
      oldIndex++;
    }

    // continue onto next old index
    newIndex++;
  }

  // console.log(keepNodes);

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
