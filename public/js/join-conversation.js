import { createAutoVoiceTurn } from '../voice-turn.js?v=1.5.3';
import { playBase64Audio, unlockAudioPlayback } from '../audio-playback.js?v=1.5.3';
import { LANGUAGES } from '../languages.js?v=1.5.3';

const code = location.pathname.split('/').filter(Boolean).pop()?.toUpperCase() || '';
const token = new URLSearchParams(location.hash.replace(/^#/, '')).get('token') || new URLSearchParams(location.search).get('token') || '';
const loading = document.querySelector('#room-loading');
const app = document.querySelector('#room-app');
const errorBox = document.querySelector('#room-error');
const errorCopy = document.querySelector('#room-error-copy');
const talk = document.querySelector('#room-talk');
const status = document.querySelector('#room-status');
const transcript = document.querySelector('#room-transcript');
let room = null;
let syncTimer = null;
let syncBusy = false;
let cursor = 0;
let capture = null;
let busy = false;

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'No fue posible completar la solicitud.');
  return payload;
}

function showError(message) {
  loading?.classList.add('is-hidden');
  app?.classList.add('is-hidden');
  errorBox?.classList.remove('is-hidden');
  if (errorCopy) errorCopy.textContent = message;
}

function addTurn(turn) {
  if (!transcript || !turn?.originalText) return;
  const mine = turn.speaker === 'guest';
  const item = document.createElement('article');
  item.className = `room-turn ${mine ? 'mine' : 'theirs'}`;
  const label = document.createElement('span');
  label.textContent = mine ? 'TÚ' : 'OTRA PERSONA';
  const original = document.createElement('p');
  original.textContent = turn.originalText;
  const translated = document.createElement('strong');
  translated.textContent = turn.translatedText;
  item.append(label, original, translated);
  transcript.appendChild(item);
  transcript.scrollTop = transcript.scrollHeight;
  if (turn.targetLanguage === room?.guestLanguage && turn.audioBase64) {
    unlockAudioPlayback().then(() => playBase64Audio(turn.audioBase64)).catch(() => {});
  }
}

function stopSync() {
  if (syncTimer) window.clearInterval(syncTimer);
  syncTimer = null;
  syncBusy = false;
}

async function syncRoom() {
  if (!room || syncBusy || talk.disabled && status?.dataset?.state === 'closed') return;
  syncBusy = true;
  try {
    const payload = await request(`/api/public/conversations/${encodeURIComponent(code)}/sync?role=guest&after=${cursor}`, { headers: { 'X-SB-Conversation-Token': token } });
    cursor = Math.max(cursor, Number(payload.cursor || 0));
    status.textContent = 'Conectado · ya puedes hablar';
    status.dataset.state = 'connected';
    for (const item of payload.events || []) {
      if (item.event === 'turn') addTurn(item.payload);
      if (item.event === 'room-closed') {
        status.textContent = 'La conversación terminó';
        status.dataset.state = 'closed';
        talk.disabled = true;
        stopSync();
      }
    }
  } catch (error) {
    if (/expiró|terminó|no es válido/i.test(String(error?.message || ''))) {
      status.textContent = 'La conversación terminó o expiró';
      status.dataset.state = 'closed';
      talk.disabled = true;
      stopSync();
    } else {
      status.textContent = 'Reconectando portal público…';
      status.dataset.state = 'waiting';
    }
  } finally { syncBusy = false; }
}

function connectEvents() {
  stopSync();
  cursor = 0;
  syncRoom();
  syncTimer = window.setInterval(syncRoom, 1200);
}

async function recordTurn() {
  if (busy || !room) return;
  try {
    busy = true;
    talk.disabled = true;
    await unlockAudioPlayback();
    capture = await createAutoVoiceTurn({
      onState(mode) {
        talk.querySelector('strong').textContent = mode === 'thinking' ? 'Pensando…' : mode === 'processing' ? 'Traduciendo…' : 'Escuchando…';
      }
    });
    const blob = await capture.promise;
    const form = new FormData();
    form.append('audio', blob, 'qr-guest.webm');
    form.append('role', 'guest');
    form.append('token', token);
    await request(`/api/public/conversations/${encodeURIComponent(code)}/interpret`, { method: 'POST', body: form });
  } catch (error) {
    if (error.name !== 'AbortError') status.textContent = error.message || 'No pudimos traducir este turno.';
  } finally {
    capture = null;
    busy = false;
    talk.disabled = false;
    talk.querySelector('strong').textContent = 'Hablar';
  }
}

try {
  if (!code || !token) throw new Error('El enlace está incompleto. Pide un QR nuevo.');
  room = await request(`/api/public/conversations/${encodeURIComponent(code)}?role=guest`, { headers: { 'X-SB-Conversation-Token': token } });
  document.querySelector('#room-code').textContent = `CÓDIGO ${room.code}`;
  document.querySelector('#room-my-language').textContent = LANGUAGES[room.guestLanguage] || room.guestLanguage;
  document.querySelector('#room-other-language').textContent = LANGUAGES[room.hostLanguage] || room.hostLanguage;
  loading.classList.add('is-hidden');
  app.classList.remove('is-hidden');
  talk.addEventListener('click', recordTurn);
  connectEvents();
} catch (error) { showError(error.message); }
