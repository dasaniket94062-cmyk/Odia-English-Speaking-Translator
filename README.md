# Odia → English Spoken Translator

A full-stack cascade speech pipeline:

```
your voice (Odia)
   │  MediaRecorder captures audio in the browser
   ▼
Google Cloud Speech-to-Text (or-IN)  →  Odia text
   ▼
Google Cloud Translation (or → en)   →  English text
   ▼
Google Cloud Text-to-Speech (en-IN)  →  spoken English
```

Each stage is a plain REST endpoint, so you can review or fix the text between
stages, or swap any one provider out without touching the others.

## 1. Google Cloud setup

1. Create a Google Cloud project (or use an existing one).
2. Enable three APIs in that project: **Cloud Speech-to-Text**, **Cloud Translation**, **Cloud Text-to-Speech**.
3. Create a **service account** with a role that can call these APIs (e.g. "Cloud Speech Client", "Cloud Translation API User", "Cloud Text-to-Speech User" — or the broader "Editor" role for a quick start).
4. Create a JSON key for that service account and download it.
5. Put that file at `server/google-service-account.json` (or anywhere you like — just point `GOOGLE_APPLICATION_CREDENTIALS` at it).

Billing must be enabled on the project — these APIs aren't free past a small monthly quota, but that quota is generous for testing.

## 2. Configure the server

```bash
cd server
cp .env.example .env
# edit .env: set GOOGLE_APPLICATION_CREDENTIALS to the path of your key file
npm install
```

## 3. Run it

```bash
npm start
```

Open `http://localhost:8080`. The frontend is served by the same Express
server, so there's nothing separate to deploy.

**Note on microphone access:** browsers only allow `getUserMedia` (microphone
recording) on `localhost` or over HTTPS. That's fine for local development;
once you deploy this publicly, put it behind HTTPS (most hosts — Render,
Railway, Fly.io, a reverse proxy with Let's Encrypt — do this for you).

## Project layout

```
server/
  server.js                 Express app, mounts the three API routes
  src/routes/transcribe.js  POST /api/transcribe  — audio  -> Odia text
  src/routes/translate.js   POST /api/translate   — Odia text -> English text
  src/routes/synthesize.js  POST /api/synthesize  — English text -> MP3 audio
  src/services/googleClients.js   shared Google Cloud client setup
public/
  index.html, style.css, app.js   the frontend UI
```

## Swapping providers

Each route file only talks to Google Cloud through the small client in
`googleClients.js`. To use Azure Speech, AWS, or an open model like
AI4Bharat's IndicTrans2 instead, you only need to change the body of the
relevant route — the frontend and the other two stages don't need to know.

## Things to harden before real production use

- **Rate limiting / auth** on the API routes — right now anyone who can reach
  the server can rack up your Google Cloud bill.
- **File size / duration limits** on uploaded audio (a basic limit is already
  set in `transcribe.js`, tune it for your use case).
- **Logging & monitoring** for failed requests, so you notice API quota or
  billing issues quickly.
- **A CDN or build step** for the frontend if it grows past a single page.
