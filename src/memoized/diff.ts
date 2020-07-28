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
      // keep the new and old indexes for reference on matches
      if (newValue === oldValue) {
        filtered.push([newIndex, oldIndex]);
      }
    }
  }

  const keep: [number, number][] = [];
  let last = [-1, -1];

  for (const point of filtered) {
    // make sure there are no overlaps between existing points
    if (point[0] > last[0] && point[1] > last[1]) {
      keep.push(point);
      last = point;
    }
  }

  // separate the old and new indexes
  const keepOld = keep.map((x) => x[1]);
  const keepNew = keep.map((x) => x[0]);

  // indexes to remove are all the indexes not kept in the old values
  const remove = [...oldValues.keys()].filter((x) => !keepOld.includes(x));
  // indexes to insert are all the indexes not kept in the new values
  const insert = [...newValues.keys()].filter((x) => !keepNew.includes(x));

  return [remove, insert];
}

function diffNodes(
  start: Comment,
  end: Comment,
  newValue: string[],
  oldValue: string[]
): void {
  // diff original string values instead of child nodes for performance
  const [remove, insert] = diffValues(newValue, oldValue);

  let index = 0;
  let current = start.nextSibling;
  const groups: ChildNode[][] = [];

  // iterate through all nodes between start and end
  while (current !== end && current !== null) {
    if (current instanceof Comment && current.nodeValue === "separator") {
      // begin a new group on a separator
      groups[index] = [current];
      index++;
    } else {
      // append to newest existing group otherwise
      groups[groups.length - 1].push(current);
    }

    // advance to next sibling
    current = current.nextSibling;
  }

  // iterate through indexes to remove with modifier to account for already
  // removed nodes, which works as the indexes are sorted in ascending order

  for (const [modifier, index] of remove.entries()) {
    // retrieve group with modifier
    const group = groups[index - modifier];

    // remove all nodes that are part of the group
    for (const node of group) {
      node.remove();
    }

    // remove the group from the groups
    groups.splice(index - modifier, 1);
  }

  // iterate through indexes to insert without modifier, as the indexes will
  // already be accounted for through the already inserted nodes, which works
  // due to the indexes being sorted in ascending order

  for (const index of insert) {
    // retrieve the group using index directly
    const group = groups[index];
    // generate fragment with separator
    const fragment = rawFragment(`<!--separator-->${newValue[index]}`);

    // insert child nodes as a group for padding and reference in the future
    groups.splice(index, 0, [...fragment.childNodes]);

    if (typeof group === "undefined") {
      // insert at the end for undefined indexes
      end.before(fragment);
    } else {
      // insert after the last node of the group otherwise
      group[group.length - 1].after(fragment);
    }
  }
}
