// Single place to construct Google Cloud clients, so credentials are
// loaded once and every route shares the same client instances.
//
// Auth is picked up automatically from the GOOGLE_APPLICATION_CREDENTIALS
// environment variable (see .env.example), per Google Cloud's standard
// Application Default Credentials flow.

const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const { Translate } = require('@google-cloud/translate').v2;

const speechClient = new speech.SpeechClient();
const ttsClient = new textToSpeech.TextToSpeechClient();
const translateClient = new Translate();

module.exports = { speechClient, ttsClient, translateClient };
