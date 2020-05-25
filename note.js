const fetch = require('node-fetch');

const post = (action, params) => {
  let request = {
    action: action,
    version: 6,
    params: params
  }
  console.log(request)
  return fetch('http://localhost:8765', {method: 'post', body: JSON.stringify(request)})
  .then(res => res.json())
}

const emphasize = async (id, field, prefix, suffix) => {
  let clean = prefix.replace(/<.+?>/g, '').trim()
  if (!clean.length) {
    return
  }
  let emphasized = `<em>${clean}</em>. ${suffix.trim()}`;
  let params = {note: {id: id, fields: {}}};
  Object.defineProperty(params.note.fields, field, {value: emphasized, enumerable: true})
  console.log(params)
  await post('updateNoteFields', params)
}

const emphasizeNote = async (id) => {
  await post("notesInfo", {notes: [id]}).then(json => {
    let result = json.result[0];
    ['kana', 'kanji', 'on', 'kun', 'masu', 'teta'].forEach(field => {
      if (result.fields[field]) {
        let value = result.fields[field].value.trim();
        if (!value.startsWith('<em>')) {
          let match = value.match(/(.+?)\.(.*)/);
          if (match) {
            emphasize(id, field, match[1], match[2])
          } else {
            emphasize(id, field, value, '')
          }
        }
      }
    })
  });
}

const findNotes = (query) => {
  post('findNotes', {query: query}).then(json => {
    console.log(json)
    json.result.forEach(id => emphasizeNote(id))
  })
}

findNotes('note:Doushi')
// emphasizeNote(1590348573840)
