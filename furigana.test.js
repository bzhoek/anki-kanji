const sqlite3 = require('sqlite3').verbose();
const {get_furigana, furigana_html, un_furigana, target_clean, ruby_target, markup_ruby_html} = require("./furigana");
const {jest_test_name} = require("./util");

describe('furigana/', () => {

  test('[楽](たの)[しい]', async () => {
    let result = await markup_ruby_html(jest_test_name())
    expect(result).toEqual("<ruby>楽<rt>たの</rt></ruby><ruby>しい</ruby>")
  })

  test('児童 <i>(ジドウ kinderen)</i>', async () => {
    let result = await ruby_target(jest_test_name())
    expect(result).toEqual(`<ruby>児<rt>じ</rt></ruby><ruby>童<rt>どう</rt></ruby><i>kinderen</i>`)
  })

  describe('html/', () => {
    test('正直', async () => {
      let result = await furigana_html(jest_test_name())
      expect(result).toEqual("<ruby>正<rt>しょう</rt></ruby><ruby>直<rt>じき</rt></ruby>")
    })

    test('楽しい', async () => {
      let result = await furigana_html(jest_test_name())
      expect(result).toEqual("<ruby>楽<rt>たの</rt></ruby><ruby>しい</ruby>")
    })

    test('plain', async () => {
      let result = await furigana_html(jest_test_name())
      expect(result).toEqual("<ruby>plain</ruby>")
    })
    test('ゴミ箱', async () => {
      let result = await furigana_html(jest_test_name())
      expect(result).toEqual("<ruby>ゴミ</ruby><ruby>箱<rt>ばこ</rt></ruby>")
    })
  })

  describe('undo/', () => {
    test('正直', () => {
      let result = un_furigana("<ruby>正<rt>しょう</rt>直<rt>じき</rt></ruby>")
      expect(result).toEqual("正直")
    })

    test('楽しい', async () => {
      let result = await un_furigana("<ruby>楽<rt>たの</rt>しい</ruby>")
      expect(result).toEqual("楽しい")
    })

    test('plain', async () => {
      let result = await un_furigana("楽しい")
      expect(result).toEqual("楽しい")
    })
  })

  describe('query/', () => {
    test('query', async () => {
      let result = await get_furigana('正直')
      expect(result).toStrictEqual([{ruby: '正', rt: 'しょう'}, {ruby: '直', rt: 'じき'}])
    })

    test('katakana', async () => {
      let result = await get_furigana('ゴミ箱')
      expect(result).toStrictEqual([{ruby: 'ゴミ'}, {ruby: '箱', rt: 'ばこ'}])
    })

    test('query 楽しい', async () => {
      let result = await get_furigana('楽しい')
      expect(result).toStrictEqual([{ruby: '楽', rt: 'たの'}, {ruby: 'しい'}])
    })
  })

});

describe('database', () => {

  const db = new sqlite3.Database('jmdictfurigana.sqlite');

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