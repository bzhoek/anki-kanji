#!/usr/bin/env node
const {Command} = require('commander');
const sass = require('node-sass');
const {exec} = require('child_process');

const {
  move_cards, stroke_notes,
  emphasize_notes,
  update_styling,
  download_html_templates,
  upload_html_templates,
  configure_decks, lapse_cards,
  add_kanji_with_reading_and_meaning,
  add_speech,
  convert_kana_field_to_onyomi,
  missing_kanji,
  move_related,
  show_parts_of_kanji,
  target_word
} = require('./lib')
const {
  html_from_templates
} = require("./templates");

let cli = new Command()
cli.name('anki')
  .description(`  Manipulate Anki decks, notes, and cards with queries; like https://docs.ankiweb.net/searching.html:

   - 'note:OnKanj' match all notes of type 'OnKanj'
   - 'deck:Karate' match everything in deck 'Karate'
   - 'nid:1656500001715' pick note with identifier '1656500001715'`)

cli.command('collect')
  .argument('<query>', 'query')
  .description('Move all related cards to the Inbox deck')
  .action((query) => move_related(query))

cli.command('kana')
  .argument('<query>', 'query')
  .description("Convert kana for jukugo words to on'yomi")
  .action((query) => convert_kana_field_to_onyomi(query))

cli.command('move')
  .argument('<query>', 'query')
  .argument('<deck>', 'deck')
  .description('Move matching cards to a given deck')
  .action((query, deck) => move_cards(query, deck))

cli.command('lapse')
  .argument('<count>', 'count')
  .description('Find lapsed kanji without vocab')
  .action((count) => lapse_cards(count))

cli.command('emphasize')
  .argument('<query>', 'query')
  .description('Emphasize first sentence of field, delimited by period')
  .action((query) => emphasize_notes(query))

cli.command('stroke')
  .argument('<query>', 'query')
  .description('Add SVG strokes for all kanji of matched notes')
  .action((query) => stroke_notes(query))

cli.command('speech')
  .argument('<query>', 'query')
  .description('Add speech for matched notes')
  .action((query) => add_speech(query))

cli.command('lookup')
  .argument('<kanji>', 'kanji')
  .description('Lookup kanji unicode meaning')
  .action((kanji) =>
    exec(`open https://kanjivg.tagaini.net/viewer.html?kanji=${kanji}`))

cli.command('kanji')
  .argument('<kanji>', 'kanji')
  .description('Create a new note with reading and meaning')
  .action((kanji) =>
    add_kanji_with_reading_and_meaning(kanji))

cli.command('parts')
  .argument('<kanji>', 'kanji')
  .description('Show parts of kanji')
  .action((kanji) => show_parts_of_kanji(kanji))

cli.command('target')
  .argument('<kanji>', 'kanji')
  .argument('<word>', 'word')
  .description('Target word for kanji')
  .action((kanji, word) => target_word(kanji, word))

cli.command('exist')
  .argument('<kanji>', 'kanji')
  .description('Checks if kanji exist')
  .action(async (kanji) => {
    let result = await Promise.all(missing_kanji(kanji))
    for (const kanji of result.filter(v => v)) {
      add_kanji_with_reading_and_meaning(kanji)
    }
  })

cli.command('configure')
  .description('Create separate configuration for each deck')
  .action(() => configure_decks())

cli.command('download')
  .description('Download card templates to html folder')
  .action(() => download_html_templates())

cli.command('upload')
  .description('Update card templates from html folder')
  .action(() => upload_html_templates())

cli.command('restyle')
  .description('Reapply anki.css stylesheet to all notes')
  .action(() => {
    const css = sass.renderSync({
      file: 'anki.sass',
    }).css.toString()
    update_styling(css)
  })

cli.command('template')
  .description('Generate card templates from pug files')
  .action(() => {
    html_from_templates()
  })

cli.parse()