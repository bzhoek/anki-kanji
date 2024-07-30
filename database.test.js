const sqlite3 = require('sqlite3').verbose();
const get_furigana = require("./database");

const db = new sqlite3.Database('jmdictfurigana.sqlite');

describe('jmdictfurigana', () => {
  test('create database', () => {
    db.serialize(() => {
      db.run('CREATE TABLE furigana (info JSON)');
    });
  });

  test('import file', () => {
    let insert = db.prepare('INSERT INTO furigana VALUES(json(?))');
    const json = require('/Users/bas/Downloads/JmdictFurigana.json');
    json.forEach(line => {
      insert.run(JSON.stringify(line));
    });
    insert.finalize();
  });

  test('query database', done => {
    db.get(`SELECT info
            FROM furigana
            WHERE json_extract(info, '$.text') = ?`, ['正直'], (err, row) => {
      if (err) {
        throw err
      }
      console.log(row)
      done();
    })
  });

  test('query function', async () => {
    let result = await get_furigana('正直')
    expect(result).toStrictEqual([{ruby: '正', rt: 'しょう'}, {ruby: '直', rt: 'じき'}])
  })
});
