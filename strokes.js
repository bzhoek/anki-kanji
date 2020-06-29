const post = require('./ankipost'),
  colorize = require('./colorize')

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

// kata = 30A0 - 30FF, hira = 3040 - 309F
let refresh = true
const refreshStrokes = async (id) => {
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

const findNotes = async (query) => {
  let json = await post('findNotes', {query: query});
  for (const id of json.result) {
    await refreshStrokes(id);
  }
}

let modelNames = [
  'Cloze',
  'OnKanji',
  'Kunyomi',
  'Doushi',
  'Doushi-1',
  'Doushi-5']

// refreshStrokes(1591967053505);

// modelNames.forEach((model) => {
//   findNotes(`note:${model}`)
// })

findNotes('flag:4')
