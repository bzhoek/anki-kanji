const fetch = require('node-fetch');
const fs = require("fs");
const sax = require("sax");
const sqlite3 = require("sqlite3");
const {RateLimit} = require('async-sema')

const limit = RateLimit(5);

const post = (action, params) => {
  let request = {
    action: action,
    version: 6,
    params: params
  }
  // console.log(JSON.stringify(request))
  return fetch('http://127.0.0.1:8765', {method: 'post', body: JSON.stringify(request)}).then(res => res.json())
}

let colors = [
  "E8ECFB", "D9CCE3", "CAACCB", "BA8DB4", "AA6F9E", "994F88", "882E72", "7BAFDE",
  "6195CF", "437DBF", "1965B0", "CAE0AB", "4EB265", "90C987", "F7F056", "F7CB45",
  "F4A736", "EE8026", "E65518", "DC050C", "A5170E", "72190E", "42150A",]

const inline_color = (i) => ` style="stroke: #${colors[i % colors.length]}"`
const style_color = (i) => ` class="stroke-${i % 23}"`

const colorize = async (unicode, color_fn) => {
  let source = `/Users/bas/github/kanjivg/kanji/0${unicode.toString(16)}.svg`

  if (!fs.existsSync(source)) {
    throw new Error(`File ${source} does not exist.`)
  }

  let i = 1
  let svg = ""

  let saxStream = sax.createStream(true)
  saxStream.on("error", function (e) {
    console.error("error!", e)
    this._parser.error = null
    this._parser.resume()
  })

  saxStream.on('opentag', function (node) {
    svg += `<${node.name}`
    if (node.name === 'path') {
      svg += color_fn(i++)
    }

    for (const [key, value] of Object.entries(node.attributes)) {
      if (!key.startsWith('kvg:') && key !== 'style') {
        svg += ` ${key}="${value}"`
      }
    }
    svg += `>`

    if (node.name === 'svg') {
      svg += svg_style
    }

  });

  saxStream.on('closetag', function (node) {
      svg += ` </${node}>`
    }
  )

  saxStream.on('text', function (text) {
    if (text !== '\n') {
      svg += text
    }
  });

  let pipes = new Promise(((resolve) => {
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

let css_style = `
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
let svg_style = `
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
</style>`

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
    let svg = css_style
    for (let i = 0; i < kanji.value.length; i++) {
      let unicode = kanji.value.charCodeAt(i);
      if (unicode >= 0x4E00 && unicode <= 0x9fbf) {
        console.log(unicode)
        svg += await colorize(unicode, style_color)
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

const processNotes = async (query, fn) => {
  let json = await post('findNotes', {query: query});
  for (const id of json.result) {
    await fn(id);
  }
}

const strokeNotes = async (query) => processNotes(query, strokeNote)

const fix_kana = async (query) => processNotes(query, async (id) => {
  let json = await post("notesInfo", {notes: [id]});
  let entity = json.result[0];
  if (entity.fields['kana'] === undefined) {
    return
  }

  let kana = entity.fields['kana'].value;
  let kanji = entity.fields['kanji'].value;
  if (is_jukugo(kanji)) {
    let onyomi = to_onyomi(kana);
    if (onyomi !== kana) {
      let params = {note: {id: id, fields: {}}};
      Object.defineProperty(params.note.fields, "kana", {value: onyomi, enumerable: true})
      await post('updateNoteFields', params)
      console.log("fix_kana", kanji, kana, onyomi)
    }
  }
})

const moveCards = async (query, deck) => {
  let find = await post('findCards', {query: query});
  console.log(query, find)
  let move = await post('changeDeck', {cards: find.result, deck: deck})
  console.log(move)
}

const emphasize = async (id, field, prefix, suffix) => {
  let tags_removed = prefix.replace(/<.+?>/g, '').trim()
  if (!tags_removed.length) {
    return
  }
  let trimmed_suffix = suffix.trim()
  let emphasized = `<em>${tags_removed}</em>` + (trimmed_suffix.length ? `. ${trimmed_suffix}` : '');
  let params = {note: {id: id, fields: {}}};
  Object.defineProperty(params.note.fields, field, {value: emphasized, enumerable: true})
  await post('updateNoteFields', params)
}

const emphasizeFirstSentence = async (id) => {
  let json = await post("notesInfo", {notes: [id]});
  let result = json.result[0];
  // console.log('emphasizeFirstSentence', result);
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

const emphasizeNotes = async (query) => processNotes(query, emphasizeFirstSentence)

const updateModelStyling = (model, css) => {
  post("updateModelStyling", {
      "model": {
        "name": model,
        "css": css
      }
    }
  ).then(json => console.log(model, json.result));
}

let modelNames = [
  'Doushi',
  'Doushi-1',
  'Doushi-5',
  'Hiragana',
  'Katakana',
  'Kunyomi',
  'OnKanji',
]

const updateStyling = (css) => {
  modelNames.forEach((model) => {
    post("modelStyling", {"modelName": model})
      .then(json => {
        if (json.result.css !== css) {
          updateModelStyling(model, css)
        }
      });
  })
}

const downloadHtmlTemplate = (model, template, result) => {
  fs.writeFileSync(`html/${template}.${model}.Front.html`, result[template].Front)
  fs.writeFileSync(`html/${template}.${model}.Back.html`, result[template].Back)
}

const uploadHtmlTemplate = (model, template, result) => {
  function updateCard(side) {
    let html = fs.readFileSync(`html/${template}.${model}.${side}.html`).toString()
    if (result[template][side] !== html) {
      console.log(`${template} Update ${side}`)
      post("updateModelTemplates", {model: {name: model, templates: {[template]: {[side]: html}}}}).then(json => {
        console.log(json)
      })
    }
  }

  updateCard('Front');
  updateCard('Back');
}

const modelTemplates = (fn) => {
  modelNames.forEach((model) => {
    post("modelTemplates", {"modelName": model})
      .then(json => {
        for (const [key, _] of Object.entries(json.result)) {
          fn(model, key, json.result)
        }
      });
  })
}

const downloadHtmlTemplates = () => modelTemplates(downloadHtmlTemplate)
const uploadHtmlTemplates = () => modelTemplates(uploadHtmlTemplate)

const configureDeck = async (deckName, suffix) => {
  let config = await post('getDeckConfig', {deck: deckName});
  if (config.result.name.endsWith(suffix)) {
    return
  }
  let clone = await post('cloneDeckConfigId', {name: `Japans ${suffix}`, cloneFrom: config.result.id});
  let result = await post('setDeckConfigId', {decks: [deckName], configId: clone.result});
  console.log(result)
}

const configureJapaneseDecks = async () => {
  let json = await post('deckNamesAndIds', {});
  for (const [key, _] of Object.entries(json.result)) {
    let match = key.match(/日本語::(.*)/)
    if (match) {
      await configureDeck(match[0], match[1])
    }
  }
}

let png_style = `<style type="text/css">
  text {
  font: 8pt sans-serif;
  stroke-width: 0pt;
  fill: #586e75;
}
  path {
  stroke - width: 4pt;
  fill: #ffffff;
  fill-opacity: 0;
}
</style>`

let kanjidb = new sqlite3.Database('kanji.sqlite', (err) => {
  if (err) {
    console.error(err)
  }
})

let readingdb = new sqlite3.Database('kanjidic.sqlite', (err) => {
  if (err) {
    console.error(err)
  }
})

const add_kanji_with_reading_and_meaning = (kanji) => {
  let unicode = kanji.charCodeAt(0)
  kanjidb.get("select meaning from Kanji where literal=?", [kanji], function (err, row) {
    let meaning = row.meaning
    readingdb.get("select onyomi, kunyomi from Kanji where kanji=?", [kanji], function (err, row) {
      let on = row ? row.onyomi : 'no'
      colorize(unicode, style_color).then((svg) => {
        let params = {
          "note": {
            "deckName": "Default",
            "modelName": "OnKanji",
            "fields": {
              "nederlands": meaning,
              "kanji": kanji,
              "on": on,
              "notes": "",
              "strokes": css_style + svg
            },
            "options": {
              "allowDuplicate": false
            },
            "tags": []
          }
        }
        post('addNote', params).then(json => {
          console.log(meaning, json)
        })
      })
    });
  })
}

const is_kanji = (char) => char >= '一' && char <= '龘'
const is_hiragana = (ch) => {
  let c = ch.charCodeAt(0);
  return (c >= 0x3040 && c <= 0x309f)
}

const is_kunyomi = (word) => {
  if (word.length === 1) { // single kanji is kun
    return true
  }

  return Array.from(word)
    .filter(ch => is_hiragana(ch))
    .length > 0
}

const is_jukugo = (word) => {
  let clean = word.split(".")[0].trim()

  let kanji = Array.from(clean)
    .filter(ch => is_kanji(ch))

  if (kanji.length === 1) { // single kanji is kun
    return false
  }

  if (clean.includes("する")) {
    return true
  }

  return Array.from(clean)
    .filter(ch => is_hiragana(ch))
    .length === 0
}

const to_onyomi = (word) => {
  return Array.from(word)
    .map(ch => {
      let c = ch.charCodeAt(0);
      if (c >= 0x3040 && c <= 0x309f) {
        return String.fromCharCode(c + 96)
      } else {
        return ch
      }
    }).join('')
}

const find_kanji = async (kanji) => {
  await limit()
  let json = await post('findNotes', {query: `note:OnKanji kanji:*${kanji}*`});
  return json.result.length === 1
}

const multiple_kanji = (list) => {
  return list.split(/\s/).map(str => str.trim()).filter(kanji => kanji !== "")
}

const missing_kanji = (list) => {
  return multiple_kanji(list).map(async kanji => await find_kanji(kanji) ? null : kanji)
}

module.exports = {
  post,
  colorize,
  emphasizeNotes,
  moveCards,
  strokeNotes,
  updateStyling,
  downloadHtmlTemplates,
  uploadHtmlTemplates,
  configureJapaneseDecks,
  add_kanji_with_reading_and_meaning,
  is_kunyomi,
  is_jukugo,
  to_onyomi,
  fix_kana,
  find_kanji,
  multiple_kanji,
  exist_kanji: missing_kanji
}