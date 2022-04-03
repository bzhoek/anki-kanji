const fetch = require('node-fetch');
const fs = require("fs");

const post = (action, params) => {
  let request = {
    action: action,
    version: 6,
    params: params
  }
  // console.log(JSON.stringify(request))
  return fetch('http://localhost:8765', {method: 'post', body: JSON.stringify(request)}).then(res => res.json())
}

const colorize = async (unicode) => {
  let source = `/Users/bas/github/kanjivg/kanji/0${unicode.toString(16)}.svg`

  if (!fs.existsSync(source)) {
    throw new Error(`File ${source} does not exist.`)
  }

  let i = 1
  let svg = ""

  var saxStream = require("sax").createStream(true)
  saxStream.on("error", function (e) {
    console.error("error!", e)
    this._parser.error = null
    this._parser.resume()
  })

  saxStream.on('opentag', function (node) {
    svg += `<${node.name}`
    if (node.name === 'path') {
      svg += ` class="stroke-${i++ % 23}"`
    }

    for (const [key, value] of Object.entries(node.attributes)) {
      if (!key.startsWith('kvg:') && key !== 'style') {
        svg += ` ${key}="${value}"`
      }
    }
    svg += `>`
  });

  saxStream.on('closetag', function (node) {
    svg += `</${node}>`
  });

  saxStream.on('text', function (text) {
    if (text !== '\n') {
      svg += text
    }
  });

  let pipes = new Promise(((resolve, reject) => {
    saxStream.on('end', () => {
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
  return svg
}

let style = `
<style>
  text {
    font: 8pt helvetica;
  }

  path {
    stroke-width: 4pt;
    fill-opacity: 0;
    stroke: #000
  }
</style>
`

let refresh = true

const strokeNote = async (id) => {
  let json = await post("notesInfo", {notes: [id]});
  let strokes = json.result[0].fields['strokes'];
  if (!refresh && strokes.value.includes('</svg>')) {
    console.log('skipping filled svg', id)
    return
  }
  let kanji = json.result[0].fields['kanji'];
  if (kanji) {
    let svg = style
    for (let i = 0; i < kanji.value.length; i++) {
      let unicode = kanji.value.charCodeAt(i);
      if (unicode >= 0x4E00 && unicode <= 0x9fbf) {
        console.log(unicode)
        svg += await colorize(unicode)
      }
    }

    let strokes = {note: {id: id, fields: {strokes: svg}}};
    let update = await post('updateNoteFields', strokes)
    if (update.error) {
      console.error(update.error, strokes)
    }
    console.log('completed', kanji.value)
  }
}

const strokeNotes = async (query) => {
  let json = await post('findNotes', {query: query});
  for (const id of json.result) {
    await strokeNote(id);
  }
}

let modelNames = [
  'Cloze',
  'OnKanji',
  'Kunyomi',
  'Doushi',
  'Doushi-1',
  'Doushi-5']

// strokeNote(1591967053505);
// modelNames.forEach((model) => {
//   strokeNotes(`note:${model}`)
// })

module.exports = {post, colorize, strokeNotes}