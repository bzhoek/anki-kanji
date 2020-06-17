const readline = require('readline'),
  fs = require('fs');

const readInterface = readline.createInterface({
  input: fs.createReadStream('/Users/bas/github/kanjivg/kanji/0f9a8.svg'),
  output: process.stdout,
  console: false
});

readInterface.on('line', function (line) {
  let match = line.match(/^(\s+?<path)(.*)$/)
  if (match) {
    console.log(`${match[1]} style="stroke: #E8ECFB" ${match[2]}`)
  } else {
    console.log(line)
  }
});

