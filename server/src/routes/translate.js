const express = require('express');

const router = express.Router();

// MyMemory is a free translation API — no API key, no billing account.
// It's rate-limited (roughly 5,000 words/day for anonymous requests) and,
// because Odia<->English is a low-resource pair, quality can be inconsistent
// on longer or more idiomatic sentences. Good for a free demo; swap this
// route for a self-hosted engine like AI4Bharat's IndicTrans2 if you need
// more consistent quality later.
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

// POST /api/translate
// Body: { text: string }
// Returns: { translated: string }
router.post('/', async (req, res, next) => {
  try {
    const { text } = req.body || {};
    if (!text || !text.trim()) {
      const err = new Error('No text provided');
      err.status = 400;
      err.publicMessage = 'There is no text to translate.';
      throw err;
    }

    const url = `${MYMEMORY_URL}?q=${encodeURIComponent(text)}&langpair=or|en`;
    const apiRes = await fetch(url);
    if (!apiRes.ok) {
      const err = new Error(`MyMemory responded with ${apiRes.status}`);
      err.status = 502;
      err.publicMessage = 'The translation service is temporarily unavailable.';
      throw err;
    }

    const data = await apiRes.json();
    const translated = data && data.responseData && data.responseData.translatedText;
    if (!translated) {
      const err = new Error('Empty translation response');
      err.status = 502;
      err.publicMessage = 'Translation came back empty — try again.';
      throw err;
    }

    res.json({ translated });
  } catch (err) {
    if (!err.publicMessage) err.publicMessage = 'Translation failed.';
    next(err);
  }
});

module.exports = router;
