export { diff };

import { rawFragment } from "./raw";

function indexOf(nodes: Node[], value: Node): number {
  for (let index = 0; index < nodes.length; index++) {
    if (nodes[index].isEqualNode(value)) {
      return index;
    }
  }

  return -1;
}

function includes(nodes: Node[], value: Node): boolean {
  return indexOf(nodes, value) !== -1;
}

function collect(start: Comment, end: Comment): Node[] {
  const nodes: Node[] = [];

  let current = start.nextSibling;

  while (current !== end && current !== null) {
    nodes.push(current);
    current = current.nextSibling;
  }

  return nodes;
}

function diff(start: Comment, end: Comment, value: string): void {
  const oldNodes = collect(start, end);
  const newNodes = rawFragment(value).childNodes;

  if (oldNodes.length === 0) {
    start.after(...newNodes);
    return;
  }

  if (newNodes.length === 0) {
    let next = start.nextSibling;

    while (next !== null && next !== end) {
      next.remove();
      next = start.nextSibling;
    }

    return;
  }

  let oldIndex = 0;
  let newIndex = 0;

  let oldReverse = 0;
  let newReverse = 0;

  let removeIndex: number[] = [];
  let removeReverse: number[] = [];

  const cache: Node[] = [];

  while (oldIndex < oldNodes.length) {
    const newNode = newNodes[newIndex];
    const oldNode = oldNodes[oldIndex];

    if (!newNode.isEqualNode(oldNode)) {
      removeIndex.push(oldIndex);
    }

    newIndex++;
    oldIndex++;

    const newElement = newNodes[newNodes.length - (newReverse + 1)];
    const oldElement = oldNodes[oldNodes.length - (oldReverse + 1)];

    if (!newElement.isEqualNode(oldElement)) {
      removeReverse.push(oldIndex);
    }
  }

  let modifier = 0;

  for (const index of removeIndex) {
    if (removeReverse.includes(index)) {
      (oldNodes[index - modifier] as ChildNode).remove();
      cache.push(oldNodes.splice(index - modifier, 1)[0]);
      modifier++;
    }
  }

  let index = 0;

  oldNodes.push(end);

  while (index < newNodes.length) {
    const oldNode = index < oldNodes.length ? oldNodes[index] : null;
    const newNode = newNodes[index]

    if (newNode.isEqualNode(oldNode)) {
      index++;
    } else {
      let node;

      if (includes(cache, newNode)) {
        node = cache.splice(indexOf(cache, newNode), 1)[0];
      } else {
        node = newNode.cloneNode(true);
      }

      (oldNodes[index] as ChildNode).before(node);
      oldNodes.splice(index, 0, node);
    }
  }
}
