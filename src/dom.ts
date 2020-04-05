class BoreDOMNew {
  private root: HTMLElement;

  public constructor(root: HTMLElement) {
    this.root = root;
  }

  public render(elements: DocumentFragment): void {
    BoreDOMNew.sanitize(this.root);
    BoreDOMNew.sanitize(elements);

    if (this.root.childNodes.length === 0) {
      this.root.append(elements);
    } else if (elements.childNodes.length === 0) {
      while (this.root.lastChild) {
        this.root.removeChild(this.root.lastChild);
      }
    } else {
      BoreDOMNew.updateNode(this.root, elements);
    }
  }

  public static html(template: string): DocumentFragment {
    return document.createRange().createContextualFragment(template);
  }

  private static sanitize(element: HTMLElement | DocumentFragment): void {
    for (let node of element.childNodes) {
      if (
        node.nodeType === Node.COMMENT_NODE ||
        (node.nodeType === Node.TEXT_NODE && !/\S/.test(node.nodeValue || ""))
      ) {
        node.remove();
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        BoreDOM.sanitize(node as HTMLElement);
      }
    }
  }

  private static updateNode(
    oldNodes: HTMLElement,
    newNodes: HTMLElement | DocumentFragment
  ): void {}

  private static keepNodes(
    oldNodes: HTMLElement,
    newNodes: HTMLElement | DocumentFragment
  ): number[][] {
    let identicalNodes: number[][] = [];
    let sameAttributeNodes: number[][] = [];
    let sameNameNodes: number[][] = [];

    for (let x = 0; x < nodeNew.childNodes.length; x++) {
      for (let y = 0; y < nodeOld.childNodes.length; y++) {
        const newElement = nodeNew.childNodes[x];
        const oldElement = nodeOld.childNodes[y];

        if (newElement.isEqualNode(oldElement)) {
          identicalNodes.push([x, y]);
        } else if (newElement.nodeName === oldElement.nodeName) {
          sameNameNodes.push([x, y]);
        }
      }
    }
  }
}

export { html, BoreDOM };

function html(template: string): DocumentFragment {
  return document.createRange().createContextualFragment(template);
}

class BoreDOM {
  private root: HTMLElement;
  private elements?: DocumentFragment;

  public constructor(root: HTMLElement) {
    this.root = root;
    this.elements = undefined;
  }

  public render(elements: DocumentFragment): void {
    this.clean(this.root);
    this.elements = elements;
    this.clean(this.elements);

    if (this.root.childNodes.length === 0) {
      this.root.append(elements);
    } else if (this.elements.childNodes.length === 0) {
      while (this.elements.lastChild) {
        this.elements.removeChild(this.elements.lastChild);
      }
    } else {
      this.fixNode(this.root, this.elements);
      // const keepNodes: number[][] = this.keepNodes(this.root, this.elements);

      // for (let [newIndex, oldIndex] of keepNodes) {
      //   if (
      //     !this.root.childNodes[oldIndex].isEqualNode(
      //       this.elements.childNodes[newIndex]
      //     )
      //   ) {
      //     const nodeOld: Node = this.root.childNodes[oldIndex];
      //     const nodeNew: Node = this.elements.childNodes[newIndex];

      //     this.fixNode(nodeOld, nodeNew);
      //   }
      // }
    }
  }

  private fixNode(
    nodeOld: HTMLElement,
    nodeNew: HTMLElement | DocumentFragment
  ): void {
    const keepNodes: number[][] = this.keepNodes(nodeOld, nodeNew);

    for (let [newIndex, oldIndex] of keepNodes) {
      if (
        !nodeOld.childNodes[oldIndex].isEqualNode(nodeNew.childNodes[newIndex])
      ) {
        this.fixAttributes(
          nodeOld.childNodes[oldIndex] as HTMLElement,
          nodeNew.childNodes[newIndex] as HTMLElement
        );

        if (
          !nodeOld.childNodes[oldIndex].isEqualNode(
            nodeNew.childNodes[newIndex]
          )
        ) {
          this.fixNode(
            nodeOld.childNodes[oldIndex] as HTMLElement,
            nodeNew.childNodes[newIndex] as HTMLElement
          );
        }
      }
    }

    const removeNodes: number[] = [...nodeOld.childNodes.keys()].filter(
      (x) => !keepNodes.map((y) => y[1]).includes(x)
    );

    const insertNodes: number[] = [...nodeNew.childNodes.keys()].filter(
      (x) => !keepNodes.map((y) => y[0]).includes(x)
    );

    for (let [modifier, remove] of removeNodes.entries()) {
      for (let [index, node] of nodeOld.childNodes.entries()) {
        if (index === remove - modifier) {
          nodeOld.removeChild(node);
          break;
        }
      }
    }

    for (let insert of insertNodes) {
      for (let [index, node] of nodeOld.childNodes.entries()) {
        if (index === insert) {
          nodeOld.insertBefore(nodeNew.childNodes[index], node);
          break;
        }
      }
    }
  }

