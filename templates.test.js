const {
  write_html
} = require('./lib')

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
    expect(result).toBe('<main class="violet writing front"><h1 class="title {{Tags}}">{{nederlands}}</h1>{{#hint}}<div>{{hint}}</div>{{/hint}}\n' +
      '{{#kanji}}<h2>\\ 辞書形 /</h2>{{/kanji}}\n' +
      '{{^kanji}}<h2>\\ 五段活用 /</h2>{{/kanji}}</main>')
  });

})
