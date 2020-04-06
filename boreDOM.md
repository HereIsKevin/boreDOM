# The DiffyDOM Algorithm

DiffyDOM is a high performance, simple, concise, and easy-to-implement algorithm for diffing the DOM. By using only simple efficient checks, all implementations are performant under heavy loads, minimizing the changes while maintaining quick calculation. The boreDOM library is powered by DiffyDOM.

The modification begins with the first layer, the child nodes of the original element itself and the child nodes of the document fragment that the original should turn into. Before any processing, though, all empty text nodes containing only whitespace or comments have to be removed, in order to keep the algorithm efficient and working properly. To remove the useless nodes, code using a similar concept to what is shown below should be used.

```javascript
function sanitizeNode(element)
  for node in childNodes of element
    if node is whitespace or node is comment
      remove node from element
    else if node is element
      run sanitizeNode on node
```

## Find Nodes to Keep

Before changing any parts of the DOM, nodes that should be kept on the topmost layer need to be found.

### Identical Nodes

Identical nodes, including all the children, are found first. These have the highest priority to be preserved.

```javascript
function isIdenticalNode(node1, node2)
  return node1 == node2
```

### Same Nodes

Same nodes, which are like identical nodes but have different children, are found later. These have the second highest priority to be preserved.

```javascript
function isSameNode(node1, node2)
  return node1 without childNodes == node2 without childNodes
```

### Related Nodes

Related nodes, which only share the element name, are found last. These have the lowest priority to be preserved

```javascript
function isRelatedNode(node1, node2)
  return name of node1 == name of node2
```

### Combining Marked Nodes

After finding the possible nodes to be kept, the nodes have to be filtered by priority.

```javascript
function findKeepNodes(oldElement, newElement)
  filteredNodes = []

  for oldIndex and oldNode in oldElement
    for newIndex and newNode in newElement
      if (
        isIdenticalNode newNode oldNode or
        isSameNode newNode oldNode or
        isRelatedNode newNode oldNode
      )
        push [newIndex, oldIndex] onto filteredNodes

  sort filteredNodes by [0] then [1]

  keepNodes = []
  lastNode = [-1, -1]

  for node in filteredNodes
    if node[0] > lastNode[0] and node[1] > lastNode[1]
      push node onto keepNodes
      lastNode = node

  return keepNodes
```
