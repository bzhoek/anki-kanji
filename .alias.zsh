anki_sort() {
  if [ $# -lt 1 ]
  then
    echo "Usage: anki_sort <query>"
    return
  fi

  ./anki.js move "$1 card:ToKanji" Japans::1-Schrijven::Kanji
  ./anki.js move "$1 note:Opposite card:Read*" Japans::1-Schrijven::Opposite
  ./anki.js move "$1 note:OnKanji card:ToOnYomi" Japans::2-Spreken::Kanji
  ./anki.js move "$1 card:ToOnYomi" Japans::2-Spreken::Jukugo
  ./anki.js move "$1 card:ToKunYomi" Japans::2-Spreken::Kunyomi
  ./anki.js move "$1 card:Speaking" Japans::2-Spreken
  ./anki.js move "$1 card:ToExpress" Japans::3-Zeggen
  ./anki.js move "$1 card:ToMeaning" Japans::4-Lezen
  ./anki.js move "$1 note:Opposite card:Listen*" Japans::5-Luisteren::Opposite
  ./anki.js move "$1 card:Listening" Japans::5-Luisteren
}

anki_process() {
  if [ $# -lt 1 ]
  then
    echo "Usage: anki_process <query>"
    return
  fi
  ./anki.js kana $1
  ./anki.js stroke $1
  ./anki.js speech $1
}

anki_default() {
  anki_process deck:0-Inbox
}
