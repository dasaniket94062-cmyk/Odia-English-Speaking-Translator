const odiaText = document.getElementById('odiaText');
const englishText = document.getElementById('englishText');
const micBtn = document.getElementById('micBtn');
const micLabel = document.getElementById('micLabel');
const translateBtn = document.getElementById('translateBtn');
const speakBtn = document.getElementById('speakBtn');
const autoFlow = document.getElementById('autoFlow');
const statusLine = document.getElementById('statusLine');
const player = document.getElementById('player');
const stageAsr = document.getElementById('stageAsr');
const stageMt = document.getElementById('stageMt');
const stageTts = document.getElementById('stageTts');

function setStatus(msg, isError){
  statusLine.textContent = msg;
  statusLine.classList.toggle('error', !!isError);
}
function setStage(el, state){
  [stageAsr, stageMt, stageTts].forEach(s => s.classList.remove('active'));
  if(state === 'active') el.classList.add('active');
  if(state === 'done'){ el.classList.remove('active'); el.classList.add('done'); }
}
function resetStages(){
  [stageAsr, stageMt, stageTts].forEach(s => s.classList.remove('active','done'));
}
async function readError(res){
  try{ const data = await res.json(); return data.error || res.statusText; }
  catch{ return res.statusText; }
}

// ---------- Recording (mic -> WebM/Opus blob) ----------
let mediaRecorder = null;
let chunks = [];
let recording = false;

async function startRecording(){
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
  chunks = [];

  mediaRecorder.ondataavailable = (e) => { if(e.data.size > 0) chunks.push(e.data); };
  mediaRecorder.onstop = async () => {
    stream.getTracks().forEach(t => t.stop());
    const blob = new Blob(chunks, { type: 'audio/webm' });
    await transcribe(blob);
  };

  mediaRecorder.start();
  recording = true;
  micBtn.classList.add('listening');
  micLabel.textContent = 'Recording… tap to stop';
  setStage(stageAsr, 'active');
  setStatus('Recording — speak in Odia, then tap to stop.');
}

function stopRecording(){
  if(mediaRecorder && recording){
    mediaRecorder.stop();
    recording = false;
    micBtn.classList.remove('listening');
    micLabel.textContent = 'Record Odia';
  }
}

micBtn.addEventListener('click', async () => {
  if(recording){ stopRecording(); return; }
  odiaText.value = '';
  englishText.value = '';
  resetStages();
  try{
    await startRecording();
  }catch(err){
    setStatus('Could not access the microphone: ' + err.message, true);
  }
});

// ---------- ASR ----------
async function transcribe(blob){
  setStatus('Transcribing Odia speech…');
  const form = new FormData();
  form.append('audio', blob, 'speech.webm');

  try{
    const res = await fetch('/api/transcribe', { method: 'POST', body: form });
    if(!res.ok) throw new Error(await readError(res));
    const data = await res.json();
    odiaText.value = data.text;
    setStage(stageAsr, 'done');
    setStatus('Transcribed. Review the Odia text, then translate.');
    if(autoFlow.checked) translate();
  }catch(err){
    setStage(stageAsr, null);
    setStatus('Transcription failed: ' + err.message, true);
  }
}

// ---------- MT ----------
async function translate(){
  const text = odiaText.value.trim();
  if(!text){ setStatus('Nothing to translate yet.', true); return; }

  translateBtn.disabled = true;
  setStage(stageMt, 'active');
  setStatus('Translating Odia → English…');

  try{
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if(!res.ok) throw new Error(await readError(res));
    const data = await res.json();
    englishText.value = data.translated;
    setStage(stageMt, 'done');
    setStatus('Translated. Speak it, or edit first.');
    if(autoFlow.checked) speak();
  }catch(err){
    setStage(stageMt, null);
    setStatus('Translation failed: ' + err.message, true);
  }finally{
    translateBtn.disabled = false;
  }
}
translateBtn.addEventListener('click', translate);

// ---------- TTS ----------
async function speak(){
  const text = englishText.value.trim();
  if(!text){ setStatus('Nothing to speak yet.', true); return; }

  speakBtn.disabled = true;
  setStage(stageTts, 'active');
  setStatus('Synthesizing speech…');

  try{
    const res = await fetch('/api/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if(!res.ok) throw new Error(await readError(res));
    const blob = await res.blob();
    player.src = URL.createObjectURL(blob);
    await player.play();
    setStage(stageTts, 'done');
    setStatus('Speaking…');
    player.onended = () => setStatus('Done.');
  }catch(err){
    setStage(stageTts, null);
    setStatus('Speech synthesis failed: ' + err.message, true);
  }finally{
    speakBtn.disabled = false;
  }
}
speakBtn.addEventListener('click', speak);
