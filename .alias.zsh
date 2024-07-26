usage() {
  if [ $1 -lt 1 ]
  then
    echo "Usage: ${funcstack[-1]} <query>"
    return 1
  fi
}

anki_sort() {
  usage $# || return

  ./anki.js move "$1 card:ToKanji" Japans::1-書く::漢字
  ./anki.js move "$1 note:Opposite card:Read*" Japans::1-書く::対義語
  ./anki.js move "$1 note:OnKanji card:ToOnYomi" Japans::2-言う::漢字
  ./anki.js move "$1 card:ToOnYomi" Japans::2-言う::単語
  ./anki.js move "$1 card:ToKunYomi" Japans::2-言う::単語
  ./anki.js move "$1 card:Speaking" Japans::2-言う
  ./anki.js move "$1 card:ToExpress" Japans::2-言う
  ./anki.js move "$1 card:ToMeaning" Japans::3-読む
  ./anki.js move "$1 note:Opposite card:Listen*" Japans::4-聞く::対義語
  ./anki.js move "$1 card:Listening" Japans::4-聞く
  ./anki.js move "$1 card:ToHearing" Japans::4-聞く::単語
}

anki_process() {
  usage $# || return

  ./anki.js kana $1
  ./anki.js stroke $1
  ./anki.js speech $1
}

anki_stroke() {
  ./anki.js stroke 'kanji:_* strokes:'
}

anki_default() {
  anki_process deck:0-Inbox
}
