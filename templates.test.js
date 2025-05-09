const {
  to_express_html,
  to_meaning_html,
  to_kanji_html,
} = require('./templates')

describe('templates', () => {
  test('reading', () => {
    let result = to_meaning_html()
    expect(result).toBe('<main class="magenta reading front">\n' +
      '{{#kanji}}<h1 class="kanji {{Tags}}">{{kanji}}</h1>{{/kanji}}\n' +
      '{{^kanji}}<h1 class="kanji {{Tags}}">{{kana}}</h1>{{/kanji}}\n' +
      '{{#target}}<div>{{target}}</div>{{/target}}\n' +
      '{{#kanji}}<h2>終止形</h2>{{/kanji}}\n' +
      '{{^kanji}}<h2>しゅうしけい</h2>{{/kanji}}' +
      '</main>')
  })

  test('expressing', () => {
    let result = to_express_html()
    expect(result).toBe('<main class="cyan saying front"><h1 class="{{Tags}}">{{nederlands}}</h1>'+
      '{{#hint}}<div>{{hint}}</div>{{/hint}}\n' +
      '{{#kanji}}<h2>&gt; V &lt;</h2>{{/kanji}}\n' +
      '{{^kanji}}<h2>&gt; 五段活用 &lt;</h2>{{/kanji}}</main>')
  });

  test('writing', () => {
    let result = to_kanji_html();
    expect(result).toBe('<main class="violet writing front"><h1 class="{{Tags}}">{{nederlands}}</h1>{{#hint}}<div>{{hint}}</div>{{/hint}}\n' +
      '{{#kanji}}<h2>\\ 辞書形 /</h2>{{/kanji}}\n' +
      '{{^kanji}}<h2>\\ 五段活用 /</h2>{{/kanji}}</main>')
  });

})
