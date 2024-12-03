const {Command} = require('commander');
const fs = require("fs");
const sqlite3 = require('sqlite3').verbose();
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
    });
    let insert = db.prepare('INSERT INTO furigana VALUES(json(?))');
    let data = fs.readFileSync(file, "utf8")
    const json = eval(data)
    json.forEach(line => {
      insert.run(JSON.stringify(line));
    });
    insert.finalize();
  })
cli.parse()