  private fixAttributes(nodeOld: HTMLElement, nodeNew: HTMLElement): void {
    if (nodeOld.nodeType === Node.TEXT_NODE) {
      nodeOld.textContent = nodeNew.textContent;
      return;
    }

    for (let attribute of nodeNew.getAttributeNames()) {
      if (nodeOld.getAttribute(attribute) !== nodeNew.getAttribute(attribute)) {
        nodeOld.setAttribute(
          attribute,
          String(nodeNew.getAttribute(attribute))
        );
      }
    }
  }

  private keepNodes(
    nodeOld: HTMLElement,
    nodeNew: HTMLElement | DocumentFragment
  ): number[][] {
    let identicalNodes: number[][] = [];
    let sameAttributeNodes: number[][] = [];
    let sameNameNodes: number[][] = [];

    for (let x = 0; x < nodeNew.childNodes.length; x++) {
      for (let y = 0; y < nodeOld.childNodes.length; y++) {
        const newElement = nodeNew.childNodes[x];
        const oldElement = nodeOld.childNodes[y];

        if (newElement.isEqualNode(oldElement)) {
          identicalNodes.push([x, y]);
        } else if (newElement.nodeName === oldElement.nodeName) {
          sameNameNodes.push([x, y]);
        }
      }
    }

    let minimalNode: number[] = [-1, -1];
    let finalNodes: number[][] = [];

    while (true) {
      let minimalDistance: number = BoreDOM.distance(minimalNode, [
        nodeNew.childNodes.length,
        nodeOld.childNodes.length,
      ]);
      let minimalNodeIndex: number = -1;
      let minimalNodeType: string = "";

      for (let [index, node] of identicalNodes.entries()) {
        if (
          BoreDOM.distance(minimalNode, node) < minimalDistance &&
          node[0] > minimalNode[0] &&
          node[1] > minimalNode[1]
        ) {
          minimalDistance = BoreDOM.distance(minimalNode, node);
          minimalNodeIndex = index;
          minimalNodeType = "identical";
        }
      }

      for (let [index, node] of sameNameNodes.entries()) {
        if (
          BoreDOM.distance(minimalNode, node) < minimalDistance &&
          node[0] > minimalNode[0] &&
          node[1] > minimalNode[1]
        ) {
          minimalDistance = BoreDOM.distance(minimalNode, node);
          minimalNodeIndex = index;
          minimalNodeType = "sameName";
        }
      }

      if (minimalNodeIndex === -1) {
        break;
      }

      if (minimalNodeType === "identical") {
        minimalNode = identicalNodes[minimalNodeIndex];
        finalNodes.push(identicalNodes[minimalNodeIndex]);
        identicalNodes.splice(minimalNodeIndex, 1);
      } else if (minimalNodeType === "sameName") {
        minimalNode = sameNameNodes[minimalNodeIndex];
        finalNodes.push(sameNameNodes[minimalNodeIndex]);
        sameNameNodes.splice(minimalNodeIndex, 1);
      }
    }

    return finalNodes;
  }

  private static distance(point1: number[], point2: number[]): number {
    return Math.sqrt(
      Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2)
    );
  }

  private normalizeLength(): void {
    if (this.elements === undefined) {
      throw "this.elements not found";
    }

    let removeCount: number =
      this.root.childNodes.length - this.elements.childNodes.length;

    for (let newElement of this.elements.childNodes) {
      for (let oldElement of this.root.childNodes) {
        console.log(oldElement);
        if (removeCount === 0) {
          break;
        }

        if (newElement.nodeName !== oldElement.nodeName) {
          oldElement.remove();
          removeCount -= 1;
        }
      }
    }

    for (let newElement of this.elements.childNodes) {
      for (let oldElement of this.root.childNodes) {
        console.log(oldElement);
        if (removeCount === 0) {
          break;
        }

        if (newElement.nodeName !== oldElement.nodeName) {
          oldElement.remove();
          removeCount -= 1;
        }
      }
    }

    while (removeCount > 0 && this.root.lastChild) {
      this.root.removeChild(this.root.lastChild);
      removeCount -= 1;
    }
  }

  private clean(element: HTMLElement | DocumentFragment | Node): void {
    for (let node of element.childNodes) {
      if (
        node.nodeType === 8 ||
        (node.nodeType === 3 && !/\S/.test(node.nodeValue || ""))
      ) {
        node.remove();
      } else if (node.nodeType === 1) {
        this.clean(node);
      }
    }
  }
}
