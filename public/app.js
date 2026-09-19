import { initLearning } from './learn.js?v=1.6.1';
import { initSounds } from './sounds.js?v=1.6.1';
import { LANGUAGE_CATALOG, LANGUAGES, POPULAR_PARTNER_CODES } from './languages.js?v=1.6.1';
import { createAutoVoiceTurn } from './voice-turn.js?v=1.6.1';
import { guidedScroll, guidedTop } from './navigation-flow.js?v=1.6.1';
import { initAIStage } from './ai-stage.js?v=1.6.1';
import { installAudioUnlock, unlockAudioPlayback, playBase64Audio, stopAudioPlayback, destroyAudioPlayback } from './audio-playback.js?v=1.6.1';
import { initPhrasebook } from './phrasebook.js?v=1.6.1';
import { initPhrasePractice } from './phrase-practice.js?v=1.6.1';
import { initQrConversation } from './qr-conversation.js?v=1.6.1';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const listen = (element, event, handler, options) => {
  if (element) element.addEventListener(event, handler, options);
};

const HISTORY_KEY = 'sinBarreras.history.v2';
const SETTINGS_KEY = 'sinBarreras.settings.v2';
const ONBOARDING_KEY = 'sinBarreras.onboarded.v2';
const LEGACY_HISTORY_KEYS = ['siSePuede.history.v1'];
const LEGACY_SETTINGS_KEYS = ['siSePuede.settings.v1'];
const LEGACY_ONBOARDING_KEYS = ['siSePuede.onboarded'];
const PRACTICE_POINTS_KEY = 'sinBarreras.practicePoints';

const ui = {
  shell: $('.app-shell'),
  statusPill: $('#status-pill'), statusCopy: $('#status-copy'), stage: $('.interpreter-stage'), modeDot: $('#mode-dot'), modeName: $('#mode-name'),
  aiStage: $('#ai-stage'), aiCanvas: $('#ai-core-canvas'), aiFallback: $('#ai-stage-fallback'),
  conversationButton: $('#conversation-button'), conversationButtonText: $('#conversation-button-text'), conversationButtonSubtext: $('.conversation-button-subtext'),
  originalText: $('#original-text'), translationText: $('#translation-text'), originalLanguage: $('#original-language'), translationLanguage: $('#translation-language'), sourceFlag: $('#source-flag'), repeatButton: $('#repeat-button'),
  partnerLanguageSelect: $('#partner-language-select'), myLanguageName: $('#my-language-name'), autoLanguageCopy: $('#auto-language-copy'), conversationSituation: $('#conversation-situation'), translatorVoiceSelect: $('#translator-voice-select'), previewVoice: $('#preview-voice'),
  toast: $('#toast'), historyView: $('#history-view'), historyList: $('#history-list'), historyEmpty: $('#history-empty'), clearHistory: $('#clear-history'), openHistory: $('#open-history'),
  phrasebookView: $('#phrasebook-view'), openPhrasebook: $('#open-phrasebook'), settingsOpenPhrasebook: $('#settings-open-phrasebook'), saveCurrentTranslation: $('#save-current-translation'),
  faceView: $('#face-to-face-view'), openFaceToFace: $('#open-face-to-face'), closeFaceToFace: $('#close-face-to-face'), faceToggleListening: $('#face-toggle-listening'), faceStatus: $('#face-status'), faceStatusDot: $('#face-status-dot'), facePartnerLanguage: $('#face-partner-language'), faceUserLanguage: $('#face-user-language'), facePartnerText: $('#face-partner-text'), faceUserText: $('#face-user-text'), facePartnerRepeat: $('#face-partner-repeat'), faceUserRepeat: $('#face-user-repeat'),
  learnView: $('#learn-view'), learnHome: $('#learn-home'), learnSoundsBranch: $('#learn-sounds-branch'), learnRoutesBranch: $('#learn-routes-branch'), learnConversationsBranch: $('#learn-conversations-branch'), learnWordsBranch: $('#learn-words-branch'), conversationLearningList: $('#conversation-learning-list'), conversationLearningEmpty: $('#conversation-learning-empty'), conversationLearningCount: $('#conversation-learning-count'), learnFromTranslation: $('#learn-from-translation'),
  settingsDialog: $('#settings-dialog'), onboardingDialog: $('#onboarding-dialog'), fontSize: $('#font-size-select'), themeButton: $('#theme-button'),
  practiceView: $('#practice-view'), practiceForm: $('#practice-form'), practiceInput: $('#practice-input'), practiceLanguage: $('#practice-language'), practiceTargetLanguage: $('#practice-target-language'), practiceSituation: $('#practice-situation'),
  practiceResult: $('#practice-result'), practiceEnglish: $('#practice-english'), practiceTargetLabel: $('#practice-target-label'), practiceMeaning: $('#practice-meaning'), practicePronunciation: $('#practice-pronunciation'), practiceTip: $('#practice-tip'),
  practiceAlternative: $('#practice-alternative'), practiceUsage: $('#practice-usage'), listenPractice: $('#listen-practice'), recordPractice: $('#record-practice'),
  practiceScore: $('#practice-score'), scoreNumber: $('#score-number'), scoreFeedback: $('#score-feedback'), heardText: $('#heard-text'), correctedText: $('#corrected-text'), focusText: $('#focus-text'), totalPoints: $('#total-points'),
  coachView: $('#coach-view'), coachScenario: $('#coach-scenario'), coachLanguage: $('#coach-language'), coachLevel: $('#coach-level'), coachGoal: $('#coach-goal'), coachMode: $('#coach-mode'), startCoach: $('#start-coach'), coachSetup: $('#coach-setup'), coachSession: $('#coach-session'),
  coachStatus: $('#coach-status'), coachThread: $('#coach-thread'), coachRecord: $('#coach-record'), coachTextInput: $('#coach-text-input'), coachSendText: $('#coach-send-text'), endCoach: $('#end-coach'),
  coachPersonaRole: $('#coach-persona-role'), coachSessionTitle: $('#coach-session-title'), coachSessionObjective: $('#coach-session-objective'), coachTurnCount: $('#coach-turn-count'), coachProgressValue: $('#coach-progress-value'), coachProgressBar: $('#coach-progress-bar'), coachSuccessCriteria: $('#coach-success-criteria'), coachCurrentFocus: $('#coach-current-focus'), coachSummary: $('#coach-summary'), coachResponseBox: $('#coach-response-box'), newCoachSession: $('#new-coach-session'),
  cameraView: $('#camera-view'), cameraInput: $('#camera-input'), cameraSourceLanguage: $('#camera-source-language'), cameraTargetLanguage: $('#camera-target-language'), cameraSituation: $('#camera-situation'),
  cameraDropzone: $('#camera-dropzone'), cameraPreviewWrap: $('#camera-preview-wrap'), cameraPreview: $('#camera-preview'), removeCameraImage: $('#remove-camera-image'), analyzeImage: $('#analyze-image'),
  cameraResult: $('#camera-result'), cameraPanel: $('.camera-panel'), cameraDocumentType: $('#camera-document-type'), cameraDetectedLanguage: $('#camera-detected-language'), cameraOriginalText: $('#camera-original-text'), cameraTranslatedText: $('#camera-translated-text'),
  listenCameraTranslation: $('#listen-camera-translation'), explainCameraText: $('#explain-camera-text'), explanationBox: $('#explanation-box'), explanationSummary: $('#explanation-summary'), explanationPoints: $('#explanation-points'), explanationActions: $('#explanation-actions'), explanationCaution: $('#explanation-caution')
};


const SITUATIONS = {
  everyday: 'Vida diaria', work: 'Trabajo', construction: 'Construcción / campo', medical: 'Doctor / salud', school: 'Escuela', restaurant: 'Restaurante', bank: 'Banco', interview: 'Entrevista', hotel: 'Hotel / viaje', shopping: 'Compras', emergency: 'Emergencia', legal: 'Documento oficial'
};

const TTS_VOICES = new Set(['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse', 'marin', 'cedar']);

const HANDS_FREE = Object.freeze({
  shortSpeechGraceMs: 1800,
  normalSpeechGraceMs: 1450,
  longSpeechGraceMs: 1200,
  thinkingStatusAfterMs: 420,
  maxSegmentMs: 45_000,
  silentRecycleMs: 55_000,
  minVoiceFrames: 3,
  minThreshold: 0.018,
  noiseMultiplier: 2.35
});

const state = {
  userLanguage: null, userLanguageHint: null, partnerLanguage: null, situation: 'everyday',
  running: false, processing: false, stream: null, audioContext: null, analyser: null, animationFrame: null, recorder: null, chunks: [], heardVoice: false, silenceSince: null, segmentStartedAt: null, voiceStartedAt: null, voiceFrames: 0, noiseFloor: 0.008, lastVoiceAt: null,
  currentAudio: null, currentBase64: null, currentLanguage: null, currentTranslation: null, currentResult: null,
  conversationSession: 0, conversationController: null, faceToFace: false, faceUserAudio: null, facePartnerAudio: null,
  settings: { theme: 'light', fontSize: 'normal', translatorVoice: 'coral', detectedUserLanguage: null },
  practice: null, practiceRecorder: null, practiceStream: null, practiceChunks: [], practiceVoiceCapture: null, practiceVoiceBusy: false,
  coachActive: false, coachHistory: [], coachLastReply: '', coachSessionContext: null, coachTurnCount: 0, coachProgress: 0, coachScores: [], coachRecorder: null, coachStream: null, coachChunks: [], coachBusy: false, coachVoiceCapture: null, coachVoiceBusy: false, coachPhraseRecorder: null, coachPhraseStream: null, coachPhraseChunks: [],
  cameraFile: null, cameraPreviewUrl: null, cameraResult: null
};

let learning = null;
let sounds = null;
let aiStageController = null;
let phrasebook = null;
let phrasePractice = null;
let qrConversation = null;

const languageName = (language) => (LANGUAGES[language] || language || 'Idioma').toUpperCase();
const languageFlag = (language) => ({ es: 'ES', en: 'EN', pt: 'PT', fr: 'FR', ar: 'AR', zh: '中', vi: 'VI', ko: '한', tl: 'TL', ht: 'HT', ru: 'RU', de: 'DE', hi: 'हि', ja: '日', it: 'IT' }[language] || String(language || '↗').toUpperCase().slice(0, 3));

function migrateLocalStorage() {
  if (!localStorage.getItem(HISTORY_KEY)) {
    for (const key of LEGACY_HISTORY_KEYS) {
      const value = localStorage.getItem(key);
      if (value) { localStorage.setItem(HISTORY_KEY, value); break; }
    }
  }
  if (!localStorage.getItem(SETTINGS_KEY)) {
    for (const key of LEGACY_SETTINGS_KEYS) {
      const value = localStorage.getItem(key);
      if (value) { localStorage.setItem(SETTINGS_KEY, value); break; }
    }
  }
  if (!localStorage.getItem(ONBOARDING_KEY) && LEGACY_ONBOARDING_KEYS.some((key) => localStorage.getItem(key))) {
    localStorage.setItem(ONBOARDING_KEY, '1'); window.SinBarrerasCloud?.queueSync?.();
  }
}

