const {exec} = require('child_process');
const fs = require("fs");
const sax = require("sax");
const sqlite3 = require("sqlite3");
const {RateLimit} = require('async-sema')
const {DOMParser: parser} = require("@xmldom/xmldom");
const xpath = require("xpath");
const {un_furigana, furigana_html, ruby_target_result} = require("./furigana");
const {strip_kana, extract_before_period, extract_ruby_kana} = require('./util')
const {tts} = require("./tts");

let data = fs.readFileSync("config.json", "utf8")
const config = JSON.parse(data);

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

const raw_svg = async (kanji, output) => {
  let unicode = kanji.charCodeAt(0);
  let cwd = process.cwd();
  let source = `${cwd}/kanjivg/kanji/0${unicode.toString(16)}.svg`
  console.log('From', source);

  exec(`xsltproc -o ${output} radicals/radical.xslt ${source}`, (err, stdout, stderr) => {
    if (err) {
      console.error(err)
      return;
    }
    console.log(stdout)
  });
  return

  const parser = new DOMParser();
  const xsltProcessor = new XSLTProcessor();
  const xslResponse = await fetch("radicals/radical.xslt");
  const xslText = await xslResponse.text();
  const xslStylesheet = parser.parseFromString(xslText, "application/xml");
  xsltProcessor.importStylesheet(xslStylesheet);
  const xmlDoc = parser.parseFromString(source, "application/xml");
  const fragment = xsltProcessor.transformToFragment(xmlDoc, document);
  console.log(fragment)
  return fs.readFileSync(source, 'utf8')
}

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
  return new Promise(resolve => setTimeout(resolve, 250));
}

async function kanji_svg(kanji) {
  let svg = css_style
  for (let i = 0; i < kanji.length; i++) {
    let unicode = kanji.charCodeAt(i);
    let char = kanji.charAt(i);
    if (is_kanji(char)) {
      console.log(unicode)
      svg += await colorize(unicode, style_color)
    }
  }
  return svg;
}

const stroke_note = async (id, note) => {
  let strokes = note.fields['strokes'];
  if (!refresh && strokes.value.includes('</svg>')) {
    console.log('skipping filled svg', id)
    return
  }
  let kanji = note.fields['kanji'];
  if (kanji) {
    let svg = await kanji_svg(kanji.value);

    let strokes = {note: {id: id, fields: {strokes: svg}}};
    let update = await post('updateNoteFields', strokes)
    if (update.error) {
      console.error(update.error, strokes)
    }
    console.log('completed', kanji.value)
  }
}

const iterate_notes = async (query, fn) => {
  let ids = await post('findNotes', {query: query});
  console.log("Matches", ids.result.length, "notes")
  let notes = await post("notesInfo", {notes: ids.result});
  for (const note of notes.result) {
    await fn(note.noteId, note)
    await delay()
  }
}

const clean_notes = async (query) => iterate_notes(query, clean_note)
const emphasize_notes = async (query) => iterate_notes(query, emphasize_first_sentence)
const furigana_notes = async (query) => iterate_notes(query, furigana_note)
const retarget_notes = async (query) => iterate_notes(query, retarget_note)
const hint6k_notes = async (query) => iterate_notes(query, kanji_to_hint6k)
const notes_target_to_hint = async (query) => iterate_notes(query, target_to_hint)
const mirror_notes = async (query) => iterate_notes(query, mirror_note)
const stroke_notes = async (query) => iterate_notes(query, stroke_note)
const kun_notes = async (query) => iterate_notes(query, kun_note)

const move_related = async (query) => {
  let json = await post('findNotes', {query: query});
  console.log("Matches", json.result.length, "notes")
  for (const id of json.result) {
    await move_cards(`nid:${id}`, '0-Inbox')
    await delay()
  }
}

