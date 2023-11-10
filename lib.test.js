const {
  is_jukugo,
  is_kunyomi,
  to_onyomi,
  find_kanji,
  multiple_kanji,
  missing_kanji,
  write_html
} = require('./lib')
// ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎ

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

describe('transpose onyomi', () => {
  test('ending', () => {
    expect(to_onyomi("食べて")).toBe("食ベテ")
  });
  test('n', () => {
    expect(to_onyomi("いん")).toBe("イン")
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

const pug = require('pug');

describe('templates', () => {
  test('has kanji', () => {
    const back_template = pug.compileFile('template.back.pug');
    const front_template = pug.compileFile('template.front.pug');
    const meanings = (ary) => ary.map(text => `&equals; ${text} &equals;`)
    let jukugo = meanings(['熟語', 'じゅくご']);
    let suru = meanings(['V']);

    let fronts = [
      {name: 'Godan', grammar: meanings(['終止形', 'しゅうしけい'])},
      {name: 'Ichidan', grammar: meanings(['終止形', 'しゅうしけい'])},
      {name: 'Onyomi', grammar: jukugo},
      {name: 'Kunyomi', grammar: jukugo},
      {name: 'Suru', grammar: suru}
    ].map(meaning => Object.assign(meaning, {
      color: 'magenta',
      mode: 'tomeaning',
      name: `${meaning.name}.ToMeaning.Front`
    }))

    let backs = [
      {name: 'Godan', grammar: meanings(['五段活用']),},
      {name: 'Ichidan', grammar: meanings(['一段活用']),},
      {name: 'Onyomi', grammar: jukugo},
      {name: 'Kunyomi', grammar: jukugo},
      {name: 'Suru', grammar: suru,},
    ].map(meaning => Object.assign(meaning, {
      color: 'magenta',
      mode: 'tomeaning',
      name: `${meaning.name}.ToMeaning.Back`
    }))

    write_html(backs, back_template);
    write_html(fronts, front_template);

    let result = front_template(fronts[0])
    expect(result).toBe('<main class="magenta tomeaning front">\n' +
      '{{#kanji}}<h1 class="title">{{kanji}}</h1><h2>&equals; 終止形 &equals;</h2>{{/kanji}}\n' +
      '{{^kanji}}<h1 class="title">{{kana}}</h1><h2>&equals; しゅうしけい &equals;</h2>{{/kanji}}</main>')
  });
})
