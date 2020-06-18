const post = require('./ankipost')

const emphasize = (id, field, prefix, suffix) => {
  let clean = prefix.replace(/<.+?>/g, '').trim()
  if (!clean.length) {
    return
  }
  let trimmed = suffix.trim()
  let emphasized = `<em>${clean}</em>` + (trimmed.length ? `. ${trimmed}` : '');
  let params = {note: {id: id, fields: {}}};
  Object.defineProperty(params.note.fields, field, {value: emphasized, enumerable: true})
  post('updateNoteFields', params)
}

const emphasizeNote = async (id) => {
  let json = await post("notesInfo", {notes: [id]});
  let result = json.result[0];
  // console.log('emphasizeNote', result);
  ['kana', 'kanji', 'on', 'kun', 'masu', 'teta'].forEach(field => {
    if (result.fields[field]) {
      let value = result.fields[field].value.trim();
      let match = value.match(/(.+?)\.(.*)/);
      if (match) {
        emphasize(id, field, match[1], match[2])
      } else {
        emphasize(id, field, value, '')
      }
    }
  })
}

const findNotes = async (query) => {
  let json = await post('findNotes', {query: query});
  // console.log('findNotes', json);
  for (const id of json.result) {
    await emphasizeNote(id);
  }
}

findNotes('note:OnKanji')
// emphasizeNote(1590348573840)
