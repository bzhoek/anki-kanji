const {strip_kana} = require('./util')

function test_name() {
  return expect.getState().currentTestName
}

describe('kana', () => {
  const stripped = () => strip_kana(test_name())
  test('まき ジャク. text', () => {
    expect(stripped()).toEqual('まきジャク')
  })
  test('ひらがな', () => {
    expect(stripped()).toEqual('ひらがな')
  })
})

