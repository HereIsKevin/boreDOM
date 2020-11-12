export { diffNodes };

import { rawFragment } from "./raw";

/*
function includesNode(nodes: Node[], value: Node): boolean {
  for (const node of nodes) {
    if (node.isEqualNode(value)) {
      return true;
    }
  }

  return false;
}

function indexOfNode(nodes: Node[], value: Node): number {
  for (let index = 0; index < nodes.length; index++) {
    if (nodes[index].isEqualNode(value)) {
      return index;
    }
  }

  return -1;
}

function diffNodes(start: Comment, end: Comment, value: string): void {
  console.log("asdf")

  const finalNodes = Array.from(rawFragment(value).childNodes);
  const cache: Node[] = [];

  let current = start.nextSibling;
  let index = 0;

  while (true) {
    if (current === null) {
      break;
    }

    const final = finalNodes[index];

    if (current.isEqualNode(final)) {
      index++;
      current = current.nextSibling;
    } else if (includesNode(cache, final)) {
      const cacheIndex = indexOfNode(cache, final);
      const cacheNode = cache.splice(cacheIndex, 1)[0];
      current.replaceWith(cacheNode);

      cache.push(current);
      current = cacheNode as ChildNode;
    } else if (index < finalNodes.length) {
      current.replaceWith(final.cloneNode(true));

      cache.push(current);
      current = final;
    } else if (current.nextSibling !== end) {
      current.nextSibling?.remove();
    } else {
      break;
    }
  }
}
*/

function includesNode(nodes: Node[], value: Node): boolean {
  for (const node of nodes) {
    if (node.isEqualNode(value)) {
      return true;
    }
  }

  return false;
}

function indexOfNode(nodes: Node[], value: Node): number {
  for (let index = 0; index < nodes.length; index++) {
    if (nodes[index].isEqualNode(value)) {
      return index;
    }
  }

  return -1;
}

function collectNodes(start: Comment, end: Comment): Node[] {
  const nodes: Node[] = [];

  let current = start.nextSibling;

  while (current !== end && current !== null) {
    nodes.push(current);
    current = current.nextSibling;
  }

  return nodes;
}

function diffNodes(start: Comment, end: Comment, value: string): void {
  const oldNodes = collectNodes(start, end);
  const newNodes = Array.from(rawFragment(value).childNodes);

  // console.log(oldNodes, newNodes);

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

  let oldIndex = 0
  let newIndex = 0

  const cache: Node[] = [];

  for (const newNode of newNodes) {
    if (oldIndex >= oldNodes.length) {
      break;
    }

    const oldNode = oldNodes[oldIndex];

    if (newNode.isEqualNode(oldNode)) {
      newIndex++;
      oldIndex++;
      // console.log("same");
    } else {
      newIndex++;
      (oldNodes[oldIndex] as ChildNode).remove()
      cache.push(oldNodes.splice(oldIndex, 1)[0]);
      // console.log("remove")
    }
  }

  // console.log(oldNodes)

  let index = 0;

  oldNodes.push(end);

  while (index < newNodes.length) {
    const oldNode = index < oldNodes.length ? oldNodes[index] : null;
    const newNode = newNodes[index]

    if (newNode.isEqualNode(oldNode)) {
      index++;
    } else if (includesNode(cache, newNode)) {
      const node = cache.splice(indexOfNode(cache, newNode), 1)[0];
      (oldNodes[index] as ChildNode).before(node);
      oldNodes.splice(index, 0, node);
    } else {
      const node = newNode.cloneNode(true);
      (oldNodes[index] as ChildNode).before(node);
      oldNodes.splice(index, 0, node);
    }
  }

  // console.log(oldNodes)
}