function setStatus(kind, copy) {
  const values = {
    idle: ['LISTO PARA ESCUCHAR', copy || 'Toca el botón rojo una sola vez y empieza a hablar.'],
    listening: ['ESCUCHANDO', copy || 'Habla cuando quieras. No necesitas tocar ningún botón al terminar.'],
    thinking: ['SIGUE PENSANDO', copy || 'Puedes pausar unos segundos. Terminaré cuando detecte que acabaste.'],
    translating: ['INTERPRETANDO', copy || 'Detectando idioma y preparando la traducción.'],
    speaking: ['TRADUCIENDO EN VOZ', copy || 'Al terminar volveré a escuchar automáticamente.'],
    paused: ['EN PAUSA', copy || 'Toca una vez cuando quieras volver a escuchar.']
  };
  const [pill, text] = values[kind] || values.idle;
  if (ui.statusPill) ui.statusPill.textContent = pill;
  if (ui.statusCopy) ui.statusCopy.textContent = text;
  ui.stage?.classList.toggle('listening', kind === 'listening');
  ui.stage?.classList.toggle('thinking', kind === 'thinking');
  ui.stage?.classList.toggle('processing', ['translating','speaking'].includes(kind));
  ui.modeDot?.classList.toggle('active', ['listening','thinking'].includes(kind));
  aiStageController?.setState?.(kind);
  if (ui.faceStatus) ui.faceStatus.textContent = pill;
  if (ui.faceStatusDot) ui.faceStatusDot.dataset.state = kind;
  if (ui.faceToggleListening) ui.faceToggleListening.textContent = state.running ? '■ Pausar' : '● Comenzar';
}

function renderConversationButtonState(mode = state.running ? 'running' : 'idle') {
  const selected = Boolean(state.partnerLanguage && LANGUAGES[state.partnerLanguage]);
  if (!ui.conversationButton || !ui.conversationButtonText) return;
  if (mode === 'running') {
    ui.conversationButton.classList.add('stop');
    ui.conversationButtonText.textContent = 'Escucha automática activa';
    if (ui.conversationButtonSubtext) ui.conversationButtonSubtext.textContent = 'Escucha automática activa. Habla con fluidez y haré el resto.';
    ui.conversationButton.setAttribute('aria-label', 'Pausar escucha automática');
    return;
  }
  ui.conversationButton.classList.remove('stop');
  ui.conversationButtonText.textContent = selected ? 'Comenzar a hablar' : 'Selecciona el idioma primero';
  if (ui.conversationButtonSubtext) ui.conversationButtonSubtext.textContent = selected ? 'Un toque activa la conversación manos libres' : 'Selecciona el idioma para activar el modo manos libres';
  ui.conversationButton.setAttribute('aria-label', selected ? 'Activar conversación manos libres' : 'Selecciona el idioma de la otra persona');
}

function updateWaveVisual(volume = 0, speaking = false) {
  const level = Math.max(0, Math.min(1, volume * 10));
  aiStageController?.setVolume?.(level, speaking);
  const bars = ui.stage?.querySelectorAll('.sound-waves i');
  if (!bars?.length) return;
  const center = (bars.length - 1) / 2;
  bars.forEach((bar, index) => {
    const distance = Math.abs(index - center) / Math.max(1, center);
    const shape = 1 - (distance * .62);
    const idle = 10 + shape * 20;
    const active = idle + level * (18 + shape * 36);
    const height = speaking ? active : idle;
    bar.style.height = `${Math.round(height)}px`;
    bar.style.opacity = String(speaking ? .62 + level * .38 : .42 + shape * .22);
  });
}

function notify(message) {
  if (!ui.toast) return;
  ui.toast.textContent = message;
  ui.toast.classList.add('visible');
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => ui.toast.classList.remove('visible'), 3600);
}

function escapeHTML(text = '') {
  return String(text).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function readHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

function writeHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 100)));
  window.SinBarrerasCloud?.queueSync?.();
  renderHistory();
}

function renderHistory() {
  if (!ui.historyEmpty || !ui.clearHistory || !ui.historyList) return;
  const items = readHistory();
  ui.historyEmpty.hidden = items.length > 0;
  ui.clearHistory.hidden = items.length === 0;
  ui.historyList.innerHTML = items.map((item) => `
    <article class="history-item" data-id="${escapeHTML(item.id)}">
      <div class="history-meta"><span>${languageName(item.sourceLanguage)} → ${languageName(item.targetLanguage)}${item.situation ? ` · ${escapeHTML(SITUATIONS[item.situation] || item.situation)}` : ''}</span><time>${new Date(item.createdAt).toLocaleString('es-US', { dateStyle: 'medium', timeStyle: 'short' })}</time></div>
      <p class="history-original">${escapeHTML(item.originalText)}</p>
      <p class="history-translation">${escapeHTML(item.translatedText)}</p>
      <div class="history-actions"><button type="button" data-action="speak">Escuchar</button><button type="button" data-action="learn">Practicar</button><button type="button" data-action="save">★ Guardar</button><button type="button" data-action="copy">Copiar</button><button type="button" data-action="share">Compartir</button><button type="button" data-action="delete">Eliminar</button></div>
    </article>`).join('');
}

function historySafeInterpretation(result = {}) {
  return {
    id: result.id || crypto.randomUUID(),
    originalText: String(result.originalText || '').slice(0, 4000),
    translatedText: String(result.translatedText || '').slice(0, 4000),
    sourceLanguage: result.sourceLanguage || null,
    targetLanguage: result.targetLanguage || null,
    detectedUserLanguage: result.detectedUserLanguage || null,
    partnerLanguage: result.partnerLanguage || null,
    direction: result.direction || null,
    autoLanguage: Boolean(result.autoLanguage),
    situation: result.situation || 'everyday',
    voice: result.voice || null,
    createdAt: result.createdAt || new Date().toISOString()
  };
}

function saveInterpretation(result) {
  // Audio is intentionally memory-only. Persisting audioBase64 makes cloud state
  // grow by hundreds of KB per turn and can trigger HTTP 413 errors.
  const item = historySafeInterpretation(result);
  writeHistory([item, ...readHistory().filter((entry) => entry.id !== item.id).map(historySafeInterpretation)]);
}


function conversationLearningCandidates() {
  const grouped = new Map();
  for (const item of readHistory()) {
    const englishText = item.sourceLanguage === 'en' ? item.originalText : item.targetLanguage === 'en' ? item.translatedText : '';
    if (!englishText) continue;
    const meaning = item.sourceLanguage === 'en' ? item.translatedText : item.originalText;
    const nativeLanguage = item.sourceLanguage === 'en' ? item.targetLanguage : item.sourceLanguage;
    const key = englishText.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key) continue;
    const previous = grouped.get(key);
    const createdAt = item.createdAt || new Date().toISOString();
    grouped.set(key, {
      id: item.id, englishText, meaning, nativeLanguage, situation: item.situation || 'everyday',
      sourceLanguage: item.sourceLanguage, targetLanguage: item.targetLanguage, count: (previous?.count || 0) + 1,
      createdAt: previous && new Date(previous.createdAt) > new Date(createdAt) ? previous.createdAt : createdAt
    });
  }
  return [...grouped.values()]
    .sort((a, b) => (b.count - a.count) || (new Date(b.createdAt) - new Date(a.createdAt)))
    .slice(0, 16);
}

function renderConversationLearning() {
  if (!ui.conversationLearningList || !ui.conversationLearningEmpty) return;
  const items = conversationLearningCandidates();
  ui.conversationLearningEmpty.hidden = items.length > 0;
  if (ui.conversationLearningCount) ui.conversationLearningCount.textContent = String(items.length);
  ui.conversationLearningList.innerHTML = items.map((item) => `
    <article class="conversation-learning-card" data-learning-id="${escapeHTML(item.id)}">
      <div class="conversation-learning-card-top"><span>${escapeHTML(SITUATIONS[item.situation] || 'Vida diaria')}</span>${item.count > 1 ? `<b>${item.count}× usada</b>` : ''}</div>
      <strong>${escapeHTML(item.englishText)}</strong>
      <p>${escapeHTML(item.meaning)}</p>
      <div><button type="button" data-learning-action="listen">▶ Escuchar</button><button type="button" data-learning-action="practice">✦ Practicar</button><button type="button" data-learning-action="save">★ Guardar frase</button></div>
    </article>`).join('');
}

function preparePhraseForPractice(item) {
  if (!item) return;
  const englishText = item.englishText || (item.sourceLanguage === 'en' ? item.originalText : item.targetLanguage === 'en' ? item.translatedText : '');
  const meaning = item.meaning || (item.sourceLanguage === 'en' ? item.translatedText : item.originalText);
  const nativeLanguage = item.nativeLanguage || (item.sourceLanguage === 'en' ? item.targetLanguage : item.sourceLanguage) || state.userLanguage || state.userLanguageHint || 'es';
  if (!englishText || !meaning) { notify('Esta conversación no contiene una frase en inglés para practicar.'); return; }
  if (ui.practiceInput) ui.practiceInput.value = meaning;
  if (ui.practiceLanguage && LANGUAGES[nativeLanguage]) ui.practiceLanguage.value = nativeLanguage;
  if (ui.practiceTargetLanguage) ui.practiceTargetLanguage.value = nativeLanguage === 'en' ? 'es' : 'en';
  keepPracticeLanguagesDistinct('native');
  if (ui.practiceSituation) ui.practiceSituation.value = item.situation || 'everyday';
  showView('practice');
  guidedScroll(ui.practiceForm, { block: 'center', highlight: true, delay: 90, focus: true });
  notify('Frase cargada desde tu conversación. Toca “Enseñarme” para practicarla.');
}

function updateFaceLabels() {
  const userLanguage = state.userLanguage || state.userLanguageHint || state.settings.detectedUserLanguage || 'es';
  if (ui.faceUserLanguage) ui.faceUserLanguage.textContent = `TÚ · ${languageName(userLanguage)}`;
  if (ui.facePartnerLanguage) ui.facePartnerLanguage.textContent = `OTRA PERSONA · ${languageName(state.partnerLanguage)}`;
}

function renderFaceToFace(result) {
  if (!state.faceToFace || !result) return;
  updateFaceLabels();
  ui.faceUserRepeat?.classList.add('is-hidden');
  ui.facePartnerRepeat?.classList.add('is-hidden');
  state.faceUserAudio = null;
  state.facePartnerAudio = null;
  if (result.direction === 'outbound') {
    if (ui.faceUserText) ui.faceUserText.textContent = result.originalText;
    if (ui.facePartnerText) ui.facePartnerText.textContent = result.translatedText;
    state.facePartnerAudio = { base64: result.audioBase64, language: result.targetLanguage };
    ui.facePartnerRepeat?.classList.remove('is-hidden');
  } else {
    if (ui.facePartnerText) ui.facePartnerText.textContent = result.originalText;
    if (ui.faceUserText) ui.faceUserText.textContent = result.translatedText;
    state.faceUserAudio = { base64: result.audioBase64, language: result.targetLanguage };
    ui.faceUserRepeat?.classList.remove('is-hidden');
  }
}

async function openFaceToFace() {
  if (!state.partnerLanguage || !LANGUAGES[state.partnerLanguage]) {
    notify('Selecciona primero el idioma de la otra persona.');
    guidedScroll(ui.partnerLanguageSelect, { block: 'center', highlight: true, focus: true });
    return;
  }
  state.faceToFace = true;
  ui.faceView?.classList.remove('is-hidden');
  document.body.classList.add('face-mode-open');
  updateFaceLabels();
  if (!state.running) await toggleConversation();
  setStatus(state.running ? 'listening' : 'idle');
}

