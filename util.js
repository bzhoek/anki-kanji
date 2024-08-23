function strip_kana(text) {
  return text.replace(/[^ぁ-んァ-ン]/g, '') // https://gist.github.com/terrancesnyder/1345094
}

function jest_test_name() {
  return expect.getState().currentTestName.split("/ ").slice(-1)[0]
}

module.exports = {strip_kana, jest_test_name}