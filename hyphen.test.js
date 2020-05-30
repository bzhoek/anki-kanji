const regex = (string) => {
  // console.log(string)
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

describe('split consonant', () => {
  test.each([
    ['lopen', 'lo-pen'],
    ['Spelen', 'Spe-len'],
    ['MUREN', 'MU-REN'],
    ['boren', 'bo-ren'],
    ['slapen', 'sla-pen'],
    ['apotheek', 'apo-theek'],
  ])('%s', (a, expected) => {
    expect(split(a)).toEqual(expected);
  });
});

describe('split two consonants', () => {
  test.each([
    ['bossen', 'bos-sen'],
    ['lachen', 'la-chen'],
  ])('%s', (a, expected) => {
    expect(split(a)).toEqual(expected);
  });
});

// test('split three consonants', () => {
//   expect(split('bibliotheek')).toEqual('bi-blio-theek');
// });