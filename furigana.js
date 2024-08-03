const {DOMParser: parser} = require("@xmldom/xmldom");
const xpath = require("xpath");
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
          return
        }

        if (row === undefined) {
          resolve([{ruby: kanji}])
        } else {
          let data = JSON.parse(row.info)
          resolve(data.furigana)
        }
      })
    }
  )
}

function furigana_html(kanji) {
  return get_furigana(kanji)
    .then(json => {
      let html = ''
      json.forEach(element => {
        html += `<ruby>${element.ruby}`
        if (element.rt !== undefined) {
          html += `<rt>${element.rt}</rt>`
        }
        html += '</ruby>'
      });
      return html
    })
}

function un_furigana(html) {
  let doc = new parser().parseFromString(html, 'text/xml');
  let texts = xpath.select("//rt", doc);
  texts.forEach(node => {
    node.parentNode.removeChild(node)
  })

  let ruby = xpath.select1("//ruby", doc)
  if (ruby === undefined) {
    return html
  } else {
    return ruby.textContent
  }
}

module.exports = {get_furigana, furigana_html, un_furigana}