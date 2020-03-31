interface DiffToken {
  oldIndex: number;
  newIndex: number;
  type: string;
  value: string;
}

class Diff {
  private oldText: string[];
  private newText: string[];

  public constructor(oldText: string, newText: string, separator: string = "") {
    this.oldText = oldText.split(separator);
    this.newText = newText.split(separator);
  }

  public static applyPatch(
    text: string,
    patch: DiffToken[],
    separator: string = ""
  ): string {
    let result: string[] = text.split(separator);

    const removePatch: DiffToken[] = patch.filter((x) => x["type"] === "remove");
    const insertPatch: DiffToken[] = patch.filter((x) => x["type"] === "insert");

    for (let [modifier, remove] of removePatch.entries()) {
      result.splice(remove["oldIndex"] - modifier, 1);
    }

    for (let insert of insertPatch) {
      result.splice(insert["newIndex"], 0, insert["value"]);
    }

    return result.join(separator);
  }

  public generatePatch(): DiffToken[] {
    return this.generateTokens().filter((x) => x["type"] !== "same");
  }

  public printVisual(): void {
    const reset: string = "\u001b[0m";
    const red: string = "\u001b[31m";
    const green: string = "\u001b[32m";

    for (let token of this.generateTokens()) {
      if (token["type"] === "same") {
        console.log(
          `\t${token["oldIndex"] + 1}\t${token["newIndex"] + 1}\t${
            token["value"]
          }`
        );
      } else if (token["type"] === "remove") {
        console.log(
          `${red}\t${token["oldIndex"] + 1}\t-\t${token["value"]}${reset}`
        );
      } else if (token["type"] === "insert") {
        console.log(
          `${green}\t+\t${token["newIndex"] + 1}\t${token["value"]}${reset}`
        );
      }
    }
  }

  public generateTokens(): DiffToken[] {
    const same: number[][] = this.sameIndexes();
    const remove: number[] = this.removeIndexes(same);
    const insert: number[] = this.insertIndexes(same);

    let tokens: DiffToken[] = [];

    const longerText: number = Math.max(
      this.oldText.length,
      this.newText.length
    );
    const sameOld = same.map((x) => x[1]);
    const sameNew = same.map((x) => x[0]);

    for (let index = 0; index < longerText; index++) {
      if (sameNew.includes(index)) {
        tokens.push({
          oldIndex: sameOld[sameNew.indexOf(index)],
          newIndex: index,
          type: "same",
          value: this.newText[index],
        });
      }

      if (remove.includes(index)) {
        tokens.push({
          oldIndex: index,
          newIndex: -1,
          type: "remove",
          value: this.oldText[index],
        });
      }

      if (insert.includes(index)) {
        tokens.push({
          oldIndex: -1,
          newIndex: index,
          type: "insert",
          value: this.newText[index],
        });
      }
    }

    for (let index = 0; index < tokens.length - 1; index++) {
      const currentToken = tokens[index]["oldIndex"];
      const nextToken = tokens[index + 1]["oldIndex"];

      if (currentToken > nextToken && currentToken !== -1 && nextToken !== -1) {
        [tokens[index], tokens[index + 1]] = [tokens[index + 1], tokens[index]];
      }
    }

    return tokens;
  }

  private insertIndexes(sameIndexes: number[][]): number[] {
    let sameNewIndexes = sameIndexes.map((x) => x[0]);
    return [...this.newText.keys()].filter((x) => !sameNewIndexes.includes(x));
  }

  private removeIndexes(sameIndexes: number[][]): number[] {
    const sameOldIndexes: number[] = sameIndexes.map((x) => x[1]);
    return [...this.oldText.keys()].filter((x) => !sameOldIndexes.includes(x));
  }

  private sameIndexes(): number[][] {
    let samePoints: number[][] = [];

    for (let x = 0; x < this.newText.length; x++) {
      for (let y = 0; y < this.oldText.length; y++) {
        if (this.newText[x] === this.oldText[y]) {
          samePoints.push([x, y]);
        }
      }
    }

    let currentPoint: number[] = [0, 0];
    let finalPoints: number[][] = [];

    while (true) {
      let leastDistance = Diff.distance(
        [0, 0],
        [this.newText.length, this.oldText.length]
      );
      let leastIndex: number = -1;

      for (let [index, point] of samePoints.entries()) {
        if (
          Diff.distance(currentPoint, point) < leastDistance &&
          point[0] > currentPoint[0] &&
          point[1] > currentPoint[1]
        ) {
          leastDistance = Diff.distance(currentPoint, point);
          leastIndex = index;
        }
      }

      if (leastIndex === -1) {
        break;
      }

      currentPoint = samePoints[leastIndex];
      finalPoints.push(samePoints[leastIndex]);
      samePoints.splice(leastIndex, 1);
    }

    return finalPoints;
  }

  private static distance(point1: number[], point2: number[]): number {
    return Math.sqrt(
      Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2)
    );
  }
}

let diff: Diff = new Diff("ABCABBA", "CBABAC");
diff.printVisual();
console.log(Diff.applyPatch("ABCABBA", diff.generatePatch()));
