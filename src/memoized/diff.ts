export { diffNodes, eraseNodes };

import { rawFragment } from "./raw";

function eraseNodes(start: Comment, end: Comment, value: string): void {
  while (start.nextSibling !== end) {
    const sibling = start.nextSibling;

    if (sibling === null) {
      break;
    }

    sibling.remove();
  }

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

  let current: ChildNode = start;
  let index = -1;

  /* eslint-disable no-constant-condition */

  while (true) {
    if (
      current instanceof Comment &&
      (current.nodeValue === "separator" || current === end)
    ) {
      index++;

      if (insert.includes(index)) {
        current.before(rawFragment(`<!--separator-->${newValue[index]}`));
      }
    }

    const next = current.nextSibling;

    if (next === null) {
      break;
    }

    if (remove.includes(index) && current !== null) {
      current.remove();
    }

    current = next;
  }

  /* eslint-enable no-constant-condition */
}
