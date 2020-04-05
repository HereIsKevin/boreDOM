const Benchmark = require("benchmark");

const oldText = ["A", "B", "C", "A", "B", "B", "A"];
const newText = ["C", "B", "A", "B", "A", "C"];

let suite = new Benchmark.Suite();

suite
  .add("Imperative", () => {
    let samePoints = [];

    for (let x = 0; x < newText.length; x++) {
      for (let y = 0; y < oldText.length; y++) {
        if (newText[x] === oldText[y]) {
          samePoints.push([x, y]);
        }
      }
    }
  })
  .add("Functional", () => {
    const oldTextEntries = Array.from(oldText.entries());

    let samePoints = Array.from(newText.entries())
      .map((x) =>
        oldTextEntries.filter((y) => y[1] === x[1]).map((z) => [x[0], z[0]])
      )
      .flat();
  })
  .add("Functional New", () => {
    const oldTextEntries = [...Array(oldText.length).keys()];

    let samePoints = [...Array(newText.length).keys()]
      .map((x) =>
        oldTextEntries
          .filter((y) => oldText[y] === newText[x])
          .map((z) => [x, z])
      )
      .flat();
  })
  .on("complete", function() {
    console.log(this);
    console.log(`Fastest is ${this.filter("fastest").map("name")}`);
  })
  .run();
