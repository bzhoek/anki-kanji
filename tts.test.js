const {hash, tts} = require("./tts");

describe('hash', () => {
  test('string', () => {
    expect(hash("hello, world")).toEqual('e4d7f1b4ed2e42d15898f4b27b019da4')
  })
})