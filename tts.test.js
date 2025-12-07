const {createRequest, hash, unpackCloze} = require("./tts");

describe('hash', () => {
  test('string', () => {
    expect(hash("hello, world")).toEqual('e4d7f1b4ed2e42d15898f4b27b019da4')
  })
})

describe('createRequest', () => {
  test('short', () => {
    const request = createRequest("これはペンです。");
    expect(request.audioConfig.speakingRate).toEqual(1.0)
  })
  test('long', () => {
    const request = createRequest("議長は彼のばかげた提案を一蹴した");
    expect(request.audioConfig.speakingRate).toEqual(0.75)
  })
})

describe('clean', () => {
  test('cloze', () => {
    let sentence = "手伝う → {{c1::手伝わない}}"
    let result = unpackCloze(sentence);
    expect(result).toEqual("手伝う → 手伝わない")
  })

  test('cloze hint', () => {
    let sentence = "手伝う → {{c1::手伝わない::nai}}"
    let result = unpackCloze(sentence);
    expect(result).toEqual("手伝う → 手伝わない")
  })

  test('no cloze', () => {
    let sentence = "手伝う"
    let result = unpackCloze(sentence);
    expect(result).toEqual(sentence)
  })
});