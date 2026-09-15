import { guidedScroll, guidedTop } from './navigation-flow.js?v=1.5.2';

const SOUND_STATE_KEY = 'sinBarreras.sounds.v1';

const VOWELS = [
  { id:'i-long', symbol:'iː', word:'see', cue:'Sonido largo y tenso.', tip:'Sonríe ligeramente y mantén la lengua alta y al frente.', example:'I can see it clearly.' },
  { id:'i-short', symbol:'ɪ', word:'sit', cue:'Sonido corto y relajado.', tip:'Relaja la mandíbula. Es más corto que el sonido de “see”.', example:'Please sit here.' },
  { id:'e', symbol:'ɛ', word:'bed', cue:'E abierta y corta.', tip:'Abre un poco la boca y mantén la lengua relajada.', example:'The book is on the bed.' },
  { id:'ae', symbol:'æ', word:'cat', cue:'A muy abierta.', tip:'Baja la mandíbula más que para una “e”; la lengua queda al frente.', example:'The cat is outside.' },
  { id:'uh', symbol:'ʌ', word:'cup', cue:'Sonido central y corto.', tip:'Relaja labios y lengua. No redondees los labios.', example:'I need a cup of water.' },
  { id:'ah', symbol:'ɑ', word:'hot', cue:'A profunda y abierta.', tip:'Abre bien la mandíbula y lleva la lengua ligeramente hacia atrás.', example:'The coffee is hot.' },
  { id:'aw', symbol:'ɔ', word:'law', cue:'Sonido redondeado.', tip:'Redondea suavemente los labios y mantén la lengua atrás.', example:'That is the law.' },
  { id:'book', symbol:'ʊ', word:'book', cue:'U corta.', tip:'Redondea poco los labios. Es más corto que “food”.', example:'This is a good book.' },
  { id:'food', symbol:'uː', word:'food', cue:'U larga.', tip:'Redondea los labios y sostén el sonido un poco más.', example:'The food is ready.' },
  { id:'bird', symbol:'ɝ', word:'bird', cue:'Vocal con R americana.', tip:'Lleva la lengua hacia atrás sin tocar el paladar y no muevas mucho la mandíbula.', example:'I can hear a bird.' },
  { id:'schwa', symbol:'ə', word:'about', cue:'El sonido más relajado del inglés.', tip:'Déjalo muy corto y neutral. Suele aparecer en sílabas sin énfasis.', example:'Tell me about your job.' },
  { id:'day', symbol:'eɪ', word:'day', cue:'Desliza de E hacia I.', tip:'Empieza abierto y termina con una ligera sonrisa.', example:'Have a good day.' },
  { id:'time', symbol:'aɪ', word:'time', cue:'Desliza de A hacia I.', tip:'Empieza con la boca abierta y ciérrala gradualmente.', example:'What time is it?' },
  { id:'boy', symbol:'ɔɪ', word:'boy', cue:'Desliza de O hacia I.', tip:'Comienza con labios redondeados y termina más estirados.', example:'The boy is waiting.' },
  { id:'now', symbol:'aʊ', word:'now', cue:'Desliza de A hacia U.', tip:'Abre la boca al inicio y redondea los labios al final.', example:'I need it now.' }
];

const CONSONANTS = [
  { id:'p', symbol:'p', word:'pen', cue:'Aire fuerte sin voz.', tip:'Cierra los labios y suelta una pequeña explosión de aire.', example:'I need a pen.' },
  { id:'b', symbol:'b', word:'book', cue:'Como P, pero con voz.', tip:'Cierra los labios y activa la vibración de la garganta.', example:'Open the book.' },
  { id:'t', symbol:'t', word:'time', cue:'Punta de lengua + aire.', tip:'Toca detrás de los dientes superiores y suelta el aire.', example:'What time is it?' },
  { id:'d', symbol:'d', word:'day', cue:'Como T, pero con voz.', tip:'Toca detrás de los dientes superiores y activa la voz.', example:'Have a good day.' },
  { id:'k', symbol:'k', word:'key', cue:'Aire desde la parte posterior.', tip:'La parte trasera de la lengua toca el paladar blando.', example:'I lost my key.' },
  { id:'g', symbol:'g', word:'go', cue:'Como K, pero con voz.', tip:'Usa la parte trasera de la lengua y activa la garganta.', example:'We can go now.' },
  { id:'f', symbol:'f', word:'fish', cue:'Aire entre labio y dientes.', tip:'Apoya suavemente los dientes superiores sobre el labio inferior.', example:'I like fish.' },
  { id:'v', symbol:'v', word:'very', cue:'Como F, pero con vibración.', tip:'Mantén dientes sobre labio inferior y activa la voz.', example:'Thank you very much.' },
  { id:'th-voiceless', symbol:'θ', word:'think', cue:'TH sin voz.', tip:'Saca apenas la punta de la lengua entre los dientes y deja pasar aire.', example:'I think so.' },
  { id:'th-voiced', symbol:'ð', word:'this', cue:'TH con voz.', tip:'La lengua queda entre los dientes, pero la garganta vibra.', example:'This is my phone.' },
  { id:'s', symbol:'s', word:'see', cue:'Aire fino, sin voz.', tip:'Acerca la lengua al borde detrás de los dientes sin tocar.', example:'I can see it.' },
  { id:'z', symbol:'z', word:'zoo', cue:'Como S, pero con voz.', tip:'Mantén la misma posición de S y activa la vibración.', example:'We went to the zoo.' },
  { id:'sh', symbol:'ʃ', word:'shoe', cue:'SH suave.', tip:'Redondea un poco los labios y lleva la lengua ligeramente atrás.', example:'This is my shoe.' },
  { id:'zh', symbol:'ʒ', word:'measure', cue:'SH con voz.', tip:'Usa la posición de SH, pero activa la vibración de la garganta.', example:'Measure it again.' },
  { id:'h', symbol:'h', word:'home', cue:'Aire abierto.', tip:'Deja salir aire desde la garganta sin bloquearlo.', example:'I am going home.' },
  { id:'ch', symbol:'tʃ', word:'chair', cue:'CH inglés.', tip:'Empieza como T y libera el aire como SH.', example:'Sit in the chair.' },
  { id:'j', symbol:'dʒ', word:'job', cue:'J inglesa.', tip:'Empieza como D y libera con vibración parecida a “zh”.', example:'I need a job.' },
  { id:'m', symbol:'m', word:'moon', cue:'Vibración por la nariz.', tip:'Cierra los labios y deja que el sonido salga por la nariz.', example:'Look at the moon.' },
  { id:'n', symbol:'n', word:'nose', cue:'Lengua arriba, aire nasal.', tip:'Toca detrás de los dientes superiores y deja salir el aire por la nariz.', example:'Touch your nose.' },
  { id:'ng', symbol:'ŋ', word:'sing', cue:'NG nasal.', tip:'No pronuncies una G extra. La parte trasera de la lengua queda arriba.', example:'They like to sing.' },
  { id:'l', symbol:'l', word:'lion', cue:'Lengua detrás de los dientes.', tip:'La punta de la lengua toca el borde detrás de los dientes superiores.', example:'The lion is sleeping.' },
  { id:'r', symbol:'ɹ', word:'red', cue:'R inglesa sin vibrar.', tip:'Lleva la lengua atrás sin tocar el paladar. No la hagas vibrar.', example:'The light is red.' },
  { id:'w', symbol:'w', word:'water', cue:'Labios redondeados.', tip:'Empieza con labios redondeados y ábrelos rápidamente.', example:'I need some water.' },
  { id:'y', symbol:'j', word:'yes', cue:'Y rápida.', tip:'Sube la lengua hacia el paladar sin tocarlo y desliza hacia la vocal.', example:'Yes, I understand.' }
];

