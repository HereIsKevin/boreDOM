export { diff };

import { rawFragment } from "./raw";

function isChildNode(value: Node): value is ChildNode {
  // node is only a child node if it has a parent node
  return value.parentNode !== null;
}

function indexOf(nodes: Node[], value: Node): number {
  // iterate through all the nodes
  for (let index = 0; index < nodes.length; index++) {
    // return index if node is equal to the value
    if (nodes[index].isEqualNode(value)) {
      return index;
    }
  }

  // return -1 otherwise
  return -1;
}

function includes(nodes: Node[], value: Node): boolean {
  // check if the value has an index
  return indexOf(nodes, value) !== -1;
}

function collect(start: Comment, end: Comment): Node[] {
  const nodes: Node[] = [];

  let current = start.nextSibling;

  // iterate until the end or when there are no nodes left
  while (current !== end && current !== null) {
    // keep the nodes in nodes
    nodes.push(current);
    // move on to the next sibling
    current = current.nextSibling;
  }

  return nodes;
}

function diff(start: Comment, end: Comment, value: string): void {
  // collect all nodes between the start and end
  const oldNodes = collect(start, end);
  // generate list of nodes from the value
  const newNodes = rawFragment(value).childNodes;

  if (oldNodes.length === 0) {
    // insert nodes after start if there were none before
    start.after(...newNodes);
    return;
  }

  if (newNodes.length === 0) {
    // get node after start if there are none now
    let next = start.nextSibling;

    // iterate until the end or when there are no nodes left
    while (next !== null && next !== end) {
      // remove the node
      next.remove();
      // move on to the next sibling
      next = start.nextSibling;
    }

    return;
  }

  let oldIndex = 0;
  let newIndex = 0;

  // cache any nodes that are removed
  const cache: Node[] = [];
  // keep remove indexes while diffing from front to back
  const forwardIndexes: number[] = [];
  // keep remove indexes while diffing from back to front
  const backwardIndexes: number[] = [];
  // find maximum length out of new and old nodes
  const length = Math.max(newNodes.length, oldNodes.length);

  // execute stupid diff algorithm from front to back
  for (let index = 0; index < length; index++) {
    const oldNode = oldNodes[index];
    const newNode = newNodes[index];

    // keep indexes of differing nodes to remove
    if (typeof newNode === "undefined" || !newNode.isEqualNode(oldNode)) {
      forwardIndexes.push(index);
    }
  }

  // execute stupid diff algorith from back to front
  for (let index = 0; index < length; index++) {
    const modifier = index + 1;
    const oldNode = oldNodes[oldNodes.length - modifier];
    const newNode = newNodes[newNodes.length - modifier];

    // keep indexes of differing nodes to remove
    if (typeof newNode === "undefined" || !newNode.isEqualNode(oldNode)) {
      backwardIndexes.push(oldNodes.length - modifier);
    }
  }

  // take backward indexes only if they are shorter than forward indexes
  const indexes =
    backwardIndexes.length < forwardIndexes.length
      ? backwardIndexes
      : forwardIndexes.reverse();

  for (const index of indexes) {
    const node = oldNodes[index];

    // remove and cache node if can be found and is a child node
    if (typeof node !== "undefined" && isChildNode(node)) {
      node.remove();
      cache.push(oldNodes.splice(index, 1)[0]);
    }
  }

  let index = 0;

  // iterate until at the end of new nodes where old nodes are equal
  while (index < newNodes.length) {
    const oldNode = oldNodes[index];
    const newNode = newNodes[index];

    if (newNode.isEqualNode(oldNode)) {
      // proceed on to next node when both nodes are equal
      index++;
      continue;
    }

    // retrieve old node from cache, clone new node otherwise
    const node = includes(cache, newNode)
      ? cache.splice(indexOf(cache, newNode), 1)[0]
      : newNode.cloneNode(true);

    if (isChildNode(oldNode)) {
      // insert at the old node is possible
      oldNode.before(node);
    } else {
      // insert at the end otherwise
      end.before(node);
    }

    // insert node into old nodes for reference
    oldNodes.splice(index, 0, node);
  }
}
