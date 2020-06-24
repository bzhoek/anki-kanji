var fs = require('fs');
const exec = require('child_process').exec

if (process.argv.length !== 3) {
  console.error(`Usage: colorize 客`)
  process.exit(1)
}
let unicode = process.argv[2].charCodeAt(0).toString(16)
let source = `/Users/bas/github/kanjivg/kanji/0${unicode}.svg`

if(!fs.existsSync(source)) {
  console.error(source, "does not exist")
  process.exit(2)
}

let colors = [
  "E8ECFB", "D9CCE3", "CAACCB", "BA8DB4", "AA6F9E", "994F88", "882E72", "7BAFDE",
  "6195CF", "437DBF", "1965B0", "CAE0AB", "4EB265", "90C987", "F7F056", "F7CB45",
  "F4A736", "EE8026", "E65518", "DC050C", "A5170E", "72190E", "42150A",]
let i = 0

let destination = fs.createWriteStream('test.svg');

var saxStream = require("sax").createStream(true)
saxStream.on("error", function (e) {
  console.error("error!", e)
  this._parser.error = null
  this._parser.resume()
})

saxStream.on('opentag', function (node) {
  destination.write(`<${node.name}`)
  if (node.name === 'path') {
    destination.write(` style="stroke: #${colors[i++ % colors.length]}"`)
  }

  for (const [key, value] of Object.entries(node.attributes)) {
    if (!key.startsWith('kvg:') && key !== 'style') {
      destination.write(` ${key}="${value}"`)
    }
  }
  destination.write(`>`)
  if (node.name === 'svg') {
    destination.write(`
      <style type="text/css">
        text {
        font: 8pt sans-serif;
        stroke-width: 0pt;
        fill: #586e75;
        }
        path {
        stroke-width: 4pt;
        fill: #ffffff;
        fill-opacity: 0;
        }
      </style>
    `)
  }
});

saxStream.on('closetag', function (node) {
  destination.write(`</${node}>`)
});

saxStream.on('text', function (text) {
  if (text !== '\n') {
    destination.write(text)
  }
});

let pipes = new Promise(((resolve, reject) => {
  destination.on('finish', resolve)
  fs.createReadStream(source)
    .pipe(saxStream)
}))

Promise.all([pipes]).then(console.log('completed'))
exec(`inkscape -z -y 0.0 test.svg -o test.png`, (err, stdout, stderr) => console.log(stdout))