async function closeFaceToFace() {
  state.faceToFace = false;
  ui.faceView?.classList.add('is-hidden');
  document.body.classList.remove('face-mode-open');
  if (state.running) await toggleConversation();
}

function populatePartnerLanguageSelect() {
  if (!ui.partnerLanguageSelect) return;
  const selected = state.partnerLanguage || '';
  const popularSet = new Set(POPULAR_PARTNER_CODES);
  const popular = POPULAR_PARTNER_CODES
    .map((code) => LANGUAGE_CATALOG.find((language) => language.code === code))
    .filter(Boolean);
  const remaining = LANGUAGE_CATALOG
    .filter(({ code }) => !popularSet.has(code))
    .sort((a, b) => a.apiName.localeCompare(b.apiName));

  const makeOption = ({ code, label }) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = label;
    return option;
  };

  ui.partnerLanguageSelect.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecciona su idioma…';
  placeholder.disabled = true;
  placeholder.selected = true;
  ui.partnerLanguageSelect.append(placeholder);

  const popularGroup = document.createElement('optgroup');
  popularGroup.label = 'Más usados';
  popular.forEach((language) => popularGroup.append(makeOption(language)));
  ui.partnerLanguageSelect.append(popularGroup);

  const allGroup = document.createElement('optgroup');
  allGroup.label = 'Todos los demás idiomas';
  remaining.forEach((language) => allGroup.append(makeOption(language)));
  ui.partnerLanguageSelect.append(allGroup);

  ui.partnerLanguageSelect.value = LANGUAGES[selected] ? selected : '';
  updatePartnerSelectionUI();
}

function populatePracticeLanguageSelects() {
  if (!ui.practiceLanguage || !ui.practiceTargetLanguage) return;
  const populate = (select) => {
    const previous = select.value;
    select.replaceChildren();
    LANGUAGE_CATALOG
      .slice()
      .sort((a, b) => a.apiName.localeCompare(b.apiName))
      .forEach(({ code, label }) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = label;
        select.append(option);
      });
    if (LANGUAGES[previous]) select.value = previous;
  };

  populate(ui.practiceLanguage);
  populate(ui.practiceTargetLanguage);

  const nativeDefault = LANGUAGES[state.settings.detectedUserLanguage]
    ? state.settings.detectedUserLanguage
    : (browserLanguageHint() || 'es');
  ui.practiceLanguage.value = nativeDefault;
  ui.practiceTargetLanguage.value = nativeDefault === 'en' ? 'es' : 'en';
}

function keepPracticeLanguagesDistinct(changed = 'native') {
  if (!ui.practiceLanguage || !ui.practiceTargetLanguage) return;
  if (ui.practiceLanguage.value !== ui.practiceTargetLanguage.value) return;
  const fallback = ui.practiceLanguage.value === 'en' ? 'es' : 'en';
  if (changed === 'target') ui.practiceLanguage.value = fallback;
  else ui.practiceTargetLanguage.value = fallback;
}

function updatePartnerSelectionUI() {
  const selected = Boolean(state.partnerLanguage && LANGUAGES[state.partnerLanguage]);
  if (ui.conversationButton && !state.running) ui.conversationButton.disabled = !selected;
  if (!state.running) renderConversationButtonState('idle');
}

function applySettings() {
  document.body.classList.toggle('dark', state.settings.theme === 'dark');
  document.documentElement.style.setProperty('--font-scale', state.settings.fontSize === 'large' ? '1.12' : state.settings.fontSize === 'xl' ? '1.27' : '1');
  if (ui.fontSize) ui.fontSize.value = state.settings.fontSize;
  if (ui.partnerLanguageSelect) ui.partnerLanguageSelect.value = state.partnerLanguage || '';
  if (ui.translatorVoiceSelect) ui.translatorVoiceSelect.value = TTS_VOICES.has(state.settings.translatorVoice) ? state.settings.translatorVoice : 'coral';
  $$('.theme-option').forEach((button) => button.classList.toggle('is-active', button.dataset.theme === state.settings.theme));
}

function browserLanguageHint() {
  const code = String(navigator.language || navigator.languages?.[0] || '').toLowerCase().split(/[-_]/)[0];
  return LANGUAGES[code] ? code : null;
}

function renderAutomaticLanguageState() {
  const userName = state.userLanguage ? LANGUAGES[state.userLanguage] : 'AUTO · Detectando';
  const partnerName = LANGUAGES[state.partnerLanguage] || 'Selecciona un idioma';
  if (ui.myLanguageName) ui.myLanguageName.textContent = userName;
  if (ui.autoLanguageCopy) ui.autoLanguageCopy.textContent = state.partnerLanguage ? `Idioma elegido manualmente: ${partnerName}. Tu idioma se reconoce automáticamente.` : 'Selecciona manualmente el idioma de la otra persona. No se elegirá automáticamente.';
  if (ui.modeName) ui.modeName.textContent = `${state.userLanguage ? userName : 'TU IDIOMA · AUTO'} ↔ ${partnerName} · ${SITUATIONS[state.situation] || 'Vida diaria'}`;
}

function persistConversationSettings() {
  state.settings.translatorVoice = TTS_VOICES.has(state.settings.translatorVoice) ? state.settings.translatorVoice : 'coral';
  if (state.userLanguage && state.userLanguage !== state.partnerLanguage) state.settings.detectedUserLanguage = state.userLanguage;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  window.SinBarrerasCloud?.queueSync?.();
}

function updateConversationSettings() {
  // Partner language is deliberately NOT restored or auto-selected. The user chooses it manually.
  const rememberedUser = state.settings.detectedUserLanguage;
  state.userLanguage = LANGUAGES[rememberedUser] && rememberedUser !== state.partnerLanguage ? rememberedUser : null;
  state.userLanguageHint = browserLanguageHint();
  state.situation = ui.conversationSituation?.value || 'everyday';
  renderAutomaticLanguageState();
}

async function ensureMicrophone() {
  if (state.stream?.active) return;
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Este navegador no permite grabar audio. Abre la app en Chrome, Safari o Edge actualizado.');
  state.stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }, video: false
  });
  state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  await state.audioContext.resume();
  const source = state.audioContext.createMediaStreamSource(state.stream);
  state.analyser = state.audioContext.createAnalyser();
  state.analyser.fftSize = 1024;
  source.connect(state.analyser);
}

function cleanConversationResources() {
  if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
  state.animationFrame = null;
  state.stream?.getTracks().forEach((track) => track.stop());
  state.stream = null;
  state.audioContext?.close().catch(() => {});
  state.audioContext = null;
  state.analyser = null;
  state.recorder = null;
}

function averageVolume() {
  if (!state.analyser) return 0;
  const data = new Uint8Array(state.analyser.fftSize);
  state.analyser.getByteTimeDomainData(data);
  return data.reduce((sum, value) => sum + Math.abs(value - 128), 0) / data.length / 128;
}

function conversationSilenceLimit() {
  const spokenFor = Math.max(0, (state.lastVoiceAt || performance.now()) - (state.voiceStartedAt || state.lastVoiceAt || performance.now()));
  if (spokenFor < 900) return HANDS_FREE.shortSpeechGraceMs;
  if (spokenFor < 3200) return HANDS_FREE.normalSpeechGraceMs;
  return HANDS_FREE.longSpeechGraceMs;
}

function monitorSilence(sessionId) {
  if (!state.running || sessionId !== state.conversationSession || state.processing || !state.recorder || state.recorder.state !== 'recording') return;
  const volume = averageVolume();
  const now = performance.now();

  if (!state.heardVoice) {
    state.noiseFloor = Math.max(0.004, Math.min(0.03, (state.noiseFloor * .96) + (volume * .04)));
  }
  const threshold = Math.max(HANDS_FREE.minThreshold, state.noiseFloor * HANDS_FREE.noiseMultiplier);
  const voiceNow = volume > threshold;
  updateWaveVisual(volume, voiceNow || state.heardVoice);

  if (voiceNow) {
    state.voiceFrames += 1;
    state.lastVoiceAt = now;
    state.silenceSince = null;
    if (!state.heardVoice && state.voiceFrames >= HANDS_FREE.minVoiceFrames) {
      state.heardVoice = true;
      state.voiceStartedAt = now;
      setStatus('listening', 'Te escucho. Puedes hacer pausas naturales para pensar.');
    } else if (state.heardVoice) {
      setStatus('listening', 'Te escucho. Puedes hacer pausas naturales para pensar.');
    }
  } else {
    state.voiceFrames = Math.max(0, state.voiceFrames - 1);
    if (state.heardVoice) {
      if (!state.silenceSince) state.silenceSince = now;
      const silentFor = now - state.silenceSince;
      const silenceLimit = conversationSilenceLimit();
      if (silentFor > HANDS_FREE.thinkingStatusAfterMs && silentFor < silenceLimit) {
        setStatus('thinking', 'Pausa detectada. Si terminaste, traduzco enseguida.');
      }
      if (silentFor >= silenceLimit) {
        finishSegment(sessionId);
        return;
      }
    }
  }

  const segmentAge = state.segmentStartedAt ? now - state.segmentStartedAt : 0;
  if (state.heardVoice && segmentAge > HANDS_FREE.maxSegmentMs) {
    finishSegment(sessionId);
    return;
  }
  if (!state.heardVoice && segmentAge > HANDS_FREE.silentRecycleMs) {
    if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
    state.recorder.stop();
    setStatus('listening', 'Sigo aquí. Habla cuando estés listo.');
    return;
  }
  state.animationFrame = requestAnimationFrame(() => monitorSilence(sessionId));
}

function startRecordingSegment(sessionId = state.conversationSession) {
  if (!state.running || sessionId !== state.conversationSession || !state.stream?.active) return;
  state.processing = false;
  state.heardVoice = false;
  state.silenceSince = null;
  state.voiceStartedAt = null;
  state.voiceFrames = 0;
  state.lastVoiceAt = null;
  state.segmentStartedAt = performance.now();
  updateWaveVisual(0, false);
  state.chunks = [];
  const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? { mimeType: 'audio/webm;codecs=opus' } : undefined;
  const recorder = new MediaRecorder(state.stream, options);
  state.recorder = recorder;
  listen(recorder, 'dataavailable', (event) => { if (event.data.size) state.chunks.push(event.data); });
  listen(recorder, 'stop', async () => {
    const audio = new Blob(state.chunks, { type: recorder.mimeType || 'audio/webm' });
    if (!state.running || sessionId !== state.conversationSession) return;
    if (!state.heardVoice || audio.size < 1000) {
      window.setTimeout(() => startRecordingSegment(sessionId), 120);
      return;
    }
    await interpretAudio(audio, sessionId);
  }, { once: true });
  recorder.start();
  setStatus('listening');
  state.animationFrame = requestAnimationFrame(() => monitorSilence(sessionId));
}

function finishSegment(sessionId = state.conversationSession) {
  if (sessionId !== state.conversationSession || !state.recorder || state.recorder.state !== 'recording') return;
  if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
  state.processing = true;
  setStatus('translating');
  state.recorder.stop();
}

async function request(path, options = {}) {
  const response = await fetch(path, options);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || 'No fue posible completar la solicitud.');
    error.status = response.status;
    throw error;
  }
  return result;
}