const ALL_SOUNDS = [...VOWELS.map((item) => ({ ...item, group:'vowels' })), ...CONSONANTS.map((item) => ({ ...item, group:'consonants' }))];


const SOUND_DRILLS = {
  'i-long': ['see','green','need'], 'i-short': ['sit','give','little'], e: ['bed','red','help'], ae: ['cat','bad','map'], uh: ['cup','sun','bus'], ah: ['hot','job','stop'], aw: ['law','talk','call'], book: ['book','good','look'], food: ['food','blue','school'], bird: ['bird','work','first'], schwa: ['about','ago','support'], day: ['day','name','wait'], time: ['time','my','find'], boy: ['boy','toy','enjoy'], now: ['now','house','town'],
  p: ['pen','paper','people'], b: ['boy','book','baby'], t: ['time','today','table'], d: ['day','door','doctor'], k: ['key','car','work'], g: ['go','good','again'], f: ['fish','family','coffee'], v: ['very','visit','seven'], 'th-voiceless': ['think','thank','three'], 'th-voiced': ['this','that','mother'], s: ['see','sun','bus'], z: ['zoo','easy','music'], sh: ['shoe','shop','wash'], zh: ['measure','vision','usual'], h: ['home','help','behind'], ch: ['chair','check','watch'], j: ['job','juice','change'], m: ['moon','mom','time'], n: ['nose','name','ten'], ng: ['sing','long','working'], l: ['lion','light','call'], r: ['red','right','work'], w: ['water','work','away'], y: ['yes','you','yellow']
};

const SOUND_PHRASES = {
  'i-long':'see me', 'i-short':'sit here', e:'red bed', ae:'black cat', uh:'one cup', ah:'hot coffee', aw:'the law', book:'good book', food:'good food', bird:'first bird', schwa:'about a job', day:'good day', time:'my time', boy:'good boy', now:'right now',
  p:'blue pen', b:'big book', t:'take time', d:'good day', k:'car key', g:'go again', f:'fresh fish', v:'very good', 'th-voiceless':'think first', 'th-voiced':'this thing', s:'see this', z:'busy zoo', sh:'new shoe', zh:'measure again', h:'home here', ch:'cheap chair', j:'good job', m:'my mom', n:'nice name', ng:'sing along', l:'little lion', r:'red road', w:'warm water', y:'yes, you'
};

const SOUND_LEVELS = Object.freeze([
  { id:1, label:'Palabra', description:'Primero domina una palabra clara.' },
  { id:2, label:'3 palabras', description:'Reconoce el mismo sonido en palabras diferentes.' },
  { id:3, label:'Frase corta', description:'Úsalo dentro de una frase breve y natural.' },
  { id:4, label:'Oración', description:'Mantén el sonido claro dentro de una oración completa.' }
]);
const SOUND_LEVEL_SCORE = 80;
const SOUND_LEVEL_SUCCESSES = 3;

