console.time('test');

let [oldText, newText] = ["ABCABBA".split(""), "CBABAC".split("")]

let samePoints = Array.from(newText.entries()).map(
    x => Array.from(oldText.entries()).filter(
        y => y[1] === x[1]
    ).map(
        z => [x[0], z[0]]
    )
).flat()

console.timeEnd('test')