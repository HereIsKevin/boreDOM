/* class Diff {
  public old_text: string;
  public new_text: string;
  public separator: string;
  public matrix: number[][];
  public same_indexes: number[][];

  public constructor(old_text: string, new_text: string, separator: string) {
    this.old_text = old_text;
    this.new_text = new_text;
    this.separator = separator;
    this.matrix = [];
    this.same_indexes = [];
  }

  public diff() {
    let old_text = this.old_text.split(this.separator);
    let new_text = this.new_text.split(this.separator);

    this.matrix = new_text.map((x) => old_text.map((y) => 0));

    for (let [index_new, item_new] of new_text.entries()) {
      for (let [index_old, item_old] of old_text.entries()) {
        if (item_new === item_old) {
          this.matrix[index_new][index_old]++;
          this.same_indexes.push([index_new, index_old]);
        }
      }
    }

    let result: string[] = [];
    let largest_x = 0;
    let largest_y = 0;

    for (let row of this.matrix) {
      for (let [index, item] of row.entries()) {
        if (index > largest_x) {
          result.push(new_text[index]);
        }
        largest_x = index;
      }
    }

    return result;
  }
}

function main() {
  let diff = new Diff("ABCABBA", "CBABAC", "");
  console.log(diff.diff());
  console.log(diff.matrix.map((x) => x.join(" ")).join("\n"));
  console.log(diff.same_indexes);
}

main();
 */

// [x][y]
// x is new, y is old

function distance(coords1: number[], coords2: number[]): number {
  return Math.sqrt(
    Math.pow(coords1[0] - coords2[0], 2) + Math.pow(coords1[1] - coords2[1], 2)
  );
}

function diff(text_old: string[], text_new: string[]) {
  let matrix = text_new.map((x) => text_old.map((y) => 0));
  let same_coords: number[][] = [];

  for (let x in matrix) {
    for (let y in matrix[x]) {
      if (text_new[x] === text_old[y]) {
        matrix[x][y]++;
        same_coords.push([Number(x), Number(y)]);
      }
    }
  }

  let current_coords = [0, 0];
  let final_coords = [];

  let smallest = distance([0, 0], [text_new.length, text_old.length]);
  let index = 0;
  let smallest_coords = [0, 0];
  let len = Number(same_coords.length);

  for (let index__ = 0; index__ < len; index__++) {
    for (let [index_, coords] of same_coords.entries()) {
      if (distance(current_coords, coords) < smallest && coords[0] > current_coords[0] && coords[1] > current_coords[1]) {
        smallest = distance(current_coords, coords);
        index = index_;
        smallest_coords = coords;
      }
    }
    if (smallest_coords[0] == current_coords[0] && smallest_coords[1] == current_coords[1]) {
      break;
    }
    current_coords = smallest_coords;
    final_coords.push(current_coords);
    same_coords.splice(index, 1);
    smallest = distance(smallest_coords, [text_new.length, text_old.length]);
    index = 0;
  }

  console.log(final_coords.map(x => text_new[x[0]]).join(""))

  return final_coords;
}

console.log(diff("ABCABBA".split(""), "CBABAC".split("")));
