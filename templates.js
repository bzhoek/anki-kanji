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

  let compiledTemplate = write_html(cards, 'writing.front.pug', 'ToKanji.Front');
  write_html(cards, 'writing.back.pug', 'ToKanji.Back');

  return compiledTemplate(cards[0]);
}

function to_hearing_html() {
  let onyomi = ['オンヨミ'];

  let cards = [
    {note: 'OnYomi', grammar: onyomi, color: 'yellow', type: ''},
    {note: 'Kunyomi', grammar: jukugo, color: 'violet', type: ''},
    {note: 'Godan', grammar: godan, color: 'magenta', type: '⬤'},
    {note: 'Ichidan', grammar: ichidan, color: 'magenta', type: '⬤'},
  ].map(card => Object.assign(card, {mode: 'hearing'}));

  let compiledTemplate = write_html(cards, 'listening.front.pug', 'ToHearing.Front');
  write_html(cards, 'listening.back.pug', 'ToHearing.Back');

  return compiledTemplate(cards[0]);
}

function to_on_yomi_html() {
  let onyomi = ['オンヨミ'];

  let cards = [
    {
      note: 'OnKanji', grammar: onyomi, color: 'yellow', mode: 'speaking onkanji',
      notempty: 'on', clazz: 'strokes', fmain: 'strokes', bmain: 'strokes', back: 'on', kanji: 'kanji'
    },
    {
      note: 'OnYomi', grammar: onyomi, color: 'yellow', mode: 'speaking',
      notempty: 'kanji', clazz: 'kanji', fmain: 'kanji', bmain: 'furigana', back: 'kana', kanji: 'furigana'
    },
  ]

  write_html(cards, 'speaking.front.pug', 'ToOnYomi.Front');
  write_html(cards, 'speaking.back.pug', 'ToOnYomi.Back');
}

function to_kan_yomi_html() {
  let kunyomi = ['くんよみ'];

  let cards = [
    {
      note: 'OnKanji', grammar: kunyomi, color: 'magenta', mode: 'speaking',
      notempty: 'kun', clazz: 'strokes', fmain: 'strokes', bmain: 'strokes', back: 'kun', kanji: 'kanji'
    },
  ]

  write_html(cards, 'speaking.front.pug', 'ToKunYomi.Front');
  write_html(cards, 'speaking.back.pug', 'ToKunYomi.Back');
}

function to_kun_yomi_html() {
  let godan = ['V', '五段活用'];
  let ichidan = ['V', '一段活用'];
  let suru = ['V', 'するV'];

  let cards = [
    {note: 'Godan', grammar: godan},
    {note: 'Ichidan', grammar: ichidan},
    {note: 'Kunyomi', grammar: jukugo},
    {note: 'Suru', grammar: suru},
  ].map(card => Object.assign(card, {
    mode: 'speaking', color: 'magenta',
    notempty: 'kanji', clazz: 'kanji', fmain: 'kanji', bmain: 'furigana', back: 'kana', kanji: 'furigana'
  }));

  let compiledTemplate = write_html(cards, 'speaking.front.pug', 'ToKunYomi.Front');
  write_html(cards, 'speaking.back.pug', 'ToKunYomi.Back');

  return compiledTemplate(cards[0])
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

const html_from_templates = () => {
  reading_kanji_html()
  writing_kanji_html()
  to_express_html()
  to_meaning_html()
  to_kanji_html()
  to_kan_yomi_html()
  to_kun_yomi_html()
  to_on_yomi_html()
  to_hearing_html()
}

module.exports = {
  to_express_html,
  to_meaning_html,
  to_kanji_html,
  to_kun_yomi_html,
  html_from_templates
}