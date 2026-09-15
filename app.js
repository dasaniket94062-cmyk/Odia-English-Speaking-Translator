const odiaText = document.getElementById('odiaText');
const englishText = document.getElementById('englishText');
const micBtn = document.getElementById('micBtn');
const micLabel = document.getElementById('micLabel');
const translateBtn = document.getElementById('translateBtn');
const speakBtn = document.getElementById('speakBtn');
const autoFlow = document.getElementById('autoFlow');
const statusLine = document.getElementById('statusLine');
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

// ---------- ASR (free, runs in the browser) ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;

if(SR){
  recognition = new SR();
  recognition.lang = 'or-IN';
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    listening = true;
    micBtn.classList.add('listening');
    micLabel.textContent = 'Listening…';
    setStage(stageAsr, 'active');
    setStatus('Listening for Odia speech…');
  };

  recognition.onresult = (e) => {
    let finalText = '';
    let interim = '';
    for(let i = 0; i < e.results.length; i++){
      const t = e.results[i][0].transcript;
      if(e.results[i].isFinal) finalText += t;
      else interim += t;
    }
    odiaText.value = (finalText || interim).trim();
  };

  recognition.onerror = (e) => {
    setStatus('Speech recognition error: ' + e.error + '. You can type Odia text instead.', true);
  };

  recognition.onend = () => {
    listening = false;
    micBtn.classList.remove('listening');
    micLabel.textContent = 'Speak Odia';
    setStage(stageAsr, 'done');
    if(odiaText.value.trim()){
      setStatus('Transcribed. Review the Odia text, then translate.');
      if(autoFlow.checked) translate();
    } else {
      setStatus('No speech captured — try again or type the Odia text.');
    }
  };
} else {
  micBtn.disabled = true;
  micLabel.textContent = 'Mic not supported here';
  setStatus('Your browser doesn\'t support speech recognition — type Odia text below instead.', true);
}

micBtn.addEventListener('click', () => {
  if(!recognition) return;
  if(listening){ recognition.stop(); return; }
  odiaText.value = '';
  englishText.value = '';
  resetStages();
  try{ recognition.start(); }
  catch(err){ setStatus('Could not start microphone: ' + err.message, true); }
});

// ---------- MT (backend call -> free MyMemory API) ----------
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

// ---------- TTS (free, runs in the browser) ----------
function speak(){
  const text = englishText.value.trim();
  if(!text){ setStatus('Nothing to speak yet.', true); return; }
  if(!('speechSynthesis' in window)){
    setStatus('Speech synthesis isn\'t supported in this browser.', true);
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-IN';
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang && v.lang.startsWith('en'));
  if(enVoice) utter.voice = enVoice;

  utter.onstart = () => { setStage(stageTts, 'active'); setStatus('Speaking…'); };
  utter.onend = () => { setStage(stageTts, 'done'); setStatus('Done.'); };
  utter.onerror = () => { setStatus('Could not play speech audio.', true); };

  window.speechSynthesis.speak(utter);
}
speakBtn.addEventListener('click', speak);
if('speechSynthesis' in window){
  window.speechSynthesis.onvoiceschanged = () => {};
}
