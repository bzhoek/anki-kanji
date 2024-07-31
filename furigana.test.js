const sqlite3 = require('sqlite3').verbose();
const {get_furigana, furigana_html, un_furigana} = require("./furigana");

const db = new sqlite3.Database('jmdictfurigana.sqlite');

describe('furigana', () => {

  test('html', async () => {
    let result = await furigana_html('正直')
    expect(result).toEqual("<ruby>正<rt>しょう</rt>直<rt>じき</rt></ruby>")
  })

  test('html 楽しい', async () => {
    let result = await furigana_html('楽しい')
    expect(result).toEqual("<ruby>楽<rt>たの</rt>しい</ruby>")
  })

  test('plain', async () => {
    let result = await furigana_html('hello')
    expect(result).toEqual("<ruby>hello</ruby>")
  })

  test('query', async () => {
    let result = await get_furigana('正直')
    expect(result).toStrictEqual([{ruby: '正', rt: 'しょう'}, {ruby: '直', rt: 'じき'}])
  })

  test('query 楽しい', async () => {
    let result = await get_furigana('楽しい')
    expect(result).toStrictEqual([{ruby: '楽', rt: 'たの'}, {ruby: 'しい'}])
  })

  test('undo 正直', () => {
    let result = un_furigana("<ruby>正<rt>しょう</rt>直<rt>じき</rt></ruby>")
    expect(result).toEqual("正直")
  })

  test('undo 楽しい', async () => {
    let result = await un_furigana("<ruby>楽<rt>たの</rt>しい</ruby>")
    expect(result).toEqual("楽しい")
  })

  test('undo plain', async () => {
    let result = await un_furigana("楽しい")
    expect(result).toEqual("楽しい")
  })

});

describe('database', () => {

  test('create', () => {
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

  test('query', done => {
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

})