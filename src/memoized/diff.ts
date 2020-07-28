export { diffNodes, eraseNodes };

import { rawFragment } from "./raw";

function eraseNodes(start: Comment, end: Comment, value: string): void {
  // iterate through all nodes in between start and end
  while (start.nextSibling !== end) {
    const sibling = start.nextSibling;

    // stop if end is missing
    if (sibling === null) {
      break;
    }

    // remove the node
    sibling.remove();
  }

  // insert the value as a fragment after start
  start.after(rawFragment(value));
}

function diffValues(
  newValues: string[],
  oldValues: string[]
): [number[], number[]] {
  const filtered: [number, number][] = [];

  for (const [newIndex, newValue] of newValues.entries()) {
    for (const [oldIndex, oldValue] of oldValues.entries()) {
      if (newValue === oldValue) {
        filtered.push([newIndex, oldIndex]);
      }
    }
  }

  const keep: [number, number][] = [];
  let last = [-1, -1];

  for (const point of filtered) {
    if (point[0] > last[0] && point[1] > last[1]) {
      keep.push(point);
      last = point;
    }
  }

  const keepOld = keep.map((x) => x[1]);
  const keepNew = keep.map((x) => x[0]);

  const remove = [...oldValues.keys()].filter((x) => !keepOld.includes(x));
  const insert = [...newValues.keys()].filter((x) => !keepNew.includes(x));

  return [remove, insert];
}

function diffNodes(
  start: Comment,
  end: Comment,
  newValue: string[],
  oldValue: string[]
): void {
  const [remove, insert] = diffValues(newValue, oldValue);

  let index = 0;
  let current = start.nextSibling;
  const groups: ChildNode[][] = [];

  while (current !== end && current !== null) {
    if (current instanceof Comment && current.nodeValue === "separator") {
      groups[index] = [current];
      index++;
    } else {
      groups[groups.length - 1].push(current);
    }

    current = current.nextSibling;
  }

  for (const [modifier, index] of remove.entries()) {
    const group = groups[index - modifier];

    for (const node of group) {
      node.remove();
    }

    groups.splice(index - modifier, 1);
  }

  for (const index of insert) {
    const group = groups[index];
    const fragment = rawFragment(`<!--separator-->${newValue[index]}`);

    groups.splice(index, 0, [...fragment.childNodes]);

    if (typeof group === "undefined") {
      end.before(fragment);
    } else {
      group[group.length - 1].after(fragment);
    }
  }
}
