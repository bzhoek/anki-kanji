const pug = require("pug");
const fs = require("fs");

const write_html = (cards, template, suffix) => {
  const compiledTemplate = pug.compileFile(`template/${template}`, {pretty: true});

  cards.forEach(card => {
      let result = compiledTemplate(card)
      let filename = `html/${card.note}.${suffix}.html`;
      fs.writeFileSync(filename, result, 'utf8')
      console.log(`Wrote ${filename}`)
    }
  )
  return compiledTemplate
};

let godan = ['辞書形', '五段活用'];
let ichidan = ['辞書形', '一段活用'];
let jukugo = ['熟語', 'じゅくご'];
let kango = ['漢語', 'かんご'];

function writing_kanji_html() {
  let cards = [{
    note: 'OnKanji', grammar: ['漢字'], color: 'yellow', mode: 'writing'
  }]

  to_sides(cards, 'writing.kanji', 'ToKanji');
}

function reading_kanji_html() {
  let cards = [{
    note: 'OnKanji', grammar: ['漢字'], color: 'yellow', mode: 'reading'
  }]

  to_sides(cards, 'reading.kanji', 'ToMeaning');
}

function to_kanji_html() {
  let suru = ['辞書形', 'するV'];

  let cards = [
    {note: 'Godan', grammar: godan, color: 'violet'},
    {note: 'Ichidan', grammar: ichidan, color: 'violet'},
    {note: 'Onyomi', grammar: kango, color: 'magenta'},
    {note: 'Kunyomi', grammar: jukugo, color: 'violet'},
    {note: 'Suru', grammar: suru, color: 'violet'},
  ].map(card => Object.assign(card, {mode: 'writing'}));

  to_sides(cards, 'writing', 'ToWriting');
}

function to_hearing_html() {
  let cards = [
    {note: 'Godan', grammar: godan, color: 'violet', type: '⬤'},
    {note: 'Ichidan', grammar: ichidan, color: 'violet', type: '⬤'},
    {note: 'Kunyomi', grammar: jukugo, color: 'violet', type: ''},
    {note: 'OnYomi', grammar: kango, color: 'magenta', type: ''},
  ].map(card => Object.assign(card, {mode: 'hearing'}));

  to_sides(cards, 'hearing', 'ToHearing');
}

function to_meaning_html() {
  let suru = ['V'];

  let dictionary = ['終止形', 'しゅうしけい'];
  let fronts = [
    {note: 'Godan', grammar: dictionary, color: 'violet'},
    {note: 'Ichidan', grammar: dictionary, color: 'violet'},
    {note: 'Kunyomi', grammar: jukugo, color: 'violet'},
    {note: 'Onyomi', grammar: kango, color: 'magenta'},
    {note: 'Suru', grammar: suru, color: 'violet'}
  ].map(meaning => Object.assign(meaning, {
    mode: 'reading'
  }))

  let backs = [
    {note: 'Godan', grammar: ['五段活用'], color: 'violet'},
    {note: 'Ichidan', grammar: ['一段活用'], color: 'violet'},
    {note: 'Kunyomi', grammar: jukugo, color: 'violet'},
    {note: 'Onyomi', grammar: kango, color: 'magenta'},
    {note: 'Suru', grammar: suru, color: 'violet'},
  ].map(meaning => Object.assign(meaning, {
    mode: 'reading'
  }))

  let compiledTemplate = write_html(fronts, 'reading.front.pug', 'ToMeaning.Front');
  write_html(backs, 'reading.back.pug', 'ToMeaning.Back');

  return compiledTemplate(fronts[0])
}

function to_express_html() {
  let godan = ['V', '五段活用'];
  let ichidan = ['V', '一段活用'];

  let cards = [
    {note: 'Godan', grammar: godan, color: 'cyan'},
    {note: 'Ichidan', grammar: ichidan, color: 'cyan'},
  ].map(card => Object.assign(card, {mode: 'saying'}));

  let compiledTemplate = write_html(cards, 'writing.front.pug', 'ToExpress.Front');
  write_html(cards, 'saying.back.pug', 'ToExpress.Back');

  return compiledTemplate(cards[0])
}

function pair_html(note_name, grammar) {
  [{front: 1, back: 2}, {front: 2, back: 1}].forEach(card => {
    const note = Object.assign({note: note_name, grammar: grammar}, card);
    to_sides([note], 'mirror.r2w', `Read${card.front}Write${card.back}`);
    to_sides([note], 'mirror.l2s', `Listen${card.front}Speak${card.back}`);
  })
}

const to_sides = (notes, template, card) => {
  ['Front', 'Back'].forEach(side => {
    write_html(notes,
      `${template}.${side.toLowerCase()}.pug`,
      `${card}.${side}`
    )
  })
}

const to_immerse_html = () => {
  const notes = [{note: 'Immersion'}];
  to_sides(notes, 'reading.immerse', 'ToMeaning');
  to_sides(notes, 'hearing.immerse', 'ToHearing');
}

const to_grammar_html = () => {
  const notes = [{note: 'Grammar'}];
  to_sides(notes, 'grammar', 'Cloze');
}

const html_from_templates = () => {
  pair_html("Opposite", "対義語")
  pair_html("Pair", "自他動詞")
  reading_kanji_html()
  writing_kanji_html()
  to_express_html()
  to_meaning_html()
  to_kanji_html()
  to_hearing_html()
  to_immerse_html()
  to_grammar_html()
}

module.exports = {
  to_express_html,
  to_meaning_html,
  to_kanji_html,
  html_from_templates
}