function practiceLevelsFor(sound) {
  const words = SOUND_DRILLS[sound.id] || [sound.word];
  const phrase = SOUND_PHRASES[sound.id] || sound.word;
  return [
    { ...SOUND_LEVELS[0], target:sound.word, model:sound.word },
    { ...SOUND_LEVELS[1], target:words.join(' '), model:words.join(', ') },
    { ...SOUND_LEVELS[2], target:phrase, model:phrase },
    { ...SOUND_LEVELS[3], target:sound.example, model:sound.example }
  ];
}

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SOUND_STATE_KEY) || '{}');
    return { progress: saved.progress && typeof saved.progress === 'object' ? saved.progress : {} };
  } catch { return { progress:{} }; }
}
function saveState(state) {
  localStorage.setItem(SOUND_STATE_KEY, JSON.stringify(state));
  window.SinBarrerasCloud?.queueSync?.();
}
function clamp(value, min=0, max=100) { return Math.max(min, Math.min(max, value)); }
function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }

const SOUND_CHALLENGE_DAYS = 15;
const SOUND_SHORT_BLOCK_SECONDS = 120;
const SOUND_LONG_BLOCK_SECONDS = 300;
const SOUND_DAILY_ATTEMPTS = 3;
const SOUND_CHALLENGE_SECONDS = SOUND_CHALLENGE_DAYS * SOUND_SHORT_BLOCK_SECONDS * 2;
const SOUND_QUALITY_TARGET = 80;
const SOUND_LEVEL_COUNT = SOUND_LEVELS.length;

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function shiftDateKey(key, delta) {
  const [year, month, day] = String(key).split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  date.setDate(date.getDate() + delta);
  return localDateKey(date);
}
function formatSeconds(total = 0) {
  const seconds = Math.max(0, Math.floor(Number(total) || 0));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
function ensureProgressEntry(entry = {}) {
  const levels = entry.levels && typeof entry.levels === 'object' ? entry.levels : {};
  const normalizedLevels = {};
  for (const level of SOUND_LEVELS) {
    const value = levels[level.id] && typeof levels[level.id] === 'object' ? levels[level.id] : {};
    normalizedLevels[level.id] = {
      attempts: Math.max(0, Number(value.attempts || 0)),
      successes: Math.max(0, Number(value.successes || 0)),
      bestScore: clamp(Number(value.bestScore || 0))
    };
  }
  return {
    listens: Math.max(0, Number(entry.listens || 0)),
    attempts: Math.max(0, Number(entry.attempts || 0)),
    bestScore: clamp(Number(entry.bestScore || 0)),
    scoreTotal: Math.max(0, Number(entry.scoreTotal || 0)),
    scoreCount: Math.max(0, Number(entry.scoreCount || 0)),
    completedAt: entry.completedAt || null,
    daily: entry.daily && typeof entry.daily === 'object' ? entry.daily : {},
    levels: normalizedLevels
  };
}

function ensureDailyEntry(entry, key = localDateKey()) {
  entry.daily ||= {};
  const value = entry.daily[key] && typeof entry.daily[key] === 'object' ? entry.daily[key] : {};
  entry.daily[key] = {
    sessions: Array.isArray(value.sessions) ? value.sessions.map((seconds) => Math.max(0, Math.floor(Number(seconds) || 0))).slice(-8) : [],
    attempts: Math.max(0, Number(value.attempts || 0)),
    bestScore: clamp(Number(value.bestScore || 0)),
    scoreTotal: Math.max(0, Number(value.scoreTotal || 0)),
    scoreCount: Math.max(0, Number(value.scoreCount || 0))
  };
  return entry.daily[key];
}
function qualifyingSeconds(day = {}) {
  const sessions = Array.isArray(day.sessions) ? day.sessions : [];
  const longBlock = sessions.find((seconds) => seconds >= SOUND_LONG_BLOCK_SECONDS);
  if (longBlock) return Math.min(SOUND_LONG_BLOCK_SECONDS, longBlock);
  const shortBlocks = sessions.filter((seconds) => seconds >= SOUND_SHORT_BLOCK_SECONDS).sort((a, b) => b - a).slice(0, 2);
  return shortBlocks.reduce((sum, seconds) => sum + Math.min(seconds, SOUND_LONG_BLOCK_SECONDS), 0);
}
function dayIsQualified(day = {}) {
  const sessions = Array.isArray(day.sessions) ? day.sessions : [];
  const enoughTime = sessions.some((seconds) => seconds >= SOUND_LONG_BLOCK_SECONDS) || sessions.filter((seconds) => seconds >= SOUND_SHORT_BLOCK_SECONDS).length >= 2;
  return enoughTime && Number(day.attempts || 0) >= SOUND_DAILY_ATTEMPTS;
}
function currentQualifiedStreak(entry) {
  const today = localDateKey();
  let cursor = dayIsQualified(entry.daily?.[today]) ? today : shiftDateKey(today, -1);
  let streak = 0;
  while (dayIsQualified(entry.daily?.[cursor])) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}
function bestQualifiedStreak(entry) {
  const keys = Object.keys(entry.daily || {}).filter((key) => dayIsQualified(entry.daily[key])).sort();
  let best = 0; let current = 0; let previous = null;
  for (const key of keys) {
    current = previous && shiftDateKey(previous, 1) === key ? current + 1 : 1;
    best = Math.max(best, current);
    previous = key;
  }
  return best;
}
function totalQualifiedSeconds(entry) {
  return Object.values(entry.daily || {}).reduce((sum, day) => sum + (dayIsQualified(day) ? qualifyingSeconds(day) : 0), 0);
}
function averageRecognition(entry) {
  if (entry.scoreCount > 0) return clamp(entry.scoreTotal / entry.scoreCount);
  return clamp(entry.bestScore || 0);
}
function levelIsComplete(entry, levelId) {
  const level = entry.levels?.[levelId] || {};
  return Number(level.successes || 0) >= SOUND_LEVEL_SUCCESSES && Number(level.bestScore || 0) >= SOUND_LEVEL_SCORE;
}
function levelIsUnlocked(entry, levelId) {
  if (levelId <= 1) return true;
  return levelIsComplete(entry, levelId - 1);
}
function completedSoundLevels(entry) {
  return SOUND_LEVELS.filter((level) => levelIsComplete(entry, level.id)).length;
}
function levelMasteryRatio(entry) {
  return completedSoundLevels(entry) / SOUND_LEVEL_COUNT;
}

function masteryForEntry(entry) {
  if (entry.completedAt) return 100;
  const streak = currentQualifiedStreak(entry);
  const consistency = Math.min(1, streak / SOUND_CHALLENGE_DAYS) * 65;
  const practiceTime = Math.min(1, totalQualifiedSeconds(entry) / SOUND_CHALLENGE_SECONDS) * 10;
  const quality = Math.min(1, averageRecognition(entry) / SOUND_QUALITY_TARGET) * 5;
  const levels = levelMasteryRatio(entry) * 20;
  return Math.min(99, Math.round(consistency + practiceTime + quality + levels));
}
function challengeComplete(entry) {
  return currentQualifiedStreak(entry) >= SOUND_CHALLENGE_DAYS
    && totalQualifiedSeconds(entry) >= SOUND_CHALLENGE_SECONDS
    && averageRecognition(entry) >= SOUND_QUALITY_TARGET
    && completedSoundLevels(entry) === SOUND_LEVEL_COUNT;
}


export function initSounds({ notify, speakText, request, getNativeLanguage, createAutoVoiceTurn } = {}) {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const ui = {
    grid:$('#sound-grid'),
    detail:$('#sound-detail'),
    tabs:$$('.sound-tab'),
    aiActivity:$('#sound-ai-activity'),
    aiActivityLabel:$('#sound-ai-activity-label'),
    aiActivityText:$('#sound-ai-activity-text')
  };
  if (!ui.grid || !ui.detail) return { render() {} };

  let state = readState();
  let filter = 'vowels';
  let selected = null;
  let selectedLevel = 1;
  let recorder = null;
  let stream = null;
  let chunks = [];
  let autoVoiceCapture = null;
  let busy = false;
  let lastRecordingUrl = null;
  let lastRecordingSoundId = null;
  let practiceSession = null;
  let practiceTimer = null;
  let aiActivityHideTimer = null;

  const AI_ACTIVITY_STATES = Object.freeze({
    waiting: { label:'PREPARANDO', text:'Activando el micrófono…' },
    listening: { label:'ESCUCHANDO', text:'Habla con naturalidad.' },
    thinking: { label:'IA EN ESPERA', text:'Detectando si terminaste…' },
    processing: { label:'IA TRABAJANDO', text:'Analizando tu pronunciación…' },
    finalizing: { label:'CASI LISTO', text:'Preparando tu resultado…' }
  });

  function setAIActivity(mode = 'hidden', options = {}) {
    if (!ui.aiActivity) return;
    window.clearTimeout(aiActivityHideTimer);
    aiActivityHideTimer = null;

    if (mode === 'hidden') {
      const delay = Math.max(0, Number(options.delay || 0));
      const hide = () => {
        ui.aiActivity.classList.add('is-hidden');
        ui.aiActivity.classList.remove('is-visible');
        ui.aiActivity.dataset.state = 'idle';
      };
      if (delay) aiActivityHideTimer = window.setTimeout(hide, delay);
      else hide();
      return;
    }

    const copy = AI_ACTIVITY_STATES[mode] || AI_ACTIVITY_STATES.processing;
    ui.aiActivity.dataset.state = mode;
    if (ui.aiActivityLabel) ui.aiActivityLabel.textContent = options.label || copy.label;
    if (ui.aiActivityText) ui.aiActivityText.textContent = options.text || copy.text;
    ui.aiActivity.classList.remove('is-hidden');
    window.requestAnimationFrame(() => ui.aiActivity?.classList.add('is-visible'));
  }

  function clearLastRecording() {
    if (lastRecordingUrl) URL.revokeObjectURL(lastRecordingUrl);
    lastRecordingUrl = null;
    lastRecordingSoundId = null;
  }

  function saveLastRecording(blob) {
    clearLastRecording();
    lastRecordingUrl = URL.createObjectURL(blob);
    lastRecordingSoundId = selected?.id || null;
  }

  function playMyRecording() {
    return new Promise((resolve, reject) => {
      if (!lastRecordingUrl || lastRecordingSoundId !== selected?.id) {
        reject(new Error('Primero graba tu voz para poder escucharla.'));
        return;
      }
      const audio = new Audio(lastRecordingUrl);
      audio.addEventListener('ended', resolve, { once:true });
      audio.addEventListener('error', () => reject(new Error('No se pudo reproducir tu grabación.')), { once:true });
      audio.play().catch(reject);
    });
  }

  function entryFor(sound) {
    const entry = ensureProgressEntry(state.progress[sound.id] || {});
    state.progress[sound.id] = entry;
    return entry;
  }
  const progressFor = (sound) => masteryForEntry(entryFor(sound));

  function maybeMarkCompleted(sound) {
    const entry = entryFor(sound);
    if (!entry.completedAt && challengeComplete(entry)) {
      entry.completedAt = new Date().toISOString();
      saveState(state);
      notify?.(`¡Dominaste ${sound.word}! Completaste 15 días consecutivos de práctica.`);
    }
    return entry;
  }

  function liveSessionSeconds() {
    if (!practiceSession || practiceSession.soundId !== selected?.id) return 0;
    return Math.min(SOUND_LONG_BLOCK_SECONDS, Math.max(0, Math.floor((Date.now() - practiceSession.startedAt) / 1000)));
  }

  function finishPracticeSession({ silent = false } = {}) {
    if (!practiceSession) return 0;
    const soundId = practiceSession.soundId;
    const elapsed = Math.min(SOUND_LONG_BLOCK_SECONDS, Math.max(0, Math.floor((Date.now() - practiceSession.startedAt) / 1000)));
    window.clearInterval(practiceTimer); practiceTimer = null; practiceSession = null;
    const sound = ALL_SOUNDS.find((item) => item.id === soundId);
    if (!sound || elapsed < 10) { updateChallengeUI(); return elapsed; }
    const entry = entryFor(sound);
    const day = ensureDailyEntry(entry);
    day.sessions.push(elapsed);
    day.sessions = day.sessions.slice(-8);
    maybeMarkCompleted(sound);
    saveState(state);
    renderGrid();
    updateChallengeUI();
    if (!silent) {
      if (elapsed >= SOUND_LONG_BLOCK_SECONDS) notify?.('Bloque de 5 minutos completado.');
      else if (elapsed >= SOUND_SHORT_BLOCK_SECONDS) notify?.('Bloque de 2 minutos completado. Haz otro bloque hoy o practica 5 minutos seguidos.');
      else notify?.(`Bloque guardado: ${formatSeconds(elapsed)}. Para que cuente, llega a 2:00.`);
    }
    return elapsed;
  }

  function startPracticeSession() {
    if (!selected) return;
    if (practiceSession?.soundId === selected.id) return;
    if (practiceSession) finishPracticeSession({ silent:true });
    practiceSession = { soundId:selected.id, startedAt:Date.now() };
    window.clearInterval(practiceTimer);
    practiceTimer = window.setInterval(() => {
      if (!practiceSession) return;
      if (liveSessionSeconds() >= SOUND_LONG_BLOCK_SECONDS) {
        finishPracticeSession();
        renderDetail();
        return;
      }
      updateChallengeUI();
    }, 1000);
    updateChallengeUI();
  }

  function togglePracticeSession() {
    if (practiceSession?.soundId === selected?.id) { finishPracticeSession(); return; }
    startPracticeSession();
  }

  function listForFilter() {
    if (filter === 'all') return ALL_SOUNDS;
    return ALL_SOUNDS.filter((item) => item.group === filter);
  }

  function renderGrid() {
    ui.grid.innerHTML = listForFilter().map((sound) => {
      const progress = progressFor(sound);
      const active = selected?.id === sound.id ? ' is-selected' : '';
      return `<button class="sound-card${active}" type="button" data-sound-id="${sound.id}" aria-label="Practicar ${escapeHtml(sound.word)}">
        <span class="sound-symbol">/${escapeHtml(sound.symbol)}/</span>
        <strong>${escapeHtml(sound.word)}</strong>
        <span class="sound-card-bar"><i style="width:${progress}%"></i></span>
      </button>`;
    }).join('');
    ui.grid.querySelectorAll('[data-sound-id]').forEach((button) => button.addEventListener('click', () => {
      const nextSelected = ALL_SOUNDS.find((item) => item.id === button.dataset.soundId) || null;
      if (selected?.id !== nextSelected?.id) {
        autoVoiceCapture?.cancel?.();
        autoVoiceCapture = null;
        setAIActivity('hidden');
        finishPracticeSession({ silent:true });
        clearLastRecording();
      }
      selected = nextSelected;
      if (selected) {
        const entry = entryFor(selected);
        selectedLevel = SOUND_LEVELS.find((level) => levelIsUnlocked(entry, level.id) && !levelIsComplete(entry, level.id))?.id || SOUND_LEVEL_COUNT;
      }
      renderGrid(); renderDetail();
      guidedTop(ui.detail, { delay: 70 });
    }));
  }

  function challengeData(sound) {
    const entry = entryFor(sound);
    const today = ensureDailyEntry(entry);
    const active = practiceSession?.soundId === sound.id ? liveSessionSeconds() : 0;
    const sessions = [...today.sessions, ...(active ? [active] : [])];
    const shortBlocks = sessions.filter((seconds) => seconds >= SOUND_SHORT_BLOCK_SECONDS).length;
    const longDone = sessions.some((seconds) => seconds >= SOUND_LONG_BLOCK_SECONDS);
    const todaySeconds = sessions.reduce((sum, seconds) => sum + seconds, 0);
    return {
      entry, today, active, shortBlocks, longDone, todaySeconds,
      qualified: dayIsQualified(today),
      streak: currentQualifiedStreak(entry),
      bestStreak: bestQualifiedStreak(entry),
      totalSeconds: totalQualifiedSeconds(entry),
      averageScore: averageRecognition(entry),
      mastery: masteryForEntry(entry)
    };
  }

  function challengeMarkup(sound) {
    const data = challengeData(sound);
    const sessionActive = practiceSession?.soundId === sound.id;
    const completed = Boolean(data.entry.completedAt);
    const todayTimeText = `${formatSeconds(data.todaySeconds)} practicados hoy`;
    const attemptText = `${Math.min(data.today.attempts, SOUND_DAILY_ATTEMPTS)}/${SOUND_DAILY_ATTEMPTS} intentos con voz`;
    const blockText = data.longDone ? 'Bloque de 5 min ✓' : `${Math.min(data.shortBlocks, 2)}/2 bloques de 2 min`;
    const statusText = completed ? 'Dominado' : data.qualified ? 'Hoy completado ✓' : 'Meta de hoy';
    return `<section class="sound-challenge${completed ? ' is-complete' : ''}" aria-label="Reto de dominio de 15 días">
      <div class="sound-challenge-head">
        <div><small>RETO DE DOMINIO · 15 DÍAS</small><strong>${statusText}</strong></div>
        <span class="sound-streak-pill">${completed ? '✓' : '🔥'} ${Math.min(data.streak, SOUND_CHALLENGE_DAYS)}/${SOUND_CHALLENGE_DAYS}</span>
      </div>
      <div class="sound-challenge-progress"><i style="width:${data.mastery}%"></i></div>
      <div class="sound-challenge-metrics">
        <span><small>HOY</small><strong class="sound-challenge-today">${todayTimeText}</strong></span>
        <span><small>REPETICIONES</small><strong class="sound-challenge-attempts">${attemptText}</strong></span>
        <span><small>BLOQUES</small><strong class="sound-challenge-blocks">${blockText}</strong></span>
      </div>
      <p class="sound-challenge-rule">Para que un día cuente: <b>1 bloque de 5 minutos</b> o <b>2 bloques de 2 minutos</b>, más <b>3 intentos con tu voz</b>. Debes completar <b>15 días consecutivos</b> y superar los <b>4 niveles</b> por cada sonido.</p>
      <div class="sound-challenge-session">
        <div><small>${sessionActive ? 'BLOQUE ACTIVO' : 'PRÁCTICA ENFOCADA'}</small><strong class="sound-challenge-timer">${sessionActive ? formatSeconds(data.active) : '0:00'}</strong></div>
        <button type="button" data-sound-session-action="toggle" ${completed ? 'disabled' : ''}>${completed ? 'DOMINADO ✓' : sessionActive ? 'Finalizar bloque' : 'Iniciar práctica de hoy'}</button>
      </div>
      <div class="sound-challenge-foot">
        <span>Mejor racha: <b>${data.bestStreak} días</b></span>
        <span>Tiempo válido: <b>${Math.floor(data.totalSeconds / 60)} min</b></span>
        <span>Reconocimiento: <b>${Math.round(data.averageScore)}%</b></span>
      </div>
    </section>`;
  }

  function updateChallengeUI() {
    if (!selected || !ui.detail) return;
    const data = challengeData(selected);
    const sessionActive = practiceSession?.soundId === selected.id;
    const q = (selector) => ui.detail.querySelector(selector);
    const timer = q('.sound-challenge-timer');
    if (timer) timer.textContent = sessionActive ? formatSeconds(data.active) : '0:00';
    const today = q('.sound-challenge-today');
    if (today) today.textContent = `${formatSeconds(data.todaySeconds)} practicados hoy`;
    const attempts = q('.sound-challenge-attempts');
    if (attempts) attempts.textContent = `${Math.min(data.today.attempts, SOUND_DAILY_ATTEMPTS)}/${SOUND_DAILY_ATTEMPTS} intentos con voz`;
    const blocks = q('.sound-challenge-blocks');
    if (blocks) blocks.textContent = data.longDone ? 'Bloque de 5 min ✓' : `${Math.min(data.shortBlocks, 2)}/2 bloques de 2 min`;
    const progress = q('.sound-challenge-progress i');
    if (progress) progress.style.width = `${data.mastery}%`;
    const mastery = q('.sound-mastery strong');
    if (mastery) mastery.textContent = `${data.mastery}%`;
    const button = q('[data-sound-session-action="toggle"]');
    if (button && !data.entry.completedAt) button.textContent = sessionActive ? 'Finalizar bloque' : 'Iniciar práctica de hoy';
  }

  function soundLevelsMarkup(sound) {
    const entry = entryFor(sound);
    return `<section class="sound-level-roadmap" aria-label="Niveles de práctica del sonido">
      <div class="sound-level-roadmap-head"><div><small>RUTA DE PRÁCTICA</small><strong>De palabra a conversación</strong></div><span>${completedSoundLevels(entry)}/${SOUND_LEVEL_COUNT}</span></div>
      <div class="sound-level-list">${practiceLevelsFor(sound).map((level) => {
        const unlocked = levelIsUnlocked(entry, level.id);
        const complete = levelIsComplete(entry, level.id);
        const active = selectedLevel === level.id;
        const data = entry.levels?.[level.id] || {};
        return `<button type="button" class="sound-level-step${active ? ' is-active' : ''}${complete ? ' is-complete' : ''}${!unlocked ? ' is-locked' : ''}" data-sound-level="${level.id}" ${unlocked ? '' : 'disabled'}>
          <span class="sound-level-number">${complete ? '✓' : level.id}</span>
          <span><small>NIVEL ${level.id}</small><strong>${escapeHtml(level.label)}</strong><em>${escapeHtml(level.description)}</em></span>
          <b>${Math.min(Number(data.successes || 0), SOUND_LEVEL_SUCCESSES)}/${SOUND_LEVEL_SUCCESSES}</b>
        </button>`;
      }).join('')}</div>
    </section>`;
  }

  function currentLevelData() {
    if (!selected) return null;
    return practiceLevelsFor(selected).find((level) => level.id === selectedLevel) || practiceLevelsFor(selected)[0];
  }

  function renderDetail(extra = '') {
    if (!selected) {
      ui.detail.innerHTML = `<div class="sound-detail-empty"><span class="sound-orbit" aria-hidden="true">◌</span><strong>Selecciona un sonido</strong><p>Toca una tarjeta. Primero practicarás una palabra; después pasarás a varias palabras, frases y oraciones.</p></div>`;
      return;
    }
    const progress = progressFor(selected);
    const level = currentLevelData();
    const entry = entryFor(selected);
    const levelEntry = entry.levels?.[level.id] || {};
    ui.detail.innerHTML = `<div class="sound-detail-top">
      <div class="sound-detail-symbol"><span>/${escapeHtml(selected.symbol)}/</span><small>${selected.group === 'vowels' ? 'VOCAL' : 'CONSONANTE'}</small></div>
      <div class="sound-detail-copy"><span>NIVEL ${level.id} · ${escapeHtml(level.label).toUpperCase()}</span><h4>${escapeHtml(level.model)}</h4><p>${escapeHtml(selected.cue)}</p></div>
      <span class="sound-mastery"><strong>${progress}%</strong><small>dominio</small></span>
    </div>
    ${soundLevelsMarkup(selected)}
    ${challengeMarkup(selected)}
    <div class="sound-current-target">
      <div><span>OBJETIVO DE ESTE NIVEL</span><strong>${escapeHtml(level.model)}</strong><p>${escapeHtml(level.description)}</p></div>
      <span class="sound-level-score">${Math.min(Number(levelEntry.successes || 0), SOUND_LEVEL_SUCCESSES)}/${SOUND_LEVEL_SUCCESSES}<small>aciertos</small></span>
    </div>
    <div class="sound-tip"><span>CÓMO HACER EL SONIDO</span><p>${escapeHtml(selected.tip)}</p></div>
    <div class="sound-actions">
      <button type="button" data-sound-action="listen">▶ Escuchar modelo</button>
      <button type="button" data-sound-action="slow">◷ Más lento</button>
      <button type="button" data-sound-action="practice" class="sound-practice">● Practicar mi voz</button>
    </div>
    <div id="sound-result" class="sound-result${extra ? '' : ' is-hidden'}">${extra}</div>`;

    ui.detail.querySelectorAll('[data-sound-level]').forEach((button) => button.addEventListener('click', () => {
      const next = Number(button.dataset.soundLevel || 1);
      if (!levelIsUnlocked(entryFor(selected), next)) return;
      selectedLevel = next;
      clearLastRecording();
      renderDetail();
      guidedTop(ui.detail, { delay: 50 });
    }));
    ui.detail.querySelectorAll('[data-sound-action]').forEach((button) => button.addEventListener('click', () => handleAction(button.dataset.soundAction, button)));
    ui.detail.querySelector('[data-sound-session-action="toggle"]')?.addEventListener('click', togglePracticeSession);
    ui.detail.querySelectorAll('[data-sound-result-action]').forEach((button) => button.addEventListener('click', async () => {
      const action = button.dataset.soundResultAction;
      const activeLevel = currentLevelData();
      if (action === 'model' || action === 'mine' || action === 'compare') {
        try {
          startPracticeSession();
          button.disabled = true;
          if (action === 'model') await speakText?.(activeLevel.model, 'en', { speed:.78 });
          if (action === 'mine') await playMyRecording();
          if (action === 'compare') {
            await speakText?.(activeLevel.model, 'en', { speed:.78 });
            await new Promise((resolve) => setTimeout(resolve, 280));
            await playMyRecording();
          }
        } catch (error) {
          notify?.(error.message || 'No se pudo reproducir el audio.');
        } finally {
          button.disabled = false;
        }
      }
      if (action === 'retry') ui.detail.querySelector('[data-sound-action="practice"]')?.click();
    }));
  }

  async function handleAction(action, button) {
    if (!selected || busy) return;
    try {
      if (action === 'listen' || action === 'slow') {
        startPracticeSession();
        busy = true; button.disabled = true;
        await speakText?.(currentLevelData().model, 'en', { speed: action === 'slow' ? .7 : 1 });
        const entry = entryFor(selected);
        entry.listens += 1;
        saveState(state);
        updateChallengeUI();
      } else if (action === 'practice') {
        startPracticeSession();
        await toggleRecording(button);
      }
    } catch (error) {
      notify?.(error.message || 'No se pudo reproducir este sonido.');
    } finally {
      if (action !== 'practice') { busy = false; button.disabled = false; }
    }
  }

  async function toggleRecording(button) {
    if (busy || !createAutoVoiceTurn) return;
    try {
      busy = true;
      button.classList.add('is-recording');
      button.textContent = '● Habla cuando estés listo';
      setAIActivity('waiting');
      const capture = await createAutoVoiceTurn({
        onState: (mode) => {
          if (mode === 'waiting') {
            button.textContent = '● Habla cuando estés listo';
            setAIActivity('waiting');
          }
          if (mode === 'listening') {
            button.textContent = '● Escuchando tu voz';
            setAIActivity('listening');
          }
          if (mode === 'thinking') {
            button.textContent = '● Grabación activa';
            setAIActivity('thinking');
          }
          if (mode === 'processing') {
            button.textContent = '✓ Voz recibida';
            setAIActivity('processing');
          }
        }
      });
      autoVoiceCapture = capture;
      const blob = await capture.promise;
      autoVoiceCapture = null;
      button.disabled = true;
      button.textContent = '✓ Voz recibida';
      setAIActivity('processing');
      if (blob.size < 800) throw new Error('Habla un poco más fuerte y vuelve a intentarlo.');
      saveLastRecording(blob);
      const form = new FormData();
      form.append('audio', blob, 'sound-practice.webm');
      const activeLevel = currentLevelData();
      form.append('targetText', activeLevel.target);
      form.append('practiceMode', 'sound');
      form.append('soundTip', selected.tip);
      form.append('nativeLanguage', 'es');
      const result = await request('/api/practice/score', { method:'POST', body:form });
      const entry = entryFor(selected);
      const score = clamp(Number(result.score || 0));
      entry.attempts += 1;
      entry.bestScore = Math.max(entry.bestScore, score);
      entry.scoreTotal += score;
      entry.scoreCount += 1;
      const day = ensureDailyEntry(entry);
      day.attempts += 1;
      day.bestScore = Math.max(day.bestScore, score);
      day.scoreTotal += score;
      day.scoreCount += 1;
      const levelEntry = entry.levels[selectedLevel];
      levelEntry.attempts += 1;
      levelEntry.bestScore = Math.max(levelEntry.bestScore, score);
      if (score >= SOUND_LEVEL_SCORE) levelEntry.successes += 1;
      const justCompletedLevel = levelIsComplete(entry, selectedLevel);
      maybeMarkCompleted(selected);
      saveState(state);
      renderGrid();
      updateChallengeUI();
      const resultState = ['success','almost','retry'].includes(result.status) ? result.status : (result.score >= 90 ? 'success' : result.score >= 60 ? 'almost' : 'retry');
      const resultIcon = resultState === 'success' ? '✓' : resultState === 'almost' ? '↗' : '↻';
      setAIActivity('finalizing');
      const resultHtml = `<div class="sound-feedback-card is-${resultState}">
        <div class="sound-feedback-head">
          <span class="sound-feedback-icon" aria-hidden="true">${resultIcon}</span>
          <div class="sound-feedback-copy"><small>RESULTADO</small><h5>${escapeHtml(result.title || 'Sigue practicando')}</h5><p>${escapeHtml(result.feedback || 'Escucha el ejemplo y vuelve a intentarlo.')}</p></div>
          <div class="sound-feedback-score"><strong>${Math.round(result.score || 0)}%</strong><small>${escapeHtml(result.metricLabel || 'Reconocimiento')}</small></div>
        </div>
        <div class="sound-feedback-compare">
          <div><small>OBJETIVO · NIVEL ${activeLevel.id}</small><strong>${escapeHtml(activeLevel.model)}</strong></div>
          <div><small>LA APP ENTENDIÓ</small><strong>${escapeHtml(result.heardText || 'No pude reconocerla')}</strong></div>
        </div>
        <div class="sound-feedback-tip"><small>PRUEBA ESTO</small><p>${escapeHtml(result.focus || selected.tip)}</p></div>
        ${justCompletedLevel ? `<div class="sound-level-unlock-note"><span>✓ NIVEL ${selectedLevel} COMPLETADO</span><strong>${selectedLevel < SOUND_LEVEL_COUNT ? `Se desbloqueó el nivel ${selectedLevel + 1}.` : 'Completaste los 4 niveles de este sonido.'}</strong></div>` : ''}
        <div class="sound-voice-compare">
          <div class="sound-voice-compare-head">
            <div><small>COMPARA TU VOZ</small><strong>Escucha el modelo y después escúchate a ti.</strong></div>
            <span aria-hidden="true">A/B</span>
          </div>
          <div class="sound-voice-pair">
            <button type="button" data-sound-result-action="model"><span>MODELO</span><b>▶ ${escapeHtml(activeLevel.model)}</b><small>Cómo debe sonar</small></button>
            <button type="button" data-sound-result-action="mine"><span>TU VOZ</span><b>▶ Mi grabación</b><small>Cómo lo dijiste tú</small></button>
          </div>
          <button type="button" class="sound-compare-button" data-sound-result-action="compare">⇄ Escuchar modelo y mi voz</button>
        </div>
        <div class="sound-feedback-actions single-action">
          <button type="button" data-sound-result-action="retry">● Grabar otra vez</button>
        </div>
      </div>`;
      renderDetail(resultHtml);
      setAIActivity('hidden', { delay: 320 });
      guidedScroll(ui.detail.querySelector('#sound-result'), { block: 'center', delay: 70 });
    } catch (error) {
      setAIActivity('hidden');
      if (error?.name !== 'AbortError') {
        notify?.(error.message || 'No pudimos revisar tu pronunciación.');
        renderDetail();
      }
    } finally {
      autoVoiceCapture = null;
      busy = false;
      button.disabled = false;
      button.classList.remove('is-recording');
      if (!ui.aiActivity?.classList.contains('is-hidden') && ui.aiActivity?.dataset.state !== 'finalizing') {
        setAIActivity('hidden', { delay: 180 });
      }
    }
  }

  ui.tabs.forEach((button) => button.addEventListener('click', () => {
    autoVoiceCapture?.cancel?.();
    autoVoiceCapture = null;
    setAIActivity('hidden');
    filter = button.dataset.soundFilter || 'vowels';
    ui.tabs.forEach((tab) => { const active = tab === button; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', String(active)); });
    if (selected && filter !== 'all' && selected.group !== filter) {
      finishPracticeSession({ silent:true });
      selected = null;
    }
    renderGrid(); renderDetail();
  }));

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      setAIActivity('hidden');
      finishPracticeSession({ silent:true });
    }
  });
  window.addEventListener('pagehide', () => { setAIActivity('hidden'); autoVoiceCapture?.cancel?.(); autoVoiceCapture = null; finishPracticeSession({ silent:true }); });

  renderGrid(); renderDetail();
  return { render(){ state = readState(); renderGrid(); renderDetail(); } };
}
