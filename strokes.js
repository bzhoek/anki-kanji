const post = require('./ankipost'),
  colorize = require('./colorize'),
  fs = require('fs')

const stamp = Date.now()

const refreshStrokes = async (id) => {
  let json = await post("notesInfo", {notes: [id]});
  let result = json.result[0].fields['kanji'];
  if (result) {
    let value = result.value
    let unicode = value.charCodeAt(value.startsWith('<em>') ? 4 : 0).toString(16)
    console.log(value, unicode)
    if (0x4E00 <= unicode < 0x9fbf) {
      let files = await colorize(unicode)
      let data = fs.readFileSync(files.outfile)
      let strokes = {note: {id: id, fields: {strokes: `${data.toString()}`}}};
      let update = await post('updateNoteFields', strokes)
      if (update.error) {
        console.error(update.error, strokes)
      }
      console.log('completed', value, unicode)
    } else {
      console.error(id, result, unicode)
    }
  }
}

const findNotes = async (query) => {
  let json = await post('findNotes', {query: query});
  for (const id of json.result) {
    await refreshStrokes(id);
    // await sleep(1000)
  }
}

// refreshStrokes(1591967198782);

findNotes('note:OnKanji')

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}