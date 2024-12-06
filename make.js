const {Command} = require('commander');
const fs = require("fs");
const sqlite3 = require('sqlite3').verbose();
const Encoding = require('encoding-japanese');
const sax = require("sax");
const {parse_kanjidic} = require('./lib')

let cli = new Command()
cli.name('make')
cli.command('furigana')
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

cli.command('kanji')
  .argument('<edict>', 'EDICT file')
  .argument('<sqlite>', 'SQLite file to create')
  .description('Import EDICT to kanji SQLite')
  .action((edict, sqlite) => {
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
  .argument('<xml>', 'XML file')
  .argument('<sqlite>', 'SQLite file to create')
  .description('Import JMdict XML dictionary to SQLite')
  .action(async (source, sqlite) => {
    let db = new sqlite3.Database(sqlite)
    db.serialize(() => {
      db.run('CREATE TABLE jmdict (info JSON)');
      db.run('pragma synchronous = normal;');
      db.run('pragma journal_mode = wal;');
    });
    let insert = db.prepare('INSERT INTO jmdict VALUES(json(?))');
    let saxStream = sax.createStream(false)
    saxStream.on("error", function (e) {
      console.error("error!", e)
      this._parser.error = null
      this._parser.resume()
    })

    let entry = {};
    let field = undefined;
    saxStream.on('opentag', function (node) {
      if (node.name === 'ENTRY') {
        entry = {}
      }
      if (node.name === 'KEB' && entry['keb'] === undefined) {
        field = 'keb'
      }
      if (node.name === 'KE_PRI') {
        field = 'freq'
      }
      if (node.name === 'REB' && entry['reb'] === undefined) {
        field = 'reb'
      }
      if (node.name === 'GLOSS' && entry['gloss'] === undefined) {
        field = 'gloss'
      }
      if (node.name === 'POS' && entry['pos'] === undefined) {
        field = 'pos'
      }
    });

    saxStream.on('text', function (text) {
      if (field === 'freq') {
        if (text.startsWith('nf')) {
          entry.freq_nf = text
        }
        if (text.startsWith('ichi')) {
          entry.freq_1m = text
        }
        field = undefined
        return
      }
      if (field !== undefined && entry[field] === undefined) {
        entry[field] = text
        field = undefined
      }
    });

    saxStream.on('closetag', function (name) {
      if (name === 'ENTRY' && entry.freq_1m === 'ichi1') {
        insert.run(JSON.stringify(entry));
      }
    });

    let pipes = new Promise(((resolve) => {
      saxStream.on('end', () => {
        resolve()
      })
      fs.createReadStream(source)
        .pipe(saxStream)
    }))

    await Promise.all([pipes]).then(() => {
        console.log("done")
      }
    )
  })

cli.parse()
