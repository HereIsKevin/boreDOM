export { compare, diff };

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

/*function compare(
  start: Comment,
  end: Comment,
  oldN: string[],
  newN: string[]
): void {
  const oldValues = Array.from(oldN);
  const newValues = Array.from(newN);

  const nodes = collect(start, end);
  const values: Node[][] = [];
  let position = -1;

  for (const node of nodes) {
    const value = node.nodeValue ?? "";

    if (node instanceof Comment && value === "separator") {
      position++;
    }

    if (typeof values[position] === "undefined") {
      values[position] = [];
    }

    values[position].push(node);
  }

  if (oldValues.length === 0) {
    const value = mark(newValues);
    const nodes = rawFragment(value).childNodes;
    start.after(...nodes);
    return;
  }

  if (newValues.length === 0) {
    let next = start.nextSibling;

    while (next !== null && next !== end) {
      next.remove();
      next = start.nextSibling;
    }

    return;
  }

  const cache: Record<string, Node[]> = {};
  const length = Math.max(newValues.length, oldValues.length);
  let modifier = 0;

  for (let index = 0; index < length; index++) {
    const position = index - modifier;
    const value = oldValues[position];

    if (typeof value !== "undefined" && value !== newValues[position] && value !== newValues[index]) {
      for (const node of values[position]) {
        node.remove();
      }

      cache[value] = values[position];
      modifier++;
    }
  }

  let index = 0;

  while (index < newValues.length) {
    const oldValue = oldValues[index];
    const newValue = newValues[index];

    if (newValue === oldValue) {
      index++;
      continue;
    }

    const cached = cache[newValue];
    let node: Node[];

    if (typeof cached === "undefined") {
      node = cached;
      delete cache[newValue];
    } else {
      node = rawFragment(`<!--separator-->${newValue}`).childNodes;
    }

    const blah = values[index];

    if (typeof oldValue !== "undefined" && isChildNode(blah[0])) {
      for (const asdf of node) {
        blah[0].before(asdf);
      }
    } else {
      end.before(...node);
    }

    oldValues.splice(index, 0, newValue);
    values.splice(index, 0, node);
  }
}

*/

function mark(values: string[]): string {
  let output = "";

  // iterate through values
  for (const value of values) {
    // add a separator before each value
    output += "<!--separator-->";
    output += value;
  }

  return output;
}

function group(start: Comment, end: Comment): Node[][] {
  const nodes: Node[][] = [];

  let current = start.nextSibling;

  while (current !== end && current !== null) {
    if (current instanceof Comment && current.nodeValue === "separator") {
      nodes.push([]);
    }

    nodes[nodes.length - 1].push(current);
    current = current.nextSibling;
  }

  return nodes;
}

function clear(nodes: Node[]): void {
  for (const node of nodes) {
    if (isChildNode(node)) {
      node.remove();
    } else {
      throw new TypeError("node must be a child node");
    }
  }
}

function insert(reference: Node[], nodes: Node[]): void {
  const point = reference[0];

  if (!isChildNode(point)) {
    throw new TypeError("reference point must be a child node");
  }

  point.before(...nodes);
}

function compare(
  start: Comment,
  end: Comment,
  [...oldValues]: string[],
  newValues: string[]
): void {
  const nodes = group(start, end);

  if (oldValues.length === 0) {
    start.after(...rawFragment(mark(newValues)).childNodes);
    return;
  }

  if (newValues.length === 0) {
    let next = start.nextSibling;

    while (next !== null && next !== end) {
      next.remove();
      next = start.nextSibling;
    }

    return;
  }

  const cache: Record<string, Node[]> = {};
  const length = Math.max(newValues.length, oldValues.length);

  let modifier = 0;

  for (let index = 0; index < length; index++) {
    const position = index - modifier;
    const value = oldValues[position];

    // console.log(value, newValues[position], newValues[index])

    if (
      typeof value !== "undefined" &&
      value !== newValues[position] &&
      value !== newValues[index]
    ) {
      // console.log("remove", position, index);
    // console.log(value, newValues[position], newValues[index])

      oldValues.splice(position, 1);

      clear(nodes[position]);
      cache[value] = nodes.splice(position, 1)[0];
      modifier++;
    }
  }

  let index = 0;

  while (index < newValues.length) {
    const oldValue = oldValues[index];
    const newValue = newValues[index];

    if (newValue === oldValue) {
      index++;
      continue;
    }

    let node: Node[];

    if (typeof cache[newValue] !== "undefined") {
      node = cache[newValue];
      delete cache[newValue];
    } else {
      const fragment = rawFragment(`<!--separator-->${newValue}`);
      node = [...fragment.childNodes];
    }

    if (
      typeof oldValue !== "undefined" &&
      typeof nodes[index] !== "undefined" &&
      isChildNode(nodes[index][0])
    ) {
      insert(nodes[index], node);
    } else {
      end.before(...node);
    }

    nodes.splice(index, 0, node);
    oldValues.splice(index, 0, newValue);
  }
}
