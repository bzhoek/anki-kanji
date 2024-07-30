const sqlite3 = require('sqlite3').verbose();

let furiganadb = new sqlite3.Database('jmdictfurigana.sqlite', (err) => {
  if (err) {
    console.error(err)
  }
})

function get_furigana(kanji) {
  return new Promise((resolve, reject) => {
    furiganadb.get(`SELECT info
                    FROM furigana
                    WHERE json_extract(info, '$.text') = ?`, [kanji], (err, row) => {
      if (err) {
        reject(err)
      }
      let data = JSON.parse(row.info)
      resolve(data.furigana)
    })
  })
}

module.exports = get_furigana