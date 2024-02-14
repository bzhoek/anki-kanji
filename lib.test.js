const {
  is_jukugo,
  is_kunyomi,
  convert_kunyomi_to_onyomi,
  find_kanji,
  multiple_kanji,
  missing_kanji
} = require('./lib')

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