async function interpretAudio(audio, sessionId) {
  if (!state.partnerLanguage || !LANGUAGES[state.partnerLanguage]) {
    notify('Selecciona el idioma de la otra persona.');
    return;
  }
  state.conversationController?.abort();
  const controller = new AbortController();
  state.conversationController = controller;
  try {
    const form = new FormData();
    form.append('audio', audio, 'conversation.webm');
    if (state.userLanguage) form.append('userLanguage', state.userLanguage);
    if (state.userLanguageHint) form.append('userLanguageHint', state.userLanguageHint);
    form.append('partnerLanguage', state.partnerLanguage);
    form.append('voice', state.settings.translatorVoice || 'coral');
    form.append('situation', state.situation);
    const result = await request('/api/interpret', { method: 'POST', body: form, signal: controller.signal });
    if (!state.running || sessionId !== state.conversationSession) return;
    showInterpretation(result);
    saveInterpretation(result);
    await playAudio(result.audioBase64, result.targetLanguage, { resumeConversation: true, sessionId });
  } catch (error) {
    if (error.name === 'AbortError') return;
    notify(error.message || 'No pudimos traducir este mensaje.');
    if (state.running && sessionId === state.conversationSession) window.setTimeout(() => startRecordingSegment(sessionId), 900);
  } finally {
    if (state.conversationController === controller) state.conversationController = null;
  }
}

function showInterpretation(result) {
  if (result.detectedUserLanguage && result.detectedUserLanguage !== state.partnerLanguage) {
    const changed = state.userLanguage !== result.detectedUserLanguage;
    state.userLanguage = result.detectedUserLanguage;
    persistConversationSettings();
    renderAutomaticLanguageState();
    if (changed && result.direction === 'outbound') notify(`Tu idioma fue detectado como ${LANGUAGES[result.detectedUserLanguage] || result.detectedUserLanguage}.`);
  }
  if (ui.originalText) {
    ui.originalText.textContent = result.originalText;
    ui.originalText.classList.remove('muted');
  }
  if (ui.translationText) ui.translationText.textContent = result.translatedText;
  if (ui.originalLanguage) ui.originalLanguage.textContent = `HABLÓ · ${languageName(result.sourceLanguage)}`;
  if (ui.translationLanguage) ui.translationLanguage.textContent = `TRADUCCIÓN · ${languageName(result.targetLanguage)}`;
  if (ui.sourceFlag) ui.sourceFlag.textContent = languageFlag(result.sourceLanguage);
  if (ui.repeatButton) ui.repeatButton.disabled = false;
  if (ui.saveCurrentTranslation) ui.saveCurrentTranslation.disabled = false;
  state.currentBase64 = result.audioBase64;
  state.currentLanguage = result.targetLanguage;
  state.currentTranslation = result.translatedText;
  state.currentResult = result;
  const hasEnglish = result.sourceLanguage === 'en' || result.targetLanguage === 'en';
  ui.learnFromTranslation?.classList.toggle('is-hidden', !hasEnglish);
  renderFaceToFace(result);
  if (!state.faceToFace) guidedScroll($('.translation-grid'), { block: 'center', highlight: false, delay: 90 });
}

function playAudio(base64, language, { resumeConversation = false, sessionId = state.conversationSession } = {}) {
  stopAudioPlayback();
  const playback = { pause: stopAudioPlayback };
  state.currentAudio = playback;
  setStatus('speaking');

  return playBase64Audio(base64)
    .catch((error) => {
      if (error?.name === 'AudioPlaybackBlockedError') {
        notify('Audio pausado por el navegador. Toca la app una vez y el audio quedará habilitado.');
      } else {
        notify(error?.message || 'No se pudo reproducir la voz.');
      }
      throw error;
    })
    .finally(() => {
      if (state.currentAudio === playback) state.currentAudio = null;
      if (resumeConversation && state.running && sessionId === state.conversationSession) startRecordingSegment(sessionId);
      else if (!state.running) setStatus('idle');
    });
}

async function speakText(text, language, { speed = 1 } = {}) {
  const safeSpeed = Math.max(0.25, Math.min(4, Number(speed) || 1));
  const result = await request('/api/speak', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language, voice: state.settings.translatorVoice || 'coral', speed: safeSpeed })
  });
  await playAudio(result.audioBase64, language, { resumeConversation: false });
}

function getPracticePoints() { return Number(localStorage.getItem(PRACTICE_POINTS_KEY) || 0); }
function renderPracticePoints() { if (ui.totalPoints) ui.totalPoints.textContent = `${getPracticePoints()} puntos`; }
function addPracticePoints(points = 0) {
  const safePoints = Math.max(0, Number(points) || 0);
  if (!safePoints) return;
  localStorage.setItem(PRACTICE_POINTS_KEY, String(getPracticePoints() + safePoints));
  window.SinBarrerasCloud?.queueSync?.();
  renderPracticePoints();
}

async function preparePractice(event) {
  event.preventDefault();
  if (!ui.practiceForm || !ui.practiceInput || !ui.practiceLanguage || !ui.practiceTargetLanguage) return;
  const submit = ui.practiceForm.querySelector('button[type="submit"]');
  const nativeLanguage = ui.practiceLanguage.value;
  const targetLanguage = ui.practiceTargetLanguage.value;
  if (nativeLanguage === targetLanguage) {
    notify('Elige un idioma diferente para practicar.');
    return;
  }
  try {
    if (submit) { submit.disabled = true; submit.textContent = 'Preparando…'; }
    const result = await request('/api/practice', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phrase: ui.practiceInput.value.trim(),
        nativeLanguage,
        targetLanguage,
        situation: ui.practiceSituation?.value || 'everyday'
      })
    });
    const targetText = result.targetText || result.english || '';
    state.practice = {
      ...result,
      targetText,
      nativeLanguage,
      targetLanguage,
      originalIntent: ui.practiceInput.value.trim(),
      situation: ui.practiceSituation?.value || 'everyday'
    };
    if (ui.practiceEnglish) ui.practiceEnglish.textContent = targetText;
    if (ui.practiceTargetLabel) ui.practiceTargetLabel.textContent = `FORMA NATURAL EN ${languageName(targetLanguage)}`;
    if (ui.practiceMeaning) ui.practiceMeaning.textContent = result.meaning;
    if (ui.practicePronunciation) ui.practicePronunciation.textContent = result.pronunciation;
    if (ui.practiceTip) ui.practiceTip.textContent = result.tip;
    if (ui.practiceAlternative) ui.practiceAlternative.textContent = result.alternative;
    if (ui.practiceUsage) ui.practiceUsage.textContent = result.usage;
    ui.practiceScore?.classList.add('is-hidden');
    ui.practiceResult?.classList.remove('is-hidden');
    guidedTop(ui.practiceResult, { delay: 90 });
  } catch (error) {
    notify(error.message || 'No pudimos preparar la práctica.');
  } finally {
    if (submit) { submit.disabled = false; submit.textContent = 'Enseñarme'; }
  }
}

function stopPracticeRecording() {
  if (state.practiceRecorder?.state === 'recording') state.practiceRecorder.stop();
}

async function scorePracticeAudio(audio) {
  if (!state.practice) return;
  try {
    if (ui.recordPractice) { ui.recordPractice.disabled = true; ui.recordPractice.textContent = 'Revisando…'; }
    const form = new FormData();
    form.append('audio', audio, 'practice.webm');
    form.append('targetText', state.practice.targetText || state.practice.english);
    form.append('originalIntent', state.practice.originalIntent || '');
    form.append('nativeLanguage', state.practice.nativeLanguage || 'es');
    form.append('targetLanguage', state.practice.targetLanguage || 'en');
    const result = await request('/api/practice/score', { method: 'POST', body: form });
    if (ui.scoreNumber) ui.scoreNumber.textContent = `${result.score}% claro · +${result.points} puntos`;
    if (ui.scoreFeedback) ui.scoreFeedback.textContent = result.feedback;
    if (ui.heardText) ui.heardText.textContent = result.heardText ? `“${result.heardText}”` : 'No logramos reconocer palabras.';
    if (ui.correctedText) ui.correctedText.textContent = result.correctedEnglish || state.practice.targetText || state.practice.english;
    if (ui.focusText) ui.focusText.textContent = result.focus || 'Repite la frase con calma.';
    ui.practiceScore?.classList.remove('is-hidden');
    guidedScroll(ui.practiceScore, { block: 'center', delay: 90 });
    addPracticePoints(result.points);
  } catch (error) {
    notify(error.message || 'No pudimos revisar tu práctica.');
  } finally {
    if (ui.recordPractice) { ui.recordPractice.disabled = false; ui.recordPractice.textContent = '● Practicar mi voz'; }
  }
}

async function togglePracticeRecording() {
  if (!state.practice || state.practiceVoiceBusy) return;
  if (state.running) { notify('Pausa la conversación antes de practicar tu voz.'); return; }
  if (state.coachActive) { notify('Finaliza el Coach antes de usar esta práctica.'); return; }
  try {
    state.practiceVoiceBusy = true;
    ui.recordPractice?.classList.add('recording');
    if (ui.recordPractice) ui.recordPractice.textContent = '● Escuchando… habla y haz una pausa';
    const capture = await createAutoVoiceTurn({
      onState: (mode) => {
        if (!ui.recordPractice) return;
        if (mode === 'waiting') ui.recordPractice.textContent = '● Habla cuando estés listo';
        if (mode === 'listening') ui.recordPractice.textContent = '● Te escucho…';
        if (mode === 'thinking') ui.recordPractice.textContent = '◌ Esperando por si continúas…';
        if (mode === 'processing') ui.recordPractice.textContent = '✓ Revisando automáticamente…';
      }
    });
    state.practiceVoiceCapture = capture;
    const audio = await capture.promise;
    state.practiceVoiceCapture = null;
    await scorePracticeAudio(audio);
  } catch (error) {
    if (error?.name !== 'AbortError') notify(error.message || 'Necesitamos permiso para usar el micrófono.');
  } finally {
    state.practiceVoiceCapture = null;
    state.practiceVoiceBusy = false;
    ui.recordPractice?.classList.remove('recording');
    if (ui.recordPractice && !ui.recordPractice.disabled) ui.recordPractice.textContent = '● Practicar mi voz';
  }
}

async function toggleConversation() {
  // Must run directly inside the user's click gesture so Safari/Chrome authorize
  // future hands-free TTS responses after asynchronous API calls.
  const audioUnlock = unlockAudioPlayback();
  if (state.running) {
    state.running = false;
    state.conversationSession += 1;
    state.conversationController?.abort();
    state.conversationController = null;
    if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
    if (state.recorder?.state === 'recording') state.recorder.stop();
    state.currentAudio?.pause();
    state.currentAudio = null;
    cleanConversationResources();
    renderConversationButtonState('idle');
    setStatus('paused');
    updateWaveVisual(0, false);
    return;
  }
  if (state.coachActive) { notify('Finaliza el Coach antes de iniciar el intérprete.'); return; }
  if (!state.partnerLanguage || !LANGUAGES[state.partnerLanguage]) {
    notify('Selecciona primero el idioma de la otra persona.');
    ui.partnerLanguageSelect?.focus();
    return;
  }
  try {
    if (ui.conversationButton) ui.conversationButton.disabled = true;
    updateConversationSettings();
    await audioUnlock;
    await ensureMicrophone();
    state.running = true;
    state.conversationSession += 1;
    const sessionId = state.conversationSession;
    renderConversationButtonState('running');
    startRecordingSegment(sessionId);
  } catch (error) {
    cleanConversationResources();
    notify(error.message || 'Necesitamos permiso para usar el micrófono.');
    setStatus('idle');
  } finally {
    if (ui.conversationButton) ui.conversationButton.disabled = !state.partnerLanguage;
  }
}

