const {Command} = require('commander');
const fs = require("fs");
const Encoding = require("encoding-japanese");
const sqlite3 = require('sqlite3').verbose();
const {parse_kanjidic} = require('./lib')

let cli = new Command()
cli.name('make')
cli.command('furijson')
  .argument('<json>', 'Furigana JSON file')
  .argument('<sqlite>', 'SQLite file to create')
  .description('Import JSON to furigana SQLite')
  .action((file, sqlite) => {
    let db = new sqlite3.Database(sqlite)
    db.serialize(() => {
      db.run('CREATE TABLE furigana (info JSON)');
      db.run('pragma synchronous = normal;');
      db.run('pragma journal_mode = wal;');
    });
    let insert = db.prepare('INSERT INTO furigana VALUES(json(?))');
    let data = fs.readFileSync(file, "utf8")
    const json = eval(data)
    json.forEach(line => {
      insert.run(JSON.stringify(line));
    });
    insert.finalize();
  })

cli.command('furiidx')
  .argument('<json>', 'Furigana JSON file')
  .argument('<sqlite>', 'SQLite file to create')
  .description('Import JSON to furigana SQLite')
  .action((file, sqlite) => {
    let db = new sqlite3.Database(sqlite)
    db.serialize(() => {
      db.exec(`
          CREATE TABLE words
          (
              word_id INTEGER PRIMARY KEY AUTOINCREMENT,
              word    TEXT,
              reading TEXT
          );
          CREATE TABLE rubies
          (
              word_id INTEGER,
              ruby    TEXT,
              rt      TEXT,
              FOREIGN KEY (word_id) REFERENCES words (word_id) ON DELETE CASCADE ON UPDATE NO ACTION
          );
          CREATE INDEX idx_ruby_word_id ON rubies (word_id);
          CREATE INDEX idx_words_word ON words (word);
      `);
      db.run('pragma synchronous = normal;');
      db.run('pragma journal_mode = wal;');
    });
    let insert_furigana = db.prepare('INSERT INTO words VALUES(?, ?, ?)');
    let insert_rubies = db.prepare('INSERT INTO rubies VALUES(?, ?, ?)');
    let data = fs.readFileSync(file, "utf8")
    const json = eval(data)
    json.forEach((line, index) => {
      // insert_furigana.run(line.text, JSON.stringify(line.furigana));
      insert_furigana.run(index, line.text, line.reading);
      line.furigana.forEach(ruby => {
        insert_rubies.run(index, ruby.ruby, ruby.rt);
      });
    })
    insert_furigana.finalize();
  })

cli.command('kanji')
  .argument('<edict>', 'EDICT file')
  .argument('<sqlite>', 'SQLite file to create')
  .description('Import EDICT to kanji SQLite')
  .action((edict, sqlite) => {
    const Encoding = require('encoding-japanese');
    const buffer = fs.readFileSync(edict);
    const unicodeArray = Encoding.convert(buffer, {
      to: 'UNICODE', from: 'EUCJP'
    });

    let decoded = Encoding.codeToString(unicodeArray);
    let db = new sqlite3.Database(sqlite)
    db.serialize(() => {
      db.run('CREATE TABLE kanji (info JSON)');
      db.run('pragma synchronous = normal;');
      db.run('pragma journal_mode = wal;');
    });
    let insert = db.prepare('INSERT INTO kanji VALUES(json(?))');
    decoded
      .split('\n')
      .filter(line => line.length > 0 && !line.startsWith('#'))
      .forEach(line => {
        insert.run(JSON.stringify(parse_kanjidic(line)));
      });
    insert.finalize();
  })

cli.command('dict')
  .argument('<edict>', 'EDICT file')
  .argument('<sqlite>', 'SQLite file to create')
  .description('Import EDICT to kanji SQLite')
  .action((edict, sqlite) => {
    const Encoding = require('encoding-japanese');
    const buffer = fs.readFileSync(edict);
    const unicodeArray = Encoding.convert(buffer, {
      to: 'UNICODE', from: 'EUCJP'
    });

    let decoded = Encoding.codeToString(unicodeArray);
    let db = new sqlite3.Database(sqlite)
    db.serialize(() => {
      db.run('CREATE TABLE kanji (kanji_id INTEGER PRIMARY KEY, word TEXT, meanings TEXT, onyomi TEXT, kunyomi TEXT, jlpt TEXT, grade TEXT, frequency TEXT)');
      db.run('pragma synchronous = normal;');
      db.run('pragma journal_mode = wal;');
    });
    let insert = db.prepare('INSERT INTO kanji VALUES(json(?))');
    decoded
      .split('\n')
      .filter(line => line.length > 0 && !line.startsWith('#'))
      .forEach(line => {
        insert.run(JSON.stringify(parse_kanjidic(line)));
      });
    insert.finalize();
  })

cli.parse()
