const isVowel = (c) => {
  return ['a', 'e', 'i', 'o', 'u'].includes(c)
}

const regex = (string) => {
  console.log(string)
  return new RegExp(string, 'i')
}
const vowels = 'aeiouAEIOU'
const V = regex(`^[${vowels}]`, 'i')
const CV = regex(`^(ch|th|[^${vowels}])[${vowels}]`, 'i')

const split = (word) => {
  let syllables = []
  let syllable = []
  let hasVowel = false

  const isNextCV = (i) => {
    return CV.test(word.substr(i + 1))
  }

  const reset = () => {
    syllables.push(syllable.join(''))
    syllable = []
    hasVowel = false
  }

  syllable.push(word[0])
  for (let i = 1; i < word.length; i++) {
    let c = word[i];
    syllable.push(c)
    hasVowel = hasVowel || V.test(c);
    if (hasVowel && isNextCV(i)) {
      reset();
    }
  }
  syllables.push(syllable.join(''))
  return syllables.join('-')
}

// https://www.freepascal.org/~daniel/breekijzer/breekijzer.pdf
// https://nl.wikipedia.org/wiki/Afbreken_in_de_Nederlandse_spelling
// https://kevinvermassen.be/2016/08/01/verdelen-in-lettergrepen/
// https://woordenlijst.org/#/?q=bibliotheek
// http://anw.inl.nl/article/bibliotheek

test('split consonant', () => {
  expect(split('lopen')).toEqual('lo-pen');
  expect(split('Spelen')).toEqual('Spe-len');
  expect(split('MUREN')).toEqual('MU-REN');
  expect(split('boren')).toEqual('bo-ren');
  expect(split('slapen')).toEqual('sla-pen');
  expect(split('apotheek')).toEqual('sla-pen');
});

test('split two consonants', () => {
  expect(split('bossen')).toEqual('bos-sen');
  expect(split('lachen')).toEqual('la-chen');
});

test('split three consonants', () => {
  expect(split('bibliotheek')).toEqual('bi-blio-theek');
});