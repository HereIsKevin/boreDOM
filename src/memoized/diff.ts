export { compare, diff };

import { rawFragment } from "./raw";

declare global {
  interface Window {
    collections?: WeakMap<Comment, Node[]>;
    groups?: WeakMap<Comment, Node[][]>;
  }
}

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

function sanitize(nodes: ArrayLike<Node>): void {
  let index = 0;

  while (index < nodes.length) {
    const node = nodes[index];

    // remove comments or empty text nodes
    if (
      node instanceof Comment ||
      (node instanceof Text && /^\s*$/.test(node.textContent ?? ""))
    ) {
      node.remove();

      // splice it from nodes if nodes is an array
      if (Array.isArray(nodes)) {
        nodes.splice(index, 1);
      }

      continue;
    }

    index++;
  }
}

function diff(start: Comment, end: Comment, value: string): void {
  // initialize cache if missing, using WeakMap to prevent memory leaks
  if (typeof window.collections === "undefined") {
    window.collections = new WeakMap();
  }

  // attempt to get collections from cache, collect all nodes otherwise
  const oldNodes = window.collections.get(start) ?? collect(start, end);
  // generate list of nodes from the value
  const newNodes = rawFragment(value).childNodes;

  // sanitize the old nodes
  sanitize(oldNodes);
  // sanitize the new nodes
  sanitize(newNodes);

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

  for (let place = 0; place < length; place++) {
    const position = place - modifier;
    const node = oldNodes[position];

    // when the node to be removed can be found and is not a diffing mistake
    if (
      typeof node !== "undefined" &&
      isChildNode(node) &&
      !node.isEqualNode(newNodes[position]) &&
      !node.isEqualNode(newNodes[place])
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

  // update the cache in the WeakMap
  window.collections.set(start, oldNodes);
}

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

  // iterate until the end or until there are no nodes left
  while (current !== end && current !== null) {
    // create a new group when a separator is found
    if (current instanceof Comment && current.nodeValue === "separator") {
      nodes.push([]);
    }

    // append the current node to the newest group
    nodes[nodes.length - 1].push(current);
    // move on to the next sibling
    current = current.nextSibling;
  }

  return nodes;
}

function clear(nodes: Node[]): void {
  // iterate through all the nodes
  for (const node of nodes) {
    // remove the node if it is a child node, throw an error otherwise
    if (isChildNode(node)) {
      node.remove();
    } else {
      throw new TypeError("node must be a child node");
    }
  }
}

function insert(reference: Node[], nodes: Node[]): void {
  const point = reference[0];

  // throw an error if the reference point is not a child node
  if (!isChildNode(point)) {
    throw new TypeError("reference point must be a child node");
  }

  // insert the nodes before the reference point
  point.before(...nodes);
}

function compare(
  start: Comment,
  end: Comment,
  [...oldValues]: string[],
  newValues: string[]
): void {
  // initialize cache if missing, using WeakMap to prevent memory leaks
  if (typeof window.groups === "undefined") {
    window.groups = new WeakMap();
  }

  // attempt to get groups from cache, group all the actual nodes otherwise
  const nodes = window.groups.get(start) ?? group(start, end);

  // insert new values in when old values are empty
  if (oldValues.length === 0) {
    start.after(...rawFragment(mark(newValues)).childNodes);
    return;
  }

  // remove all nodes when new values are empty
  if (newValues.length === 0) {
    let next = start.nextSibling;

    while (next !== null && next !== end) {
      next.remove();
      next = start.nextSibling;
    }

    return;
  }

  // cache nodes that are removed for possible reinsertion
  const cache: Record<string, Node[]> = {};
  // find maximum length out of new and old values
  const length = Math.max(newValues.length, oldValues.length);

  // keep a modifier for removals
  let modifier = 0;

  for (let place = 0; place < length; place++) {
    const position = place - modifier;
    const value = oldValues[position];

    // when the value to be removed can be found and is not a diffing mistake
    if (
      typeof value !== "undefined" &&
      value !== newValues[position] &&
      value !== newValues[place]
    ) {
      // remove the value from old values
      oldValues.splice(position, 1);
      // clear the corresponding node
      clear(nodes[position]);
      // cache nodes for later
      cache[value] = nodes.splice(position, 1)[0];
      // increment the modifier
      modifier++;
    }
  }

  let index = 0;

  // iterate until at the end of new values where old values are equal
  while (index < newValues.length) {
    const oldValue = oldValues[index];
    const newValue = newValues[index];

    if (newValue === oldValue) {
      // proceed on to next value when both values are equal
      index++;
      continue;
    }

    let node: Node[];

    if (typeof cache[newValue] !== "undefined") {
      // retrieve old node from cache
      node = cache[newValue];
      delete cache[newValue];
    } else {
      // create it otherwise
      const fragment = rawFragment(`<!--separator-->${newValue}`);
      node = [...fragment.childNodes];
    }

    if (
      typeof oldValue !== "undefined" &&
      typeof nodes[index] !== "undefined" &&
      isChildNode(nodes[index][0])
    ) {
      // insert at the old node is possible
      insert(nodes[index], node);
    } else {
      // insert at the end otherwise
      end.before(...node);
    }

    // insert node into nodes for reference
    nodes.splice(index, 0, node);
    // insert value into old values for reference
    oldValues.splice(index, 0, newValue);
  }

  // update the cache in the WeakMap
  window.groups.set(start, nodes);
}
