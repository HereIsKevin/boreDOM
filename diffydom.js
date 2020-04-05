export { render, html };

function sanitizeNode(element) {
  for (let node of element.childNodes) {
    if (
      node.nodeType === Node.COMMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === "")
    ) {
      node.remove();
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      sanitizeNode(node);
    }
  }
}

function findIdenticalNodes(oldElement, newElement) {
  let identicalNodes = [];

  for (let [newIndex, newNode] of newElement.childNodes.entries()) {
    for (let [oldIndex, oldNode] of oldElement.childNodes.entries()) {
      if (newNode.isEqualNode(oldNode)) {
        identicalNodes.push([newIndex, oldIndex]);
      }
    }
  }

  return identicalNodes;
}

function isSameNode(node1, node2) {
  return node1.cloneNode(true).isEqualNode(node2.cloneNode(true));
}

function findSameNodes(oldElement, newElement) {
  let sameNodes = [];

  for (let [newIndex, newNode] of newElement.childNodes.entries()) {
    for (let [oldIndex, oldNode] of oldElement.childNodes.entries()) {
      if (isSameNode(newNode, oldNode)) {
        sameNodes.push([newIndex, oldIndex]);
      }
    }
  }

  return sameNodes;
}

function findRelatedNodes(oldElement, newElement) {
  let relatedNodes = [];

  for (let [newIndex, newNode] of newElement.childNodes.entries()) {
    for (let [oldIndex, oldNode] of oldElement.childNodes.entries()) {
      if (newNode.nodeName === oldNode.nodeName) {
        relatedNodes.push([newIndex, oldIndex]);
      }
    }
  }

  return relatedNodes;
}

function distance(node1, node2) {
  return Math.sqrt(
    Math.pow(node2[0] - node1[0], 2) + Math.pow(node2[1] - node1[1], 2)
  );
}

function keepNodes(oldElement, newElement) {
  const identicalNodes = findIdenticalNodes(oldElement, newElement);
  const sameNodes = findSameNodes(oldElement, newElement);
  const relatedNodes = findRelatedNodes(oldElement, newElement);
  const combinedNodes = identicalNodes
    .concat(sameNodes, relatedNodes)
    .sort((node1, node2) => {
      if (node1[0] < node2[0]) {
        return -1;
      } else if (node1[0] > node2[0]) {
        return 1;
      } else {
        if (node1[1] < node2[1]) {
          return -1;
        } else if (node1[1] > node2[1]) {
          return 1;
        } else {
          return 0;
        }
      }
    });

  let keepNodes = [];
  let lastNode = [-1, -1];

  for (let node of combinedNodes) {
    if (node[0] > lastNode[0] && node[1] > lastNode[1]) {
      keepNodes.push(node);
      lastNode = node;
    }
  }

  return keepNodes;
}

function patchAttributes(oldNode, newNode) {
  if (
    oldNode.nodeType === Node.TEXT_NODE &&
    oldNode.textContent !== newNode.textContent
  ) {
    oldNode.textContent = newNode.textContent;
  } else if (oldNode.nodeType === Node.ELEMENT_NODE) {
    for (let attribute of newNode.getAttributeNames()) {
      if (oldNode.getAttribute(attribute) !== newNode.getAttribute(attribute)) {
        oldNode.setAttribute(attribute, newNode.getAttribute(attribute));
      }
    }

    for (let attribute of oldNode.getAttributeNames()) {
      if (!newNode.hasAttribute(attribute)) {
        oldNode.removeAttribute(attribute);
      }
    }
  }
}

function patchNode(oldNode, newNode) {
  const sameNodes = keepNodes(oldNode, newNode);
  const removeNodes = [...oldNode.childNodes.keys()].filter(
    (x) => !sameNodes.map((y) => y[1]).includes(x)
  );
  const insertNodes = [...newNode.childNodes.keys()].filter(
    (x) => !sameNodes.map((y) => y[0]).includes(x)
  );

  for (let [newIndex, oldIndex] of sameNodes) {
    patchAttributes(oldNode.childNodes[oldIndex], newNode.childNodes[newIndex]);

    if (
      !newNode.childNodes[newIndex].isEqualNode(oldNode.childNodes[oldIndex])
    ) {
      patchNode(oldNode.childNodes[oldIndex], newNode.childNodes[newIndex]);
    }
  }

  for (let [modifier, index] of removeNodes.entries()) {
    oldNode.removeChild(oldNode.childNodes[index - modifier]);
  }

  for (let index of insertNodes) {
    oldNode.insertBefore(newNode.childNodes[index], oldNode.childNodes[index]);
  }
}

function render(oldElement, newElement) {
  sanitizeNode(oldElement);
  sanitizeNode(newElement);

  if (oldElement.childNodes.length === 0) {
    oldElement.append(newElement);
  } else if (newElement.childNodes.length === 0) {
    while (oldElement.lastChild) {
      oldElement.removeChild(oldElement.lastChild);
    }
  } else {
    patchNode(oldElement, newElement);
  }
}

function html(template) {
  return document.createRange().createContextualFragment(template);
}
