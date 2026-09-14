import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appHtml = fs.readFileSync(new URL('../private/app.html', import.meta.url), 'utf8');
const landingHtml = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const adminHtml = fs.readFileSync(new URL('../private/admin.html', import.meta.url), 'utf8');
const javascript = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const learnJavascript = fs.readFileSync(new URL('../public/learn.js', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server/server.js', import.meta.url), 'utf8');
const authRoutes = fs.readFileSync(new URL('../routes/authRoutes.js', import.meta.url), 'utf8');
const adminRoutes = fs.readFileSync(new URL('../routes/adminRoutes.js', import.meta.url), 'utf8');
const accountRoutes = fs.readFileSync(new URL('../routes/accountRoutes.js', import.meta.url), 'utf8');
const billingRoutes = fs.readFileSync(new URL('../routes/billingRoutes.js', import.meta.url), 'utf8');
const serviceWorker = fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const languagesJavascript = fs.readFileSync(new URL('../public/languages.js', import.meta.url), 'utf8');
const cloudJavascript = fs.readFileSync(new URL('../public/cloud.js', import.meta.url), 'utf8');

const assertIdsExist = (source, html, label) => {
  const selectors = [...source.matchAll(/\$\('#([^']+)'\)/g)].map((match) => match[1]);
  for (const id of [...new Set(selectors)]) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `Missing HTML element #${id} required by ${label}`);
  }
};

test('every static ID requested by app.js exists in protected app.html', () => assertIdsExist(javascript, appHtml, 'app.js'));
test('every static ID requested by learn.js exists in protected app.html', () => assertIdsExist(learnJavascript, appHtml, 'learn.js'));

test('versioned frontend assets are loaded by protected app', () => {
  assert.match(appHtml, /app-bootstrap\.js\?v=1\.4\.42/);
  assert.match(appHtml, /styles\.css\?v=1\.4\.42/);
  assert.match(javascript, /learn\.js\?v=1\.4\.42/);
});

test('public landing contains real signup and pricing surfaces', () => {
  assert.match(landingHtml, /\$5\.99/);
  assert.match(landingHtml, /id="google-login"/);
  assert.match(landingHtml, /id="subscribe-button"/);
  assert.match(landingHtml, /id="login-form"/);
  assert.match(landingHtml, /id="register-form"/);
  assert.doesNotMatch(landingHtml, /id="owner-access"/);
});

test('protected application and admin dashboard are server-gated', () => {
  assert.match(server, /app\.get\('\/app', requireAccess/);
  assert.match(server, /app\.get\('\/admin', requireOwner/);
  assert.match(server, /app\.use\('\/api', requireAccess\)/);
});

test('SaaS billing creates a recurring $5.99 monthly Stripe Checkout subscription', () => {
  assert.match(billingRoutes, /mode: 'subscription'/);
  assert.match(billingRoutes, /STRIPE_MONTHLY_AMOUNT \|\| 599/);
  assert.match(billingRoutes, /recurring: \{ interval: 'month' \}/);
});

test('Google OAuth and optional ChatGPT OAuth routes exist', () => {
  assert.match(authRoutes, /router\.get\('\/google'/);
  assert.match(authRoutes, /passport\.authenticate\('google'/);
  assert.match(authRoutes, /router\.get\('\/chatgpt'/);
  assert.match(authRoutes, /chatgptEnabled/);
});

test('owner can pre-authorize free access by email', () => {
  assert.match(adminRoutes, /router\.post\('\/grants'/);
  assert.match(adminRoutes, /user\.freeAccess = true/);
  assert.match(adminHtml, /Acceso gratuito por email/);
  assert.match(adminHtml, /id="grant-email"/);
});

test('admin has revoke, restore, cancel subscription, and delete user endpoints', () => {
  assert.match(adminRoutes, /users\/:id\/revoke/);
  assert.match(adminRoutes, /users\/:id\/restore/);
  assert.match(adminRoutes, /users\/:id\/cancel-subscription/);
  assert.match(adminRoutes, /router\.delete\('\/users\/:id'/);
});

test('each authenticated user gets an isolated cloud state record', () => {
  assert.match(accountRoutes, /UserState\.findOne\(\{ user: request\.user\._id \}\)/);
  assert.match(accountRoutes, /UserState\.findOneAndUpdate\(\{ user: request\.user\._id \}/);
});

test('service worker does not cache private app, admin, API, auth, or billing routes', () => {
  assert.match(serviceWorker, /PRIVATE_PREFIXES/);
  for (const path of ['/app', '/admin', '/api/', '/auth/', '/billing/']) assert.match(serviceWorker, new RegExp(path.replaceAll('/', '\\/')));
});

test('conversation auto-detects the user language while the partner language is selected explicitly', () => {
  assert.doesNotMatch(appHtml, /id="swap-languages"/);
  assert.doesNotMatch(appHtml, /id="primary-language-select"/);
  assert.match(appHtml, /id="partner-language-select"/);
  assert.match(appHtml, /MI IDIOMA · AUTO/);
  assert.match(javascript, /form\.append\('partnerLanguage', state\.partnerLanguage\)/);
  assert.match(javascript, /form\.append\('userLanguage', state\.userLanguage\)/);
  assert.match(javascript, /form\.append\('userLanguageHint', state\.userLanguageHint\)/);
  assert.match(javascript, /result\.detectedUserLanguage/);
  assert.match(server, /sourceLanguage === partnerLanguage/);
  assert.match(server, /userLanguage = sourceLanguage/);
  assert.match(server, /direction = 'inbound'/);
  assert.match(server, /direction = 'outbound'/);
});

test('translator voice is user-selectable and validated server-side', () => {
  assert.match(appHtml, /id="translator-voice-select"/);
  assert.match(appHtml, /id="preview-voice"/);
  assert.match(javascript, /translatorVoice/);
  assert.match(javascript, /form\.append\('voice', state\.settings\.translatorVoice/);
  assert.match(server, /const TTS_VOICES = new Set/);
  assert.match(server, /cleanVoice/);
  assert.match(server, /speak\(translatedText, targetLanguage, voice\)/);
});

test('admin dashboard displays the official Sin Barreras logo in the main header', () => {
  assert.match(adminHtml, /admin-topbar-logo/);
  assert.match(adminHtml, /sin-barreras-logo-full\.png/);
});

test('practice pronunciation still forbids IPA symbols', () => {
  assert.match(server, /pronunciation must NEVER use IPA/);
  assert.match(server, /hasUnfriendlyPronunciationSymbols/);
  assert.match(server, /repairPronunciationGuide/);
});

test('learning routes remain split into long multi-session levels', () => {
  assert.match(learnJavascript, /WORDS_PER_LEVEL = 8/);
  assert.match(learnJavascript, /SESSIONS_PER_LEVEL = 5/);
  assert.match(learnJavascript, /LEVEL_BLUEPRINTS/);
  assert.match(learnJavascript, /levelSessions/);
  assert.match(appHtml, /id="learn-level-panel"/);
  assert.match(appHtml, /id="learn-level-grid"/);
});

test('partner language selector exposes the full multilingual catalog while user language stays automatic', () => {
  assert.match(appHtml, /id="partner-language-select"/);
  assert.match(appHtml, /MI IDIOMA · AUTO/);
  assert.match(javascript, /populatePartnerLanguageSelect/);
  assert.match(javascript, /POPULAR_PARTNER_CODES/);
  const codes = [...languagesJavascript.matchAll(/\{ code: "([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(codes).size, 99);
  for (const code of ['en', 'es', 'zh', 'ar', 'tl', 'ht', 'uk', 'sw', 'bn', 'fa', 'th', 'ur', 'haw']) {
    assert.ok(codes.includes(code), `Missing partner language ${code}`);
  }
  assert.match(server, /const SUPPORTED_LANGUAGES = API_LANGUAGE_NAMES/);
  assert.match(server, /LANGUAGE_ALIASES/);
});



test('partner language is manual-only with no automatic/default selection', () => {
  assert.match(appHtml, /id="partner-language-select"[^>]*required/);
  assert.match(appHtml, /value="" selected disabled>Selecciona su idioma/);
  assert.doesNotMatch(appHtml, /id="partner-language-select"[\s\S]{0,500}<option value="auto"/);
  assert.match(javascript, /partnerLanguage: null/);
  assert.match(javascript, /Selecciona primero el idioma de la otra persona/);
  assert.match(javascript, /delete state\.settings\.partnerLanguage/);
  assert.doesNotMatch(javascript, /state\.settings\.partnerLanguage = nextLanguage/);
  assert.doesNotMatch(javascript, /state\.settings\.partnerLanguage \|\| 'en'/);
});



test('cloud state never restores the other person language', () => {
  const cloud = fs.readFileSync(new URL('../public/cloud.js', import.meta.url), 'utf8');
  assert.match(cloud, /delete settings\.partnerLanguage/);
  assert.match(javascript, /partnerLanguage: null/);
  assert.match(javascript, /updatePartnerSelectionUI/);
  assert.doesNotMatch(javascript, /ESCUCHANDO · AUTO/);
});

test('MongoDB configuration comes only from environment variables with no credential hardcoding', () => {
  const envConfig = fs.readFileSync(new URL('../config/env.js', import.meta.url), 'utf8');
  const dbConfig = fs.readFileSync(new URL('../config/db.js', import.meta.url), 'utf8');
  const envExample = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
  const renderYaml = fs.readFileSync(new URL('../render.yaml', import.meta.url), 'utf8');
  const mongoCheck = fs.readFileSync(new URL('../scripts/check-mongodb.js', import.meta.url), 'utf8');
  const bootstrap = fs.readFileSync(new URL('../server/bootstrap.js', import.meta.url), 'utf8');

  assert.match(envConfig, /process\.env\.MONGODB_URI/);
  assert.match(envConfig, /process\.env\.MONGODB_DB_NAME/);
  assert.match(dbConfig, /mongoose\.connect\(uri, \{/);
  assert.match(server, /clientPromise: mongoClientPromise/);
  assert.match(envExample, /^MONGODB_URI=/m);
  assert.match(renderYaml, /key: MONGODB_URI/);
});

test('local login is primary and public owner entry is removed', () => {
  assert.match(landingHtml, /id="login-form"/);
  assert.match(landingHtml, /id="register-form"/);
  assert.match(landingHtml, /o continúa con/);
  assert.doesNotMatch(landingHtml, /id="owner-access"/);
  assert.doesNotMatch(landingHtml, /id="owner-dialog"/);
});

test('owner is protected from billing and admin remains owner-only', () => {
  const billing = fs.readFileSync(new URL('../routes/billingRoutes.js', import.meta.url), 'utf8');
  const auth = fs.readFileSync(new URL('../middleware/auth.js', import.meta.url), 'utf8');
  const ownerService = fs.readFileSync(new URL('../services/ownerService.js', import.meta.url), 'utf8');
  assert.match(billing, /request\.user\.role === 'owner'/);
  assert.match(auth, /request\.user\.role !== 'owner'/);
  assert.match(ownerService, /freeAccess = true/);
});

test('mobile hero uses compact Sin Barreras copy', () => {
  assert.match(appHtml, />INTÉRPRETE INTELIGENTE</);
  assert.doesNotMatch(appHtml, /INTÉRPRETE INTELIGENTE · CONVERSACIÓN EN DOS DIRECCIONES/);
  assert.match(appHtml, /Elige el idioma de la otra persona\. Tu idioma se detecta automáticamente/);
});

test('learning uses the supplied category artwork and intelligent feedback copy', () => {
  for (const category of ['everyday','work','construction','medical','shopping','restaurant','interview','school']) {
    assert.match(learnJavascript, new RegExp(`/assets/learn/${category}\\.png`));
  }
  assert.match(appHtml, /RETROALIMENTACIÓN INTELIGENTE/);
  assert.match(learnJavascript, /Bien\. Ya conectaste significado y uso\./);
  assert.match(learnJavascript, /Todavía no\. La reforzamos en unos pasos\./);
});


test('footer main menu uses the supplied custom icons for each main option', () => {
  for (const asset of [
    '/assets/footer-menu-v1413/hablar.png', '/assets/footer-menu-v1413/hablar-active.png',
    '/assets/footer-menu-v1413/aprender.png', '/assets/footer-menu-v1413/aprender-active.png',
    '/assets/footer-menu-v1413/practica.png', '/assets/footer-menu-v1413/practica-active.png',
    '/assets/footer-menu-v1413/coach.png', '/assets/footer-menu-v1413/coach-active.png',
    '/assets/footer-menu-v1413/camara.png', '/assets/footer-menu-v1413/camara-active.png'
  ]) {
    assert.match(appHtml, new RegExp(asset.replaceAll('/', '\\/')));
    assert.match(serviceWorker, new RegExp(asset.replaceAll('/', '\\/')));
  }
  assert.match(appHtml, /aria-label="Abrir Hablar"/);
  assert.match(appHtml, /aria-label="Abrir Aprender"/);
  assert.match(appHtml, /aria-label="Abrir Práctica"/);
  assert.match(appHtml, /aria-label="Abrir Coach"/);
  assert.match(appHtml, /aria-label="Abrir Cámara"/);
});


test('protected app and admin HTML are never browser-cached', () => {
  assert.match(server, /Cache-Control', 'no-store, no-cache, must-revalidate, private/);
  assert.match(server, /Pragma', 'no-cache/);
});

test('footer menu no longer contains the old symbol icons', () => {
  const nav = appHtml.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  for (const oldIcon of ['◉','◆','☆','✦','▣']) assert.doesNotMatch(nav, new RegExp(oldIcon));
});

test('production secrets are never hardcoded or exposed to browser files', () => {
  const gitignore = fs.readFileSync(new URL('../.gitignore', import.meta.url), 'utf8');
  const envExample = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
  const serverSource = fs.readFileSync(new URL('../server/server.js', import.meta.url), 'utf8');
  const publicFiles = [
    '../public/app.js','../public/cloud.js','../public/account-ui.js','../public/learn.js','../public/js/landing.js','../public/js/admin.js','../private/app.html','../private/admin.html'
  ].map((file) => fs.readFileSync(new URL(file, import.meta.url), 'utf8')).join('\n');

  assert.match(gitignore, /^\.env$/m);
  assert.match(envExample, /MONGODB_URI=mongodb\+srv:\/\/<db_user>:<db_password>@<cluster_host>/);
  assert.doesNotMatch(serverSource, /development[-]only[-]change[-]this[-]secret/);
  assert.match(serverSource, /secret: sessionSecret/);
  for (const name of ['OPENAI_API_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','MONGODB_URI','GOOGLE_CLIENT_SECRET','OWNER_PASSWORD','SESSION_SECRET']) {
    assert.doesNotMatch(publicFiles, new RegExp(name));
  }
});

test('footer icons stay compact and use floating active state', () => {
  const styles = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');
  assert.match(styles, /v1\.4\.26 · Compact floating footer dock/);
  assert.match(styles, /width: 18px;/);
  assert.match(styles, /translateY\(-4px\)/);
  assert.match(styles, /backdrop-filter: blur\(18px\)/);
});


test('Coach gives in-place comprehension and practice tools without leaving the role-play', () => {
  assert.match(javascript, /data-coach-action="meaning"/);
  assert.match(javascript, /¿Qué significa\?/);
  assert.match(javascript, /data-coach-action="listen"/);
  assert.match(javascript, /data-coach-action="slow"/);
  assert.match(javascript, /data-coach-action="reply"/);
  assert.match(javascript, /data-coach-action="practice"/);
  assert.match(javascript, /\/api\/coach\/help/);
  assert.match(javascript, /\/api\/practice\/score/);
  assert.match(server, /app\.post\('\/api\/coach\/help'/);
  assert.match(server, /suggestedReplies/);
  assert.match(server, /keywords/);
  assert.match(server, /pronunciation must NEVER use IPA/i);
});

test('Coach audio supports normal and slower playback using the selected translator voice', () => {
  assert.match(javascript, /speed: 0\.72/);
  assert.match(javascript, /voice: state\.settings\.translatorVoice/);
  assert.match(server, /speed: safeSpeed/);
  assert.match(server, /Math\.max\(0\.25, Math\.min\(4/);
});


test('English Sound Lab includes vowels, consonants, listening and voice practice', () => {
  const sounds = fs.readFileSync(new URL('../public/sounds.js', import.meta.url), 'utf8');
  assert.match(appHtml, /id="sound-lab"/);
  assert.match(appHtml, /id="sound-grid"/);
  assert.match(appHtml, /data-sound-filter="vowels"/);
  assert.match(appHtml, /data-sound-filter="consonants"/);
  assert.match(sounds, /const VOWELS = \[/);
  assert.match(sounds, /const CONSONANTS = \[/);
  assert.match(sounds, /\/api\/practice\/score/);
  assert.match(sounds, /Escuchar modelo/);
  assert.match(sounds, /Más lento/);
  assert.match(sounds, /Practicar mi voz/);
});

test('sound progress synchronizes per authenticated user and the compact hero is versioned', () => {
  const cloud = fs.readFileSync(new URL('../public/cloud.js', import.meta.url), 'utf8');
  const userState = fs.readFileSync(new URL('../models/UserState.js', import.meta.url), 'utf8');
  const account = fs.readFileSync(new URL('../routes/accountRoutes.js', import.meta.url), 'utf8');
  const styles = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');
  assert.match(cloud, /sinBarreras\.sounds\.v1/);
  assert.match(userState, /sounds:/);
  assert.match(account, /sounds/);
  assert.match(styles, /v1\.4\.26 · Compact hero \+ English Sound Lab/);
  assert.match(styles, /font-size:clamp\(25px,7\.7vw,34px\)/);
});


test('Sound Lab feedback is Spanish, student-friendly, and isolated from auto-detected conversation language', () => {
  const sounds = fs.readFileSync(new URL('../public/sounds.js', import.meta.url), 'utf8');
  const styles = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');
  assert.match(sounds, /form\.append\('practiceMode', 'sound'\)/);
  assert.match(sounds, /form\.append\('nativeLanguage', 'es'\)/);
  assert.match(sounds, /OBJETIVO · NIVEL/);
  assert.match(sounds, /LA APP ENTENDIÓ/);
  assert.match(sounds, /PRUEBA ESTO/);
  assert.match(sounds, /Escuchar modelo y mi voz/);
  assert.match(sounds, /Grabar otra vez/);
  assert.match(server, /const evaluateSoundPractice/);
  assert.match(server, /Reconocimiento de palabra/);
  assert.match(server, /La palabra se reconoció correctamente/);
  assert.match(styles, /v1\.4\.26 · Student-friendly Sound Lab feedback/);
});

test('Sound Lab does not claim acoustic accent scoring from transcription-only input', () => {
  assert.match(server, /evaluateSoundPractice/);
  assert.doesNotMatch(server, /evaluateSoundPractice[\s\S]{0,2200}acento perfecto/i);
});


test('Sound Lab lets the learner hear their own recording and compare it with the model', () => {
  const sounds = fs.readFileSync(new URL('../public/sounds.js', import.meta.url), 'utf8');
  const styles = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');
  assert.match(sounds, /URL\.createObjectURL\(blob\)/);
  assert.match(sounds, /URL\.revokeObjectURL/);
  assert.match(sounds, /data-sound-result-action="mine"/);
  assert.match(sounds, /data-sound-result-action="model"/);
  assert.match(sounds, /data-sound-result-action="compare"/);
  assert.match(sounds, /Escuchar modelo y mi voz/);
  assert.match(sounds, /Cómo debe sonar/);
  assert.match(sounds, /Cómo lo dijiste tú/);
  assert.match(styles, /Sound Lab A\/B voice comparison/);
});


test('Coach keeps a coherent long conversation with session context and extended history', () => {
  assert.match(appHtml, /id="coach-goal"/);
  assert.match(appHtml, /id="coach-mode"/);
  assert.match(appHtml, /id="coach-session-title"/);
  assert.match(appHtml, /id="coach-progress-bar"/);
  assert.match(appHtml, /id="coach-summary"/);
  assert.match(javascript, /coachSessionContext/);
  assert.match(javascript, /state\.coachHistory\.slice\(-24\)/);
  assert.match(javascript, /form\.append\('session'/);
  assert.match(javascript, /form\.append\('turnNumber'/);
  assert.match(server, /CONTINUITY IS CRITICAL/);
  assert.match(server, /Never restart the scene/);
  assert.match(server, /roughly 12-18 learner turns/);
  assert.match(server, /sanitizeCoachSession/);
});

test('Coach turn feedback is implemented and no longer calls a missing function', () => {
  assert.match(javascript, /function appendCoachCorrection\(result = \{\}\)/);
  assert.match(javascript, /appendCoachCorrection\(result\)/);
  assert.match(javascript, /correctionNeeded/);
});

test('Coach provides an end-of-session report without exposing secrets', () => {
  assert.match(server, /app\.post\('\/api\/coach\/summary'/);
  assert.match(server, /const coachSummary = async/);
  assert.match(appHtml, /id="new-coach-session"/);
  assert.match(javascript, /function renderCoachSummary/);
  assert.match(javascript, /finishCoachSession/);
});


test('Sound Lab mastery requires sustained 15-day practice instead of quick progress clicks', () => {
  const sounds = fs.readFileSync(new URL('../public/sounds.js', import.meta.url), 'utf8');
  const styles = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');
  assert.match(sounds, /SOUND_CHALLENGE_DAYS = 15/);
  assert.match(sounds, /SOUND_SHORT_BLOCK_SECONDS = 120/);
  assert.match(sounds, /SOUND_LONG_BLOCK_SECONDS = 300/);
  assert.match(sounds, /SOUND_DAILY_ATTEMPTS = 3/);
  assert.match(sounds, /dayIsQualified/);
  assert.match(sounds, /currentQualifiedStreak/);
  assert.match(sounds, /Math\.min\(99,/);
  assert.match(sounds, /15 días consecutivos/);
  assert.match(sounds, /1 bloque de 5 minutos/);
  assert.match(sounds, /2 bloques de 2 minutos/);
  assert.doesNotMatch(sounds, /addProgress\(selected/);
  assert.match(styles, /15-day Sound Mastery Challenge/);
});

test('Sound Lab focused practice timer stops when the app is hidden', () => {
  const sounds = fs.readFileSync(new URL('../public/sounds.js', import.meta.url), 'utf8');
  assert.match(sounds, /startPracticeSession/);
  assert.match(sounds, /finishPracticeSession/);
  assert.match(sounds, /document\.visibilityState === 'hidden'/);
  assert.match(sounds, /window\.addEventListener\('pagehide'/);
  assert.match(sounds, /data-sound-session-action="toggle"/);
});


test('hands-free interpreter waits through natural thinking pauses and auto-finishes the utterance', () => {
  assert.match(javascript, /shortSpeechGraceMs: 2150/);
  assert.match(javascript, /normalSpeechGraceMs: 1750/);
  assert.match(javascript, /longSpeechGraceMs: 1450/);
  assert.match(javascript, /thinkingStatusAfterMs: 480/);
  assert.match(javascript, /noiseFloor/);
  assert.match(javascript, /noiseMultiplier/);
  assert.match(javascript, /conversationSilenceLimit/);
  assert.match(javascript, /setStatus\('thinking'/);
  assert.match(javascript, /finishSegment\(sessionId\)/);
  assert.match(javascript, /Escucha automática activa/);
  assert.match(appHtml, /wave-glow/);
});

test('Sound Lab progresses from word to multi-word, phrase and sentence levels', () => {
  const sounds = fs.readFileSync(new URL('../public/sounds.js', import.meta.url), 'utf8');
  assert.match(sounds, /const SOUND_LEVELS/);
  assert.match(sounds, /Palabra/);
  assert.match(sounds, /3 palabras/);
  assert.match(sounds, /Frase corta/);
  assert.match(sounds, /Oración/);
  assert.match(sounds, /SOUND_LEVEL_SUCCESSES = 3/);
  assert.match(sounds, /completedSoundLevels/);
  assert.match(sounds, /data-sound-level/);
  assert.match(sounds, /challengeComplete[\s\S]{0,500}completedSoundLevels/);
});

test('Coach and Camera include the upgraded mobile interaction surfaces', () => {
  const styles = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');
  assert.match(appHtml, /coach-feature-strip/);
  assert.match(appHtml, /12–18 turnos/);
  assert.match(appHtml, /camera-flow-strip/);
  assert.match(appHtml, /Apunta\. Captura\. Entiende\./);
  assert.match(appHtml, /camera-analyze-button/);
  assert.match(styles, /coach-response-box \{ position:sticky/);
  assert.match(styles, /camera-analyze-button/);
});


test('Aprender, Práctica, Coach and Sound Lab share automatic silence voice capture', () => {
  const voiceTurn = fs.readFileSync(new URL('../public/voice-turn.js', import.meta.url), 'utf8');
  const sounds = fs.readFileSync(new URL('../public/sounds.js', import.meta.url), 'utf8');
  assert.match(appHtml, /id="lesson-voice"/);
  assert.match(learnJavascript, /createAutoVoiceTurn/);
  assert.match(javascript, /createAutoVoiceTurn/);
  assert.match(javascript, /Habla cuando estés listo/);
  assert.match(sounds, /createAutoVoiceTurn/);
  assert.match(voiceTurn, /shortSpeechSilenceMs: 2150/);
  assert.match(voiceTurn, /normalSpeechSilenceMs: 1750/);
  assert.match(voiceTurn, /longSpeechSilenceMs: 1450/);
  assert.match(voiceTurn, /thinkingAfterMs: 480/);
  assert.match(serviceWorker, /voice-turn\.js\?v=1\.4\.42/);
});


test('Learn opens as a simple two-path hub instead of showing all learning content at once', () => {
  assert.match(appHtml, /id="learn-home"/);
  assert.match(appHtml, /data-learn-path="sounds"/);
  assert.match(appHtml, /data-learn-path="routes"/);
  assert.match(appHtml, /id="learn-sounds-branch" class="learn-branch is-hidden"/);
  assert.match(appHtml, /id="learn-routes-branch" class="learn-branch is-hidden"/);
  assert.match(javascript, /function showLearnHome\(\)/);
  assert.match(javascript, /function openLearnPath\(path\)/);
});

test('Sounds and situational routes are separated into independent learning branches', () => {
  const soundsStart = appHtml.indexOf('id="learn-sounds-branch"');
  const routesStart = appHtml.indexOf('id="learn-routes-branch"');
  assert.ok(soundsStart > 0 && routesStart > soundsStart);
  const soundsBlock = appHtml.slice(soundsStart, routesStart);
  const routesBlock = appHtml.slice(routesStart, appHtml.indexOf('id="practice-view"'));
  assert.match(soundsBlock, /id="sound-lab"/);
  assert.doesNotMatch(soundsBlock, /id="learn-course-grid"/);
  assert.match(routesBlock, /id="learn-course-grid"/);
  assert.doesNotMatch(routesBlock, /id="sound-grid"/);
});


test('cloud history never persists generated TTS audio payloads', () => {
  assert.match(javascript, /function historySafeInterpretation/);
  assert.match(javascript, /Persisting audioBase64 makes cloud state/);
  assert.doesNotMatch(javascript, /const item = \{ \.\.\.result, createdAt:/);
  assert.match(cloudJavascript, /function sanitizeHistoryItem/);
  assert.match(cloudJavascript, /history: sanitizedHistory\(readJson\(KEYS\.history/);
  assert.doesNotMatch(cloudJavascript, /audioBase64:/);
});

test('account state accepts a legacy payload long enough to strip old audio and keeps a strict persisted cap', () => {
  assert.match(server, /express\.json\(\{ limit: '1mb' \}\)/);
  assert.match(server, /entity\.too\.large/);
  assert.match(accountRoutes, /function sanitizeHistoryItem/);
  assert.match(accountRoutes, /MAX_STATE_BYTES = 350_000/);
  assert.match(accountRoutes, /UserState\.updateOne\(\{ user: request\.user\._id \}/);
  assert.doesNotMatch(accountRoutes, /audioBase64/);
});


test('guided navigation moves users to the next logical action', () => {
  const navigationFlow = fs.readFileSync(new URL('../public/navigation-flow.js', import.meta.url), 'utf8');
  const soundsJavascript = fs.readFileSync(new URL('../public/sounds.js', import.meta.url), 'utf8');
  assert.match(javascript, /guidedScroll\(ui\.conversationButton/);
  assert.match(javascript, /guidedTop\(ui\.practiceResult/);
  assert.match(javascript, /guidedScroll\(ui\.practiceScore/);
  assert.match(javascript, /guidedScroll\(ui\.coachResponseBox/);
  assert.match(javascript, /guidedTop\(ui\.cameraResult/);
  assert.match(javascript, /guidedTop\(ui\.explanationBox/);
  assert.match(learnJavascript, /guidedTop\(ui\.levelPanel/);
  assert.match(soundsJavascript, /guidedTop\(ui\.detail/);
  assert.match(navigationFlow, /prefers-reduced-motion/);
  assert.match(navigationFlow, /isComfortablyVisible/);
});


test('Three.js conversational AI background is bundled and reacts to real conversation states', () => {
  const aiStageJavascript = fs.readFileSync(new URL('../public/ai-stage.js', import.meta.url), 'utf8');
  assert.match(appHtml, /id="ai-stage"/);
  assert.match(appHtml, /id="ai-core-canvas"/);
  assert.doesNotMatch(appHtml, /PUENTE DE CONVERSACIÓN|Cambio inteligente|Respuesta inmediata/);
  assert.match(javascript, /initAIStage/);
  assert.match(javascript, /aiStageController\?\.setState/);
  assert.match(javascript, /aiStageController\?\.setVolume/);
  assert.match(aiStageJavascript, /three@0\.179\.1/);
  assert.match(aiStageJavascript, /WebGLRenderer/);
  assert.match(serviceWorker, /ai-stage\.js\?v=1\.4\.42/);
});
