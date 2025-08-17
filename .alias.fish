function usage
  set -l actual (count $argv[3..-1])
  if test $actual -lt $argv[1]
    echo "Usage: $argv[2]"
    return 1
  end
end

function akprocess
  usage 1 "Usage: akprocess <query>" $argv || return
  set QRY $argv[1]

  ./anki.js kana $QRY
  ./anki.js stroke $QRY
  ./anki.js furigana $QRY
  ./anki.js speech $QRY
  ./anki.js mirror $QRY
  aktts "$QRY"
end

function aksort
  usage 1 "Usage: aksort <query>" $argv || return
  set FROM $argv[1]
  
  ./anki.js move "$FROM (card:ToKanji or card:ToWriting)" Japans::1-書く::漢字
  ./anki.js move "$FROM note:Opposite card:Read*" Japans::1-書く::対義語
  ./anki.js move "$FROM card:*Yomi" Japans::2-言う読む
  ./anki.js move "$FROM (card:Speaking or card:ToExpress or card:ToMeaning)" Japans::2-言う読む
  ./anki.js move "$FROM note:Opposite card:Listen*" Japans::3-聞く::対義語
  ./anki.js move "$FROM card:Listening" Japans::3-聞く::没入
  ./anki.js move "$FROM card:ToHearing" Japans::3-聞く::単語
  ./anki.js move "$FROM card:Cloze*" Japans::4-文法
end

function aktts
  usage 1 "Usage: aktts <query>" $argv || return
  set QRY $argv[1]

  ./anki.js tts "$QRY kana:_* speech:"
  ./anki.js tts "$QRY target:_* context:"
  ./anki.js tts "$QRY sentence:_* audio:"
  ./anki.js hint "$QRY target:_* hint:"
end