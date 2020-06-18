const post = require('./ankipost')

const configureDeck = async (match) => {
  let config = await post('getDeckConfig', {deck: match[0]});
  if (config.result.name.endsWith(match[1])) {
    return
  }
  let clone = await post('cloneDeckConfigId', {name: `Japans ${match[1]}`, cloneFrom: config.result.id});
  let result = await post('setDeckConfigId', {decks: [match[0]], configId: clone.result});
  console.log(result)
}

const processDecks = async () => {
  let json = await post('deckNamesAndIds', {});
  for (const [key, value] of Object.entries(json.result)) {
    let match = key.match(/日本語::(.*)/)
    if (match) {
      await configureDeck(match)
    }
  }
}

processDecks()