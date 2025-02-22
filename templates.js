const pug = require("pug");
const fs = require("fs");

const write_front_html = (cards, template, suffix) => {
  write_html(cards, template, suffix + '.Front');
}

const write_back_html = (cards, template, suffix) => {
  write_html(cards, template, suffix + '.Back');
}

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

  write_html(cards, 'writing.kanji.back.pug', 'ToKanji.Back');
}

function reading_kanji_html() {
  let cards = [{
    note: 'OnKanji', grammar: ['漢字'], color: 'yellow', mode: 'reading'
  }]

  write_html(cards, 'reading.kanji.back.pug', 'ToMeaning.Back');
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

  let compiledTemplate = write_html(cards, 'writing.front.pug', 'ToWriting.Front');
  write_html(cards, 'writing.back.pug', 'ToWriting.Back');

  return compiledTemplate(cards[0]);
}

function to_hearing_html() {
  let cards = [
    {note: 'OnYomi', grammar: kango, color: 'magenta', type: ''},
    {note: 'Kunyomi', grammar: jukugo, color: 'violet', type: ''},
    {note: 'Godan', grammar: godan, color: 'violet', type: '⬤'},
    {note: 'Ichidan', grammar: ichidan, color: 'violet', type: '⬤'},
  ].map(card => Object.assign(card, {mode: 'hearing'}));

  let compiledTemplate = write_html(cards, 'hearing.front.pug', 'ToHearing.Front');
  write_html(cards, 'hearing.back.pug', 'ToHearing.Back');

  return compiledTemplate(cards[0]);
}

function to_meaning_html() {
  let suru = ['V'];

  let dictionary = ['終止形', 'しゅうしけい'];
  let fronts = [
    {note: 'Godan', grammar: dictionary},
    {note: 'Ichidan', grammar: dictionary},
    {note: 'Onyomi', grammar: kango},
    {note: 'Kunyomi', grammar: jukugo},
    {note: 'Suru', grammar: suru}
  ].map(meaning => Object.assign(meaning, {
    color: 'magenta',
    mode: 'reading'
  }))

  let backs = [
    {note: 'Godan', grammar: ['五段活用'],},
    {note: 'Ichidan', grammar: ['一段活用'],},
    {note: 'Onyomi', grammar: kango},
    {note: 'Kunyomi', grammar: jukugo},
    {note: 'Suru', grammar: suru,},
  ].map(meaning => Object.assign(meaning, {
    color: 'magenta',
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

function opposite_html() {
  [{front: 1, back: 2}, {front: 2, back: 1}].forEach(card => {
    const note = Object.assign({note: 'Opposite'}, card);
    const rwsuffix = `Read${card.front}Write${card.back}`;
    write_front_html([note], 'mirror.r2w.front.pug', rwsuffix);
    write_back_html([note], 'mirror.r2w.back.pug', rwsuffix);
    const lssuffix = `Listen${card.front}Speak${card.back}`;
    write_front_html([note], 'mirror.l2s.front.pug', lssuffix);
    write_back_html([note], 'mirror.l2s.back.pug', lssuffix);
  })
}

const to_immerse_html = () => {
  write_html([{note: 'Immersion'}], 'immerse.back.pug', 'Listening.Back');
}

const html_from_templates = () => {
  opposite_html()
  reading_kanji_html()
  writing_kanji_html()
  to_express_html()
  to_meaning_html()
  to_kanji_html()
  to_hearing_html()
  to_immerse_html()
}

module.exports = {
  to_express_html,
  to_meaning_html,
  to_kanji_html,
  html_from_templates
}