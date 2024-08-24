const sqlite3 = require('sqlite3').verbose();
const {
  get_furigana,
  furigana_html,
  un_furigana,
  target_clean,
  ruby_target,
  markup_ruby_html,
  ruby_target_result
} = require("./furigana");
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

  describe('target/', () => {
    test('児童 <i>(ジドウ kinderen)</i>', async () => {
      let result = await ruby_target_result(jest_test_name())
      expect(result).toEqual(["児童", "<ruby>児<rt>じ</rt></ruby><ruby>童<rt>どう</rt></ruby>", "kinderen"])
    })
    test('伝染 <i>(デンセン besmetting)</i>', async () => {
      let result = await ruby_target_result(jest_test_name())
      expect(result).toEqual(["伝染", "<ruby>伝<rt>でん</rt></ruby><ruby>染<rt>せん</rt></ruby>", "besmetting"])
    })
    test('告白<i> (コクハク bekentenis)</i>', async () => {
      let result = await ruby_target_result(jest_test_name())
      expect(result).toEqual(["告白", "<ruby>告<rt>こく</rt></ruby><ruby>白<rt>はく</rt></ruby>", "bekentenis"])
    })
    test('地下鉄 <i>(チカテツ. metro)</i>', async () => {
      let result = await ruby_target_result(jest_test_name())
      expect(result).toEqual(["地下鉄", "<ruby>地<rt>ち</rt></ruby><ruby>下<rt>か</rt></ruby><ruby>鉄<rt>てつ</rt></ruby>", "metro"])
    })
  })

  describe('html/', () => {
    test('景色', async () => {
      let result = await furigana_html(jest_test_name())
      expect(result).toEqual("<ruby>景色<rt>けしき</rt></ruby>")
    })

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
    test('try', async () => {
      let kanji = '前屈立'
      let prefix = kanji
      let suffix = ''
      let prefix_result = []
      let suffix_result = []
      while (prefix_result.length === 0 && kanji.length > 0) {
        suffix = kanji.slice(prefix.length)
        prefix_result = await get_furigana(prefix)
        suffix_result = await get_furigana(suffix)
        prefix = prefix.slice(0, -1)
      }

      if (suffix_result.length === 0) {
        suffix_result = [{ruby: suffix}]
      }

      expect(prefix_result).toStrictEqual([{ruby: '前', rt: 'ぜん'}, {ruby: '屈', rt: 'くつ'}])
      expect(suffix_result).toStrictEqual([{ruby: '立'}])
    })

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