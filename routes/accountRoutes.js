import express from 'express';
import UserState from '../models/UserState.js';
import { requireAuth } from '../middleware/auth.js';
import { publicUser } from '../services/accessService.js';
import { refreshGooglePlayEntitlement } from '../services/googlePlayService.js';

const router = express.Router();
const MAX_STATE_BYTES = 350_000;

function defaultState() {
  return { history: [], settings: {}, onboarding: false, practicePoints: 0, learning: {}, sounds: {} };
}

function sanitizeHistoryItem(item = {}) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  return {
    id: String(item.id || '').slice(0, 120),
    originalText: String(item.originalText || '').slice(0, 4000),
    translatedText: String(item.translatedText || '').slice(0, 4000),
    sourceLanguage: item.sourceLanguage || null,
    targetLanguage: item.targetLanguage || null,
    detectedUserLanguage: item.detectedUserLanguage || null,
    partnerLanguage: item.partnerLanguage || null,
    direction: item.direction || null,
    autoLanguage: Boolean(item.autoLanguage),
    situation: item.situation || 'everyday',
    voice: item.voice || null,
    createdAt: item.createdAt || null
  };
}

function sanitizeHistory(value) {
  return (Array.isArray(value) ? value : []).slice(0, 100).map(sanitizeHistoryItem).filter(Boolean);
}

function sanitizePayload(body = {}) {
  const result = defaultState();
  result.history = sanitizeHistory(body.history);
  result.settings = body.settings && typeof body.settings === 'object' && !Array.isArray(body.settings) ? body.settings : {};
  result.onboarding = Boolean(body.onboarding);
  result.practicePoints = Math.max(0, Number(body.practicePoints) || 0);
  result.learning = body.learning && typeof body.learning === 'object' && !Array.isArray(body.learning) ? body.learning : {};
  result.sounds = body.sounds && typeof body.sounds === 'object' && !Array.isArray(body.sounds) ? body.sounds : {};
  if (Buffer.byteLength(JSON.stringify(result), 'utf8') > MAX_STATE_BYTES) throw new Error('El estado de la cuenta es demasiado grande para sincronizar.');
  return result;
}

router.get('/auth/me', async (request, response) => {
  if (request.user?.billingProvider === 'google_play') {
    try { await refreshGooglePlayEntitlement(request.user); }
    catch (error) { console.warn('Google Play entitlement refresh failed:', error.message); }
  }
  response.json({ authenticated: Boolean(request.user), user: publicUser(request.user) });
});

router.get('/account/state', requireAuth, async (request, response, next) => {
  try {
    const state = await UserState.findOne({ user: request.user._id }).lean();
    if (!state) return response.json({ user: publicUser(request.user), state: defaultState() });

    const cleanHistory = sanitizeHistory(state.history);
    // One-time migration for accounts created before v1.4.26, where generated TTS audio
    // could accidentally be stored in history and make every sync request oversized.
    if (JSON.stringify(cleanHistory) !== JSON.stringify(state.history || [])) {
      await UserState.updateOne({ user: request.user._id }, { $set: { history: cleanHistory } });
    }

    response.json({ user: publicUser(request.user), state: {
      history: cleanHistory, settings: state.settings || {}, onboarding: Boolean(state.onboarding),
      practicePoints: state.practicePoints || 0, learning: state.learning || {}, sounds: state.sounds || {}
    } });
  } catch (error) { next(error); }
});

router.put('/account/state', requireAuth, async (request, response, next) => {
  try {
    const state = sanitizePayload(request.body || {});
    await UserState.findOneAndUpdate({ user: request.user._id }, { $set: state }, { upsert: true, new: true, setDefaultsOnInsert: true });
    response.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    if (error.message.includes('demasiado grande')) return response.status(413).json({ error: error.message });
    next(error);
  }
});

export default router;
