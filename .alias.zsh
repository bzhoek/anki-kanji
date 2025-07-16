usage() {
  if [ $1 -lt 1 ]
  then
    echo "Usage: ${funcstack[-1]} <query>"
    return 1
  fi
}

aksort() {
  usage $# || return

  ./anki.js move "$1 (card:ToKanji or card:ToWriting)" Japans::1-書く::漢字
  ./anki.js move "$1 note:Opposite card:Read*" Japans::1-書く::対義語
  ./anki.js move "$1 card:*Yomi" Japans::2-言う読む
  ./anki.js move "$1 (card:Speaking or card:ToExpress or card:ToMeaning)" Japans::2-言う読む
  ./anki.js move "$1 note:Opposite card:Listen*" Japans::3-聞く::対義語
  ./anki.js move "$1 card:Listening" Japans::3-聞く::没入
  ./anki.js move "$1 card:ToHearing" Japans::3-聞く::単語
  ./anki.js move "$1 card:Cloze*" Japans::4-文法
}

akprocess() {
  usage $# || return

  ./anki.js kana $1
  ./anki.js stroke $1
  ./anki.js furigana $1
  ./anki.js speech $1
  ./anki.js mirror $1
}

akstroke() {
  ./anki.js stroke 'kanji:_* strokes:'
}

akdefault() {
  akprocess deck:0-Inbox
}

aktts() {
  usage $# || return

  ./anki.js tts "$1 kana:_* speech:"
  ./anki.js tts "$1 target:_* context:"
  ./anki.js hint "$1 target:_* hint:"
}