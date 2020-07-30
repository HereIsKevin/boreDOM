export { eraseNodes as diffNodes, eraseNodes };

import { rawFragment } from "./raw";

function eraseNodes(
  start: Comment,
  end: Comment,
  value: string | string[],
  useless: string[]
): void {
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
  start.after(rawFragment(Array.isArray(value) ? value.join("") : value));
}
