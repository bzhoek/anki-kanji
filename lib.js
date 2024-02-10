const fetch = require('node-fetch');
const fs = require("fs");
const sax = require("sax");
const sqlite3 = require("sqlite3");
const {RateLimit} = require('async-sema')
const pug = require("pug");

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

const stroke_note = async (id) => {
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

const find_notes = async (query, fn) => {
  let json = await post('findNotes', {query: query});
  console.log("Matches", json.result.length, "notes")
  for (const id of json.result) {
    await fn(id);
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
    let json = await post("notesInfo", {notes: [id]});
    let entity = json.result[0];

    if (!['OnYomi', 'Suru'].includes(entity.modelName)) {
      console.log("Skip", entity.modelName)
      return
    }

    if (entity.fields['kana'] === undefined) {
      return
    }

    let kana = entity.fields['kana'].value;
    let kanji = entity.fields['kanji'].value;
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

const add_speech = async (query) => find_notes(query, async (id) => {
  let note = await post("notesInfo", {notes: [id]});
  let entity = note.result[0];
  if (entity.fields['speech'] === undefined) {
    return
  }

  let speech = entity.fields['speech'].value;
  if (speech.startsWith("[")) {
    return
  }

  let words = entity.fields['kanji'].value;
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
    let json = await post("notesInfo", {notes: [id]});
    let kanji = json.result[0].fields.kanji.value.replace(/<.+?>/g, '').trim()
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
  let json = await post("notesInfo", {notes: [id]});
  let result = json.result[0];
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
    colorize(unicode, style_color).then(async (svg) => {
      let params = {
        "note": {
          "deckName": "Default",
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
          "tags": [`jlpt${json.jlpt}`, `g${json.grade}`]
        }
      }

      post('addNote', params).then(json => {
        console.log(meaning, json)
      })
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

const find_kanji = async (kanji) => {
  let json = await post('findNotes', {query: `note:OnKanji kanji:*${kanji}*`});
  return json.result.length === 1
}

const multiple_kanji = (list) => {
  return list.split(/\s/).map(str => str.trim()).filter(kanji => kanji !== "")
}

const missing_kanji = (list) => {
  return multiple_kanji(list).map(async kanji => await find_kanji(kanji) ? null : kanji)
}

const write_html = (cards, template, suffix) => {
  const compiledTemplate = pug.compileFile(`template/${template}`);

  cards.forEach(card => {
      let result = compiledTemplate(card)
      let filename = `html/${card.name}.${suffix}.html`;
      fs.writeFileSync(filename, result, 'utf8')
      console.log(`Wrote ${filename}`)
    }
  )
  return compiledTemplate
};

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
  multiple_kanji,
  missing_kanji,
  move_related,
  add_speech,
  lapse_cards,
  parse_kanjidic,
  write_html
}