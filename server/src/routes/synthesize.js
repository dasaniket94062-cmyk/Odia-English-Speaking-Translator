const express = require('express');
const { ttsClient } = require('../services/googleClients');

const router = express.Router();

// POST /api/synthesize
// Body: { text: string }
// Returns: audio/mpeg binary (an MP3 file), played directly by the browser
router.post('/', async (req, res, next) => {
  try {
    const { text } = req.body || {};
    if (!text || !text.trim()) {
      const err = new Error('No text provided');
      err.status = 400;
      err.publicMessage = 'There is no text to speak.';
      throw err;
    }

    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: 'en-IN',
        ssmlGender: 'FEMALE'
        // Swap to a named Neural2/Wavenet voice for a more natural result, e.g.:
        // name: 'en-IN-Neural2-A'
      },
      audioConfig: { audioEncoding: 'MP3' }
    });

    res.set('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);
  } catch (err) {
    if (!err.publicMessage) err.publicMessage = 'Speech synthesis failed.';
    next(err);
  }
});

module.exports = router;
