# Odia → English Spoken Translator (free-services edition)

A full-stack cascade speech pipeline, built entirely on free services:

```
your voice (Odia)
   │  Browser's built-in Speech Recognition (or-IN)
   ▼
Odia text
   │  POST /api/translate  ->  MyMemory free translation API (or -> en)
   ▼
English text
   │  Browser's built-in Speech Synthesis
   ▼
spoken English
```

Speech recognition and speech synthesis run entirely client-side (free, no
API key, no server round trip). The backend's only job is the translation
step — a small Express server that calls MyMemory, a free public
translation API.

## Why it's split this way

There's no free, no-billing-account API for Odia speech-to-text or
text-to-speech from the major cloud providers — Google/Azure/AWS all
require a linked billing account even within a free quota. The browser's
built-in Speech Recognition and Speech Synthesis APIs are genuinely free
and need no setup, so ASR and TTS run there. Translation is different:
MyMemory offers a real free public API with no account needed, so that
stage runs on the backend, which also means you can swap the translation
engine later without touching the frontend.

## 1. Run it

```bash
cd server
cp .env.example .env
npm install
npm start
```

Open `http://localhost:8080` in **Chrome** (best support for Odia speech
recognition; other browsers may not support the `or-IN` locale at all —
type into the Odia box as a fallback).

## 2. Try it

Click **Speak Odia**, allow microphone access, say a sentence, then click
again to stop. With "Auto-run the pipeline" checked, it transcribes,
translates, and speaks automatically — or you can review and edit the text
at each stage first.

## Known limitations of the free stack

- **ASR quality varies by browser/OS.** Odia isn't as well supported as
  major world languages in browser speech recognition. The Odia transcript
  box is always editable so you can fix mistakes before translating.
- **MyMemory is rate-limited** (roughly 5,000 words/day for anonymous
  requests) and, since Odia↔English is a low-resource language pair,
  translation quality can be inconsistent on longer or idiomatic sentences.
- **Browser TTS voices** for English are functional but not especially
  natural-sounding — quality depends on what voices your OS ships with.

## Upgrading a stage later (still free, more setup)

Each stage is isolated, so any one can be swapped without touching the
others:

- **ASR** — AI4Bharat's open-source `indicwav2vec-odia` or
  `indic-conformer-600m-multilingual` models are trained specifically on
  Odia and free to self-host, but need you to run a Python model server
  with real compute (GPU recommended).
- **MT** — AI4Bharat's `IndicTrans2` is tuned specifically for Indic
  languages and outperforms general-purpose engines on Odia; also free to
  self-host, same compute caveat.
- **TTS** — AI4Bharat's `IndicF5` supports natural Odia and other Indic
  voices if you later want the pipeline to speak Odia rather than just
  transcribe it; for English output, browser TTS is usually sufficient.

If you want a paid, zero-setup option instead, Google Cloud's
Speech-to-Text / Translation / Text-to-Speech APIs (covered in the
previous version of this project) are simpler to wire up and don't need
a Python model server — just a billing account.

## Project layout

```
server/
  server.js                 Express app, serves the frontend + /api/translate
  src/routes/translate.js   POST /api/translate — Odia text -> English text (MyMemory)
public/
  index.html, style.css, app.js   the frontend UI (ASR + TTS run here)
```

## Things to harden before real production use

- **Rate limiting** on `/api/translate` — MyMemory's free tier is shared,
  so a busy app could hit the daily limit quickly.
- **A fallback translation provider** for when MyMemory is unavailable or
  rate-limited.
- **HTTPS in production** — browsers only allow microphone access
  (`getUserMedia`/speech recognition) on `localhost` or over HTTPS.
