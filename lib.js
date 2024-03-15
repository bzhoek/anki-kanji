const fs = require("fs");
const sax = require("sax");
const sqlite3 = require("sqlite3");
const {RateLimit} = require('async-sema')
const pug = require("pug");
const {DOMParser: parser} = require("@xmldom/xmldom");
const xpath = require("xpath");

const rate_limit = RateLimit(5);

const post = async (action, params) => {
  let request = {
    action: action,
    version: 6,
    params: params
  }

  await rate_limit()

  return fetch('http://127.0.0.1:8765', {method: 'post', body: JSON.stringify(request)}).then(res => res.json())
}

// noinspection JSUnusedLocalSymbols
let colors = [
  "E8ECFB", "D9CCE3", "CAACCB", "BA8DB4", "AA6F9E", "994F88", "882E72", "7BAFDE",
  "6195CF", "437DBF", "1965B0", "CAE0AB", "4EB265", "90C987", "F7F056", "F7CB45",
  "F4A736", "EE8026", "E65518", "DC050C", "A5170E", "72190E", "42150A",]

const style_color = (i) => ` class="stroke-${i % 23}"`

const colorize = async (unicode, color_fn) => {
  let cwd = process.cwd();
  let source = `${cwd}/kanjivg/kanji/0${unicode.toString(16)}.svg`

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
<style>
  text {
  font: 8pt sans-serif;
  stroke-width: 0;
  fill: #586e75;
  }
  path {
  stroke-width: 4pt;
  fill: #ffffff;
  fill-opacity: 0;
  }
</style>`

let refresh = true

// FIXME
function delay() {
  return new Promise(resolve => setTimeout(resolve, 500));
}

const stroke_note = async (id) => {
  let note = await note_info(id)
  let strokes = note.fields['strokes'];
  if (!refresh && strokes.value.includes('</svg>')) {
    console.log('skipping filled svg', id)
    return
  }
  let kanji = note.fields['kanji'];
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

const find_notes = async (query, fn) => {
  let json = await post('findNotes', {query: query});
  console.log("Matches", json.result.length, "notes")
  for (const id of json.result) {
    await fn(id)
    await delay()
  }
}

const stroke_notes = async (query) => find_notes(query, stroke_note)

const move_related = async (query) => {
  await find_notes(query, (nid) => {
    move_cards(`nid:${nid}`, 'Default')
  })
}

const convert_kana_field_to_onyomi = async (query) =>
  find_notes(query, async (id) => {
    let note = await note_info(id)

    if (!['OnYomi', 'Suru'].includes(note.modelName)) {
      console.log("Skip", note.modelName)
      return
    }

    if (note.fields['kana'] === undefined) {
      return
    }

    let kana = note.fields['kana'].value;
    let kanji = note.fields['kanji'].value;
    if (is_jukugo(kanji)) {
      let onyomi = convert_kunyomi_to_onyomi(kana);
      if (onyomi !== kana) {
        let params = {note: {id: id, fields: {}}};
        Object.defineProperty(params.note.fields, "kana", {value: onyomi, enumerable: true})
        await post('updateNoteFields', params)
        console.log("convert_kana_field_to_onyomi", kanji, kana, onyomi)
      }
    }
  })

const target_word = async (char, word) => {
  let kanji = await find_kanji(char);
  let onyomi = await find_onyomi(word);
  let fields = {}
  let speech = onyomi.fields['speech'].value;
  if (kanji.fields['speech'].value.length === 0 && speech.length !== 0) {
    Object.assign(fields, {speech: speech})
  }
  if (kanji.fields['target'].value.length === 0) {
    let kana = onyomi.fields['kana'].value.replace(/<.+?>/g, '').trim()
    let nl = onyomi.fields['nederlands'].value.replace(/<.+?>/g, '').trim()
    let target = `${word} <i>(${kana} ${nl})</i> `
    Object.assign(fields, {target: target})
  }
  let note = {note: {id: kanji.noteId, fields: fields}};
  let update = await post('updateNoteFields', note)
  if (update.error) {
    console.error(update.error, note)
  } else {
    console.log("Update", fields)
  }
}

const add_speech = async (query) => find_notes(query, async (id) => {
  let note = await note_info(id)
  if (note.fields['speech'] === undefined) {
    return
  }

  let speech = note.fields['speech'].value;
  if (speech.startsWith("[")) {
    return
  }

  let words = note.fields['kanji'].value;
  words = words.replace(/<.+?>/g, '').trim()
  words = words.replace(/\s/g, '').trim()

  let clean = words.split(".")[0].trim()
  if (clean.length === 0) {
    return
  }
  console.log(clean)

  let filename = await try_media(clean)
  if (filename === undefined) {
    let kanji = as_jukugo(words)
    if (kanji.length === 0) {
      return
    }
    filename = await try_media(kanji.join(''))
  }

  if (filename === undefined) {
    console.error("No media for", clean[0])
    return
  }

  let sound = `[sound:${filename}]`;
  let strokes = {note: {id: id, fields: {speech: sound}}};
  let update = await post('updateNoteFields', strokes)
  if (update.error) {
    console.error(update.error, strokes)
  }
  console.log('completed', sound)
})

const try_media = async (name) => {
  let filename = name + '_b.mp3'
  let media = await post("retrieveMediaFile", {filename: filename});
  if (!media.result) {
    console.error("No media for", filename)
    return undefined
  } else {
    return filename
  }
}

const move_cards = async (query, deck) => {
  let find = await post('findCards', {query: query});
  console.log(query, find)
  let move = await post('changeDeck', {cards: find.result, deck: deck})
  console.log(move)
}

const lapse_cards = async (count) =>
  find_notes(`prop:lapses=${count} note:OnKanji`, async (id) => {
    let note = await note_info(id)
    let kanji = note.fields.kanji.value.replace(/<.+?>/g, '').trim()
    let yomi = await post('findNotes', {query: `kanji:*${kanji}* card:ToKanji (note:OnYomi or note:Suru)`});
    console.log(kanji, yomi.result.length)
    if (yomi.result.length < 1) {
      await move_cards(`nid:${id}`, 'Lapsed')
    }
  })

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

const emphasize_first_sentence = async (id) => {
  let note = await note_info(id)
    ['kana', 'kanji', 'on', 'kun', 'masu', 'teta'].forEach(field => {
    if (note.fields[field]) {
      let value = note.fields[field].value.trim();
      let match = value.match(/(.+?)\.(.*)/);
      if (match) {
        emphasize(id, field, match[1], match[2])
      } else {
        emphasize(id, field, value, '')
      }
    }
  })
}

const emphasize_notes = async (query) => find_notes(query, emphasize_first_sentence)

const update_model_styling = (model, css) => {
  post("updateModelStyling", {
      "model": {
        "name": model,
        "css": css
      }
    }
  ).then(json => console.log(model, json.result));
}

let model_names = [
  'Suru',
  'Ichidan',
  'Godan',
  'Hiragana',
  'Katakana',
  'OnKanji',
  'Onyomi',
  'Kunyomi',
  'Immersion'
]

const update_styling = (css) => {
  model_names.forEach((model) => {
    post("modelStyling", {"modelName": model})
      .then(json => {
        if (json.result.css !== css) {
          update_model_styling(model, css)
        }
      });
  })
}

const download_html_template = (model, template, result) => {
  fs.writeFileSync(`html/${model}.${template}.Front.html`, result[template].Front)
  fs.writeFileSync(`html/${model}.${template}.Back.html`, result[template].Back)
}

const upload_html_template = (model, template, result) => {
  function updateCard(side) {
    let html = fs.readFileSync(`html/${model}.${template}.${side}.html`).toString()
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

const model_templates = (fn) => {
  model_names.forEach((model) => {
    post("modelTemplates", {"modelName": model})
      .then(json => {
        for (const [key, _] of Object.entries(json.result)) {
          fn(model, key, json.result)
        }
      });
  })
}

const download_html_templates = () => model_templates(download_html_template)
const upload_html_templates = () => model_templates(upload_html_template)

const configure_deck = async (deckName, suffix) => {
  let config = await post('getDeckConfig', {deck: deckName});
  if (config.result.name.endsWith(suffix)) {
    return
  }
  let clone = await post('cloneDeckConfigId', {name: `Japans ${suffix}`, cloneFrom: config.result.id});
  let result = await post('setDeckConfigId', {decks: [deckName], configId: clone.result});
  console.log(result)
}

const configure_decks = async () => {
  let json = await post('deckNamesAndIds', {});
  for (const [key, _] of Object.entries(json.result)) {
    let match = key.match(/日本語::(.*)/)
    if (match) {
      await configure_deck(match[0], match[1])
    }
  }
}

let kanjidb = new sqlite3.Database('kanjson.sqlite', (err) => {
  if (err) {
    console.error(err)
  }
})

const add_kanji_with_reading_and_meaning = (kanji) => {
  let unicode = kanji.charCodeAt(0)
  kanjidb.get("SELECT info FROM kanjidic WHERE json_extract(info, '$.kanji')=?", [kanji], function (err, row) {
    let json = JSON.parse(row.info)
    console.log(json)

    let meaning = row.meaning

    let tags = []
    if (json.jlpt > 0) {
      tags.push(`jlpt${json.jlpt}`)
    }
    if (json.grade > 0) {
      tags.push(`g${json.grade}`)
    }

    colorize(unicode, style_color).then(async (svg) => {
      let add = {
        "note": {
          "deckName": "Inbox",
          "modelName": "OnKanji",
          "fields": {
            "nederlands": json.meanings.join(', '),
            "kanji": kanji,
            "on": json.katakana.join(', '),
            "notes": json.hiragana.join(', '),
            "strokes": css_style + svg
          },
          "options": {
            "allowDuplicate": false
          },
          "tags": tags
        }
      }

      let update = false

      if (update) {
        let found = await find_kanji(kanji);
        // found.fields['notes'].value.length === 0
        let update = {note: {id: found.noteId, fields: add.note.fields, tags: tags}};
        console.log(update)
        await post('updateNote', update)
        console.log("updated", json)
      } else {
        post('addNote', add).then(json => {
          console.log("added", meaning, json)
        })/**/
      }
    })
  })
}

const is_kanji = (char) => char >= '一' && char <= '龘'
const is_hiragana = (char) => char >= 'ぁ' && char <= 'わ' // 0x3041 to 0x308F
const is_katakana = (char) => char >= 'ァ' && char <= 'ワ' // 0x30A1 to 0x30EF

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

const as_jukugo = (word) => {
  let clean = word.split(".")[0].trim()

  let kanji = Array.from(clean)
    .filter(ch => is_kanji(ch))

  if (kanji.length === 1) { // single kanji is kun
    return []
  }

  if (clean.includes("する")) {
    return kanji
  }

  if (Array.from(clean)
    .filter(ch => is_hiragana(ch))
    .length === 0) {
    return kanji
  }

  return []
}

const convert_kunyomi_to_onyomi = (word) => {
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

const has_kanji = async (kanji) => {
  return find_kanji(kanji).result.length === 1
}

async function note_info(id) {
  let notes = await post("notesInfo", {notes: [id]});
  await delay()
  return notes.result[0];
}

const find_kanji = async (kanji) => {
  let ids = await post('findNotes', {query: `note:OnKanji kanji:*${kanji}*`});
  let id = ids.result[0];
  return await note_info(id);
}

const find_onyomi = async (kanji) => {
  let ids = await post('findNotes', {query: `(note:OnYomi or note:Suru) kanji:*${kanji}*`});
  let id = ids.result[0];
  return await note_info(id);
}

const multiple_kanji = (list) => {
  return list.split(/\s/).map(str => str.trim()).filter(kanji => kanji !== "")
}

const missing_kanji = (list) => {
  return multiple_kanji(list).map(async kanji => await has_kanji(kanji) ? null : kanji)
}

const parse_kanjidic = (line) => {
  try {
    let meanings = line.split("{");
    let tokens = meanings.shift().split(" ");
    let result = {
      kanji: tokens[0],
      unicode: parseInt(tokens[2].substring(1), 16),
      frequency: 0,
      grade: 0,
      jlpt: 0,
      katakana: [],
      hiragana: [],
      meanings: meanings.map(str => str.replace('}', '').trim()),
    }
    tokens.forEach(str => {
      if (str.startsWith('F')) {
        result.frequency = parseInt(str.substring(1))
      }
      if (str.startsWith('G')) {
        result.grade = parseInt(str.substring(1))
      }
      if (str.startsWith('J')) {
        result.jlpt = parseInt(str.substring(1))
      }
      if (is_hiragana(str.charAt(0))) {
        result.hiragana.push(str)
      }
      if (is_katakana(str.charAt(0))) {
        result.katakana.push(str)
      }
    })
    return result
  } catch (error) {
    console.error(line.length, error);
  }
}
const extract_parts_from_kanji = unicode => {
  let hex = unicode.toString(16).padStart(5, '0')
  let svg = fs.readFileSync(`kanjivg/kanji/${hex}.svg`, 'utf8')

  let doc = new parser().parseFromString(svg, 'text/xml');
  let nodes = xpath.select("//*[@position]", doc);
  return nodes.map(node => xpath.select1("@element", node).nodeValue);
};

const show_parts_of_kanji = char => {
  let unicode = char.charCodeAt(0)
  let parts = extract_parts_from_kanji(unicode);
  console.log(parts)
}

module.exports = {
  post,
  colorize,
  emphasize_notes,
  move_cards,
  stroke_notes,
  update_styling,
  download_html_templates,
  upload_html_templates,
  configure_decks,
  add_kanji_with_reading_and_meaning,
  is_jukugo,
  is_kunyomi,
  is_hiragana,
  is_katakana,
  convert_kunyomi_to_onyomi,
  convert_kana_field_to_onyomi,
  find_kanji,
  find_onyomi,
  has_kanji,
  multiple_kanji,
  missing_kanji,
  move_related,
  add_speech,
  lapse_cards,
  parse_kanjidic,
  extract_parts_from_kanji,
  show_parts_of_kanji,
  target_word
}