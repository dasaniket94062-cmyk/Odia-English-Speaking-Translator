const express = require('express');
const { translateClient } = require('../services/googleClients');

const router = express.Router();

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

    const [translated] = await translateClient.translate(text, {
      from: 'or',
      to: 'en'
    });

    res.json({ translated });
  } catch (err) {
    if (!err.publicMessage) err.publicMessage = 'Translation failed.';
    next(err);
  }
});

module.exports = router;
