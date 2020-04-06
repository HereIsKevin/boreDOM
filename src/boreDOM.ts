export { BoreDOM };

function sanitizeNode(element: Node): void {
  for (let node of element.childNodes) {
    if (
      node.nodeType === Node.COMMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE &&
        (node.textContent || "").trim() === "")
    ) {
      // remove all comment nodes or empty text nodes
      node.remove();
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // continue sanitizing element child nodes
      sanitizeNode(node);
    }
  }
}

function isIdenticalNode(node1: Node, node2: Node): boolean {
  return node1.isEqualNode(node2);
}

function isSameNode(node1: Node, node2: Node): boolean {
  // make shallow clones of nodes to compare, so children are removed
  return node1.cloneNode(false).isEqualNode(node2.cloneNode(false));
}

function isRelatedNode(node1: Node, node2: Node): boolean {
  return node1.nodeName === node2.nodeName;
}

function findKeepNodes(oldElement: Node, newElement: Node): number[][] {
  let filteredNodes: number[][] = [];

  for (let [newIndex, newNode] of newElement.childNodes.entries()) {
    for (let [oldIndex, oldNode] of oldElement.childNodes.entries()) {
      if (
        isIdenticalNode(newNode, oldNode) ||
        isSameNode(newNode, oldNode) ||
        isRelatedNode(newNode, oldNode)
      ) {
        // save indexes when the node could be kept
        filteredNodes.push([newIndex, oldIndex]);
      }
    }
  }

  let keepNodes: number[][] = [];
  let lastNode: number[] = [-1, -1];

  for (let node of filteredNodes) {
    if (node[0] > lastNode[0] && node[1] > lastNode[1]) {
      // keep as many nodes compatible with each other as possible
      keepNodes.push(node);
      lastNode = node;
    }
  }

  return keepNodes;
}

function patchAttributes(oldNode: Node, newNode: Node): void {
  if (
    oldNode.nodeType === Node.TEXT_NODE &&
    oldNode.nodeValue !== newNode.nodeValue
  ) {
    // update text for text nodes
    oldNode.nodeValue = newNode.nodeValue;
  } else if (oldNode.nodeType === Node.ELEMENT_NODE) {
    for (let attribute of (newNode as Element).getAttributeNames()) {
      if (
        (oldNode as Element).getAttribute(attribute) !==
        (newNode as Element).getAttribute(attribute)
      ) {
        // update attribute if it is different
        (oldNode as Element).setAttribute(
          attribute,
          (newNode as Element).getAttribute(attribute) || ""
        );
      }
    }

    for (let attribute of (oldNode as Element).getAttributeNames()) {
      if (!(newNode as Element).hasAttribute(attribute)) {
        // remove attributes that are not in the new node
        (oldNode as Element).removeAttribute(attribute);
      }
    }
  }
}

function patchNode(oldNode: Node, newNode: Node): void {
  const keepNodes: number[][] = findKeepNodes(oldNode, newNode);
  const removeNodes: number[] = [...oldNode.childNodes.keys()].filter(
    (x) => !keepNodes.map((y) => y[1]).includes(x)
  );
  const insertNodes: number[] = [...newNode.childNodes.keys()].filter(
    (x) => !keepNodes.map((y) => y[0]).includes(x)
  );

  for (let [newIndex, oldIndex] of keepNodes) {
    const currentOld: Node = oldNode.childNodes[oldIndex];
    const currentNew: Node = newNode.childNodes[newIndex];

    // patch the attributes of the old node
    patchAttributes(currentOld, currentNew);

    if (!currentNew.isEqualNode(currentOld)) {
      // continue if old node's children are still different
      patchNode(currentOld, currentNew);
    }
  }

  for (let [modifier, index] of removeNodes.entries()) {
    // remove item at index - modifier
    oldNode.removeChild(oldNode.childNodes[index - modifier]);
  }

  for (let index of insertNodes) {
    // insert items
    oldNode.insertBefore(newNode.childNodes[index], oldNode.childNodes[index]);
  }
}

function render(oldElement: Node, newElement: Node): void {
  sanitizeNode(oldElement);
  sanitizeNode(newElement);

  if (oldElement.childNodes.length === 0) {
    while (newElement.firstChild) {
      oldElement.appendChild(newElement.firstChild);
    }
  } else if (newElement.childNodes.length === 0) {
    while (oldElement.lastChild) {
      oldElement.removeChild(oldElement.lastChild);
    }
  } else {
    patchNode(oldElement, newElement);
  }
}

function html(template: string): DocumentFragment {
  return document.createRange().createContextualFragment(template);
}

const BoreDOM = {
  render: render,
  html: html,
}
