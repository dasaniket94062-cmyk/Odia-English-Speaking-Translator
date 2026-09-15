const express = require('express');
const multer = require('multer');
const { speechClient } = require('../services/googleClients');

const router = express.Router();

// Keep uploaded audio in memory only — nothing written to disk, nothing retained after the request.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB is generous for a short utterance
});

// POST /api/transcribe
// Body: multipart/form-data with a single field "audio" (webm/opus from the browser's MediaRecorder)
// Returns: { text: string }
router.post('/', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No audio file provided');
      err.status = 400;
      err.publicMessage = 'No audio was received. Try recording again.';
      throw err;
    }

    const [response] = await speechClient.recognize({
      audio: { content: req.file.buffer.toString('base64') },
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'or-IN',
        // If the speaker code-switches into English mid-sentence (common in India),
        // this lets the recognizer fall back gracefully instead of failing outright.
        alternativeLanguageCodes: ['en-IN'],
        enableAutomaticPunctuation: true
      }
    });

    const text = (response.results || [])
      .map(r => r.alternatives[0].transcript)
      .join(' ')
      .trim();

    if (!text) {
      const err = new Error('No speech detected');
      err.status = 422;
      err.publicMessage = 'No speech was recognized in that recording. Try again, speaking clearly.';
      throw err;
    }

    res.json({ text });
  } catch (err) {
    if (!err.publicMessage) err.publicMessage = 'Speech recognition failed.';
    next(err);
  }
});

module.exports = router;