function appendCoachBubble(role, content, meta = '') {
  if (!ui.coachThread) return null;
  const article = document.createElement('article');
  article.className = `coach-bubble ${role}`;
  const label = role === 'coach' ? 'COACH' : role === 'coach-tip' ? 'PISTA' : 'TÚ';

  if (role === 'coach') {
    const beginnerMode = (ui.coachLevel?.value || 'beginner') === 'beginner';
    article.dataset.coachText = content;
    article.dataset.quickMeaning = meta || '';
    article.innerHTML = `
      <span>${label}</span>
      <p>${escapeHTML(content)}</p>
      ${beginnerMode && meta ? `<small class="coach-beginner-meaning"><b>Significa:</b> ${escapeHTML(meta)}</small>` : ''}
      <div class="coach-tools" aria-label="Herramientas para entender y practicar esta frase">
        <button type="button" data-coach-action="meaning">¿Qué significa?</button>
        <button type="button" data-coach-action="listen">🔊 Escuchar</button>
        <button type="button" data-coach-action="slow">🐢 Más lento</button>
        <button type="button" data-coach-action="reply">💡 Ayúdame a responder</button>
        <button type="button" data-coach-action="practice">🎤 Repetir frase</button>
      </div>
      <div class="coach-inline-help is-hidden" data-coach-help></div>
      <div class="coach-repeat-result is-hidden" data-coach-repeat-result></div>`;
  } else {
    article.innerHTML = `<span>${label}</span><p>${escapeHTML(content)}</p>${meta ? `<small>${escapeHTML(meta)}</small>` : ''}`;
  }

  ui.coachThread.appendChild(article);
  ui.coachThread.scrollTop = ui.coachThread.scrollHeight;
  return article;
}

function appendCoachCorrection(result = {}) {
  if (!ui.coachThread) return null;
  const beginnerMode = (ui.coachLevel?.value || 'beginner') === 'beginner';
  const correctionThreshold = beginnerMode ? 72 : 88;
  const needsCorrection = Boolean(result.correctionNeeded) || Number(result.score || 0) < correctionThreshold;
  const card = document.createElement('article');
  card.className = `coach-turn-feedback ${needsCorrection ? 'needs-work' : 'good'}`;
  const score = Math.max(0, Math.min(100, Math.round(Number(result.score || 0))));
  const corrected = String(result.correctedEnglish || '').trim();
  const explanation = String(result.explanation || '').trim();
  const feedback = String(result.feedback || '').trim();
  const nextFocus = String(result.nextFocus || '').trim();

  card.innerHTML = needsCorrection ? `
    <div class="coach-feedback-headline"><span>${beginnerMode ? 'PEQUEÑA AYUDA' : 'MICRO-FEEDBACK'}</span><strong>${score}%</strong></div>
    <div class="coach-feedback-main">
      <div><small>UNA FORMA MÁS NATURAL</small><b>${escapeHTML(corrected)}</b></div>
      ${explanation ? `<p>${escapeHTML(explanation)}</p>` : ''}
    </div>
    <div class="coach-feedback-foot"><span>${escapeHTML(feedback || 'Sigue hablando; el objetivo es comunicarte con claridad.')}</span>${nextFocus ? `<b>${escapeHTML(nextFocus)}</b>` : ''}</div>` : `
    <div class="coach-feedback-headline"><span>BIEN DICHO</span><strong>${score}%</strong></div>
    <p>${escapeHTML(feedback || 'Tu respuesta fue clara y natural. Continúa la conversación.')}</p>`;

  ui.coachThread.appendChild(card);
  ui.coachThread.scrollTop = ui.coachThread.scrollHeight;
  return card;
}

function updateCoachSessionUI({ progress = state.coachProgress, focus = '' } = {}) {
  state.coachProgress = Math.max(state.coachProgress || 0, Math.min(100, Math.round(Number(progress || 0))));
  if (ui.coachTurnCount) ui.coachTurnCount.textContent = String(state.coachTurnCount || 0);
  if (ui.coachProgressValue) ui.coachProgressValue.textContent = `${state.coachProgress}%`;
  if (ui.coachProgressBar) ui.coachProgressBar.style.width = `${state.coachProgress}%`;
  if (ui.coachCurrentFocus && focus) ui.coachCurrentFocus.textContent = focus;
}

function renderCoachSessionHeader(session = {}) {
  if (ui.coachPersonaRole) ui.coachPersonaRole.textContent = String(session.personaRole || 'CONVERSATION PARTNER').toUpperCase();
  if (ui.coachSessionTitle) ui.coachSessionTitle.textContent = session.title || 'Conversación real';
  if (ui.coachSessionObjective) ui.coachSessionObjective.textContent = session.objective || 'Mantén una conversación natural en inglés.';
  if (ui.coachSuccessCriteria) {
    const criteria = Array.isArray(session.successCriteria) ? session.successCriteria.slice(0, 3) : [];
    ui.coachSuccessCriteria.innerHTML = criteria.map((item, index) => `<span><b>${index + 1}</b>${escapeHTML(item)}</span>`).join('');
  }
  updateCoachSessionUI({ progress: 0, focus: session.firstFocus || 'Escucha y responde naturalmente' });
}

function renderCoachSummary(summary = {}) {
  if (!ui.coachSummary) return;
  const strengths = Array.isArray(summary.strengths) ? summary.strengths.slice(0, 3) : [];
  const improve = Array.isArray(summary.improve) ? summary.improve.slice(0, 3) : [];
  const phrases = Array.isArray(summary.usefulPhrases) ? summary.usefulPhrases.slice(0, 3) : [];
  ui.coachSummary.innerHTML = `
    <div class="coach-summary-head"><span>SESIÓN COMPLETADA</span><strong>${Math.round(Number(summary.overallScore || 0))}%</strong></div>
    <h3>${escapeHTML(summary.title || 'Buen trabajo. Terminaste una conversación completa.')}</h3>
    <p>${escapeHTML(summary.summary || 'Cada conversación te da más confianza para responder en situaciones reales.')}</p>
    <div class="coach-summary-grid">
      <div><span>LO QUE HICISTE BIEN</span>${strengths.map((item) => `<b>✓ ${escapeHTML(item)}</b>`).join('')}</div>
      <div><span>PRÓXIMO ENFOQUE</span>${improve.map((item) => `<b>→ ${escapeHTML(item)}</b>`).join('')}</div>
    </div>
    ${phrases.length ? `<div class="coach-summary-phrases"><span>FRASES PARA QUEDARTE</span>${phrases.map((item) => `<button type="button" data-summary-phrase="${escapeHTML(item)}">${escapeHTML(item)}</button>`).join('')}</div>` : ''}
    <div class="coach-summary-next"><span>SIGUIENTE PASO</span><strong>${escapeHTML(summary.nextPractice || 'Repite la misma situación e intenta responder con menos ayuda.')}</strong></div>`;
  ui.coachSummary.classList.remove('is-hidden');
}

function renderCoachHelp(article, help) {
  const panel = article?.querySelector('[data-coach-help]');
  if (!panel) return;
  const keywords = Array.isArray(help.keywords) ? help.keywords.slice(0, 4) : [];
  const replies = Array.isArray(help.suggestedReplies) ? help.suggestedReplies.slice(0, 3) : [];
  panel.innerHTML = `
    <div class="coach-help-section coach-help-meaning">
      <span>QUÉ SIGNIFICA</span>
      <strong>${escapeHTML(help.meaning || article.dataset.quickMeaning || '')}</strong>
      ${help.explanation ? `<p>${escapeHTML(help.explanation)}</p>` : ''}
    </div>
    <div class="coach-help-grid">
      <div class="coach-help-section">
        <span>PRONUNCIACIÓN FÁCIL</span>
        <strong>${escapeHTML(help.pronunciation || '')}</strong>
      </div>
      <div class="coach-help-section">
        <span>CLAVE PARA ENTENDERLO</span>
        <p>${escapeHTML(help.grammarTip || 'Escucha la frase completa y responde a la idea principal.')}</p>
      </div>
    </div>
    ${keywords.length ? `<div class="coach-help-section"><span>PALABRAS CLAVE</span><div class="coach-keywords">${keywords.map((item) => `<b>${escapeHTML(item.word || '')}<small>${escapeHTML(item.meaning || '')}</small></b>`).join('')}</div></div>` : ''}
    ${replies.length ? `<div class="coach-help-section coach-help-replies"><span>PUEDES RESPONDER ASÍ</span><div class="coach-reply-options"></div></div>` : ''}`;
  const list = panel.querySelector('.coach-reply-options');
  replies.forEach((reply) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'coach-reply-option';
    button.dataset.coachSuggestion = String(reply.english || '');
    button.innerHTML = `<strong>${escapeHTML(reply.english || '')}</strong><small>${escapeHTML(reply.meaning || '')}</small>`;
    list?.appendChild(button);
  });
  panel.classList.remove('is-hidden');
  article._coachHelpData = help;
}

async function loadCoachHelp(article, focus = 'meaning') {
  const panel = article?.querySelector('[data-coach-help]');
  if (!article || !panel) return;
  if (article._coachHelpData) {
    panel.classList.remove('is-hidden');
    if (focus === 'reply') panel.querySelector('.coach-help-replies')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return;
  }

  panel.classList.remove('is-hidden');
  panel.innerHTML = `<div class="coach-help-loading">Preparando ayuda sin salir de la conversación…</div>`;
  try {
    const help = await request('/api/coach/help', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        englishText: article.dataset.coachText || '',
        quickMeaning: article.dataset.quickMeaning || '',
        nativeLanguage: ui.coachLanguage?.value || 'es',
        scenario: ui.coachScenario?.value || 'everyday',
        level: ui.coachLevel?.value || 'beginner'
      })
    });
    renderCoachHelp(article, help);
    if (focus === 'reply') panel.querySelector('.coach-help-replies')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  } catch (error) {
    const fallback = article.dataset.quickMeaning;
    panel.innerHTML = fallback
      ? `<div class="coach-help-section coach-help-meaning"><span>QUÉ SIGNIFICA</span><strong>${escapeHTML(fallback)}</strong></div>`
      : `<div class="coach-help-loading error">${escapeHTML(error.message || 'No pudimos preparar la ayuda.')}</div>`;
  }
}

