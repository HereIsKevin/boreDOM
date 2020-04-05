function test() {
  console.time('test');

  let [oldText, newText] = ["ABCABBA".split(""), "CBABAC".split("")];

  let samePoints = [];

  for (let x = 0; x < newText.length; x++) {
    for (let y = 0; y < oldText.length; y++) {
      if (newText[x] === oldText[y]) {
        samePoints.push([x, y]);
      }
    }
  }

  console.timeEnd('test');
}