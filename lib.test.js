const {
  is_jukugo,
  is_kunyomi,
  convert_kunyomi_to_onyomi,
  find_kanji,
  multiple_kanji,
  missing_kanji,
  is_katakana,
  is_hiragana,
  parse_kanjidic
} = require('./lib')

describe('euc-jp encoding', () => {
  test('import file', () => {
    const fs = require('fs');
    const Encoding = require('encoding-japanese');
    const buffer = fs.readFileSync('/Users/bvanderhoek/Downloads/kanjidic');
    const unicodeArray = Encoding.convert(buffer, {
      to: 'UNICODE', from: 'EUCJP'
    });

    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('kanjson.sqlite');
    // db.run('CREATE TABLE kanjidic (info JSON)');
    let insert = db.prepare('INSERT INTO kanjidic VALUES(json(?))');

    let decoded = Encoding.codeToString(unicodeArray);
    // fs.writeFileSync("kanjidic.txt", decoded)
    // console.log(decoded)
    decoded
      .split('\n')
      .filter(line => line.length > 0 && !line.startsWith('#'))
      .forEach(line => {
        insert.run(JSON.stringify(parse_kanjidic(line)));
      });

    insert.finalize();
  });
})
describe('sqlite json', () => {
  test('create database', () => {
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('kanjson.sqlite');
    db.serialize(() => {
      db.run('CREATE TABLE kanjidic (info JSON)');
    });
  });
})

describe('kanjidic', () => {
  test('single line', () => {
    const line = '亜 3021 U4e9c B1 C7 G8 S7 XJ05033 F1509 J1 N43 V81 H3540 DP4354 DK2204 DL2966 L1809 DN1950 K1331 O525 DO1788 MN272 MP1.0525 E997 IN1616 DA1724 DF1032 DT1092 DJ1818 DG35 DM1827 P4-7-1 I0a7.14 Q1010.6 DR3273 Yya4 Wa ア つ.ぐ T1 や つぎ つぐ {Asia} {rank next} {come after} {-ous}'
    // B/C Radical
    // U   Unicode
    // F   Frequency
    // G   Grade 1-8 school, 9-10 names
    // J   JLPT 1-5
    // DN  Remembering the Kanji
    // {meaning}

    let meanings = line.split("{");
    let tokens = meanings.shift().split(" ");
    let kanji = tokens[0]
    let unicode = parseInt(tokens[2].substring(1), 16)
    const hiragana = tokens.filter(str => is_hiragana(str.charAt(0)))
    const katakana = tokens.filter(str => is_katakana(str.charAt(0)))
    console.log(kanji, unicode, meanings.map(str => str.replace('}', '').trim()), katakana, hiragana)
    console.log(parse_kanjidic(line))
  });
})

describe('jukugo', () => {
  test('single', () => {
    expect(is_jukugo("食")).toBeFalsy()
  });
  test('html', () => {
    expect(is_jukugo("<b>食</b>")).toBeFalsy()
  });
  test('delimited', () => {
    expect(is_jukugo("食.")).toBeFalsy()
  });
  test('okurikana', () => {
    expect(is_jukugo("食べて")).toBeFalsy()
  });
  test('double', () => {
    expect(is_jukugo("運命")).toBeTruthy()
  });
  test('ending', () => {
    expect(is_jukugo("運転する")).toBeTruthy()
  });
  test('sentence', () => {
    expect(is_jukugo("来る. De RUs komt")).toBeFalsy()
  });
})

describe('kunyomi reading', () => {
  test('single', () => {
    expect(is_kunyomi("食")).toBeTruthy()
  });
  test('double', () => {
    expect(is_kunyomi("運命")).toBeFalsy()
  });
  test('ending', () => {
    expect(is_kunyomi("食べて")).toBeTruthy()
  });
})

describe('convert kunyomi to onyomi', () => {
  test('ending', () => {
    expect(convert_kunyomi_to_onyomi("食べて")).toBe("食ベテ")
  });
  test('embedded', () => {
    expect(convert_kunyomi_to_onyomi("涼風 <i>(りょうふう)</i>")).toBe("涼風 <i>(リョウフウ)</i>")
  });
  test('n', () => {
    expect(convert_kunyomi_to_onyomi("いん")).toBe("イン")
  });
  test('functional', () => {
    let it = Array.from("べて")
      .map(c => String.fromCharCode(c.charCodeAt(0) + 96))
      .join('')
    expect(it).toBe("ベテ")
  })
})

let n5_sample = `
一\t二\t三\t四\t五\t六\t七\t八\t九\t十\t人\t今\t日
`

describe('multiple kanji', () => {
  test('has kanji', () => {
    expect(find_kanji("食")).toBeTruthy()
  });
  test('missing kanji', async () => {
    expect(await find_kanji("叫")).toBeFalsy()
  });
  test('multiple kanji', () => {
    expect(multiple_kanji(n5_sample)).toStrictEqual(["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "人", "今", "日"])
  });
  test('has kanjis', async () => {
    let result = await Promise.all(missing_kanji(n5_sample))
    expect(result.filter(v => v)).toStrictEqual([])
  });
  test('missing kanjis', async () => {
    let result = await Promise.all(missing_kanji("汗\t危\t宇\t灰\t仮\t叫\t机\t吸\t舟\t宅\t存\t忙\t灯"))
    expect(result.filter(v => v)).toStrictEqual(["汗", "宇", "仮", "叫", "吸", "舟", "存", "灯"])
  });
})