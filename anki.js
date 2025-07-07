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
  target_word, clean_notes, mirror_notes, furigana_notes, retarget_notes, notes_target_to_hint, hint6k_notes,
  move_field, copy_context, raw_svg, kun_notes, show_stats, add_tts
} = require('./lib')
const {
  html_from_templates
} = require("./templates");
const {tts} = require("./tts");

let cli = new Command()
cli.name('anki')
  .description(`  Manipulate Anki decks, notes, and cards with queries; like https://docs.ankiweb.net/searching.html:

   - 'note:OnKanj' match all notes of type 'OnKanj'
   - 'deck:Karate' match everything in deck 'Karate'
   - 'nid:1656500001715' pick note with identifier '1656500001715'`)

cli.command('hint6k')
  .argument('<query>', 'query')
  .description('Add hints from 6K deck')
  .action((query) => hint6k_notes(query))

cli.command('retarget')
  .argument('<query>', 'query')
  .description('Make target field rubified')
  .action((query) => retarget_notes(query))

cli.command('furigana')
  .argument('<query>', 'query')
  .description('Add furigana to kanji')
  .action((query) => furigana_notes(query))

cli.command('clean')
  .argument('<query>', 'query')
  .description('Remove &nbsp; from fields')
  .action((query) => clean_notes(query + " &nbsp;"))

cli.command('collect')
  .argument('<query>', 'query')
  .description('Move all related cards to the Inbox deck')
  .action((query) => move_related(query))

cli.command('copy')
  .argument('<source>', 'source note id')
  .argument('<target>', 'target note id')
  .description('Copy context from source to target')
  .action((source, target) => copy_context(source, target))

cli.command('kana')
  .argument('<query>', 'query')
  .description("Convert kana for jukugo words to on'yomi")
  .action((query) => convert_kana_field_to_onyomi(query))

cli.command('kun')
  .argument('<query>', 'query')
  .description("Extract kun from kanji to separate card")
  .action((query) => kun_notes(query))

cli.command('mirror')
  .argument('<query>', 'query')
  .description('Mirror matching notes')
  .action((query) => mirror_notes(query))

cli.command('move')
  .argument('<query>', 'query')
  .argument('<deck>', 'deck')
  .description('Move matching cards to a given deck')
  .action((query, deck) => move_cards(query, deck))

cli.command('moveField')
  .argument('<query>', 'query')
  .argument('<source>', 'source field')
  .argument('<target>', 'target field')
  .description('Move contents of fields')
  .action((query, source, target) => move_field(query, source, target))

cli.command('lapse')
  .argument('<count>', 'count')
  .description('Find lapsed kanji without vocab')
  .action((count) => lapse_cards(count))

cli.command('stats')
  .description('Find lapsed kanji without vocab')
  .action(() => show_stats())

cli.command('emphasize')
  .argument('<query>', 'query')
  .description('Emphasize first sentence of field, delimited by period')
  .action((query) => emphasize_notes(query))

cli.command('hint')
  .argument('<query>', 'query')
  .description('Add hints based on target')
  .action((query) => notes_target_to_hint(query))

cli.command('stroke')
  .argument('<query>', 'query')
  .description('Add SVG strokes for all kanji of matched notes')
  .action((query) => stroke_notes(query))

cli.command('svg')
  .argument('<kanji>', 'kanji')
  .argument('<output>', 'kanji')
  .description('Show SVG for kanji')
  .action(async (kanji, output) => await raw_svg(kanji, output))

cli.command('speech')
  .argument('<query>', 'query')
  .description('Add speech for matched notes')
  .action((query) => add_speech(query))

cli.command('tts')
  .argument('<query>', 'query')
  .description('Text-to-speech from target to context')
  .action((query) => add_tts(query))

cli.command('lookup')
  .argument('<kanji>', 'kanji')
  .description('Lookup kanji unicode meaning')
  .action((kanji) =>
    exec(`open https://kanjivg.tagaini.net/viewer.html?kanji=${kanji}`))

cli.command('kanji')
  .option("--kun", "Create as kun'yomi note")
  .argument('<kanji>', 'kanji')
  .description('Create a new note with reading and meaning')
  .action((kanji, options) => {
    add_kanji_with_reading_and_meaning(kanji, options.kun ? 'kun' : 'kan')
  })

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