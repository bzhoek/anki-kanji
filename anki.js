#!/usr/bin/env node
const clap = require('clap');
const sass = require('node-sass');
const {exec} = require('child_process');

const {
  move_cards, stroke_notes, emphasize_notes, update_styling, download_html_templates, upload_html_templates,
  configure_decks, lapse_cards,
  add_kanji_with_reading_and_meaning, add_speech, fix_kana, missing_kanji, move_related, lookup_kanji
} = require('./lib')

let cli = clap.command('anki ')
  .description(`Manipulate Anki decks, notes, cards. Queries https://docs.ankiweb.net/searching.html, like
   - note:OnKanj for all notes of types
   - deck:Karate for all notes in deck
   - nid:1656500001715 note with id`)
  .action(() => cli.outputHelp())
cli.command('default <query>')
  .description('Move all related cards to the Default deck')
  .action(({_, args}) => move_related(args[0]))
  .end()
cli.command('kana <query>')
  .description('Fix kana for jukugo words')
  .action(({_, args}) => fix_kana(args[0]))
  .end()
cli.command('move <query> <deck>')
  .description('Move matching cards to a given deck')
  .action(({_, args}) => move_cards(args[0], args[1]))
  .end()
cli.command('lapse <count>')
  .description('Find lapsed kanji without vocab')
  .action(({_, args}) => lapse_cards(args[0]))
  .end()
cli.command('emphasize <query>')
  .description('Emphasize first sentence of field, delimited by period')
  .action(({_, args}) => emphasize_notes(args[0]))
  .end()
cli.command('stroke <query>')
  .description('Add SVG strokes for all kanji of matched notes')
  .action(({_, args}) => stroke_notes(args[0]))
  .end()
cli.command('speech <query>')
  .description('Add speech for matched notes')
  .action(({_, args}) => add_speech(args[0]))
  .end()
cli.command('lookup <kanji>')
  .description('Lookup kanji unicode meaning')
  .action(({_, args}) => {
    lookup_kanji(args[0])
    exec(`open https://kanjivg.tagaini.net/viewer.html?kanji=${args[0]}`)
  })
  .end()
cli.command('kanji <kanji>')
  .description('Create a new note with reading and meaning')
  .action(({_, args}) => add_kanji_with_reading_and_meaning(args[0]))
  .end()
cli.command('exist <kanji>')
  .description('Checks if kanji exist')
  .action(async ({_, args}) => {
    let result = await Promise.all(missing_kanji(args[0]))
    for (const kanji of result.filter(v => v)) {
      add_kanji_with_reading_and_meaning(kanji)
    }
  })
  .end()
cli.command('configure')
  .description('Create separate configuration for each deck')
  .action(() => configure_decks())
  .end()
cli.command('download')
  .description('Download card templates to html folder')
  .action(() => download_html_templates())
  .end()
cli.command('upload')
  .description('Update card templates from html folder')
  .action(() => upload_html_templates())
  .end()
cli.command('restyle')
  .description('Reapply anki.css stylesheet to all notes')
  .action(() => {
    const css = sass.renderSync({
      file: 'anki.sass',
    }).css.toString()
    update_styling(css)
  })
  .end()
cli.run()