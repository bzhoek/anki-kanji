const post = require('./ankipost')

const findNotes = async (query, deck) => {
  let find = await post('findCards', {query: query});
  console.log(find)
  let move = await post('changeDeck', {cards: find.result, deck: deck})
  console.log(move)
}

findNotes('card:ToKanji note:OnKanji', '日本語::漢字')
findNotes('card:ToOnYomi note:OnKanji', '日本語::音読み')
findNotes('card:ToKunYomi note:OnKanji', '日本語::訓読み')
findNotes('card:KunKana note:Kunyomi', '日本語::かな')
findNotes('card:ToHiragana note:Hiragana', '日本語::かな')
findNotes('card:ToKatakana note:Katakana', '日本語::かな')
findNotes('card:Jukugo note:Kunyomi', '日本語::熟語')

// '日本語::かな'
// '日本語::じしょけい'
// '日本語::て形'
// '日本語::ます形'
// '日本語::仮名'
// '日本語::漢字'
// '本語::熟語'
// '日本語::訓読み'
// '日本語::辞書形'
// '日本語::音読み'
// '(note:Doushi or note:Doushi-1 or note:Doushi-5) card:Jukugo'