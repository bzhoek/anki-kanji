const post = require('./ankipost'),
  fs = require('fs')

let modelNames = [
  'OnKanji',
  'Kunyomi',
  'Doushi',
  'Doushi-1',
  'Doushi-5']

const saveTemplate = (model, template, result) => {
  fs.writeFileSync(`html/${template}.${model}.Front.html`, result[template].Front)
  fs.writeFileSync(`html/${template}.${model}.Back.html`, result[template].Back)
}

const updateTemplate = (model, template, result) => {
  function updateCard(side) {
    let html = fs.readFileSync(`html/${template}.${model}.${side}.html`).toString()
    if (result[template][side] !== html) {
      console.log(`${template} Update ${side}`)
      post("updateModelTemplates", {model: {name: model, templates: {[template]: {[side]: html}}}}).then(json => {
        console.log(json)
      })
    }
  }

  updateCard('Front');
  updateCard('Back');
}

modelNames.forEach((model) => {
  post("modelTemplates", {"modelName": model})
    .then(json => {
      for (const [key, value] of Object.entries(json.result)) {
        // saveTemplate(model, key, json.result)
        updateTemplate(model, key, json.result)
      }
      // console.log(json)
    });
})
