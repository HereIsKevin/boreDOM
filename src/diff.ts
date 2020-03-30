class Diff {
  private oldText: string[];
  private newText: string[];

  public constructor(oldText: string, newText: string, separator: string = "") {
    this.oldText = oldText.split(separator);
    this.newText = newText.split(separator);
  }

  public insertIndexes(sameIndexes: number[][]): number[] {
    let sameNewIndexes = sameIndexes.map((x) => x[0]);
    return [...this.newText.keys()].filter((x) => !sameNewIndexes.includes(x));
  }

  public removeIndexes(sameIndexes: number[][]): number[] {
    const sameOldIndexes: number[] = sameIndexes.map((x) => x[1]);
    return [...this.oldText.keys()].filter((x) => !sameOldIndexes.includes(x));
  }

  public sameIndexes(): number[][] {
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

function main() {
  let compare: Diff = new Diff("ABCABBA", "CBABAC");

  let same: number[][] = compare.sameIndexes();
  let remove: number[] = compare.removeIndexes(same);
  let insert: number[] = compare.insertIndexes(same);

  console.log(same);
  console.log(remove);
  console.log(insert);
}

main();
