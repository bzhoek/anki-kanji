var fs = require('fs');
const exec = require('child_process').execSync

module.exports = async (unicode) => {
  let source = `/Users/bas/github/kanjivg/kanji/0${unicode.toString(16)}.svg`

  if (!fs.existsSync(source)) {
    throw new Error(`File ${source} does not exist.`)
  }

  let colors = [
    "E8ECFB", "D9CCE3", "CAACCB", "BA8DB4", "AA6F9E", "994F88", "882E72", "7BAFDE",
    "6195CF", "437DBF", "1965B0", "CAE0AB", "4EB265", "90C987", "F7F056", "F7CB45",
    "F4A736", "EE8026", "E65518", "DC050C", "A5170E", "72190E", "42150A",]
  let i = 0

  let infile = `tmp/${unicode}.svg`;
  let outfile = `tmp/${unicode}.png`;
  let destination = fs.createWriteStream(infile);

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
    saxStream.on('end', () => {
      destination.end()
      console.log(infile)
      exec(`inkscape -z -y 0.0 ${infile} -o ${outfile}`, (err, stdout, stderr) => console.log(stdout))
      console.log(outfile)
      resolve()
    })
    fs.createReadStream(source)
      .pipe(saxStream)
  }))

  await Promise.all([pipes]).then(() => {
      console.log(`colorized ${unicode}`)
    }
  )

  console.log(`returning ${unicode}`)
  return {infile: infile, outfile: outfile}
}
