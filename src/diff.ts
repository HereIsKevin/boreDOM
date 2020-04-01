// interfaces
export { DiffToken, Patch, PatchToken };

// objects
export { Diff };

interface DiffToken {
  oldIndex: number;
  newIndex: number;
  type: string;
  value: string;
}

interface Patch {
  separator: string;
  tokens: PatchToken[];
}

interface PatchToken {
  index: number;
  type: string;
  value: string;
}

function distance(point1: number[], point2: number[]): number {
  return Math.sqrt(
    Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2)
  );
}

function sameIndexes(oldText: string[], newText: string[]): number[][] {
  // points of matches between oldText and newText as [newText, oldText]
  let samePoints: number[][] = [];

  // iterate through newText and then oldText by indexes
  for (let x = 0; x < newText.length; x++) {
    for (let y = 0; y < oldText.length; y++) {
      // with a match between the items
      if (newText[x] === oldText[y]) {
        // push the indexes onto samePoints as [newText, oldText]
        samePoints.push([x, y]);
      }
    }
  }

  let minimalPoint: number[] = [-1, -1];
  let finalPoints: number[][] = [];

  while (true) {
    // minimal distance the point needs to meet and be in
    let leastDistance: number = distance(minimalPoint, [
      newText.length,
      oldText.length,
    ]);
    // index of the minimal point
    let leastIndex: number = -1;

    // iterate through the samePoints with indexes
    for (let [index, point] of samePoints.entries()) {
      // when a point is closer to minimalPoint and is in the boundary
      if (
        distance(minimalPoint, point) < leastDistance &&
        point[0] > minimalPoint[0] &&
        point[1] > minimalPoint[1]
      ) {
        // point is now the temporary minimal point
        leastDistance = distance(minimalPoint, point);
        leastIndex = index;
      }
    }

    // exit if nothing has been found
    if (leastIndex === -1) {
      break;
    }

    // surviving point is now the minimal point
    minimalPoint = samePoints[leastIndex];
    // add surviving point to final points
    finalPoints.push(samePoints[leastIndex]);
    // remove surviving point from samePoints
    samePoints.splice(leastIndex, 1);
  }

  return finalPoints;
}

function insertIndexes(newText: string[], sameIndexes: number[][]): number[] {
  return [...newText.keys()].filter(
    (x) => !sameIndexes.map((y) => y[0]).includes(x)
  );
}

function removeIndexes(oldText: string[], sameIndexes: number[][]): number[] {
  return [...oldText.keys()].filter(
    (x) => !sameIndexes.map((y) => y[1]).includes(x)
  );
}

function generateTokens(
  oldStr: string,
  newStr: string,
  separator: string = " "
): DiffToken[] {
  const oldText = oldStr.split(separator);
  const newText = newStr.split(separator);

  const same: number[][] = sameIndexes(oldText, newText);
  const sameOld = same.map((x) => x[1]);
  const sameNew = same.map((x) => x[0]);
  const remove: number[] = removeIndexes(oldText, same);
  const insert: number[] = insertIndexes(newText, same);

  let tokens: DiffToken[] = [];

  for (
    let index = 0;
    index < Math.max(oldText.length, newText.length);
    index++
  ) {
    if (sameNew.includes(index)) {
      tokens.push({
        oldIndex: sameOld[sameNew.indexOf(index)],
        newIndex: index,
        type: "same",
        value: newText[index],
      });
    }

    if (remove.includes(index)) {
      tokens.push({
        oldIndex: index,
        newIndex: -1,
        type: "remove",
        value: oldText[index],
      });
    }

    if (insert.includes(index)) {
      tokens.push({
        oldIndex: -1,
        newIndex: index,
        type: "insert",
        value: newText[index],
      });
    }
  }

  /* // Old Sort
  for (let index = 0; index < tokens.length - 1; index++) {
    const currentToken = tokens[index]["oldIndex"];
    const nextToken = tokens[index + 1]["oldIndex"];

    if (currentToken > nextToken && currentToken !== -1 && nextToken !== -1) {
      [tokens[index], tokens[index + 1]] = [tokens[index + 1], tokens[index]];
    }
  }
  */

  tokens.sort((x, y) =>
    x["oldIndex"] === -1 || y["oldIndex"] === -1
      ? 0
      : x["oldIndex"] < y["oldIndex"]
      ? -1
      : x["oldIndex"] < y["oldIndex"]
      ? 1
      : 0
  );

  return tokens;
}

function generatePatch(tokens: DiffToken[], separator: string = " "): Patch {
  return {
    separator: separator,
    tokens: tokens
      .filter((x) => x["type"] !== "same")
      .map((y) => ({
        index: y["oldIndex"] !== -1 ? y["oldIndex"] : y["newIndex"],
        type: y["type"],
        value: y["value"],
      })),
  };
}

function applyPatch(text: string, patch: Patch): string {
  let result: string[] = text.split(patch["separator"]);

  for (let [modifier, remove] of patch["tokens"]
    .filter((x) => x["type"] === "remove")
    .entries()) {
    result.splice(remove["index"] - modifier, 1);
  }

  for (let insert of patch["tokens"].filter((x) => x["type"] === "insert")) {
    result.splice(insert["index"], 0, insert["value"]);
  }

  return result.join(patch["separator"]);
}

const Diff = {
  generateTokens: generateTokens,
  generatePatch: generatePatch,
  applyPatch: applyPatch,
};
