const post = require('./ankipost'),
  fs = require('fs')

let css = fs.readFileSync('anki.css').toString()

let modelNames = [
  'Cloze',
  'Doushi',
  'Doushi-1',
  'Doushi-5',
  'Hiragana',
  'Katakana',
  'Kunyomi',
  'OnKanji',
]

const updateCss = (model) => {
  post("updateModelStyling", {
      "model": {
        "name": model,
        "css": css
      }
    }
  ).then(json => console.log(model, json.result));
}

modelNames.forEach((model) => {
  post("modelStyling", {"modelName": model})
    .then(json => {
      if (json.result.css !== css) {
        updateCss(model)
      }
    });
})
