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

let godan = ['動詞', '五段動詞'];
let ichidan = ['動詞', '一段動詞'];
let jukugo = ['熟語', 'じゅくご'];
let kango = ['漢語', 'かんご'];

function writing_kanji_html() {
  let cards = [{
    note: 'OnKanji', grammar: ['漢字'], color: 'yellow', mode: 'writing'
  }]

  both_sides(cards, 'mean-write.kanji', 'mean-write');
}

const read_mean_suffix = "意味";
function reading_kanji_html() {
  let cards = [{
    note: 'OnKanji', grammar: ['漢字'], color: 'yellow', mode: 'reading', suffix: read_mean_suffix
  }]

  both_sides(cards, 'read-mean.kanji', 'read-mean');
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

  both_sides(cards, 'mean-write', 'mean-write');
}

function to_hearing_html() {
  let plain = [
    {note: 'Godan', grammar: godan, color: 'violet', type: '⬤'},
    {note: 'Ichidan', grammar: ichidan, color: 'violet', type: '⬤'},
    {note: 'Kunyomi', grammar: jukugo, color: 'violet', type: ''},
    {note: 'OnYomi', grammar: kango, color: 'magenta', type: ''},
  ];

  let write = plain.map(card => Object.assign(card, {mode: "hear-write", suffix: "書く"}));
  write_html(write, 'hear.front.pug', 'hear-write.Front');
  write_html(write, 'hear-write.back.pug', 'hear-write.Back');
  let mean = plain.map(card => Object.assign(card, {mode: "hear-mean", suffix: "意味"}));
  write_html(mean, 'hear.front.pug', 'hear-mean.Front');
  write_html(mean, 'hear-mean.back.pug', 'hear-mean.Back');
}

function to_meaning_html() {
  let suru = ['動詞'];

  let dictionary = ['終止形', 'しゅうしけい'];
  let fronts = [
    {note: 'Godan', grammar: dictionary, color: 'violet'},
    {note: 'Ichidan', grammar: dictionary, color: 'violet'},
    {note: 'Kunyomi', grammar: jukugo, color: 'violet'},
    {note: 'Onyomi', grammar: kango, color: 'magenta'},
    {note: 'Suru', grammar: suru, color: 'violet'}
  ].map(meaning => Object.assign(meaning, {
    mode: 'reading', suffix: read_mean_suffix
  }))

  let backs = [
    {note: 'Godan', grammar: ['五段動詞'], color: 'violet'},
    {note: 'Ichidan', grammar: ['一段動詞'], color: 'violet'},
    {note: 'Kunyomi', grammar: jukugo, color: 'violet'},
    {note: 'Onyomi', grammar: kango, color: 'magenta'},
    {note: 'Suru', grammar: suru, color: 'violet'},
  ].map(meaning => Object.assign(meaning, {
    mode: 'reading', suffix: read_mean_suffix
  }))

  let compiledTemplate = write_html(fronts, 'read-mean.front.pug', 'read-mean.Front');
  write_html(backs, 'read-mean.back.pug', 'read-mean.Back');

  return compiledTemplate(fronts[0])
}

function to_mean_say_html() {
  let godan = ['動詞', '五段'];
  let ichidan = ['動詞', '一段'];

  let cards = [
    {note: 'Godan', grammar: godan, color: 'violet'},
    {note: 'Ichidan', grammar: ichidan, color: 'violet'},
    {note: 'OnYomi', grammar: kango, color: 'magenta'},
    {note: 'KunYomi', grammar: jukugo, color: 'violet'},
  ].map(card => Object.assign(card, {mode: 'mean-say', suffix: "言う"}));

  let compiledTemplate = write_html(cards, 'mean-write.front.pug', 'mean-say.Front');
  write_html(cards, 'mean-say.back.pug', 'mean-say.Back');

  return compiledTemplate(cards[0])
}

function pair_html(note_name, grammar, prefix, color, symbols = '') {
  [{front: 1, back: 2}, {front: 2, back: 1}]
    .forEach(side => {
      const note = Object.assign(side, {
        note: note_name, grammar: grammar, prefix: prefix, color: color, symbols: symbols
      });
      Object.assign(note, {mode: 'read-mean', suffix: read_mean_suffix});
      both_sides([note], 'read-mean.mirror', `read-mean${side.front}`);
      Object.assign(note, {mode: 'hear-mean', suffix: "意味"});
      both_sides([note], 'hear-mean.mirror', `hear-mean${side.front}`);
    })
}

const both_sides = (cards, template, card) => {
  ['Front', 'Back'].forEach(side => {
    write_html(cards,
      `${template}.${side.toLowerCase()}.pug`,
      `${card}.${side}`
    )
  })
}

const to_immerse_html = () => {
  const notes = [{note: 'Immersion'}];
  both_sides(notes, 'reading.immerse', 'read-mean');
  both_sides(notes, 'hearing.immerse', 'hear-mean');
}

const to_grammar_html = () => {
  const notes = [{note: 'Grammar'}];
  both_sides(notes, 'grammar', 'Cloze');
}

const html_from_templates = () => {
  pair_html("Opposite", "対義語", "⇕", "blue")
  pair_html("Pair", "自他動詞", "⇔", "green", "をが")
  reading_kanji_html()
  writing_kanji_html()
  to_mean_say_html()
  to_meaning_html()
  to_kanji_html()
  to_hearing_html()
  to_immerse_html()
  to_grammar_html()
}

module.exports = {
  to_mean_say_html,
  to_meaning_html,
  to_kanji_html,
  html_from_templates
}
