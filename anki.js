#!/usr/bin/env node
const clap = require('clap');
const sass = require('node-sass');
const fs = require("fs");

const {
  moveCards, strokeNotes, emphasizeNotes, updateStyling, downloadHtmlTemplates, uploadHtmlTemplates,
  configureJapaneseDecks, add_kanji_with_reading_and_meaning, fix_kana, missing_kanji, move_related,
  lookup_kanji
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
  .action(({_, args}) => moveCards(args[0], args[1]))
  .end()
cli.command('emphasize <query>')
  .description('Emphasize first sentence of field, delimited by period')
  .action(({_, args}) => emphasizeNotes(args[0]))
  .end()
cli.command('stroke <query>')
  .description('Add SVG strokes for all kanji of matched notes')
  .action(({_, args}) => strokeNotes(args[0]))
  .end()
cli.command('lookup <kanji>')
  .description('Lookup kanji unicode meaning')
  .action(({_, args}) => lookup_kanji(args[0]))
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
  .action(() => configureJapaneseDecks())
  .end()
cli.command('download')
  .description('Download card templates to html folder')
  .action(() => downloadHtmlTemplates())
  .end()
cli.command('upload')
  .description('Update card templates from html folder')
  .action(() => uploadHtmlTemplates())
  .end()
cli.command('restyle')
  .description('Reapply anki.css stylesheet to all notes')
  .action(() => {
    const css = sass.renderSync({
      file: 'anki.sass',
    }).css.toString()
    updateStyling(css)
  })
  .end()
cli.command('sort')
  .description('Move different cards to different decks')
  .action(() => {
    moveCards('card:ToKanji note:OnKanji', '日本語::漢字')
    moveCards('card:ToOnYomi note:OnKanji', '日本語::音読み')
    moveCards('card:ToKunYomi note:OnKanji', '日本語::訓読み')
    moveCards('card:KunKana note:Kunyomi', '日本語::かな')
    moveCards('card:ToHiragana note:Hiragana', '日本語::かな')
    moveCards('card:ToKatakana note:Katakana', '日本語::かな')
    moveCards('card:Jukugo note:Kunyomi', '日本語::熟語')
  })
  .end()
cli.run()