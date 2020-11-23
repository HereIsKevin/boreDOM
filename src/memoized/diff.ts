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

  for (let index = 0; index < oldNodes.length; index++) {
    const node = oldNodes[index];

    if (
      node instanceof Comment ||
      (node instanceof Text && /^\s*$/.test(node.textContent ?? ""))
    ) {
      node.remove();
      oldNodes.splice(index, 0);
      index--;
      continue;
    }
  }

  for (let index = 0; index < newNodes.length; index++) {
    const node = newNodes[index];

    if (
      node instanceof Comment ||
      (node instanceof Text && /^\s*$/.test(node.textContent ?? ""))
    ) {
      node.remove();
      index--;
      continue;
    }
  }

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

  // cache any nodes that are removed
  const cache: Node[] = [];
  // find maximum length out of new and old nodes
  const length = Math.max(newNodes.length, oldNodes.length);

  // keep a modifier for removals
  let modifier = 0;

  for (let index = 0; index < length; index++) {
    const position = index - modifier;
    const node = oldNodes[position];

    // when the node to be removed can be found and is not a diffing mistake
    if (
      typeof node !== "undefined" &&
      isChildNode(node) &&
      !node.isEqualNode(newNodes[position]) &&
      !node.isEqualNode(newNodes[index])
    ) {
      // remove the node
      node.remove();
      // cache it for later
      cache.push(oldNodes.splice(position, 1)[0]);
      // increment the modifier
      modifier++;
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

    if (typeof oldNode !== "undefined" && isChildNode(oldNode)) {
      // insert at the old node is possible
      oldNode.before(node);
    } else {
      // insert at the end otherwise
      end.before(node);
    }

    // insert node into old nodes for reference
    oldNodes.splice(index, 0, node);
  }

  // console.log(newNodes, oldNodes);

  // if (newNodes.length !== oldNodes.length) {
  //   console.log("new nodes are not the same length as old nodes");
  // }

  // for (let index = 0; index < newNodes.length; index++) {
  //   const newNode = newNodes[index];
  //   const oldNode = oldNodes[index];

  //   if (typeof newNode === "undefined" || !newNode.isEqualNode(oldNode)) {
  //     console.log(`new nodes are different from old nodes at ${index}`);
  //     console.log(newNode, oldNode);
  //   }
  // }
}
