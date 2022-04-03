const cli = require('clap');
const {moveCards, strokeNotes} = require('./lib')

cli.command('anki ')
  .description('Manipulate Anki decks, notes, cards')
  .command('stroke <query>')
  .description('Add SVG strokes for all kanji for matched notes')
  .action(({options, args, literalArgs}) => strokeNotes(args[0]))
  .end()
  .command('sort')
  .description('Move different cards to different decks')
  .action(({options, args, literalArgs}) => {
    moveCards('card:ToKanji note:OnKanji', '日本語::漢字')
    moveCards('card:ToOnYomi note:OnKanji', '日本語::音読み')
    moveCards('card:ToKunYomi note:OnKanji', '日本語::訓読み')
    moveCards('card:KunKana note:Kunyomi', '日本語::かな')
    moveCards('card:ToHiragana note:Hiragana', '日本語::かな')
    moveCards('card:ToKatakana note:Katakana', '日本語::かな')
    moveCards('card:Jukugo note:Kunyomi', '日本語::熟語')
  })
  .end()
  .run()