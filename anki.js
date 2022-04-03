const cli = require('clap');
const {strokeNotes} = require('./lib')

cli.command('anki ')
  .description('Manipulate Anki decks, notes, cards')
  .command('stroke <query>')
  .description('Add SVG strokes for all kanji for matched notes')
  .action(({options, args, literalArgs}) => strokeNotes(args[0]))
  .end()
  .run()