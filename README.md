# anki-kanji

Make beautiful kanji stroke diagrams in Anki with very distinct colors and convenient stroke order numbering based on [KanjiVG](https://github.com/KanjiVG/kanjivg). Stroke order is by [progressive](https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors/) color and number. 

![cat](neko.png).

## Requirements

```sh
git submodule add https://github.com/KanjiVG/kanjivg
wget http://www.edrdg.org/kanjidic/kanjidic.gz # 6355 kanji from JIS X 0208
wget http://www.edrdg.org/kanjidic/kanjd212.gz # 5801 kanji from JIS X 0212

http://ftp.edrdg.org/pub/Nihongo/edict2.gz
```

## Usage

Install Anki with the [AnkiConnect](https://ankiweb.net/shared/info/2055492159) add-on. Then run with

```sh
node anki.js -h
node anki.js kanji 張 # create new `OnKanji` note
node anki stroke nid:1661888566814 # add strokes for found kanji
```

### Organize

Nested decks are named `<top level>::<next level>`

```sh
./anki.js move card:ToMeaning Japans::Lezen
./anki.js move card:ToKanji Japans::Schrijven::Kanji
```

## Strategies

My current strategy is to make all mnemonics personal: *I* do something *radical* with *radical*, etc. Shout-out to [KanjiDamage](http://wwwkanjidamage.com/) for inspiration.

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

## Dictionaries

JIS X 208 is the Japanese Industrial Standard character with 6355 kanji.
http://www.edrdg.org/kanjidic/kanjidic.gz

## Database

SQLite database is in `/Users/bas/Library/Application Support/Anki2/User 1/collection.anki2`.

```sqlite
select count(*), factor from revlog group by factor
```

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