const pug = require("pug");
const fs = require("fs");

const write_html = (cards, template, suffix) => {
  const compiledTemplate = pug.compileFile(`template/${template}`, {pretty: true});

  cards.forEach(card => {
      let result = compiledTemplate(card)
      let filename = `html/${card.name}.${suffix}.html`;
      fs.writeFileSync(filename, result, 'utf8')
      console.log(`Wrote ${filename}`)
    }
  )
  return compiledTemplate
};

const speaking_title = (ary) => ary.map(text => `&gt; ${text} &lt;`)

function to_kanji_html() {
  const writing_titles = (ary) => ary.map(text => `\\ ${text} /`)
  let godan = writing_titles(['辞書形', '五段活用']);
  let ichidan = writing_titles(['辞書形', '一段活用']);
  let jukugo = writing_titles(['熟語', 'じゅくご']);
  let suru = writing_titles(['辞書形', 'するV']);

  let cards = [
    {name: 'Godan', grammar: godan, color: 'violet'},
    {name: 'Ichidan', grammar: ichidan, color: 'violet'},
    {name: 'Kunyomi', grammar: jukugo, color: 'violet'},
    {name: 'Onyomi', grammar: jukugo, color: 'magenta'},
    {name: 'Suru', grammar: suru, color: 'violet'},
  ].map(card => Object.assign(card, {mode: 'writing'}));

  let compiledTemplate = write_html(cards, 'writing.front.pug', 'ToKanji.Front');
  write_html(cards, 'writing.back.pug', 'ToKanji.Back');

  return compiledTemplate(cards[0]);
}

function to_hearing_html() {
  const hearing_titles = (ary) => ary.map(text => `&lt; ${text} &gt;`)
  let godan = hearing_titles(['辞書形', '五段活用']);
  let ichidan = hearing_titles(['辞書形', '一段活用']);
  let jukugo = hearing_titles(['熟語', 'じゅくご']);
  let suru = hearing_titles(['辞書形', 'するV']);
  let onyomi = hearing_titles(['オンヨミ']);

  let cards = [
    {name: 'Kunyomi', grammar: jukugo, color: 'violet'},
    {name: 'OnYomi', grammar: onyomi, color: 'yellow'},
    {name: 'Godan', grammar: godan, color: 'magenta'},
    {name: 'Ichidan', grammar: ichidan, color: 'magenta'},
  ].map(card => Object.assign(card, {mode: 'listening'}));

  let compiledTemplate = write_html(cards, 'listening.front.pug', 'ToHearing.Front');
  write_html(cards, 'listening.back.pug', 'ToHearing.Back');

  return compiledTemplate(cards[0]);
}

function to_on_yomi_html() {
  let onyomi = speaking_title(['オンヨミ']);

  let cards = [
    {
      name: 'OnKanji', grammar: onyomi, color: 'yellow', mode: 'speaking onkanji',
      notempty: 'on', clazz: 'strokes', front: 'strokes', back: 'on'
    },
    {
      name: 'OnYomi', grammar: onyomi, color: 'yellow', mode: 'speaking',
      notempty: 'kanji', clazz: 'title', front: 'kanji', back: 'kana'
    },
  ]

  write_html(cards, 'speaking.front.pug', 'ToOnYomi.Front');
  write_html(cards, 'speaking.back.pug', 'ToOnYomi.Back');
}

function to_kan_yomi_html() {
  let kunyomi = speaking_title(['くんよみ']);

  let cards = [
    {
      name: 'OnKanji', grammar: kunyomi, color: 'magenta', mode: 'speaking',
      notempty: 'kun', clazz: 'strokes', front: 'strokes', back: 'kun'
    },
  ]

  write_html(cards, 'speaking.front.pug', 'ToKunYomi.Front');
  write_html(cards, 'speaking.back.pug', 'ToKunYomi.Back');
}

function to_kun_yomi_html() {
  let godan = speaking_title(['V', '五段活用']);
  let ichidan = speaking_title(['V', '一段活用']);
  let jukugo = speaking_title(['熟語', 'じゅくご']);
  let suru = speaking_title(['V', 'するV']);

  let cards = [
    {name: 'Godan', grammar: godan},
    {name: 'Ichidan', grammar: ichidan},
    {name: 'Kunyomi', grammar: jukugo},
    {name: 'Suru', grammar: suru},
  ].map(card => Object.assign(card, {
    mode: 'speaking', color: 'magenta',
    notempty: 'kanji', clazz: 'title', front: 'kanji', back: 'kana'
  }));

  let compiledTemplate = write_html(cards, 'speaking.front.pug', 'ToKunYomi.Front');
  write_html(cards, 'speaking.back.pug', 'ToKunYomi.Back');

  return compiledTemplate(cards[0])
}

function to_meaning_html() {
  const meanings = (ary) => ary.map(text => `&equals; ${text} &equals;`)
  let jukugo = meanings(['熟語', 'じゅくご']);
  let suru = meanings(['V']);

  let dictionary = meanings(['終止形', 'しゅうしけい']);
  let fronts = [
    {name: 'Godan', grammar: dictionary},
    {name: 'Ichidan', grammar: dictionary},
    {name: 'Onyomi', grammar: jukugo},
    {name: 'Kunyomi', grammar: jukugo},
    {name: 'Suru', grammar: suru}
  ].map(meaning => Object.assign(meaning, {
    color: 'magenta',
    mode: 'reading'
  }))

  let backs = [
    {name: 'Godan', grammar: meanings(['五段活用']),},
    {name: 'Ichidan', grammar: meanings(['一段活用']),},
    {name: 'Onyomi', grammar: jukugo},
    {name: 'Kunyomi', grammar: jukugo},
    {name: 'Suru', grammar: suru,},
  ].map(meaning => Object.assign(meaning, {
    color: 'magenta',
    mode: 'reading'
  }))

  let compiledTemplate = write_html(fronts, 'reading.front.pug', 'ToMeaning.Front');
  write_html(backs, 'reading.back.pug', 'ToMeaning.Back');

  return compiledTemplate(fronts[0])
}

function to_express_html() {
  let godan = speaking_title(['V', '五段活用']);
  let ichidan = speaking_title(['V', '一段活用']);

  let cards = [
    {name: 'Godan', grammar: godan, color: 'cyan'},
    {name: 'Ichidan', grammar: ichidan, color: 'cyan'},
  ].map(card => Object.assign(card, {mode: 'saying'}));

  let compiledTemplate = write_html(cards, 'writing.front.pug', 'ToExpress.Front');
  write_html(cards, 'saying.back.pug', 'ToExpress.Back');

  return compiledTemplate(cards[0])
}

const html_from_templates = () => {
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