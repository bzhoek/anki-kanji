var fs = require('fs');
const exec = require('child_process').execSync

module.exports = async (unicode) => {
  let source = `/Users/bas/github/kanjivg/kanji/0${unicode.toString(16)}.svg`

  if (!fs.existsSync(source)) {
    throw new Error(`File ${source} does not exist.`)
  }

  let outfile = `tmp/${unicode}.svg`;
  let destination = fs.createWriteStream(outfile);

  var saxStream = require("sax").createStream(true)
  saxStream.on("error", function (e) {
    console.error("error!", e)
    this._parser.error = null
    this._parser.resume()
  })

  saxStream.on('opentag', function (node) {
    destination.write(`<${node.name}`)
    if (node.name === 'path') {
      destination.write(` class="stroke-${i++ % colors.length}"`)
    }

    for (const [key, value] of Object.entries(node.attributes)) {
      if (!key.startsWith('kvg:') && key !== 'style') {
        destination.write(` ${key}="${value}"`)
      }
    }
    destination.write(`>`)
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
  return {outfile: outfile}
}
