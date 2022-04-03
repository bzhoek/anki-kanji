const clap = require('clap');
const {
  moveCards, strokeNotes, emphasizeNotes, updateStyling, downloadHtmlTemplates, uploadHtmlTemplates,
  configureJapaneseDecks, renderPortableNetworkGraphic
} = require('./lib')
const fs = require("fs");

let cli = clap.command('anki ')
  .description('Manipulate Anki decks, notes, cards. Queries like \n - note:OnKanji\n - deck:Karate')
cli.command('emphasize <query>')
  .description('Emphasize first sentence of field, delimited by period')
  .action(({_, args}) => emphasizeNotes(args[0]))
  .end()
cli.command('stroke <query>')
  .description('Add SVG strokes for all kanji of matched notes')
  .action(({_, args}) => strokeNotes(args[0]))
  .end()
cli.command('render <unicode>')
  .description('Write kanji to PNG file')
  .action(({_, args}) => renderPortableNetworkGraphic(args[0].charCodeAt(0)))
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
    let css = fs.readFileSync('anki.css').toString()
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