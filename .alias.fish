set DANKI $HOME/bzhoek/danki/main.ts

set DAN_YOMI "note:*Dan or note:*Yomi"
set NOTE_NOTES "$DAN_YOMI or note:Opposite"
set NO_NOTES "notes: or 1notes: or 2notes:"
set READINGS "kanji:_* or 1reading:_* or 2reading:_*"

function usage
  set -l actual (count $argv[3..-1])
  if test $actual -lt $argv[1]
    echo "Usage: $argv[2]"
    return 1
  end
end

# after *all* reviews
function akflag
  $DANKI ease --ease 2 --flag 2 "rated:4:2 -flag:2"
  $DANKI ease --ease 3 --flag 0 "rated:4:3 flag:2"
  $DANKI flag "is:buried-manually -flag:1" 1
  $DANKI flag "flag:1 -is:buried-manually -prop:due=0" 0
  $DANKI flag "deck:Japans is:new -flag:3" 3
  $DANKI flag "deck:Japans flag:3 -is:new" 0
end

function aknotes
  $DANKI notes "deck:Japans ($READINGS) ($NOTE_NOTES) ($NO_NOTES)"
end

function akmarkdown
  ./anki.js markdown "<pre> edited:1"
end

function akprocess
  usage 1 "$_ <query>" $argv || return 1
  set QRY $argv[1]

  $DANKI onyomi "$QRY note:OnYomi"
  ./anki.js stroke $QRY
  ./anki.js furigana $QRY
  ./anki.js mirror $QRY
  $DANKI notes "$QRY ($READINGS) ($NOTE_NOTES) ($NO_NOTES)"
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
  ./anki.js mirror "$QRY (1listening: or 2listening:)"
  $DANKI hint  "$QRY target:_* hint:"
end
