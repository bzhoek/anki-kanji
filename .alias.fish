set ANKI $HOME/bzhoek/anki-kanji/anki.js
set DANKI $HOME/bzhoek/danki/main.ts

set DECK "deck:Japans"
set DAN_YOMI "note:*Dan or note:*Yomi"
set NOTE_NOTES "$DAN_YOMI or note:Opposite"
set NO_NOTES "notes: or 1notes: or 2notes:"
set READINGS "kanji:_* or 1reading:_* or 2reading:_*"

function akinbox
  ak_process "deck:0-Inbox"
end

function aknow
  ak_sort "deck:1-Now"
end

function aktts
  ak_tts "$DECK"
end

function akbreak
  $DANKI break "target:re:[\x{3000}-\x{9FFF}]{9,} -target:re:[\u200B]"
end

function akgenerate
  $DANKI generate "kanji:_* target: -note:OnKanji"
  $DANKI translate "(note:*dan OR note:*yomi) -target:<dl>* target:_*"
  $ANKI tts "$DECK target:_* context:"
end

# after *all* reviews
function akflag
  $DANKI ease --ease 2 --flag 2 "rated:4:2 -flag:2"
  $DANKI ease --ease 3 --flag 0 "rated:4:3 flag:2"
  $DANKI flag "is:buried-manually -flag:1" 1
  $DANKI flag "flag:1 -is:buried-manually -prop:due=0" 0
  $DANKI flag "$DECK is:new -flag:3" 3
  $DANKI flag "$DECK flag:3 -is:new" 0
  $DANKI clean
end

function akmarkdown
  $ANKI markdown "<pre> edited:1"
end

function aknotes
  $DANKI notes "$DECK ($READINGS) ($NOTE_NOTES) ($NO_NOTES)"
end

function usage
  set -l actual (count $argv[3..-1])
  if test $actual -lt $argv[1]
    echo "Usage: $argv[2]"
    return 1
  end
end

function ak_process
  usage 1 "$_ <query>" $argv || return 1
  set QRY $argv[1]

  $DANKI onyomi "$QRY note:OnYomi"
  $ANKI stroke $QRY
  $ANKI furigana $QRY
  $ANKI mirror $QRY
  $DANKI notes "$QRY ($READINGS) ($NOTE_NOTES) ($NO_NOTES)"
  ak_tts "$QRY"
end

function ak_sort
  usage 1 "$_ <query>" $argv || return
  set FROM $argv[1]

  $DANKI move "$FROM card:mean-write*" "Japans::1-意味書く"
  $DANKI move "$FROM card:hear-write*" "Japans::2-聞く書く"
  $DANKI move "$FROM card:mean-say" "Japans::3-意味言う"
  $DANKI move "$FROM card:hear-mean*" "Japans::4-聞く意味"
  $DANKI move "$FROM card:read-mean*" "Japans::5-読む意味"
  $DANKI move "$FROM note:Grammar" "Japans::6-文法"
end

function ak_tts
  usage 1 "$_ <query>" $argv || return
  set QRY $argv[1]

  $ANKI tts "$QRY kana:_* speech:"
  $ANKI tts "$QRY target:_* context:"
  $ANKI tts "$QRY sentence:_* audio:"
  $ANKI mirror "$QRY (1listening: or 2listening:)"
  $DANKI hint  "$QRY target:_* hint:"
end
