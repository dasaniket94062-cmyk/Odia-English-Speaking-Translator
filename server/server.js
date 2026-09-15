require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const transcribeRoute = require('./src/routes/transcribe');
const translateRoute = require('./src/routes/translate');
const synthesizeRoute = require('./src/routes/synthesize');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' }));

// API routes — one per pipeline stage
app.use('/api/transcribe', transcribeRoute);   // Odia speech  -> Odia text
app.use('/api/translate', translateRoute);     // Odia text    -> English text
app.use('/api/synthesize', synthesizeRoute);   // English text -> English speech

// Serve the frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Basic health check, useful for uptime monitors / load balancers
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Centralized error handler so route handlers can just throw
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.publicMessage || 'Something went wrong on the server.'
  });
});

app.listen(PORT, () => {
  console.log(`Odia -> English translator server running on http://localhost:${PORT}`);
});
