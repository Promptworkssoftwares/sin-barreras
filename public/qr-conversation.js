import { playBase64Audio, unlockAudioPlayback } from './audio-playback.js?v=1.5.4';

export function initQrConversation({ notify, request, languages, createAutoVoiceTurn, getDefaults } = {}) {
  const dialog = document.querySelector('#qr-conversation-dialog');
  const openButton = document.querySelector('#open-qr-conversation');
  const createButton = document.querySelector('#create-qr-room');
  const endButton = document.querySelector('#end-qr-room');
  const hostLanguage = document.querySelector('#qr-host-language');
  const guestLanguage = document.querySelector('#qr-guest-language');
  const setup = document.querySelector('#qr-room-setup');
  const active = document.querySelector('#qr-room-active');
  const code = document.querySelector('#qr-room-code');
  const link = document.querySelector('#qr-room-link');
  const qr = document.querySelector('#qr-code');
  const status = document.querySelector('#qr-room-status');
  const transcript = document.querySelector('#qr-room-transcript');
  const talkButton = document.querySelector('#qr-room-talk');
  const copyLink = document.querySelector('#qr-copy-link');
  const shareLink = document.querySelector('#qr-share-link');
  let room = null;
  let syncTimer = null;
  let syncBusy = false;
  let cursor = 0;
  let capture = null;
  let busy = false;

  const entries = () => Object.entries(languages || {}).sort((a, b) => String(a[1]).localeCompare(String(b[1])));
  const populate = (select) => {
    if (!select || select.options.length > 1) return;
    for (const [value, label] of entries()) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    }
  };

  function setStatus(text, kind = 'idle') {
    if (!status) return;
    status.textContent = text;
    status.dataset.state = kind;
  }

  function resetRoom() {
    capture?.cancel?.();
    capture = null;
    if (syncTimer) window.clearInterval(syncTimer);
    syncTimer = null;
    syncBusy = false;
    cursor = 0;
    room = null;
    busy = false;
    setup?.classList.remove('is-hidden');
    active?.classList.add('is-hidden');
    if (transcript) transcript.innerHTML = '';
    if (qr) qr.replaceChildren();
    setStatus('Esperando crear una conversación.');
  }

  function renderTurn(turn) {
    if (!transcript || !turn?.originalText) return;
    const mine = turn.speaker === 'host';
    const article = document.createElement('article');
    article.className = `qr-turn ${mine ? 'mine' : 'theirs'}`;
    article.innerHTML = `<span>${mine ? 'TÚ' : 'OTRA PERSONA'}</span><p>${escapeHtml(turn.originalText)}</p><strong>${escapeHtml(turn.translatedText)}</strong>`;
    transcript.appendChild(article);
    transcript.scrollTop = transcript.scrollHeight;
    if (room && turn.targetLanguage === room.hostLanguage && turn.audioBase64) {
      unlockAudioPlayback().then(() => playBase64Audio(turn.audioBase64)).catch(() => {});
    }
  }

  function stopSync() {
    if (syncTimer) window.clearInterval(syncTimer);
    syncTimer = null;
    syncBusy = false;
  }

  async function syncRoom() {
    if (!room || syncBusy) return;
    syncBusy = true;
    try {
      const payload = await request(`/api/public/conversations/${encodeURIComponent(room.code)}/sync?role=host&after=${cursor}`, { headers: { 'X-SB-Conversation-Token': room.hostToken } });
      cursor = Math.max(cursor, Number(payload.cursor || 0));
      if (payload.room?.guestConnected) setStatus('La otra persona está conectada.', 'connected');
      else setStatus('Sala pública activa · comparte el QR.', 'ready');
      for (const item of payload.events || []) {
        if (item.event === 'turn') renderTurn(item.payload);
        if (item.event === 'room-closed') {
          setStatus('Conversación terminada.', 'closed');
          stopSync();
        }
      }
    } catch (error) {
      if (/expiró|terminó|no es válido/i.test(String(error?.message || ''))) {
        setStatus('Conversación terminada o expirada.', 'closed');
        stopSync();
        if (talkButton) talkButton.disabled = true;
      } else if (room) setStatus('Reconectando portal público…', 'waiting');
    } finally { syncBusy = false; }
  }

  function connectEvents() {
    stopSync();
    cursor = 0;
    syncRoom();
    syncTimer = window.setInterval(syncRoom, 1200);
  }

  function drawQr(url) {
    if (!qr) return;
    qr.replaceChildren();
    if (typeof window.QRCode !== 'function') {
      qr.innerHTML = '<p class="qr-fallback">No pude dibujar el QR. Usa el enlace para compartir.</p>';
      return;
    }
    new window.QRCode(qr, { text: url, width: 220, height: 220, correctLevel: window.QRCode.CorrectLevel?.M });
  }

  async function createRoom() {
    if (!hostLanguage?.value || !guestLanguage?.value || hostLanguage.value === guestLanguage.value) {
      notify?.('Selecciona dos idiomas distintos.');
      return;
    }
    try {
      createButton.disabled = true;
      createButton.textContent = 'Creando conversación…';
      const defaults = getDefaults?.() || {};
      room = await request('/api/conversations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostLanguage: hostLanguage.value, guestLanguage: guestLanguage.value, situation: defaults.situation || 'everyday', voice: defaults.voice || 'coral' })
      });
      setup?.classList.add('is-hidden');
      active?.classList.remove('is-hidden');
      if (code) code.textContent = room.code;
      if (link) { link.textContent = room.joinUrl; link.href = room.joinUrl; }
      drawQr(room.joinUrl);
      setStatus('Sala activa · comparte el QR.', 'ready');
      connectEvents();
    } catch (error) { notify?.(error.message || 'No pudimos crear la conversación.'); resetRoom(); }
    finally { createButton.disabled = false; createButton.textContent = 'Crear conversación por QR'; }
  }

  async function recordTurn() {
    if (!room || busy) return;
    try {
      busy = true;
      talkButton.disabled = true;
      talkButton.textContent = 'Escuchando…';
      await unlockAudioPlayback();
      capture = await createAutoVoiceTurn({
        onState(mode) {
          talkButton.textContent = mode === 'thinking' ? 'Pensando…' : mode === 'processing' ? 'Traduciendo…' : 'Escuchando…';
        }
      });
      const blob = await capture.promise;
      const form = new FormData();
      form.append('audio', blob, 'qr-host.webm');
      form.append('role', 'host');
      form.append('token', room.hostToken);
      await request(`/api/public/conversations/${encodeURIComponent(room.code)}/interpret`, { method: 'POST', body: form });
    } catch (error) { if (error.name !== 'AbortError') notify?.(error.message || 'No pudimos enviar tu voz.'); }
    finally {
      capture = null;
      busy = false;
      talkButton.disabled = false;
      talkButton.textContent = '● Hablar desde este teléfono';
    }
  }

  async function endRoom() {
    if (!room) return resetRoom();
    try { await request(`/api/conversations/${encodeURIComponent(room.code)}`, { method: 'DELETE' }); }
    catch { /* room may already be expired */ }
    resetRoom();
  }

  populate(hostLanguage);
  populate(guestLanguage);
  openButton?.addEventListener('click', () => {
    const defaults = getDefaults?.() || {};
    hostLanguage.value = defaults.hostLanguage && languages?.[defaults.hostLanguage] ? defaults.hostLanguage : 'es';
    guestLanguage.value = defaults.guestLanguage && languages?.[defaults.guestLanguage] ? defaults.guestLanguage : (hostLanguage.value === 'en' ? 'es' : 'en');
    if (hostLanguage.value === guestLanguage.value) guestLanguage.value = hostLanguage.value === 'en' ? 'es' : 'en';
    dialog?.showModal();
  });
  createButton?.addEventListener('click', createRoom);
  talkButton?.addEventListener('click', recordTurn);
  endButton?.addEventListener('click', endRoom);
  copyLink?.addEventListener('click', async () => {
    if (!room?.joinUrl) return;
    await navigator.clipboard.writeText(room.joinUrl);
    notify?.('Enlace copiado.');
  });
  shareLink?.addEventListener('click', async () => {
    if (!room?.joinUrl) return;
    if (navigator.share) await navigator.share({ title: 'Conversación Sin Barreras', text: `Únete a mi conversación con Sin Barreras. Código ${room.code}`, url: room.joinUrl });
    else { await navigator.clipboard.writeText(room.joinUrl); notify?.('Enlace copiado.'); }
  });
  dialog?.addEventListener('close', () => { if (!room) resetRoom(); });
  return { resetRoom };
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}
