#!/usr/bin/env bash

if [ "$#" -lt 1 ]; then
  echo "<kanji 離> [find|update <noteid>"
  exit 1
fi

STAMP=$(date +%s)
UNICODE=$(sqlite3 kanji.sqlite "select unicode from Kanji where literal='$1'")
MEANING=$(sqlite3 kanji.sqlite "select meaning from Kanji where literal='$1'")
ONYOMI=$(sqlite3 kanjidic.sqlite "select onyomi from Kanji where kanji='$1'")
KUNYOMI=$(sqlite3 kanjidic.sqlite "select kunyomi from Kanji where kanji='$1'")

SVG='tmp/anki.kanji.svg'
STYLED='tmp/anki.styled.svg'
PNG='tmp/anki.styled.png'
sqlite3 kanji.sqlite "select drawing from Kanji where literal='$1'" > $SVG
xsltproc -nonet anki.styled.xslt $SVG > $STYLED
inkscape -z -y 0.0 $STYLED -o $PNG

function storeMediaFile {
  cat > tmp/anki.media.json <<- EOM
  {
    "action": "storeMediaFile",
    "version": 6,
    "params": {
      "filename": "${UNICODE}-${STAMP}.png",
      "data": "$(base64 $PNG)"
    }
  }
EOM
  curl localhost:8765 -X POST --data @tmp/anki.media.json
}

case "$2" in
  replace)
    cat > tmp/anki.media.json <<- EOM
    {
      "action": "findNotes",
      "version": 6,
      "params": {
        "query": "deck:Default ${1}"
      }
    }
EOM
    NOTEID=$(curl localhost:8765 -X POST --data @tmp/anki.media.json | sed 's/.*\[\(.*\)\].*/\1/g')
    echo $NOTEID
    storeMediaFile
    cat > tmp/anki.strokes.json <<- EOM
    {
      "action": "updateNoteFields",
      "version": 6,
      "params": {
        "note": {
          "id": ${NOTEID},
          "fields": {
            "strokes": "<img src=\"${UNICODE}-${STAMP}.png\" />"
          }
        }
      }
    }
EOM
    curl localhost:8765 -X POST --data @anki.strokes.json
    ;;
  none)
    echo "Only generated."
    ;;
  find)
    cat > tmp/anki.media.json <<- EOM
    {
      "action": "findNotes",
      "version": 6,
      "params": {
        "query": "deck:Default ${1}"
      }
    }
EOM
    NOTEID=$(curl localhost:8765 -X POST --data @tmp/anki.media.json | sed 's/.*\[\(.*\)\].*/\1/g')
#    curl localhost:8765 -X POST --data @anki.media.json
    echo $NOTEID
    ;;
  update)
    storeMediaFile
    NOTEID=$3
    cat > tmp/anki.strokes.json <<- EOM
    {
      "action": "updateNoteFields",
      "version": 6,
      "params": {
        "note": {
          "id": ${NOTEID},
          "fields": {
            "strokes": "<img src=\"${UNICODE}-${STAMP}.png\" />"
          }
        }
      }
    }
EOM
    curl localhost:8765 -X POST --data @tmp/anki.strokes.json
    ;;
  *)
    storeMediaFile
    cat > tmp/anki.add.json <<- EOM
    {
      "action": "addNote",
      "version": 6,
      "params": {
        "note": {
          "deckName": "Default",
          "modelName": "OnKanji",
          "fields": {
            "nederlands": "${MEANING}",
            "kanji": "${1}",
            "kana": "${ONYOMI}",
            "notes": "",
            "strokes": "<img src=\"${UNICODE}-${STAMP}.png\" />"
          },
          "options": {
            "allowDuplicate": false
          },
          "tags": []
        }
      }
    }
EOM
    curl localhost:8765 -X POST --data @tmp/anki.add.json
esac

# {"result": 1545055762607, "error": null}%
