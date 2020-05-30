const isVowel = (c) => {
  return ['a', 'e', 'i', 'o', 'u'].includes(c)
}

const split = (word) => {
  let syllables = []
  let syllable = []
  let hasVowel = false
  const isNextCV = (i) => {
    if (i < word.length - 2) {
      return !isVowel(word[i + 1]) && isVowel(word[i + 2])
    }
    return false
  }
  for (let i = 0; i < word.length; i++) {
    let c = word[i];
    syllable.push(c)
    hasVowel = hasVowel || isVowel(c);
    if (hasVowel && isNextCV(i)) {
      syllables.push(syllable.join(''))
      syllable = []
      hasVowel = false
    }
  }
  syllables.push(syllable.join(''))
  return syllables.join('-')
}

// https://kevinvermassen.be/2016/08/01/verdelen-in-lettergrepen/

test('lopen', () => {
  expect(split('lopen')).toEqual('lo-pen');
  expect(split('spelen')).toEqual('spe-len');
  expect(split('muren')).toEqual('mu-ren');
  expect(split('boren')).toEqual('bo-ren');
  expect(split('slapen')).toEqual('sla-pen');
});