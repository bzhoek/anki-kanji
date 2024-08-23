function strip_kana(text) {
  return text.replace(/[^ぁ-んァ-ン]/g, '')
}

module.exports = {strip_kana}