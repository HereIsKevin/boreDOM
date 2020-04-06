# The DiffyDOM Algorithm

DiffyDOM is a high performance, simple, concise, and easy-to-implement algorithm for diffing the DOM. By using only simple efficient checks, all implementations are performant under heavy loads, minimizing the changes while maintaining quick calculation.

The modification begins with the first layer, the child nodes of the original element itself and the child nodes of the document fragment that the original should turn into. Before any processing, though, all empty text nodes containing only whitespace or comments have to be removed, in order to keep the algorithm efficient and working properly. To remove the useless nodes, code using a similar concept to what is shown below should be used.

```javascript
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
```

## Find Nodes to Keep

Before changing any parts of the DOM, nodes that should be kept on the topmost layer need to be found.

### Identical Nodes

Identical nodes, including all the children, are found first. These have the highest priority to be preserved.

```javascript
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
```

### Same Nodes

Same nodes, which are like identical nodes but have different children, are found later. These have the second highest priority to be preserved.

```javascript
function isSameNode(node1, node2) {
  node1.cloneNode(true).isEqualNode(node2.cloneNode(true));
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
```

### Related Nodes

Related nodes, which only share the element name, are found last. These have the lowest priority to be preserved

```javascript
function findRelatedNodes(oldElement, newElement) {
  let relatedNodes = [];

  for (let [newIndex, newNode] of newElement.childNodes.entries()) {
    for (let [oldIndex, oldNode] of oldElement.childNodes.entries()) {
      if (newElement.nodeName === oldElement.nodeName) {
        relatedNodes.push([newIndex, oldIndex]);
      }
    }
  }

  return relatedNodes;
}
```

### Combining Marked Nodes

After finding the possible nodes to be kept, the nodes have to be filtered by priority.

```javascript
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
```
