const {
  is_katakana,
  is_hiragana,
  parse_kanjidic,
  extract_parts_from_kanji
} = require('./lib')

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

describe('kanjivg', () => {
  test('告 to unicode', () => {
    let unicode = '告'.charCodeAt(0)
    expect(21578).toEqual(unicode)
  })
  test('告 components', () => {
    let unicode = '告'.charCodeAt(0)
    let elements = extract_parts_from_kanji(unicode);
    expect(['牛', '口']).toEqual(elements)
  })
  test('戦 components', () => {
    let unicode = '戦'.charCodeAt(0)
    let elements = extract_parts_from_kanji(unicode);
    expect(['単', '⺍', '甲', '戈']).toEqual(elements)
  })
})