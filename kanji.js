const sqlite3 = require('sqlite3'),
  {post, colorize} = require('./lib')

if (process.argv.length !== 3) {
  console.error(`Usage: kanji 客`)
  process.exit(1)
}

let char = process.argv[2]
let unicode = char.charCodeAt(0)

let kanji = new sqlite3.Database('kanji.sqlite', (err) => {
  if (err) {
    console.error(err)
  }
})

let reading = new sqlite3.Database('kanjidic.sqlite', (err) => {
  if (err) {
    console.error(err)
  }
})

let style = `
<style>
  text {
    font: 8pt helvetica;
  }

  path {
    stroke-width: 4pt;
    fill-opacity: 0;
    stroke: #000
  }
</style>
`

kanji.get("select meaning from Kanji where literal=?", [char], function (err, row) {
  let meaning = row.meaning
  reading.get("select onyomi, kunyomi from Kanji where kanji=?", [char], function (err, row) {
    let on = row ? row.onyomi : 'no'
    let svg = colorize(unicode).then((svg) => {
      let params = {
        "note": {
          "deckName": "Default",
          "modelName": "OnKanji",
          "fields": {
            "nederlands": meaning,
            "kanji": char,
            "on": on,
            "notes": "",
            "strokes": style + svg
          },
          "options": {
            "allowDuplicate": false
          },
          "tags": []
        }
      }
      post('addNote', params).then(json => {
        console.log(meaning, json)
      })
    })
  });
});


