const {DOMParser: parser} = require("@xmldom/xmldom");
const xpath = require("xpath");
const sqlite3 = require('sqlite3').verbose();

let furiganadb = new sqlite3.Database('jmfurigana.sqlite', (err) => {
  if (err) {
    console.error(err)
  }
})

async function try_furigana(kanji) {
  let prefix = kanji
  let suffix = ''
  let prefix_result = []
  let suffix_result = []
  while (prefix_result.length === 0 && prefix.length > 0) {
    suffix = kanji.slice(prefix.length)
    prefix_result = await get_furigana(prefix)
    suffix_result = await get_furigana(suffix)
    prefix = prefix.slice(0, -1)
  }

  if (suffix_result.length === 0 && suffix.length > 0) {
    suffix_result = [{ruby: suffix}]
  }

  if (prefix_result.length === 0) {
    return []
  }

  return prefix_result.concat(suffix_result)
}

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
          resolve([])
        } else {
          let data = JSON.parse(row.info)
          resolve(data.furigana)
        }
      })
    }
  )
}

function furigana_html(kanji) {
  return try_furigana(kanji)
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
  try {
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
  } catch (error) {
    console.error("Couldn't parse", html)
    return html
  }
}

// http://www.rikai.com/library/kanjitables/kanji_codes.unicode.shtml
async function ruby_target_result(markup) {
  let regex = /([\u{3040}-\u{30ff}\u{4e00}-\u{9faf}\s]+)<i>\s?\([\u{3040}-\u{30ff}]+\.?\s(.+?)\)/u
  let result = markup.match(regex)

  if (result !== null) {
    let kanji = result[1].trim()
    let furigana = await furigana_html(kanji)
    return [kanji, furigana, result[2].trim()]
  }
  return null
}

async function ruby_target(markup) {
  let regex = /([一-龘ぁ-わァ-ワ\s]+)<i>\([一-龘ぁ-わァ-ワ]+\s(.+?)\)/
  let result = markup.match(regex)

  if (result !== null) {
    let kanji = result[1].trim()
    let furigana = await furigana_html(kanji)
    return furigana + '<i>' + result[2].trim() + '</i>'
  } else {
    return markup
  }
}

function markup_ruby_html(markup) {
  let rubyre = /(\[.+?](\(.+?\))?)/g
  let detailre = /\[(.+?)](?:\((.+?)\))?/
  let rubies = markup.match(rubyre)
  if (rubies !== null) {
    let result = ''
    for (let ruby of rubies) {
      let details = ruby.match(detailre)
      result += `<ruby>${details[1]}`
      if (details[2] !== undefined) {
        result += `<rt>${details[2]}</rt>`
      }
      result += '</ruby>'
    }
    return result
  }
  return markup
}

module.exports = {
  get_furigana,
  furiganadb,
  furigana_html,
  un_furigana,
  ruby_target,
  ruby_target_result,
  markup_ruby_html,
  try_furigana
}