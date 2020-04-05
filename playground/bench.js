for (let x = 0; x < 1000; x++) {
  console.time("regex");
  /\S/.test(" \r\t\n\f ");
  console.timeEnd("regex");
}

for (let x = 0; x < 1000; x++) {
  console.time("trim");
  " \r\t\n\f ".trim() === "";
  console.timeEnd("trim");
}