const convert_kana_field_to_onyomi = async (query) =>
  iterate_notes(query, async (id, note) => {
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
  let kanji_note = await find_onkanji(char);
  let onyomi_note = await find_yomi(word);

  let fields = {}
  let speech = note_field(onyomi_note, 'speech');
  let context = note_field(kanji_note, 'context');
  if (context.length === 0 && speech.length !== 0) {
    Object.assign(fields, {context: speech})
  } else {
    console.error("Context not empty", char)
  }

  let kana = strip_kana(onyomi_note.fields['kana'].value)
  let nl = onyomi_note.fields['nederlands'].value.replace(/<.+?>/g, '').trim()
  let target = `${word} <i>(${kana} ${nl})</i> `
  let hint = word.replace(char, '・')
  Object.assign(fields, {target: target, hint: hint})

  if (Object.keys(fields).length === 0) {
    return
  }

  let note = {note: {id: kanji_note.noteId, fields: fields}};
  let update = await post('updateNoteFields', note)
  if (update.error) {
    console.error(update.error, note)
  } else {
    console.log("Update", fields)
  }
}

const copy_context = async (source_id, target_id) => {
  let source_note = await note_info(parseInt(source_id));
  let target_note = await note_info(parseInt(target_id));
  let kanji = note_field(source_note, 'kanji');
  let picture = note_field(source_note, 'picture');
  let context = note_field(source_note, 'context');
  let target = note_field(source_note, 'target');
  let details = note_field(source_note, 'details');
  let hint = create_hint(kanji, target);

  let fields = {
    picture: picture,
    context: context,
    target: target,
    hint: hint,
    details: details
  }

  let note = {note: {id: target_note.noteId, fields: fields}};
  let update = await post('updateNoteFields', note)
  if (update.error) {
    console.error(update.error, note)
  } else {
    console.log("Update", fields)
  }
}

const add_speech = async (query) => iterate_notes(query, async (id, note) => {
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

const add_speech_field = async (text, field, object) => {
  if (text.length === 0) {
    return object
  }

  const filename = await tts(text)
  const audio = `[sound:${filename}]`;
  return Object.assign(object, {[field]: audio})
}

const add_tts = async (query) => iterate_notes(query, async (id, note) => {
  var fields = {}

  if (note.fields['speech'].value === "") {
    let kana = extract_before_period(note.fields['kana'].value);
    fields = await add_speech_field(kana, 'speech', {})
  }

  if (note.fields['context'].value === "") {
    let target = extract_ruby_kana(note.fields['target'].value);
    fields = await add_speech_field(target, 'context', fields)
  }

  let strokes = {note: {id: id, fields: fields}};
  let update = await post('updateNoteFields', strokes)
  if (update.error) {
    console.error(update.error, strokes)
  }
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

const move_field = async (query, source, target) => {
  await iterate_notes(query, async (id, note) => {
    let src_value = note_field(note, source);
    let tgt_value = note_field(note, target);
    if (tgt_value.length > 0) {
      console.error("Skip", id, src_value, tgt_value)
      return
    }
    let params = {note: {id: id, fields: {}}};
    Object.defineProperty(params.note.fields, target, {value: src_value, enumerable: true})
    Object.defineProperty(params.note.fields, source, {value: '', enumerable: true})
    console.log("Move", id, src_value)
    await post('updateNoteFields', params)
  });
}

const lapse_cards = async (count) =>
  iterate_notes(`prop:lapses=${count} note:OnKanji`, async (id, note) => {
    let kanji = note.fields.kanji.value.replace(/<.+?>/g, '').trim()
    let yomi = await post('findNotes', {query: `kanji:*${kanji}* card:ToKanji (note:OnYomi or note:Suru)`});
    console.log(kanji, yomi.result.length)
    if (yomi.result.length < 1) {
      await move_cards(`nid:${id}`, 'Lapsed')
    }
  })


const emphasize = async (id, field, prefix, suffix) => {
  let remove_tags = prefix.replace(/<.+?>/g, '').trim()
  if (!remove_tags.length) {
    return
  }
  let trimmed_suffix = suffix.trim()
  let emphasized = `<em>${remove_tags}</em>` + (trimmed_suffix.length ? `. ${trimmed_suffix}` : '');
  let params = {note: {id: id, fields: {}}};
  Object.defineProperty(params.note.fields, field, {value: emphasized, enumerable: true})
  await post('updateNoteFields', params)
}

const nbsp_removed = (str) => str.replace(/&nbsp;/g, ' ')
const remove_tags = (str) => str.replace(/<.+?>/g, '').trim()
const note_field = (note, field) => note.fields[field].value.trim()

const clean_note = async (id, note) => {
  let updates = {};
  config.clean_fields.forEach(name => {
    let field = note.fields[name];
    if (field !== undefined) {
      let cleaned = nbsp_removed(field.value);
      if (cleaned.length !== field.value.length) {
        Object.defineProperty(updates, name, {value: cleaned, enumerable: true})
      }
    }
  })
  if (Object.keys(updates).length > 0) {
    // console.log(updates)
    await post('updateNoteFields', {note: {id: id, fields: updates}})
  }
}

const mirror_note = async (id, note) => {
  if (note.modelName !== 'Opposite')
    return

  let updates = {};
  Object.assign(updates, await mirror_note_side(note, '1'));
  Object.assign(updates, await mirror_note_side(note, '2'));
  if (Object.keys(updates).length > 0) {
    // console.log(updates)
    await post('updateNoteFields', {note: {id: id, fields: updates}})
  }
}

async function mirror_note_side(note, side) {
  let kanji = note.fields[`${side}reading`].value;
  let updates = {};

  let svg = await kanji_svg(kanji);
  Object.defineProperty(updates, `${side}writing`, {value: svg, enumerable: true})

  let speech = await try_media(kanji);
  if (speech !== undefined) {
    Object.defineProperty(updates, `${side}listening`, {value: `[sound:${speech}]`, enumerable: true})
  }

  return updates
}

const furigana_note = async (id, note) => {
  if (!['Godan', 'Ichidan', 'KunYomi', 'OnYomi', 'Suru'].includes(note.modelName)) {
    console.log("Skip", note.modelName, id)
    return
  }
  let kanji = note_field(note, 'kanji');
  let plain = un_furigana(kanji);
  let furigana = await furigana_html(plain);
  if (note.modelName === 'OnYomi') {
    furigana = convert_kunyomi_to_onyomi(furigana);
  }
  let update = {note: {id: id, fields: {furigana: furigana}}};
  console.log(kanji, furigana)
  await post('updateNote', update)
}

const create_hint = (kanji, target) => {
  let placeholder = '・'.repeat(kanji.length);
  return target.replace(kanji, placeholder);
}

const kanji_to_hint6k = async (id, note) => {
  let kanji = note_field(note, 'kanji');
  let note6k = await find_6k(kanji);
  if (note6k.fields === undefined) {
    console.error("No 6k note", kanji, note6k)
    return
  }
  let target = remove_tags(note_field(note6k, 'Sentence')).replace('。', '');
  let hint = create_hint(kanji, target);
  let fields = {target: target, hint: hint};
  let update = {note: {id: id, fields: fields}};
  console.log(kanji, fields)
  await post('updateNote', update)
}

const retarget_note = async (id, note) => {
  let field_value = note_field(note, 'target');
  let kanji = note_field(note, 'kanji');
  if (field_value.length === 0) {
    return
  }

  let rubied = await ruby_target_result(field_value);
  if (rubied === null) {
    console.error("Failed ", kanji, field_value)
    return
  }

  let target_note = await find_yomi(rubied[0]);
  if (target_note.modelName === 'OnYomi') {
    rubied[1] = convert_kunyomi_to_onyomi(rubied[1]);
  }

  let target = `${rubied[1]} <i>${rubied[2]}</i>`;
  let update = {note: {id: id, fields: {target: target}}};
  console.log("Update ", kanji, rubied[0], rubied[2])
  await post('updateNote', update)
}

const target_to_hint = async (id, note) => {
  let kanji = remove_tags(note_field(note, 'kanji'));
  let target = note_field(note, 'target');
  let hint = note_field(note, 'hint');
  if (target.length > 0 && hint.length === 0) {
    let placeholder = '・'.repeat(kanji.length);
    let hint = target.replace(kanji, placeholder).replace(/<i>.*/g, '').trim();
    console.log(kanji, hint);
    let update = {note: {id: id, fields: {hint: hint}}};
    console.log(update)
    await post('updateNote', update)
  }
}

const emphasize_first_sentence = async (id, note) => {
  ['kana', 'on', 'kun', 'masu', 'teta'].forEach(field => {
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

const update_model_styling = (model, css) => {
  post("updateModelStyling", {
      "model": {
        "name": model,
        "css": css
      }
    }
  ).then(json => console.log(model, json.result));
}

const update_styling = (css) => {
  config.model_names.forEach((model) => {
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
  config.model_names.forEach((model) => {
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

let kanjidb = new sqlite3.Database('japanese.sqlite', (err) => {
  if (err) {
    console.error(err)
  }
})

const add_kanji_with_reading_and_meaning = (kanji) => {
  let unicode = kanji.charCodeAt(0)
  kanjidb.get("SELECT info FROM kanji WHERE json_extract(info, '$.kanji')=?", [kanji], function (err, row) {
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
          "deckName": "0-Inbox",
          "modelName": "OnKanji",
          "fields": {
            "nederlands": json.meanings.join(', '),
            "kanji": kanji,
            "kana": json.katakana.join(', '),
            "details": json.meanings.join(', ') + '\n' + json.hiragana.join(', '),
            "strokes": css_style + svg
          },
          "options": {
            "allowDuplicate": false
          },
          "tags": tags
        }
      }

      let found = await find_onkanji(kanji);
      if (Object.keys(found).length > 0) {
        let fields = add.note.fields
        let update = {
          note: {
            id: found.noteId,
            fields: {details: fields.details, strokes: fields.strokes},
            tags: tags
          }
        };
        await post('updateNote', update)
        console.log("updated", json)
      } else {
        post('addNote', add).then(json => {
          console.log("added", meaning, json)
        })
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
  return find_onkanji(kanji).result.length === 1
}

async function note_info(id) {
  let notes = await post("notesInfo", {notes: [id]});
  await delay()
  return notes.result[0];
}

const find_6k = async (kanji) => {
  let ids = await post('findNotes', {query: `"note:Japanese Vocab Dynamic" Expression:${kanji}`});
  let id = ids.result[0];
  return await note_info(id);
}

const either_query = (query, fn) => {
  if (query.startsWith('nid:')) {
    return query
  }
  return fn()
}

const find_note = async (query) => {
  let ids = await post('findNotes', {query: query});
  let id = ids.result[0];
  return await note_info(id);
}

const find_onkanji = async (kanji) => {
  const query = either_query(kanji, () => `(note:OnYomi or note:KunYomi or note:OnKanji) kanji:${kanji}`);
  return find_note(query);
}

const find_kun = async (kanji) => {
  return find_note(`note:KunYomi kanji:${kanji}`);
}

const find_yomi = async (kanji) => {
  return find_note(`(note:OnYomi or note:KunYomi or note:Godan or note:Ichidan) kanji:${kanji}`);
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
  let elements = nodes.map(node => xpath.select1("@element", node));
  let filtered = elements.filter(Boolean);
  return filtered.map(node => node.nodeValue);
};

const show_parts_of_kanji = char => {
  let unicode = char.charCodeAt(0)
  let parts = extract_parts_from_kanji(unicode);
  console.log(char, unicode.toString(16), parts.join(''))
}

const kun_note = async (id, note) => {
  const kanji = note_field(note, 'kanji')
  const kun = await find_kun(kanji)
  if (kun.fields !== undefined) {
    return
  }
  let add = {
    "note": {
      "deckName": "0-Inbox",
      "modelName": "KunYomi",
      "fields": {
        "nederlands": note_field(note, 'nederlands'),
        "kanji": kanji,
        "kana": note_field(note, 'kun'),
        "notes": note_field(note, 'notes'),
        "strokes": note_field(note, 'strokes'),
      },
      "options": {
        "allowDuplicate": false
      },
    }
  }
  console.log(add)
  // return
  await post('addNote', add).then(json => {
    console.log("added", add, json)
  })
  let strokes = {note: {id: id, fields: {kun: ''}}};
  await post('updateNoteFields', strokes).then(json => {
    console.log("updated", id, json)
  })
}

async function show_stats() {
  let ids = await post('findNotes', {query: `deck:Japans::1-書く kanji:_`});
  let notes = await post("notesInfo", {notes: ids.result});
  const unique = [];
  for (let note of notes.result) {
    let kanji = note_field(note, 'kanji')
    unique[kanji] = kanji
  }

  console.log('Unique items on', new Date().toLocaleDateString())
  console.log('       kanji:', Object.keys(unique).length)
  let yomi = await post('findNotes', {query: `deck:Japans note:*Yomi`});
  console.log('       words:', yomi.result.length)
  let verbs = await post('findNotes', {query: `deck:Japans note:*dan`});
  console.log('       verbs:', verbs.result.length)
}

module.exports = {
  post,
  colorize,
  clean_notes,
  emphasize_notes,
  notes_target_to_hint,
  mirror_notes,
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
  find_onkanji,
  find_yomi,
  has_kanji,
  multiple_kanji,
  missing_kanji,
  move_related,
  add_speech,
  lapse_cards,
  parse_kanjidic,
  extract_parts_from_kanji,
  show_parts_of_kanji,
  target_word,
  furigana_notes,
  retarget_notes,
  hint6k_notes,
  move_field,
  copy_context,
  raw_svg,
  kun_notes,
  show_stats,
  add_tts
}