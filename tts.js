const textToSpeech = require('@google-cloud/text-to-speech');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const util = require('util');

function hash(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

const folder = "/Users/bas/Library/Application Support/Anki2/User 1/collection.media"

function createFilename(text) {
  return `gcloud-${hash(text)}.mp3`;
}

function createFilepath(text) {
  const filename = `gcloud-${hash(text)}.mp3`;

  return path.join(folder, filename);
}

const client = new textToSpeech.TextToSpeechClient();

async function tts(text) {

  const request = {
    input: {text: text},
    voice: {
      languageCode: "ja-JP",
      name: "ja-JP-Neural2-C",
      ssmlGender: 'MALE'
    },
    audioConfig: {audioEncoding: 'MP3'},
  };

  const [response] = await client.synthesizeSpeech(request);
  const writeFile = util.promisify(fs.writeFile);
  const filename = createFilename(text);
  const filepath = path.join(folder, filename);
  await writeFile(filepath, response.audioContent, 'binary');
  console.log(`Wrote audio to: ${filepath}`);
  return filename;
}

module.exports = {hash, tts};