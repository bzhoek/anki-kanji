const {
  is_jukugo,
  is_kunyomi,
  convert_kunyomi_to_onyomi,
  has_kanji,
  find_kanji,
  multiple_kanji,
  missing_kanji, find_yomi, target_word
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
  test('find kanji', async () => {
    await target_word("格", "格好")
    let kanji = await find_kanji("格");
    let onyomi = await find_yomi("格好");
    expect(kanji).toEqual([1551038144631])
  });
  test('has kanji', () => {
    expect(has_kanji("食")).toBeTruthy()
  });
  test('missing kanji', () => {
    expect(has_kanji("叫")).toBeFalsy()
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

// https://gist.github.com/terrancesnyder/1345094
describe('reformat notes', () => {

  test('only kanji', () => {
    const string = "日本{{c1::の}}大学"
    const result = string.replaceAll(/[^一-龘ぁ-んァ-ン]/g, "")
    expect(result).toBe("日本の大学")
  })

  const regex = new RegExp("(<b>[\\w\\s]+</b>)\\s+([一-龘ぁ-んァ-ン\\u2E80-\\u2EFF])", 'gi')

  test('bold word followed by kanji', () => {
    const string = "Een behoorlijk <b>groot</b> 大 <b>deel</b> 分";
    const result = string.replaceAll(regex, "$1 <u>$2</u>")
    expect(result).toBe("Een behoorlijk <b>groot</b> <u>大</u> <b>deel</b> <u>分</u>")
  })

  test('bold word with space', () => {
    const string = "Een behoorlijk <b>groot deel</b> 大";
    const result = string.replaceAll(regex, "$1 <u>$2</u>")
    expect(result).toBe("Een behoorlijk <b>groot deel</b> <u>大</u>")
  })

  test('bold word with katakana', () => {
    const string = "In <b>neon</b> ネ licht";
    const result = string.replaceAll(regex, "$1 <u>$2</u>")
    expect(result).toBe("In <b>neon</b> <u>ネ</u> licht")
  })

  test('bold word with radical', () => {
    const string = "<b>weg</b> ⻌";
    const result = string.replaceAll(regex, "$1 <u>$2</u>")
    expect(result).toBe("<b>weg</b> <u>⻌</u>")
  })
})