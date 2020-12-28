function diff([...oldValues], newValues) {
  if (oldValues.length === 0) {
    oldValues = [...newValues];
    return oldValues;
  }

  if (newValues.length === 0) {
    oldValues = [];
    return oldValues;
  }

  console.log(oldValues);

  const cache = [];
  const length = Math.max(newValues.length, oldValues.length);

  let modifier = 0;

  for (let index = 0; index < length; index++) {
    const position = index - modifier;
    const value = oldValues[position];

    if (
      typeof value !== "undefined" &&
      value != newValues[position] &&
      value != newValues[index]
    ) {
      cache.push(oldValues.splice(position, 1)[0]);
      modifier++;

      console.log(`remove ${value} from ${position}`);
      console.log(oldValues);
    }
  }

  let index = 0;

  while (index < newValues.length) {
    const oldValue = oldValues[index];
    const newValue = newValues[index];

    if (newValue === oldValue) {
      index++;
      continue;
    }

    const value = cache.includes(newValue)
      ? cache.splice(cache.indexOf(newValue), 1)[0]
      : newValue;

    oldValues.splice(index, 0, value);

    console.log(`insert ${value} at ${index}`);
    console.log(oldValues);
  }

  return oldValues;
}

// const oldValues = "ABCABBA".split("");
// const newValues = "CBABAC".split("");

const oldValues = "1234567890".split("");
const newValues = "1239567840".split("");

// diff(oldValues, newValues);

function filterMatches(matches) {
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

function compare(oldValues, newValues) {
  console.log(oldValues, newValues);

  const startSame = [];
  let start = 0;

  while (oldValues[start] === newValues[start]) {
    startSame.push([start, start]);
    start++;
  }

  for (const group of startSame) {
    console.log(oldValues[group[0]], group);
  }

  const endSame = [];
  let end = 0;

  while (
    oldValues[oldValues.length - (end + 1)] ===
    newValues[newValues.length - (end + 1)]
  ) {
    endSame.push([oldValues.length - (end + 1), newValues.length - (end + 1)]);
    end++;
  }

  for (const group of endSame) {
    console.log(oldValues[group[0]], group);
  }

  const [oldMin, newMin] =
    startSame.length > 0 ? startSame[startSame.length - 1] : [0, 0];

  const [oldMax, newMax] =
    endSame.length > 0
      ? endSame[endSame.length - 1]
      : [oldValues.length - 1, newValues.length - 1];

  const startMatch = [];

  let startOld = 0;
  let startNew = 0;
  let startSum = Infinity;

  while (startOld + oldMin < oldMax && startNew + newMin < newMax && startOld <= startSum) {
    const oldValue = oldValues[startOld + oldMin];
    const newValue = newValues[startNew + newMin];
    const sum = startOld + startNew;

    console.log(oldValue, startOld + oldMin, newValue, startNew + newMin);

    if (oldValue === newValue && sum <= startSum) {
      startMatch.push([startOld + oldMin, startNew + newMin]);
      startSum = sum;
    }

    if (sum >= startSum) {
      startOld++;
      startNew = 0;
    } else {
      startNew++;
    }
  }

  for (const match of startMatch) {
    console.log(oldValues[match[0]], match);
  }

  const endMatch = [];

  let endOld = 0;
  let endNew = 0;
  let endSum = Infinity;

  while (oldMax - endOld > oldMin && newMax - endNew > newMin && endOld <= endSum) {
    const oldValue = oldValues[oldMax - endOld];
    const newValue = newValues[newMax - endNew];
    const sum = endOld + endNew;

    console.log(oldValue, oldMax - endOld, newValue, newMax - endNew);

    if (oldValue === newValue && sum <= endSum) {
      endMatch.push([oldMax - endOld, newMax - endNew]);
      endSum = sum;
    }

    if (sum >= endSum) {
      endOld++;
      endNew = 0;
    } else {
      endNew++;
    }
  }

  for (const match of endMatch) {
    console.log(oldValues[match[0]], match);
  }

  const bestStart =
    startMatch.length > 0
      ? startMatch[startMatch.length - 1]
      : [oldMin, newMin];
  const bestEnd =
    endMatch.length > 0 ? endMatch[endMatch.length - 1] : [oldMax, newMax];

  console.log("slice");
  console.log(bestStart[0] + 1, bestEnd[0]);
  console.log(bestStart[1] + 1, bestEnd[1]);

  if (bestStart[0] === bestEnd[0] || bestStart[1] === bestEnd[1]) {
    console.log("result");

    const final = filterMatches([
      ...startSame,
      bestStart,
      bestEnd,
      ...endSame.reverse(),
    ]);

    console.log(final);

    return final;
  }

  const centerMatch = compare(
    oldValues.slice(bestStart[0], bestEnd[0]),
    newValues.slice(bestStart[1], bestEnd[1])
  );

  console.log("result");

  const final = filterMatches([
    ...startSame,
    bestStart,
    ...centerMatch.map(([x, y]) => [x + bestStart[0], y + bestStart[1]]),
    bestEnd,
    ...endSame.reverse(),
  ]);

  console.log(final);

  return final;
}

function patch([...oldValues], newValues) {
  const keep = compare(oldValues, newValues);
  const keepOld = keep.map((x) => x[0]);
  const keepNew = keep.map((x) => x[1]);
  const allOld = [...oldValues.keys()];
  const allNew = [...newValues.keys()];
  const remove = allOld.filter((x) => !keepOld.includes(x));
  const insert = allNew.filter((x) => !keepNew.includes(x));

  for (const [oldIndex, newIndex] of keep) {
    console.log("keep", oldIndex, newIndex, oldValues[oldIndex]);
  }

  for (const [modifier, index] of remove.entries()) {
    console.log("remove", index, oldValues[index - modifier]);
    oldValues.splice(index - modifier, 1);
  }

  for (const index of insert) {
    console.log("insert", index, newValues[index]);
    oldValues.splice(index, 0, newValues[index]);
  }

  return oldValues;
}

// console.log(compare(oldValues, newValues));
console.log(patch(oldValues, newValues));

const result = {
  B: [1, 1],
  A: [3, 2],
  B: [4, 3],
  A: [6, 5],
};
