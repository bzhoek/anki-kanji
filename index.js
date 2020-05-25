const fetch = require('node-fetch');
const fs = require('fs')

let find = {
  "action": "findCards",
  "version": 6,
  "params": {
    "query": "deck:current"
  }
}

let models = {
  "action": "modelNames",
  "version": 6,
}

let css = fs.readFileSync('anki.css').toString()

let modelNames = [
  'Genki',
  'Cloze',
  'OnKanji',
  'Kunyomi',
  'Doushi',
  'Doushi-1',
  'Doushi-5']

const post = (action, params) => {
  let request = {
    action: action,
    version: 6,
    params: params
  }
  return fetch('http://localhost:8765', {method: 'post', body: JSON.stringify(request)})
  .then(res => res.json())
}

const updateCss = (model) => {
  post("updateModelStyling", {
        "model": {
          "name": model,
          "css": css
        }
      }
  ).then(json => console.log(json.result));
}

modelNames.forEach((model) => {
  post("modelStyling", {"modelName": model})
  .then(json => {
    if (json.result.css !== css) {
      updateCss(model)
    }
  });
})