async function practiceCoachPhrase(article, button) {
  if (!article || !button || state.coachBusy) return;
  const targetText = article.dataset.coachText || '';
  if (!targetText) return;

  if (state.coachPhraseRecorder?.state === 'recording') {
    state.coachPhraseRecorder.stop();
    return;
  }

  try {
    state.coachPhraseStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    state.coachPhraseChunks = [];
    const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? { mimeType: 'audio/webm;codecs=opus' } : undefined;
    const recorder = new MediaRecorder(state.coachPhraseStream, options);
    state.coachPhraseRecorder = recorder;
    button.classList.add('recording');
    button.textContent = '■ Terminar';
    listen(recorder, 'dataavailable', (event) => { if (event.data.size) state.coachPhraseChunks.push(event.data); });
    listen(recorder, 'stop', async () => {
      button.classList.remove('recording');
      button.textContent = '🎤 Repetir frase';
      state.coachPhraseStream?.getTracks().forEach((track) => track.stop());
      state.coachPhraseStream = null;
      const audio = new Blob(state.coachPhraseChunks, { type: recorder.mimeType || 'audio/webm' });
      if (audio.size < 1000) { notify('Habla un poco más tiempo e inténtalo de nuevo.'); return; }
      const resultBox = article.querySelector('[data-coach-repeat-result]');
      if (resultBox) { resultBox.classList.remove('is-hidden'); resultBox.innerHTML = '<span>ANALIZANDO</span><p>Escuchando qué tan bien se entendió la frase…</p>'; }
      try {
        const form = new FormData();
        form.append('audio', audio, 'coach-practice.webm');
        form.append('targetText', targetText);
        form.append('originalIntent', targetText);
        form.append('nativeLanguage', ui.coachLanguage?.value || 'es');
        const result = await request('/api/practice/score', { method: 'POST', body: form });
        if (resultBox) resultBox.innerHTML = `
          <div><span>QUÉ TAN BIEN TE ENTENDÍ</span><strong>${Number(result.score || 0)}%</strong></div>
          <p><b>Escuché:</b> ${escapeHTML(result.heardText || '')}</p>
          <p>${escapeHTML(result.feedback || '')}</p>
          ${result.focus ? `<small>${escapeHTML(result.focus)}</small>` : ''}`;
      } catch (error) {
        if (resultBox) resultBox.innerHTML = `<span>NO PUDIMOS EVALUAR</span><p>${escapeHTML(error.message || 'Intenta nuevamente.')}</p>`;
      }
    }, { once: true });
    recorder.start();
  } catch {
    notify('Necesitamos permiso para usar el micrófono.');
  }
}

async function startCoachSession() {
  if (state.running) { notify('Pausa la conversación antes de abrir el Coach.'); return; }
  if (state.coachBusy) return;
  try {
    state.coachBusy = true;
    if (ui.startCoach) { ui.startCoach.disabled = true; ui.startCoach.innerHTML = '<span>…</span> Preparando conversación'; }
    const result = await request('/api/coach/start', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: ui.coachScenario?.value || 'everyday',
        nativeLanguage: ui.coachLanguage?.value || 'es',
        level: ui.coachLevel?.value || 'beginner',
        goal: ui.coachGoal?.value || 'confidence',
        supportMode: ui.coachMode?.value || 'guided'
      })
    });
    state.coachActive = true;
    state.coachHistory = [];
    state.coachLastReply = result.replyEnglish;
    state.coachSessionContext = result.session || {};
    state.coachTurnCount = 0;
    state.coachProgress = 0;
    state.coachScores = [];
    if (ui.coachThread) ui.coachThread.innerHTML = '';
    ui.coachSummary?.classList.add('is-hidden');
    ui.newCoachSession?.classList.add('is-hidden');
    ui.coachResponseBox?.classList.remove('is-hidden');
    ui.coachSetup?.classList.add('is-hidden');
    ui.coachSession?.classList.remove('is-hidden');
    guidedTop(ui.coachSession, { delay: 70 });
    renderCoachSessionHeader(result.session || {});
    appendCoachBubble('coach', result.replyEnglish, result.replyMeaning);
    if (result.coachTip && ((ui.coachMode?.value || 'guided') === 'guided' || (ui.coachLevel?.value || 'beginner') === 'beginner')) appendCoachBubble('coach-tip', result.coachTip);
    if (ui.coachStatus) ui.coachStatus.textContent = 'CONVERSACIÓN EN CURSO';
    try { await speakText(result.replyEnglish, 'en', { speed: (ui.coachLevel?.value || 'beginner') === 'beginner' ? 0.84 : 1 }); } catch (error) { notify(error.message); }
    guidedScroll(ui.coachResponseBox, { block: 'center', delay: 80 });
  } catch (error) {
    notify(error.message || 'No pudimos iniciar el Coach.');
  } finally {
    state.coachBusy = false;
    if (ui.startCoach) { ui.startCoach.disabled = false; ui.startCoach.innerHTML = '<span>▶</span> Empezar conversación'; }
  }
}

function stopCoachMedia() {
  state.coachVoiceCapture?.cancel?.();
  state.coachVoiceCapture = null;
  state.coachVoiceBusy = false;
  if (state.coachRecorder?.state === 'recording') state.coachRecorder.stop();
  state.currentAudio?.pause();
  state.currentAudio = null;
  state.coachStream?.getTracks().forEach((track) => track.stop());
  state.coachStream = null;
  if (state.coachPhraseRecorder?.state === 'recording') state.coachPhraseRecorder.stop();
  state.coachPhraseStream?.getTracks().forEach((track) => track.stop());
  state.coachPhraseStream = null;
  state.coachPhraseRecorder = null;
}

function resetCoachSession() {
  stopCoachMedia();
  state.coachActive = false;
  state.coachBusy = false;
  state.coachHistory = [];
  state.coachLastReply = '';
  state.coachSessionContext = null;
  state.coachTurnCount = 0;
  state.coachProgress = 0;
  state.coachScores = [];
  ui.coachSession?.classList.add('is-hidden');
  ui.coachSetup?.classList.remove('is-hidden');
  ui.coachSummary?.classList.add('is-hidden');
  ui.newCoachSession?.classList.add('is-hidden');
  ui.coachResponseBox?.classList.remove('is-hidden');
  if (ui.coachThread) ui.coachThread.innerHTML = '';
  if (ui.coachRecord) { ui.coachRecord.classList.remove('recording'); ui.coachRecord.innerHTML = '<span>●</span> Responder con mi voz'; ui.coachRecord.disabled = false; }
  guidedTop(ui.coachSetup, { delay: 70 });
}

async function finishCoachSession() {
  if (!state.coachActive || state.coachBusy) { resetCoachSession(); return; }
  try {
    state.coachBusy = true;
    stopCoachMedia();
    if (ui.coachStatus) ui.coachStatus.textContent = 'PREPARANDO TU RESUMEN';
    if (ui.endCoach) ui.endCoach.disabled = true;
    const summary = await request('/api/coach/summary', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: ui.coachScenario?.value || 'everyday',
        nativeLanguage: ui.coachLanguage?.value || 'es',
        level: ui.coachLevel?.value || 'beginner',
        goal: ui.coachGoal?.value || 'confidence',
        session: state.coachSessionContext || {},
        history: state.coachHistory,
        scores: state.coachScores
      })
    });
    state.coachActive = false;
    ui.coachResponseBox?.classList.add('is-hidden');
    renderCoachSummary(summary);
    ui.newCoachSession?.classList.remove('is-hidden');
    if (ui.coachStatus) ui.coachStatus.textContent = 'SESIÓN COMPLETADA';
    guidedTop(ui.coachSummary, { delay: 90 });
  } catch (error) {
    notify(error.message || 'No pudimos preparar el resumen.');
    resetCoachSession();
  } finally {
    state.coachBusy = false;
    if (ui.endCoach) ui.endCoach.disabled = false;
  }
}

async function submitCoachTurn({ audio = null, text = '' } = {}) {
  if (!state.coachActive || state.coachBusy) return;
  try {
    state.coachBusy = true;
    if (ui.coachStatus) ui.coachStatus.textContent = 'ESCUCHANDO TU RESPUESTA';
    if (ui.coachRecord) ui.coachRecord.disabled = true;
    if (ui.coachSendText) ui.coachSendText.disabled = true;
    const form = new FormData();
    if (audio) form.append('audio', audio, 'coach.webm');
    if (text.trim()) form.append('text', text.trim());
    form.append('scenario', ui.coachScenario?.value || 'everyday');
    form.append('nativeLanguage', ui.coachLanguage?.value || 'es');
    form.append('level', ui.coachLevel?.value || 'beginner');
    form.append('goal', ui.coachGoal?.value || 'confidence');
    form.append('supportMode', ui.coachMode?.value || 'guided');
    form.append('turnNumber', String(state.coachTurnCount + 1));
    form.append('currentProgress', String(state.coachProgress || 0));
    form.append('session', JSON.stringify(state.coachSessionContext || {}));
    form.append('history', JSON.stringify(state.coachHistory.slice(-24)));
    const result = await request('/api/coach/turn', { method: 'POST', body: form });

    appendCoachBubble('learner', result.heardText);
    appendCoachCorrection(result);
    appendCoachBubble('coach', result.replyEnglish, result.replyMeaning);
    if ((ui.coachLevel?.value || 'beginner') === 'beginner' && result.beginnerHelp) appendCoachBubble('coach-tip', result.beginnerHelp);
    state.coachHistory.push({ coach: state.coachLastReply, learner: result.heardText, coachReply: result.replyEnglish });
    state.coachHistory = state.coachHistory.slice(-24);
    state.coachLastReply = result.replyEnglish;
    state.coachTurnCount += 1;
    state.coachScores.push(Math.max(0, Math.min(100, Number(result.score || 0))));
    state.coachScores = state.coachScores.slice(-20);
    updateCoachSessionUI({ progress: result.missionProgress, focus: result.nextFocus || result.progressNote || 'Continúa la conversación' });
    if (ui.coachTextInput) ui.coachTextInput.value = '';
    if (ui.coachStatus) ui.coachStatus.textContent = result.missionProgress >= 100 ? 'OBJETIVO COMPLETADO · PUEDES SEGUIR' : 'TU TURNO';
    try { await speakText(result.replyEnglish, 'en', { speed: (ui.coachLevel?.value || 'beginner') === 'beginner' ? 0.84 : 1 }); } catch (error) { notify(error.message); }
    guidedScroll(ui.coachResponseBox, { block: 'center', delay: 70 });
  } catch (error) {
    notify(error.message || 'No pudimos continuar la conversación.');
  } finally {
    state.coachBusy = false;
    if (ui.coachRecord) ui.coachRecord.disabled = false;
    if (ui.coachSendText) ui.coachSendText.disabled = false;
  }
}

async function toggleCoachRecording() {
  if (!state.coachActive || state.coachBusy || state.coachVoiceBusy) return;
  try {
    state.coachVoiceBusy = true;
    ui.coachRecord?.classList.add('recording');
    if (ui.coachStatus) ui.coachStatus.textContent = 'ESCUCHANDO';
    if (ui.coachRecord) ui.coachRecord.innerHTML = '<span>●</span> Habla y haz una pausa';
    const capture = await createAutoVoiceTurn({
      onState: (mode) => {
        if (mode === 'waiting') { if (ui.coachStatus) ui.coachStatus.textContent = 'HABLA CUANDO ESTÉS LISTO'; }
        if (mode === 'listening') {
          if (ui.coachStatus) ui.coachStatus.textContent = 'TE ESCUCHO';
          if (ui.coachRecord) ui.coachRecord.innerHTML = '<span>●</span> Te escucho…';
        }
        if (mode === 'thinking') {
          if (ui.coachStatus) ui.coachStatus.textContent = 'PAUSA NATURAL';
          if (ui.coachRecord) ui.coachRecord.innerHTML = '<span>◌</span> Esperando por si continúas…';
        }
        if (mode === 'processing') {
          if (ui.coachStatus) ui.coachStatus.textContent = 'PROCESANDO TU RESPUESTA';
          if (ui.coachRecord) ui.coachRecord.innerHTML = '<span>✓</span> Entendido';
        }
      }
    });
    state.coachVoiceCapture = capture;
    const audio = await capture.promise;
    state.coachVoiceCapture = null;
    await submitCoachTurn({ audio });
  } catch (error) {
    if (error?.name !== 'AbortError') notify(error.message || 'Necesitamos permiso para usar el micrófono.');
  } finally {
    state.coachVoiceCapture = null;
    state.coachVoiceBusy = false;
    ui.coachRecord?.classList.remove('recording');
    if (ui.coachRecord && !state.coachBusy) ui.coachRecord.innerHTML = '<span>●</span> Responder con mi voz';
  }
}

