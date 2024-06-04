const {download_speech, text_to_speech} = require('../src/tts');

describe('text to speech', () => {
  test('regular', async () => {
    let result = await text_to_speech("未来は未来")
    expect(result.Error).toBe(0)
  });
  test('download', async () => {
    await download_speech("未来は未来")
  });
});
