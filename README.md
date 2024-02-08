# anki-kanji

Make beautiful kanji stroke diagrams in Anki with very distinct colors and convenient stroke order numbering based on [KanjiVG](https://github.com/KanjiVG/kanjivg)

![cat](neko.png).

## Requirements

```sh
git submodule add https://github.com/KanjiVG/kanjivg
```

## Usage

Install Anki with the [AnkiConnect](https://ankiweb.net/shared/info/2055492159) add-on. Then run with

```sh
node anki.js -h
node anki.js kanji 張 # create new `OnKanji` note
node anki stroke nid:1661888566814 # add strokes for found kanji
```

Nested decks <top level>::<next level>

### Organize

```sh
./anki.js move card:ToMeaning Japans::Lezen
./anki.js move card:ToKanji Japans::Schrijven::Kanji
```

## Colors

Stroke order is by color and number. Distinguishing many colors is random and difficult for [26 colors](https://en.wikipedia.org/wiki/Help:Distinguishable_colors) but [progressive for 20](https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors/)

## Strategies

My current strategy is to make all mnemonics personal: *I* do something *radical* with *radical*, etc. Shout-out to [KanjiDamage](http://wwwkanjidamage.com/) for inspiration.

1. ToMeaning for reading, from kanji
2. ToKanji for writing, from native language
3. To<On|Kun>Yomi for speaking, from kanji

At first, I studied under the assumption that if I could write it, I could also read it, so I only had to learn Dutch to kana and kanji, but that didn't work for me. When I visited Japan, I realized that I recognized many of the kanji on the signs, but didn't know what they meant.

```sh
./anki.js move "deck:Japans::2022 card:ToKunYomi" Japans::Spreken::Kunyomi
./anki.js move "deck:Japans::2022 card:ToMeaning" Japans::Lezen
./anki.js move "deck:Japans::2022 card:ToKanji" Japans::Schrijven::Kanji
```

## Background

### Readings

Kanji followed by hiragana is called 'おくりかな', and is used to conjugate verbs and adjectives.

1. Kanji combined with hiragana, not particles, is kunyomi.
2. Two or more kanji in a row without hiragana, called じゅくご, is onyomi.
3. A kanji by itself is usually kunyomi, and this is what the kanji is referred to.

[1]: Kanji from Zero #12

Hiragana start with unicode ぁ (12353) and go for 

0x4e00 一 tot 0x9f98 龘 zijn kanji.

### Strokes

Only 'Bounce fade' can be distinguished from the current strokes:

1. Fade out はらい (はらう)
2. Dead stop とめ (とめる)
3. Bounce fade はれ (はれる)

## Database
https://github.com/ankidroid/Anki-Android/wiki/Database-Structure
https://kylerego.github.io/anki-schema
`revlog.id` is timestamp van review.
ease = review: 1 wrong, 2 hard, 3 ok, 4 easy
type = 0 learn, 1 review, 2 relearn, 3 cram

```sqlite
with hard as (select datetime(id / 1000, 'unixepoch') as 'datetime', *
from revlog
where
  id / 1000 > unixepoch(date('now', '-1 month')) and
  type = 1 and
  ease = 2 and
  ivl > 21
order by id desc)
-- update cards  set flags = 2, usn = -1 from hard as h where cards.id = h.cid;
select *
from cards as c, hard as h
where h.cid = c.id;


select unixepoch(date('now', '-1 month'))
```

### Hard answers last week

```sqlite
with hard as (
select
  datetime(id / 1000, 'unixepoch') as 'datetime',
  cast(strftime('%Y%W', datetime(id / 1000, 'unixepoch')) as int) as 'weeknr',
  *
from revlog
where
  weeknr > cast(strftime('%Y%W', date('now')) as int) - 5 and
  type = 1 and
  ease = 2 and
  ivl > 14
order by id desc)

select *
from cards as c, hard as h
where h.cid = c.id;
```

### Flag as yellow

```sqlite
update cards set flags = 2, usn = -1 from hard as h where cards.id = h.cid
```