function setCameraAnalyzeButton(mode = 'ready') {
  if (!ui.analyzeImage) return;
  if (mode === 'loading') {
    ui.analyzeImage.innerHTML = '<span>…</span><strong>Leyendo imagen</strong><small>Detectando texto y preparando la traducción</small>';
    return;
  }
  ui.analyzeImage.innerHTML = '<span>✦</span><strong>Analizar y traducir</strong><small>Detectar texto + traducción + contexto</small>';
}

function clearCameraSelection() {
  state.cameraFile = null;
  state.cameraResult = null;
  if (state.cameraPreviewUrl) URL.revokeObjectURL(state.cameraPreviewUrl);
  state.cameraPreviewUrl = null;
  if (ui.cameraInput) ui.cameraInput.value = '';
  if (ui.cameraPreview) ui.cameraPreview.removeAttribute('src');
  ui.cameraPreviewWrap?.classList.add('is-hidden');
  ui.cameraResult?.classList.add('is-hidden');
  ui.explanationBox?.classList.add('is-hidden');
  if (ui.analyzeImage) { ui.analyzeImage.disabled = true; ui.analyzeImage.classList.add('is-hidden'); }
}

function handleCameraFile() {
  const file = ui.cameraInput?.files?.[0];
  if (!file) { clearCameraSelection(); return; }
  if (file.size > 10 * 1024 * 1024) { notify('La imagen supera el máximo de 10 MB.'); clearCameraSelection(); return; }
  state.cameraFile = file;
  if (state.cameraPreviewUrl) URL.revokeObjectURL(state.cameraPreviewUrl);
  state.cameraPreviewUrl = URL.createObjectURL(file);
  if (ui.cameraPreview) ui.cameraPreview.src = state.cameraPreviewUrl;
  ui.cameraPreviewWrap?.classList.remove('is-hidden');
  if (ui.analyzeImage) { ui.analyzeImage.disabled = false; ui.analyzeImage.classList.remove('is-hidden'); }
  ui.cameraResult?.classList.add('is-hidden');
  ui.explanationBox?.classList.add('is-hidden');
  guidedScroll(ui.analyzeImage, { block: 'center', delay: 90 });
}

async function analyzeCameraImage() {
  if (!state.cameraFile || !ui.analyzeImage) return;
  try {
    ui.analyzeImage.disabled = true;
    setCameraAnalyzeButton('loading');
    const form = new FormData();
    form.append('image', state.cameraFile, state.cameraFile.name || 'photo.jpg');
    form.append('sourceLanguage', ui.cameraSourceLanguage?.value || 'auto');
    form.append('targetLanguage', ui.cameraTargetLanguage?.value || 'es');
    form.append('situation', ui.cameraSituation?.value || 'everyday');
    const result = await request('/api/image/analyze', { method: 'POST', body: form });
    state.cameraResult = result;
    if (ui.cameraDocumentType) ui.cameraDocumentType.textContent = String(result.documentType || 'Documento').toUpperCase();
    if (ui.cameraDetectedLanguage) ui.cameraDetectedLanguage.textContent = result.detectedLanguage ? `Detectado: ${LANGUAGES[result.detectedLanguage] || result.detectedLanguage}` : 'Idioma detectado';
    if (ui.cameraOriginalText) ui.cameraOriginalText.textContent = result.extractedText;
    if (ui.cameraTranslatedText) ui.cameraTranslatedText.textContent = result.translatedText;
    ui.explanationBox?.classList.add('is-hidden');
    ui.cameraResult?.classList.remove('is-hidden');
    guidedTop(ui.cameraResult, { delay: 90 });
  } catch (error) {
    notify(error.message || 'No pudimos leer la imagen.');
  } finally {
    ui.analyzeImage.disabled = false;
    setCameraAnalyzeButton('ready');
  }
}

function renderExplanation(result) {
  if (ui.explanationSummary) ui.explanationSummary.textContent = result.summary || 'Explicación disponible.';
  if (ui.explanationPoints) {
    ui.explanationPoints.innerHTML = result.importantPoints?.length
      ? `<h4>Puntos importantes</h4><ul>${result.importantPoints.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>` : '';
  }
  if (ui.explanationActions) {
    ui.explanationActions.innerHTML = result.actions?.length
      ? `<h4>Qué debes hacer</h4><ul>${result.actions.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>` : '';
  }
  if (ui.explanationCaution) {
    ui.explanationCaution.textContent = result.caution || '';
    ui.explanationCaution.classList.toggle('is-hidden', !result.caution);
  }
  ui.explanationBox?.classList.remove('is-hidden');
  guidedTop(ui.explanationBox, { delay: 70 });
}

async function explainCameraResult() {
  if (!state.cameraResult || !ui.explainCameraText) return;
  try {
    ui.explainCameraText.disabled = true;
    ui.explainCameraText.textContent = 'Explicando…';
    const result = await request('/api/explain', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: state.cameraResult.extractedText,
        translation: state.cameraResult.translatedText,
        language: ui.cameraTargetLanguage?.value || 'es',
        situation: ui.cameraSituation?.value || 'everyday'
      })
    });
    renderExplanation(result);
  } catch (error) {
    notify(error.message || 'No pudimos explicar este texto.');
  } finally {
    ui.explainCameraText.disabled = false;
    ui.explainCameraText.textContent = '✦ Explícame esto';
  }
}

async function copyText(item) {
  await navigator.clipboard.writeText(`${item.originalText}\n\n${item.translatedText}`);
  notify('Traducción copiada.');
}

async function shareText(item) {
  const text = `${item.originalText}\n\n${item.translatedText}`;
  if (navigator.share) { await navigator.share({ title: 'Sin Barreras', text }); return; }
  await copyText(item);
}

function showLearnHome() {
  ui.learnHome?.classList.remove('is-hidden');
  ui.learnSoundsBranch?.classList.add('is-hidden');
  ui.learnRoutesBranch?.classList.add('is-hidden');
  ui.learnConversationsBranch?.classList.add('is-hidden');
  ui.learnWordsBranch?.classList.add('is-hidden');
  window.scrollTo?.({ top: 0, behavior: 'smooth' });
}

function openLearnPath(path) {
  ui.learnHome?.classList.add('is-hidden');
  ui.learnSoundsBranch?.classList.toggle('is-hidden', path !== 'sounds');
  ui.learnRoutesBranch?.classList.toggle('is-hidden', path !== 'routes');
  ui.learnConversationsBranch?.classList.toggle('is-hidden', path !== 'conversations');
  ui.learnWordsBranch?.classList.toggle('is-hidden', path !== 'words');
  if (path === 'sounds') sounds?.render();
  if (path === 'routes' || path === 'words') learning?.render();
  if (path === 'conversations') renderConversationLearning();
  window.scrollTo?.({ top: 0, behavior: 'smooth' });
}

function showView(view) {
  const enteringLearn = view === 'learn' && ui.learnView?.classList.contains('is-hidden');
  if (view !== 'practice') { state.practiceVoiceCapture?.cancel?.(); state.practiceVoiceCapture = null; state.practiceVoiceBusy = false; }
  const secondary = view !== 'conversation';
  if (secondary && state.running) toggleConversation();
  if (view !== 'coach' && state.coachActive) resetCoachSession();
  ui.shell?.classList.toggle('secondary-view', secondary);
  ui.historyView?.classList.toggle('is-hidden', view !== 'history');
  ui.phrasebookView?.classList.toggle('is-hidden', view !== 'phrasebook');
  ui.learnView?.classList.toggle('is-hidden', view !== 'learn');
  ui.practiceView?.classList.toggle('is-hidden', view !== 'practice');
  ui.coachView?.classList.toggle('is-hidden', view !== 'coach');
  ui.cameraView?.classList.toggle('is-hidden', view !== 'camera');
  $$('.nav-item').forEach((item) => item.classList.toggle('is-active', item.dataset.view === view));
  if (view === 'history') renderHistory();
  if (view === 'phrasebook') phrasebook?.render();
  if (view === 'practice') renderPracticePoints();
  if (view === 'learn') { learning?.render(); sounds?.render(); if (enteringLearn) showLearnHome(); }
  window.scrollTo?.({ top: 0, behavior: 'smooth' });
}

installAudioUnlock();

learning = initLearning({
  notify,
  speakText,
  request,
  createAutoVoiceTurn,
  getNativeLanguage: () => state.settings.detectedUserLanguage || state.userLanguage || 'es',
  onNavigate: showView
});

sounds = initSounds({
  notify,
  speakText,
  request,
  createAutoVoiceTurn,
  getNativeLanguage: () => state.settings.detectedUserLanguage || state.userLanguage || 'es'
});

phrasePractice = initPhrasePractice({
  request,
  notify,
  createAutoVoiceTurn,
  speakText,
  languageName,
  onPoints: addPracticePoints,
  onComplete: (item, result) => {
    phrasebook?.recordPractice?.(item?.id, result);
    if (result?.averageScore) notify(`Práctica completada · promedio ${result.averageScore}%.`);
    else notify('Práctica completada. Repite la frase cuando quieras.');
  }
});

phrasebook = initPhrasebook({
  notify,
  request,
  onPractice: (item) => phrasePractice?.start(item)
});

qrConversation = initQrConversation({
  notify,
  request,
  languages: LANGUAGES,
  createAutoVoiceTurn,
  getDefaults: () => ({
    hostLanguage: state.userLanguage || state.settings.detectedUserLanguage || state.userLanguageHint || browserLanguageHint() || 'es',
    guestLanguage: state.partnerLanguage || (state.userLanguage === 'en' ? 'es' : 'en'),
    situation: state.situation || 'everyday',
    voice: state.settings.translatorVoice || 'coral'
  })
});

$$('[data-learn-path]').forEach((button) => listen(button, 'click', () => openLearnPath(button.dataset.learnPath)));
$$('[data-learn-back]').forEach((button) => listen(button, 'click', showLearnHome));

listen(ui.conversationButton, 'click', toggleConversation);
listen(ui.openFaceToFace, 'click', openFaceToFace);
listen(ui.closeFaceToFace, 'click', closeFaceToFace);
listen(ui.faceToggleListening, 'click', toggleConversation);
listen(ui.facePartnerRepeat, 'click', async () => {
  if (state.running) return notify('Pausa la conversación antes de repetir el audio.');
  if (state.facePartnerAudio) await playAudio(state.facePartnerAudio.base64, state.facePartnerAudio.language, { resumeConversation: false });
});
listen(ui.faceUserRepeat, 'click', async () => {
  if (state.running) return notify('Pausa la conversación antes de repetir el audio.');
  if (state.faceUserAudio) await playAudio(state.faceUserAudio.base64, state.faceUserAudio.language, { resumeConversation: false });
});
listen(ui.openPhrasebook, 'click', () => showView('phrasebook'));
listen(ui.settingsOpenPhrasebook, 'click', () => { ui.settingsDialog?.close(); showView('phrasebook'); });
listen(ui.saveCurrentTranslation, 'click', async () => {
  try { await phrasebook?.saveInterpretation(state.currentResult); }
  catch (error) { notify(error.message || 'No pudimos guardar la frase.'); }
});

