const {strip_kana, jest_test_name, eucjp_to_utf8} = require('./util')
const fs = require("fs");
const Encoding = require("encoding-japanese");

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
  test('convert edict to utf-8', () => {
    eucjp_to_utf8('tmp/edict')
  })
})
