# anki-kanji

Make beautiful kanji stroke diagrams in Anki with very distinct colors and convenient stroke order numbering based on [KanjiVG](https://github.com/KanjiVG/kanjivg)

![cat](neko.png).

## Usage

Install Anki with the [AnkiConnect](https://ankiweb.net/shared/info/2055492159) add-on. Then run with

```sh
node anki.js -h
node anki.js kanji 張 # create new `OnKanji` note
node anki stroke nid:1661888566814 # add strokes for found kanji
```

Nested decks <top level>::<next level>

## Colors

Stroke order is by color and number. Distinguishing many colors is random and difficult for [26 colors](https://en.wikipedia.org/wiki/Help:Distinguishable_colors) but [progressive for 20](https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors/)

## Strategies

My current strategy is to make all mnemonics personal: *I* do something *radical* with *radical*, etc. Shout-out to [KanjiDamage](http://wwwkanjidamage.com/) for inspiration.

## Background

### Readings

Kanji followed by hiragana is called 'おくりかな', and is used to conjugate verbs and adjectives.

1. Kanji combined with hiragana, not particles, is kunyomi.
2. Two or more kanji in a row without hiragana, called じゅくご, is onyomi.
3. A kanji by itself is usually kunyomi, and this is what the kanji is referred to.

[1]: Kanji from Zero #12

Hiragana start with unicode ぁ (12353) and go for 

### Strokes

Only 'Bounce fade' can be distinguished from the current strokes:

1. Fade out はらい (はらう)
2. Dead stop とめ (とめる)
3. Bounce fade はれ (はれる)