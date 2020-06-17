const post = require('./ankipost'),
  colorize = require('./colorize')

const refreshStrokes = async (id) => {
  let json = await post("notesInfo", {notes: [id]});
  let result = json.result[0].fields['kanji'];
  if (result) {
    let svg = ''
    for (let i = 0; i < result.value.length; i++) {
      let unicode = result.value.charCodeAt(i);
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
    console.log('completed', result.value)
  }
}

const findNotes = async (query) => {
  let json = await post('findNotes', {query: query});
  for (const id of json.result) {
    await refreshStrokes(id);
    // await sleep(1000)
  }
}

let modelNames = [
  'Genki',
  'Cloze',
  // 'OnKanji',
  'Kunyomi',
  'Doushi',
  'Doushi-1',
  'Doushi-5']

refreshStrokes(1550261296093);

// modelNames.forEach((model) => {
//   findNotes(`note:${model}`)
// })

// findNotes('note:OnKanji')

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}