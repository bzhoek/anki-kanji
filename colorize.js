var fs = require('fs'),
  xml2js = require('xml2js');
var builder = new xml2js.Builder();
var parser = new xml2js.Parser();

function nameToUpperCase(name) {
  return name.toUpperCase();
}

const traverse = (result) => {
  console.dir(result);
}

fs.readFile('/Users/bas/github/kanjivg/kanji/0f9a8.svg', (err, data) => {
  parser.parseString(data, (err, result) => {
    traverse(result)
    var xml = builder.buildObject(result);
    console.log(xml);
  });
});