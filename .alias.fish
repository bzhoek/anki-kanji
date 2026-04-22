set DANKI $HOME/bzhoek/openai-jp/main.ts

function usage
  set -l actual (count $argv[3..-1])
  if test $actual -lt $argv[1]
    echo "Usage: $argv[2]"
    return 1
  end
end

function akprocess
  usage 1 "$_ <query>" $argv || return 1
  set QRY $argv[1]

  $DANKI onyomi "$QRY note:OnYomi"
  ./anki.js stroke $QRY
  ./anki.js furigana $QRY
  ./anki.js speech $QRY
  ./anki.js mirror $QRY
  ./anki.js notes "$QRY (note:OnYomi or note:KunYomi or note:Godan or note:Ichidan) kanji:_* notes:"
  aktts "$QRY"
end

function aksort
  usage 1 "$_ <query>" $argv || return
  set FROM $argv[1]

  $DANKI move "$FROM card:mean-write*" "Japans::1-意味書く"
  $DANKI move "$FROM card:hear-write*" "Japans::2-聞く書く"
  $DANKI move "$FROM card:mean-say" "Japans::3-意味言う"
  $DANKI move "$FROM card:hear-mean*" "Japans::4-聞く意味"
  $DANKI move "$FROM card:read-mean*" "Japans::5-読む意味"
  $DANKI move "$FROM note:Grammar" "Japans::6-文法"
end

function aktts
  usage 1 "$_ <query>" $argv || return
  set QRY $argv[1]

  ./anki.js tts "$QRY kana:_* speech:"
  ./anki.js tts "$QRY target:_* context:"
  ./anki.js tts "$QRY sentence:_* audio:"
  $SENTENCE hint "$QRY target:_* hint:"
  $DANKI hint "$QRY target:_* hint:"
end
