const fs = require("fs");
const Encoding = require("encoding-japanese");

function strip_kana(text) {
  return text.replace(/[^ぁ-んァ-ン]/g, '') // https://gist.github.com/terrancesnyder/1345094
}

function jest_test_name() {
  return expect.getState().currentTestName.split("/ ").slice(-1)[0]
}

function eucjp_to_utf8(file) {
  const Encoding = require('encoding-japanese');
  const buffer = fs.readFileSync(file);
  const unicodeArray = Encoding.convert(buffer, {
    to: 'UNICODE', from: 'EUCJP'
  });

  let decoded = Encoding.codeToString(unicodeArray);
  fs.writeFileSync(`${file}.txt`, decoded)
}

module.exports = {strip_kana, jest_test_name, eucjp_to_utf8}