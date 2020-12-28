export { diff };

import { rawFragment } from "./raw";

function isChildNode(value: Node): value is ChildNode {
  return value.parentNode !== null;
}

function compareStart(oldNodes: Node[], newNodes: Node[]): [number, number][] {
  const matches: [number, number][] = [];
  let index = 0;

  while (
    typeof oldNodes[index] !== "undefined" &&
    oldNodes[index].isEqualNode(newNodes[index])
  ) {
    matches.push([index, index]);
    index++;
  }

  console.log("masdfst");

  return matches;
}

function compareEnd(oldNodes: Node[], newNodes: Node[]): [number, number][] {
  const matches: [number, number][] = [];
  let index = 1;

  while (
    typeof oldNodes[oldNodes.length - index] !== "undefined" &&
    oldNodes[oldNodes.length - index].isEqualNode(
      newNodes[newNodes.length - index]
    )
  ) {
    matches.push([oldNodes.length - index, newNodes.length - index]);
    index++;
  }

  console.log("masdfed");

  return matches;
}

function filterMatches(matches: [number, number][]): [number, number][] {
  const final = [];
  let last = [-1, -1];

  for (const match of matches) {
    if (match[0] > last[0] && match[1] > last[1]) {
      final.push(match);
      last = match;
    }
  }

  return final;
}

function compare(oldNodes: Node[], newNodes: Node[]): [number, number][] {
  const startMatches = compareStart(oldNodes, newNodes);
  const endMatches = compareEnd(oldNodes, newNodes);

  const [oldMin, newMin] =
    startMatches.length > 0 ? startMatches[startMatches.length - 1] : [0, 0];

  const [oldMax, newMax] =
    endMatches.length > 0
      ? endMatches[endMatches.length - 1]
      : [oldNodes.length - 1, newNodes.length - 1];

  let startMatch: [number, number] = [oldMin, newMin];
  let startSum = Infinity;
  let startOld = 0;
  let startNew = 0;

  while (
    startOld + oldMin < oldMax &&
    startNew + newMin < newMax &&
    startOld <= startSum
  ) {
    const oldNode = oldNodes[startOld + oldMin];
    const newNode = newNodes[startNew + newMin];
    const sum = startOld + startNew;

    if (oldNode.isEqualNode(newNode) && sum <= startSum) {
      startMatch = [startOld + oldMin, startNew + newMin];
      startSum = sum;
    }

    if (sum >= startSum) {
      startOld++;
      startNew = 0;
    } else {
      startNew++;
    }

    console.log("blah");
  }

  let endMatch: [number, number] = [oldMax, newMax];
  let endSum = Infinity;
  let endOld = 0;
  let endNew = 0;

  while (
    oldMax - endOld > oldMin &&
    newMax - endNew > newMin &&
    endOld <= endSum
  ) {
    const oldNode = oldNodes[oldMax - endOld];
    const newNode = newNodes[newMax - endNew];
    const sum = endOld + endNew;

    if (oldNode.isEqualNode(newNode) && sum <= endSum) {
      endMatch = [oldMax - endOld, newMax - endNew];
      endSum = sum;
    }

    if (sum >= endSum) {
      endOld++;
      endNew = 0;
    } else {
      endNew++;
    }

    console.log("lah");
  }

  if (startMatch[0] === endMatch[0] || startMatch[1] === endMatch[1]) {
    const matches = [
      ...startMatches,
      startMatch,
      endMatch,
      ...endMatches.reverse(),
    ];

    console.log("asdf");

    return filterMatches(matches);
  }

  console.log("asdfadsf");

  const centerMatches = compare(
    oldNodes.slice(startMatch[0], endMatch[0]),
    newNodes.slice(startMatch[1], endMatch[1])
  );

  console.log("asdfsadfasdfasdf");

  const matches = [
    ...startMatches,
    startMatch,
    ...centerMatches.map(([x, y]): [number, number] => [
      x + startMatch[0],
      y + startMatch[1],
    ]),
    endMatch,
    ...endMatches.reverse(),
  ];

  return filterMatches(matches);
}

function patchAttributes(oldNode: Node, newNode: Node): void {
  if (
    oldNode instanceof Text &&
    newNode instanceof Text &&
    oldNode.nodeValue !== newNode.nodeValue
  ) {
    oldNode.nodeValue = newNode.nodeValue;
  } else if (oldNode instanceof Element && newNode instanceof Element) {
    for (const attribute of newNode.getAttributeNames()) {
      const oldAttribute = oldNode.getAttribute(attribute);
      const newAttribute = newNode.getAttribute(attribute);

      if (oldAttribute !== newAttribute) {
        oldNode.setAttribute(attribute, newAttribute ?? "");
      }
    }

    for (const attribute of oldNode.getAttributeNames()) {
      if (!newNode.hasAttribute(attribute)) {
        oldNode.removeAttribute(attribute);
      }
    }
  }
}

function patchNodes([...oldNodes]: Node[], newNodes: Node[]): void {
  const keep = compare(oldNodes, newNodes);
  const keepOld = keep.map((x) => x[0]);
  const keepNew = keep.map((x) => x[1]);

  const allOld = [...oldNodes.keys()];
  const allNew = [...newNodes.keys()];

  const remove = allOld.filter((x) => !keepOld.includes(x));
  const insert = allNew.filter((x) => !keepNew.includes(x));

  let modifier = 0;
  let difference = oldNodes.length - newNodes.length;

  console.log(difference);

  for (const index of remove) {
    const position = index - modifier;
    const oldNode = oldNodes[position];
    const newNode = newNodes[index];

    if (!isChildNode(oldNode)) {
      throw new TypeError("node must be a child node");
    }

    if (oldNode.nodeName !== newNode.nodeName || difference > 0) {
      oldNode.remove();
      oldNodes.splice(position, 1);
      modifier++;
      difference--;
    } else {
      patchAttributes(oldNode, newNode);

      if (!newNode.isEqualNode(oldNode)) {
        patchNodes([...oldNode.childNodes], [...newNode.childNodes]);
      }

      insert.splice(insert.indexOf(index), 1);
    }
  }

  for (const index of insert) {
    const oldNode = oldNodes[index];
    const newNode = newNodes[index];

    if (!isChildNode(oldNode)) {
      throw new TypeError("node must be a child node");
    }

    oldNode.before(newNode);
    oldNodes.splice(index, 0, newNode);
  }
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

function sanitize(nodes: Node[]): void {
  let index = 0;

  while (index < nodes.length) {
    const node = nodes[index];

    if (
      node instanceof Comment ||
      (node instanceof Text && /^\s*$/.test(node.textContent ?? ""))
    ) {
      node.remove();
      nodes.splice(index, 1);

      continue;
    }

    index++;
  }
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

function diff(start: Comment, end: Comment, value: string): void {
  const oldNodes = collect(start, end);
  const newNodes = [...rawFragment(value).childNodes];

  sanitize(oldNodes);
  sanitize(newNodes);

  if (oldNodes.length === 0) {
    start.after(...newNodes);
  } else if (newNodes.length === 0) {
    clear(oldNodes);
  } else {
    patchNodes(oldNodes, newNodes);
  }
}
