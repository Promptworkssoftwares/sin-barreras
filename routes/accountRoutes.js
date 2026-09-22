import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import UserState from '../models/UserState.js';
import { requireAuth } from '../middleware/auth.js';
import { publicUser } from '../services/accessService.js';
import { refreshGooglePlayEntitlement } from '../services/googlePlayService.js';
import { deleteUserAccount } from '../services/accountService.js';
import AiContentReport from '../models/AiContentReport.js';
import { getAiQuotaStatus, publicAiQuota } from '../services/aiQuotaService.js';

const router = express.Router();
const MAX_STATE_BYTES = 750_000;

function defaultState() {
  return { history: [], settings: {}, onboarding: false, practicePoints: 0, learning: {}, sounds: {}, phrasebook: [] };
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


function sanitizePhraseItem(item = {}) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const id = String(item.id || '').slice(0, 120);
  const sourceText = String(item.sourceText || '').trim().slice(0, 1200);
  const translatedText = String(item.translatedText || '').trim().slice(0, 1200);
  if (!id || !sourceText || !translatedText) return null;
  return {
    id, sourceText, translatedText,
    sourceLanguage: String(item.sourceLanguage || '').slice(0, 12) || null,
    targetLanguage: String(item.targetLanguage || '').slice(0, 12) || null,
    category: String(item.category || 'general').slice(0, 40),
    situation: String(item.situation || 'everyday').slice(0, 40),
    createdAt: item.createdAt || null,
    practiceCount: Math.max(0, Math.min(10000, Number(item.practiceCount) || 0)),
    bestScore: Math.max(0, Math.min(100, Number(item.bestScore) || 0)),
    lastPracticedAt: item.lastPracticedAt ? String(item.lastPracticedAt).slice(0, 40) : null
  };
}

function sanitizePhrasebook(value) {
  return (Array.isArray(value) ? value : []).slice(0, 150).map(sanitizePhraseItem).filter(Boolean);
}

function sanitizePayload(body = {}) {
  const result = defaultState();
  result.history = sanitizeHistory(body.history);
  result.settings = body.settings && typeof body.settings === 'object' && !Array.isArray(body.settings) ? body.settings : {};
  result.onboarding = Boolean(body.onboarding);
  result.practicePoints = Math.max(0, Number(body.practicePoints) || 0);
  result.learning = body.learning && typeof body.learning === 'object' && !Array.isArray(body.learning) ? body.learning : {};
  result.sounds = body.sounds && typeof body.sounds === 'object' && !Array.isArray(body.sounds) ? body.sounds : {};
  result.phrasebook = sanitizePhrasebook(body.phrasebook);
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

router.get('/account/ai-usage', requireAuth, async (request, response, next) => {
  try {
    const quota = await getAiQuotaStatus(request.user);
    response.set('Cache-Control', 'no-store');
    response.json({ quota: publicAiQuota(quota) });
  } catch (error) { next(error); }
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
      practicePoints: state.practicePoints || 0, learning: state.learning || {}, sounds: state.sounds || {}, phrasebook: sanitizePhrasebook(state.phrasebook)
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



router.post('/reports/ai', requireAuth, async (request, response, next) => {
  try {
    const area = ['practice','coach','camera','explain','account','other'].includes(String(request.body?.area || '')) ? String(request.body.area) : 'other';
    const reason = ['offensive','unsafe','incorrect','other'].includes(String(request.body?.reason || '')) ? String(request.body.reason) : 'other';
    const content = String(request.body?.content || '').trim().slice(0, 4000);
    const details = String(request.body?.details || '').trim().slice(0, 1000);
    if (!content && !details) return response.status(400).json({ error: 'Describe o incluye el contenido que deseas reportar.' });
    await AiContentReport.create({ user: request.user._id, area, reason, content, details });
    response.status(201).json({ ok: true, message: 'Reporte enviado. Gracias por ayudarnos a mantener Sin Barreras seguro.' });
  } catch (error) { next(error); }
});

router.delete('/account', requireAuth, async (request, response, next) => {
  try {
    if (request.user.role === 'owner') return response.status(403).json({ error: 'La cuenta owner no puede eliminarse desde este flujo.' });
    const confirmation = String(request.body?.confirmation || '').trim().toUpperCase();
    if (confirmation !== 'ELIMINAR') return response.status(400).json({ error: 'Escribe ELIMINAR para confirmar.' });

    const user = await User.findById(request.user._id).select('+passwordHash');
    if (!user) return response.status(404).json({ error: 'Cuenta no encontrada.' });
    if (user.passwordHash) {
      const currentPassword = String(request.body?.currentPassword || '');
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        return response.status(401).json({ error: 'La contraseña actual no es correcta.' });
      }
    }

    await deleteUserAccount(user);
    request.logout(() => {
      request.session?.destroy(() => response.json({ ok: true, redirect: '/?account=deleted' }));
    });
  } catch (error) { next(error); }
});

export default router;
