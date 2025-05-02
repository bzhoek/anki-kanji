const {strip_kana, jest_test_name, eucjp_to_utf8, extract_before_period} = require('./util')

describe('kana', () => {
  const stripped = () => strip_kana(jest_test_name())
  test('まき ジャク. text', () => {
    expect(stripped()).toEqual('まきジャク')
  })
  test('ひらがな', () => {
    expect(stripped()).toEqual('ひらがな')
  })
})

describe('euc-jp encoding', () => {
  test.skip('convert edict to utf-8', () => {
    eucjp_to_utf8('tmp/edict')
  })
})

describe('extract', () => {
  test('string', async () => {
    const input = "イ. <b>Ik</b> verplaats het graan in mijn <b>eentje</b>"
    expect(extract_before_period(input)).toEqual("イ")
  })
  test('html', async () => {
    const input = "おダイジ<em>に</em>"
    expect(extract_before_period(input)).toEqual("おダイジに")
  })
  test('ruby', async () => {
    const input = "<ruby>移<rt>イ</rt></ruby><ruby>住<rt>ジュウ</rt></ruby> <i>migratie</i>"
    expect(extract_before_period(input)).toEqual("おダイジに")
  })
})
