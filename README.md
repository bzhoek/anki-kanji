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

## Colors

Stroke order is by color and number. Distinguishing many colors is random and difficult for [26 colors](https://en.wikipedia.org/wiki/Help:Distinguishable_colors) but [progressive for 20](https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors/)

## Strategies

My current strategy is to make all mnemonics personal: *i* do something *radical* with *radical*, etc. Shout-out to [KanjiDamage](http://wwwkanjidamage.com/) for inspiration.