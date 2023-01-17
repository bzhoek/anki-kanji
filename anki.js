#!/usr/bin/env node
const clap = require('clap');
const sass = require('node-sass');
const fs = require("fs");

const {
  moveCards, strokeNotes, emphasizeNotes, updateStyling, downloadHtmlTemplates, uploadHtmlTemplates,
  configureJapaneseDecks, add_kanji_with_reading_and_meaning
} = require('./lib')

let cli = clap.command('anki ')
  .description(`Manipulate Anki decks, notes, cards. Queries https://docs.ankiweb.net/searching.html, like
   - note:OnKanj for all notes of types
   - deck:Karate for all notes in deck
   - nid:1656500001715 note with id`)
  .action(() => cli.outputHelp())
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
cli.command('kanji <kanji>')
  .description('Create a new note with reading and meaning')
  .action(({_, args}) => add_kanji_with_reading_and_meaning(args[0]))
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
