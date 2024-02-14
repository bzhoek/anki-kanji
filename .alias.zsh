anki_sort() {
  if [ $# -lt 1 ]
  then
    echo "Usage: anki_sort <query>"
    return
  fi

  ./anki.js move "$1 card:ToExpress" Japans::Zeggen
  ./anki.js move "$1 card:ToMeaning" Japans::Lezen
  ./anki.js move "$1 card:ToKanji" Japans::Schrijven::Kanji
  ./anki.js move "$1 note:OnKanji card:ToOnYomi" Japans::Spreken::Kanji
  ./anki.js move "$1 card:ToOnYomi" Japans::Spreken::Jukugo
  ./anki.js move "$1 card:ToKunYomi" Japans::Spreken::Kunyomi
}

anki_process() {
  ./anki.js kana $1
  ./anki.js stroke $1
  ./anki.js speech $1
}

anki_default() {
  anki_process deck:Inbox
}
