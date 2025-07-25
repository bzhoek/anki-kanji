# anki-kanji

Make beautiful kanji stroke diagrams in Anki with very distinct colors and convenient stroke order numbering based on [KanjiVG](https://github.com/KanjiVG/kanjivg). Stroke order is by [progressive](https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors/) color and number.

![cat](neko.png).

## Radicals

https://kanjialive.com/214-traditional-kanji-radicals/

| radical         | mnemonic |
|-----------------|----------|
| ![](⌜-hoek.svg) | hoek     |
| ![](⌜-klif.svg) | klif     |

## Requirements

```sh
git submodule add https://github.com/KanjiVG/kanjivg

git submodule init
git submodule update

wget http://www.edrdg.org/kanjidic/kanjidic.gz # 6355 kanji from JIS X 0208
wget http://www.edrdg.org/kanjidic/kanjd212.gz # 5801 kanji from JIS X 0212

http://ftp.edrdg.org/pub/Nihongo/edict2.gz
```
## Google Cloud TTS

```sh
brew install --cask gcloud-cli
gcloud init
  gcloud = advance-seer-458507-r1
gcloud auth application-default login
```

## Usage

Install Anki with the [AnkiConnect](https://ankiweb.net/shared/info/2055492159) add-on. Then run with

```sh
node anki.js -h
node anki.js kanji å¼µ # create new `OnKanji` note
node anki stroke nid:1661888566814 # add strokes for found kanji
```

### Organize

Nested decks are named `<top level>::<next level>`

```sh
./anki.js move card:ToMeaning Japans::Lezen
./anki.js move card:ToKanji Japans::Schrijven::Kanji
```

## Strategies

My current strategy is to make all mnemonics personal: *I* do something *radical* with
*radical*, etc. Shout-out to [KanjiDamage](http://wwwkanjidamage.com/) for inspiration.

1. ToMeaning for reading, from kanji
2. ToKanji for writing, from native language
3. To<On|Kun>Yomi for speaking, from kanji

At first, I studied under the assumption that if I could write it, I could also read it, so I only had to learn Dutch to kana and kanji, but that didn't work for me. When I visited Japan, I realized that I recognized many of the kanji on the signs, but didn't know what they meant.

### Templates

- `reading` tests the understanding of the *meaning*
- `saying` tests expressing *verbs*
- `speaking` tests the on and kun *pronouncing*
- `writing` tests knowing how to write kanji and kana for words

### 2024

There is still a lot of regression, probably because there is too little context. So this year, I'm adding 1T for a `target` word or sentence.

- reading the meaning
- speaking by pronouncing

For writing, I'm adding a `hint` that leaves out the kanji or word.

### Hints

| field   | writing | speaking | reading | listening |
|---------|---------|----------|---------|-----------|
| zintuig | hand    | mond     | oog     | oor       |

### Parts
`Ik heb <b>ogen</b> 目 op <b>steeltjes</b> voor de <b>kipjes </b>`
`(<b>.+?</b>)\s([一-龘])`

## Background

## JMdict

http://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project

Heeft zo'n 1000 antoniemen, dus 500 paren. In XML maar ook simpele EDICT met regels in EUC-JP.

### XML

```sh
wget http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz # 10Mb > 60Mb
xmllint --format - < JMdict_e > JMdict_e.xml
# JMdict\entry\sense\ant
```

`ant` verwijst naar een `keb` of `reb`: *kanji* in `entry/k_ele/keb` en kana *reading* in `entry/r_ele/reb`.

### Readings

Kanji followed by hiragana is called 'おくりかな', and is used to conjugate verbs and adjectives.

1. Kanji combined with hiragana, not particles, is kunyomi.
2. Two or more kanji in a row without hiragana, called じゅくご, is onyomi.
3. A kanji by itself is usually kunyomi, and this is what the kanji is referred to.

[1]: Kanji from Zero #12

### Unicode CJK

https://www.compart.com/en/unicode/block

0x4e00 一 tot 0x9f98 龘 zijn kanji, maar \\u2E80-\\u9FFF bevat Kangxi, Bopomofo, Hangul en Kanbun.

### Strokes

Only 'Bounce fade' can be distinguished from the current strokes:

1. Fade out はらい (はらう)
2. Dead stop とめ (とめる)
3. Bounce fade はれ (はれる)

## Dictionaries

JIS X 208 is the Japanese Industrial Standard character with 6355 kanji.
http://www.edrdg.org/kanjidic/kanjidic.gz

## Database

SQLite database is in `/Users/bas/Library/Application Support/Anki2/User 1/collection.anki2`.

### Furigana json

Get the JSON from https://github.com/Doublevil/JmdictFurigana/releases, format with `jq . ugly.json > pretty.json`

```json
{ "text": "可能性が高い",
  "reading": "かのうせいがたかい",
  "furigana": [ {
      "ruby": "可",
      "rt": "か"
    }, {
      "ruby": "能",
      "rt": "のう"
    }, {
      "ruby": "性",
      "rt": "せい"
    }, {
      "ruby": "が"
    }, {
      "ruby": "高",
      "rt": "たか"
    }, {
      "ruby": "い"
    } ]
}
```
