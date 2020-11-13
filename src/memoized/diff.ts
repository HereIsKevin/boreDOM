export { diffNodes };

import { rawFragment } from "./raw";

function isChildNode(value: Node): value is ChildNode {
  return value.parentNode !== null;
}

class NodeCollection<T extends Node> {
  private nodes: T[];
  private backing: boolean;

  public constructor(nodes: ArrayLike<T>, backing: boolean = true) {
    this.nodes = Array.from(nodes);
    this.backing = backing;
  }

  public static collect(
    start: Node,
    end: Node,
    backing: boolean = true
  ): NodeCollection<ChildNode> {
    const nodes: ChildNode[] = [];

    let current = start.nextSibling;

    while (current !== end && current !== null) {
      nodes.push(current);
      current = current.nextSibling;
    }

    return new NodeCollection(nodes, backing);
  }

  private retrieve(index: number): ChildNode {
    const node = this.nodes[index];

    if (!isChildNode(node)) {
      throw new TypeError("node must be ChildNode");
    }

    return node;
  }

  public values(): T[] {
    return this.nodes;
  }

  public length(): number {
    return this.nodes.length;
  }

  public get(index: number): T {
    return this.nodes[index];
  }

  public set(index: number, value: T): void {
    const node = this.retrieve(index);

    if (this.backing) {
      node.replaceWith(value);
    }

    this.nodes[index] = value;
  }

  public append(...values: T[]): void {
    const node = this.retrieve(this.length() - 1);

    if (this.backing) {
      node.after(...values);
    }

    this.nodes.push(...values);
  }

  public insert(index: number, ...values: T[]): void {
    const length = this.length();

    if (index > length) {
      throw new Error(`cannot insert node past index of ${length}`);
    } else if (index == length) {
      this.append(...values);
    } else {
      const node = this.retrieve(index);

      if (this.backing) {
        node.before(...values);
      }

      this.nodes.splice(index, 0, ...values);
    }
  }

  public pop(index: number): T {
    const node = this.retrieve(index);

    if (this.backing) {
      node.remove();
    }

    return this.nodes.splice(index, 1)[0];
  }

  public remove(index: number): void {
    this.pop(index);
  }

  public clear(): void {
    if (this.backing) {
      while (this.length() > 0) {
        this.remove(0);
      }
    }

    this.nodes.splice(0, this.length());
  }

  public indexOf(value: T): number {
    for (let index = 0; index < this.length(); index++) {
      if (this.retrieve(index).isEqualNode(value)) {
        return index;
      }
    }

    return -1;
  }

  public includes(value: T): boolean {
    return this.indexOf(value) !== -1;
  }
}

function diffNodes(start: Comment, end: Comment, value: string): void {
  const oldNodes = NodeCollection.collect(start, end);
  const newNodes = new NodeCollection(rawFragment(value).childNodes);

  if (oldNodes.length() === 0) {
    start.after(...newNodes.values());
    return;
  }

  if (newNodes.length() === 0) {
    oldNodes.clear();
    return;
  }

  let oldIndex = 0;
  let newIndex = 0;

  const cache = new NodeCollection<ChildNode>([], false);

  for (const newNode of newNodes.values()) {
    if (oldIndex >= oldNodes.length()) {
      break;
    }

    const oldNode = oldNodes.get(oldIndex);

    if (newNode.isEqualNode(oldNode)) {
      newIndex++;
      oldIndex++;
    } else {
      newIndex++;
      oldNodes.get(oldIndex).remove();
      cache.append(oldNodes.pop(oldIndex));
    }
  }

  let index = 0;

  while (index < newNodes.length()) {
    const oldNode = index < oldNodes.length() ? oldNodes.get(index) : null;
    const newNode = newNodes.get(index);

    if (newNode.isEqualNode(oldNode)) {
      index++;
    } else if (cache.includes(newNode)) {
      const node = cache.pop(cache.indexOf(newNode));
      oldNodes.insert(index, node);
    } else {
      const node = newNode.cloneNode(true);
      oldNodes.insert(index, node as ChildNode);
    }
  }
}
