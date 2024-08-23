const {strip_kana, jest_test_name} = require('./util')

describe('kana', () => {
  const stripped = () => strip_kana(jest_test_name())
  test('まき ジャク. text', () => {
    expect(stripped()).toEqual('まきジャク')
  })
  test('ひらがな', () => {
    expect(stripped()).toEqual('ひらがな')
  })
})

