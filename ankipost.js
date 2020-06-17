const fetch = require('node-fetch');

const post = (action, params) => {
  let request = {
    action: action,
    version: 6,
    params: params
  }
  // console.log(request)
  return fetch('http://localhost:8765', {method: 'post', body: JSON.stringify(request)}).then(res => res.json())
}

module.exports = post