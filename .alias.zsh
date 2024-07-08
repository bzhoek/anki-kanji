anki_sort() {
  if [ $# -lt 1 ]
  then
    echo "Usage: anki_sort <query>"
    return
  fi

  ./anki.js move "$1 card:ToKanji" Japans::1-書く::漢字
  ./anki.js move "$1 note:Opposite card:Read*" Japans::1-書く::対義語
  ./anki.js move "$1 note:OnKanji card:ToOnYomi" Japans::2-言う::漢字
  ./anki.js move "$1 card:ToOnYomi" Japans::2-言う::熟語
  ./anki.js move "$1 card:ToKunYomi" Japans::2-言う::訓読み
  ./anki.js move "$1 card:Speaking" Japans::2-言う
  ./anki.js move "$1 card:ToExpress" Japans::3-言う
  ./anki.js move "$1 card:ToMeaning" Japans::4-読む
  ./anki.js move "$1 note:Opposite card:Listen*" Japans::5-聞く::対義語
  ./anki.js move "$1 card:Listening" Japans::5-聞く
  ./anki.js move "$1 card:ToHearing" Japans::5-聞く
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
