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

describe('templates', () => {
  test('reading', () => {
    const meanings = (ary) => ary.map(text => `&equals; ${text} &equals;`)
    let jukugo = meanings(['熟語', 'じゅくご']);
    let suru = meanings(['V']);

    let dictionary = meanings(['終止形', 'しゅうしけい']);
    let fronts = [
      {name: 'Godan', grammar: dictionary},
      {name: 'Ichidan', grammar: dictionary},
      {name: 'Onyomi', grammar: jukugo},
      {name: 'Kunyomi', grammar: jukugo},
      {name: 'Suru', grammar: suru}
    ].map(meaning => Object.assign(meaning, {
      color: 'magenta',
      mode: 'reading'
    }))

    let backs = [
      {name: 'Godan', grammar: meanings(['五段活用']),},
      {name: 'Ichidan', grammar: meanings(['一段活用']),},
      {name: 'Onyomi', grammar: jukugo},
      {name: 'Kunyomi', grammar: jukugo},
      {name: 'Suru', grammar: suru,},
    ].map(meaning => Object.assign(meaning, {
      color: 'magenta',
      mode: 'reading'
    }))

    let compiledTemplate = write_html(fronts, 'reading.front.pug', 'ToMeaning.Front');
    write_html(backs, 'reading.back.pug', 'ToMeaning.Back');

    let result = compiledTemplate(fronts[0])
    expect(result).toBe('<main class="magenta reading front">\n' +
      '{{#kanji}}<h1 class="title {{Tags}}">{{kanji}}</h1><h2>&equals; 終止形 &equals;</h2>{{/kanji}}\n' +
      '{{^kanji}}<h1 class="title {{Tags}}">{{kana}}</h1><h2>&equals; しゅうしけい &equals;</h2>{{/kanji}}\n' +
      '{{#target}}<div>{{target}}</div>{{/target}}</main>')
  })

  const speaking = (ary) => ary.map(text => `&gt; ${text} &lt;`)

  test('speaking kun', () => {
    let godan = speaking(['V', '五段活用']);
    let ichidan = speaking(['V', '一段活用']);
    let jukugo = speaking(['熟語', 'じゅくご']);
    let suru = speaking(['V', 'するV']);

    let cards = [
      {name: 'Godan', grammar: godan},
      {name: 'Ichidan', grammar: ichidan},
      {name: 'Kunyomi', grammar: jukugo},
      {name: 'Suru', grammar: suru},
    ].map(card => Object.assign(card, {
      mode: 'speaking', color: 'magenta',
      notempty: 'kanji', clazz: 'title', front: 'kanji', back: 'kana'
    }));

    let compiledTemplate = write_html(cards, 'speaking.front.pug', 'ToKunYomi.Front');
    write_html(cards, 'speaking.back.pug', 'ToKunYomi.Back');

    let result = compiledTemplate(cards[0])
    expect(result).toBe('{{#kanji}}\n' +
      '<main class="magenta speaking front"><h1 class="title {{Tags}}">{{kanji}}</h1><div class="target">{{target}}</div><h2>&gt; V &lt;</h2></main>\n' +
      '{{/kanji}}')
  })

  test('speaking on', () => {
    let onyomi = speaking(['オンヨミ']);

    let cards = [
      {
        name: 'Onyomi', grammar: onyomi, color: 'yellow', mode: 'speaking',
        notempty: 'kanji', clazz: 'title', front: 'kanji', back: 'kana'
      },
    ]

    write_html(cards, 'speaking.front.pug', 'ToOnYomi.Front');
    write_html(cards, 'speaking.back.pug', 'ToOnYomi.Back');
  })

  test('kanji kun', () => {
    let kunyomi = speaking(['くんよみ']);

    let cards = [
      {
        name: 'OnKanji', grammar: kunyomi, color: 'magenta', mode: 'speaking',
        notempty: 'kun', clazz: 'strokes', front: 'strokes', back: 'kun'
      },
    ]

    write_html(cards, 'speaking.front.pug', 'ToKunYomi.Front');
    write_html(cards, 'speaking.back.pug', 'ToKunYomi.Back');
  })

  test('kanji on', () => {
    let onyomi = speaking(['オンヨミ']);

    let cards = [
      {
        name: 'OnKanji', grammar: onyomi, color: 'yellow', mode: 'speaking',
        notempty: 'on', clazz: 'strokes', front: 'strokes', back: 'on'
      },
    ]

    write_html(cards, 'speaking.front.pug', 'ToOnYomi.Front');
    write_html(cards, 'speaking.back.pug', 'ToOnYomi.Back');
  })

  test('expressing', () => {
    let godan = speaking(['V', '五段活用']);

    let cards = [
      {name: 'Godan', grammar: godan, color: 'cyan'},
    ].map(card => Object.assign(card, {mode: 'saying'}));

    let compiledTemplate = write_html(cards, 'writing.front.pug', 'ToExpress.Front');
    write_html(cards, 'saying.back.pug', 'ToExpress.Back');

    let result = compiledTemplate(cards[0])
    expect(result).toBe('<main class="cyan saying front"><h1 class="title {{Tags}}">{{nederlands}}</h1>{{#kanji}}<h2>&gt; V &lt;</h2>{{/kanji}}\n' +
      '{{^kanji}}<h2>&gt; 五段活用 &lt;</h2>{{/kanji}}</main>')
  });

  test('writing', () => {
    const writing = (ary) => ary.map(text => `\\ ${text} /`)
    let godan = writing(['辞書形', '五段活用']);
    let ichidan = writing(['辞書形', '一段活用']);
    let jukugo = writing(['熟語', 'じゅくご']);
    let suru = writing(['辞書形', 'するV']);

    let cards = [
      {name: 'Godan', grammar: godan, color: 'violet'},
      {name: 'Ichidan', grammar: ichidan, color: 'violet'},
      {name: 'Kunyomi', grammar: jukugo, color: 'violet'},
      {name: 'Onyomi', grammar: jukugo, color: 'magenta'},
      {name: 'Suru', grammar: suru, color: 'violet'},
    ].map(card => Object.assign(card, {mode: 'writing'}));

    let compiledTemplate = write_html(cards, 'writing.front.pug', 'ToKanji.Front');
    write_html(cards, 'writing.back.pug', 'ToKanji.Back');

    let result = compiledTemplate(cards[0])
    expect(result).toBe('<main class="violet writing front"><h1 class="title {{Tags}}">{{nederlands}}</h1>{{#kanji}}<h2>\\ 辞書形 /</h2>{{/kanji}}\n' +
      '{{^kanji}}<h2>\\ 五段活用 /</h2>{{/kanji}}</main>')
  });

})