listen(ui.conversationSituation, 'change', () => {
  state.situation = ui.conversationSituation?.value || 'everyday';
  renderAutomaticLanguageState();
  if (state.partnerLanguage) guidedScroll(ui.conversationButton, { block: 'center', delay: 70 });
});

listen(ui.partnerLanguageSelect, 'change', () => {
  const nextLanguage = ui.partnerLanguageSelect?.value || '';
  if (!LANGUAGES[nextLanguage]) return;
  state.partnerLanguage = nextLanguage;
  updatePartnerSelectionUI();
  if (state.userLanguage === nextLanguage) {
    state.userLanguage = null;
    state.settings.detectedUserLanguage = null;
  }
  persistConversationSettings();
  renderAutomaticLanguageState();
  notify(`Idioma de la otra persona: ${LANGUAGES[nextLanguage]}. Tu idioma seguirá detectándose automáticamente.`);
  guidedScroll(ui.conversationButton, { block: 'center', delay: 90 });
});

listen(ui.translatorVoiceSelect, 'change', () => {
  const voice = ui.translatorVoiceSelect?.value || 'coral';
  if (!TTS_VOICES.has(voice)) return;
  state.settings.translatorVoice = voice;
  persistConversationSettings();
  notify(`Voz del traductor: ${voice.charAt(0).toUpperCase()}${voice.slice(1)}.`);
});

listen(ui.previewVoice, 'click', async () => {
  if (state.running) { notify('Pausa la conversación para probar otra voz.'); return; }
  try {
    ui.previewVoice.disabled = true;
    await speakText('Hello. This is your Sin Barreras translator voice.', 'en');
  } catch (error) {
    notify(error.message);
  } finally {
    ui.previewVoice.disabled = false;
  }
});

listen(ui.repeatButton, 'click', async () => {
  if (!state.currentTranslation || !state.currentLanguage) return;
  if (state.running) { notify('Pausa la conversación antes de repetir la traducción.'); return; }
  try { await playAudio(state.currentBase64, state.currentLanguage, { resumeConversation: false }); }
  catch (error) { notify(error.message); }
});

listen(ui.learnFromTranslation, 'click', async () => {
  const result = state.currentResult;
  if (!result || !learning) return;
  const englishText = result.sourceLanguage === 'en' ? result.originalText : result.targetLanguage === 'en' ? result.translatedText : '';
  if (!englishText) { notify('Esta conversación no contiene texto en inglés para aprender.'); return; }
  const originalLabel = ui.learnFromTranslation.textContent;
  try {
    ui.learnFromTranslation.disabled = true;
    ui.learnFromTranslation.textContent = 'Buscando palabras útiles…';
    const added = await learning.importFromEnglishText(englishText, result.situation || state.situation);
    showView('learn');
    openLearnPath('words');
    if (added > 0) {
      notify(`${added} ${added === 1 ? 'palabra guardada' : 'palabras guardadas'} en Mis palabras. Ya puedes practicarlas.`);
    } else {
      notify('Estas palabras ya estaban guardadas. Te llevé a Mis palabras para que puedas practicarlas.');
    }
  } catch (error) {
    notify(error.message || 'No pudimos preparar estas palabras.');
  } finally {
    ui.learnFromTranslation.disabled = false;
    ui.learnFromTranslation.textContent = originalLabel;
  }
});

listen(ui.conversationLearningList, 'click', async (event) => {
  const action = event.target?.dataset?.learningAction;
  if (!action) return;
  const id = event.target.closest('[data-learning-id]')?.dataset?.learningId;
  const item = conversationLearningCandidates().find((entry) => entry.id === id);
  if (!item) return;
  try {
    if (action === 'listen') await speakText(item.englishText, 'en');
    if (action === 'practice') preparePhraseForPractice(item);
    if (action === 'save') await phrasebook?.savePhrase({
      sourceText: item.meaning, translatedText: item.englishText, sourceLanguage: item.nativeLanguage, targetLanguage: 'en', situation: item.situation
    });
  } catch (error) { notify(error.message || 'No pudimos completar la acción.'); }
});

$$('.nav-item').forEach((button) => listen(button, 'click', () => showView(button.dataset.view)));

listen(ui.clearHistory, 'click', () => {
  localStorage.removeItem(HISTORY_KEY); window.SinBarrerasCloud?.queueSync?.();
  renderHistory();
  notify('Historial eliminado de este dispositivo.');
});

listen(ui.historyList, 'click', async (event) => {
  const action = event.target?.dataset?.action;
  if (!action) return;
  const container = event.target.closest('.history-item');
  const item = readHistory().find((entry) => entry.id === container?.dataset?.id);
  if (!item) return;
  try {
    if (action === 'delete') { writeHistory(readHistory().filter((entry) => entry.id !== item.id)); notify('Registro eliminado.'); }
    if (action === 'copy') await copyText(item);
    if (action === 'share') await shareText(item);
    if (action === 'speak') await speakText(item.translatedText, item.targetLanguage);
    if (action === 'learn') preparePhraseForPractice(item);
    if (action === 'save') await phrasebook?.savePhrase({ sourceText: item.originalText, translatedText: item.translatedText, sourceLanguage: item.sourceLanguage, targetLanguage: item.targetLanguage, situation: item.situation, createdAt: item.createdAt });
  } catch (error) {
    if (error.name !== 'AbortError') notify(error.message || 'No fue posible completar la acción.');
  }
});

listen($('#settings-button'), 'click', () => ui.settingsDialog?.showModal());
listen(ui.openHistory, 'click', () => {
  ui.settingsDialog?.close();
  showView('history');
});
listen(ui.themeButton, 'click', () => {
  state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); window.SinBarrerasCloud?.queueSync?.();
  applySettings();
});
listen(ui.fontSize, 'change', () => {
  state.settings.fontSize = ui.fontSize.value;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); window.SinBarrerasCloud?.queueSync?.();
  applySettings();
});
$$('.theme-option').forEach((button) => listen(button, 'click', () => {
  state.settings.theme = button.dataset.theme;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); window.SinBarrerasCloud?.queueSync?.();
  applySettings();
}));
listen($('#onboarding-continue'), 'click', () => {
  localStorage.setItem(ONBOARDING_KEY, '1'); window.SinBarrerasCloud?.queueSync?.();
  ui.onboardingDialog?.close();
  guidedScroll(ui.partnerLanguageSelect, { block: 'center', highlight: true, delay: 150, focus: true });
});

listen(ui.practiceForm, 'submit', preparePractice);
listen(ui.practiceLanguage, 'change', () => keepPracticeLanguagesDistinct('native'));
listen(ui.practiceTargetLanguage, 'change', () => keepPracticeLanguagesDistinct('target'));
listen(ui.listenPractice, 'click', async () => {
  if (!state.practice) return;
  try { await speakText(state.practice.targetText || state.practice.english, state.practice.targetLanguage || 'en'); } catch (error) { notify(error.message); }
});
listen(ui.recordPractice, 'click', togglePracticeRecording);

listen(ui.coachThread, 'click', async (event) => {
  const suggestion = event.target.closest('[data-coach-suggestion]');
  if (suggestion) {
    if (ui.coachTextInput) {
      ui.coachTextInput.value = suggestion.dataset.coachSuggestion || '';
      ui.coachTextInput.focus();
      notify('Respuesta colocada. Puedes cambiarla, escribirla o decirla con tu voz.');
    }
    return;
  }

  const button = event.target.closest('[data-coach-action]');
  if (!button) return;
  const article = button.closest('.coach-bubble.coach');
  const text = article?.dataset.coachText || '';
  if (!article || !text) return;
  const action = button.dataset.coachAction;
  try {
    if (action === 'meaning') await loadCoachHelp(article, 'meaning');
    else if (action === 'reply') await loadCoachHelp(article, 'reply');
    else if (action === 'listen') await speakText(text, 'en', { speed: 1 });
    else if (action === 'slow') await speakText(text, 'en', { speed: 0.72 });
    else if (action === 'practice') await practiceCoachPhrase(article, button);
  } catch (error) {
    notify(error.message || 'No pudimos completar esa ayuda.');
  }
});

listen(ui.coachSummary, 'click', async (event) => {
  const phrase = event.target.closest('[data-summary-phrase]');
  if (!phrase) return;
  const text = phrase.dataset.summaryPhrase || '';
  if (!text) return;
  try { await speakText(text, 'en', { speed: 0.82 }); } catch (error) { notify(error.message); }
});

listen(ui.startCoach, 'click', startCoachSession);
listen(ui.endCoach, 'click', finishCoachSession);
listen(ui.newCoachSession, 'click', resetCoachSession);
listen(ui.coachRecord, 'click', toggleCoachRecording);
listen(ui.coachSendText, 'click', () => {
  const text = ui.coachTextInput?.value.trim();
  if (!text) { notify('Escribe una respuesta en inglés.'); return; }
  submitCoachTurn({ text });
});
listen(ui.coachTextInput, 'keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    ui.coachSendText?.click();
  }
});

listen(ui.cameraInput, 'change', handleCameraFile);
listen(ui.removeCameraImage, 'click', clearCameraSelection);
listen(ui.analyzeImage, 'click', analyzeCameraImage);
listen(ui.listenCameraTranslation, 'click', async () => {
  if (!state.cameraResult) return;
  try { await speakText(state.cameraResult.translatedText, state.cameraResult.targetLanguage); }
  catch (error) { notify(error.message); }
});
listen(ui.explainCameraText, 'click', explainCameraResult);

window.addEventListener('beforeunload', () => {
  state.practiceVoiceCapture?.cancel?.();
  state.coachVoiceCapture?.cancel?.();
  state.conversationController?.abort();
  cleanConversationResources();
  state.practiceStream?.getTracks().forEach((track) => track.stop());
  state.coachStream?.getTracks().forEach((track) => track.stop());
  if (state.cameraPreviewUrl) URL.revokeObjectURL(state.cameraPreviewUrl);
  destroyAudioPlayback();
  aiStageController?.destroy?.();
});

migrateLocalStorage();
try { state.settings = { ...state.settings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; } catch { /* use defaults */ }
// The other person's language is intentionally never restored from storage.
// It must be selected manually for each app session.
delete state.settings.partnerLanguage;
if (!LANGUAGES[state.settings.detectedUserLanguage] && LANGUAGES[state.settings.primaryLanguage]) {
  state.settings.detectedUserLanguage = state.settings.primaryLanguage;
}
if (!TTS_VOICES.has(state.settings.translatorVoice)) state.settings.translatorVoice = 'coral';
delete state.settings.primaryLanguage;
populatePartnerLanguageSelect();
populatePracticeLanguageSelects();
applySettings();
updateConversationSettings();
updatePartnerSelectionUI();
renderHistory();
renderPracticePoints();
setCameraAnalyzeButton('ready');
aiStageController = initAIStage({ stage: ui.aiStage, canvas: ui.aiCanvas, fallback: ui.aiFallback });
renderConversationButtonState('idle');
setStatus('idle');
updateWaveVisual(0, false);
if (!localStorage.getItem(ONBOARDING_KEY)) ui.onboardingDialog?.showModal();
