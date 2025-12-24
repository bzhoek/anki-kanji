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

function createRequest(text) {
  const request = {
    input: {text: text},
    voice: {
      languageCode: "ja-JP",
      name: "ja-JP-Neural2-C",
      ssmlGender: 'MALE'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      effectsProfileId: ['headphone-class-device'],
      speakingRate: 1.0
    },
  };

  if (text.length > 10) {
    request.audioConfig.speakingRate = 0.75
  }

  return request;
}

async function tts(text) {
  const request = createRequest(text);
  const hashValue = hash(JSON.stringify(request));
  const filename =  `gcloud-${hashValue}.mp3`;
  const filepath = path.join(folder, filename);
  if (fs.existsSync(filepath)) {
    console.log(`File exists ${filename} for ${text}`);
    return filename;
  }

  const [response] = await client.synthesizeSpeech(request);
  const writeFile = util.promisify(fs.writeFile);
  await writeFile(filepath, response.audioContent, 'binary');
  console.log(`Wrote audio to ${filename} for ${text}`);
  return filename;
}

function unpackCloze(cloze) {
  const regex = /(.*?)({{.*?::)(.*?)(::.+)?(}})/g;
  return cloze.replaceAll(regex, "$1$3")
}

module.exports = {hash, tts, createRequest, unpackCloze};