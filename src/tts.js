const fs = require('fs');
const {Readable} = require('stream');
const {finished} = require('stream/promises');

const AI = {
  lang: "alloy",
  endpoint: "https://ttsmp3.com/makemp3_ai.php",
  speed: 1.0
}

const TTS = {
  lang: "Mizuki",
  endpoint: "https://ttsmp3.com/makemp3_new.php"
}

function text_to_speech(text) {
  let details = Object.assign(AI, {
    msg: text, source: "ttsmp3",
  });

  return fetch(details.endpoint, {
    method: 'post',
    headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
    body: new URLSearchParams(details)
  }).then(res => res.json())
}

async function download_file(url, path) {
  let stream = fs.createWriteStream(path);
  const {body} = await fetch(url);
  await finished(Readable.fromWeb(body).pipe(stream));
}

function download_speech(text) {
  return text_to_speech(text).then(result => {
    if (result.Error !== 0) {
      throw new Error("Failed to generate speech");
    }
    return download_file(result.URL, `${text}_g.mp3`);
  });
}

module.exports = {
  download_speech,
  text_to_speech
}
