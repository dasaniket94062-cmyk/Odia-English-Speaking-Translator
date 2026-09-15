require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const translateRoute = require('./src/routes/translate');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '256kb' }));

// Speech-to-text and text-to-speech happen entirely in the browser (free,
// no server round trip needed). The backend's job is just the translation
// step, so it's easy to swap the translation engine later without touching
// the frontend at all.
app.use('/api/translate', translateRoute); // Odia text -> English text

// Serve the frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.publicMessage || 'Something went wrong on the server.'
  });
});

app.listen(PORT, () => {
  console.log(`Odia -> English translator server running on http://localhost:${PORT}`);
});
