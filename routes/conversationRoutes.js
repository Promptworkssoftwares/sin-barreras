import express from 'express';
import { requireAccess } from '../middleware/auth.js';
import { API_LANGUAGE_NAMES } from '../public/languages.js';
import {
  authorizeConversationRoom,
  closeConversationRoom,
  createConversationRoom,
  getHostRoom,
  publicRoom
} from '../services/conversationRoomService.js';

const router = express.Router();
const SAFE_SITUATIONS = new Set(['everyday','work','construction','medical','school','restaurant','bank','interview','hotel','shopping','emergency','legal']);
const SAFE_VOICES = new Set(['alloy','ash','ballad','coral','echo','fable','onyx','nova','sage','shimmer','verse','marin','cedar']);

function baseUrl(request) {
  const configured = String(process.env.APP_URL || '').trim();
  if (configured) return configured;
  return `${request.protocol}://${request.get('host')}`;
}

router.post('/conversations', requireAccess, async (request, response, next) => {
  try {
    const hostLanguage = String(request.body?.hostLanguage || '').trim();
    const guestLanguage = String(request.body?.guestLanguage || '').trim();
    if (!API_LANGUAGE_NAMES[hostLanguage] || !API_LANGUAGE_NAMES[guestLanguage] || hostLanguage === guestLanguage) {
      return response.status(400).json({ error: 'Selecciona dos idiomas distintos y compatibles.' });
    }
    const situation = SAFE_SITUATIONS.has(request.body?.situation) ? request.body.situation : 'everyday';
    const voice = SAFE_VOICES.has(String(request.body?.voice || '').toLowerCase()) ? String(request.body.voice).toLowerCase() : 'coral';
    const created = await createConversationRoom({ hostUser: request.user._id, hostLanguage, guestLanguage, situation, voice, baseUrl: baseUrl(request) });
    response.status(201).json({ ...publicRoom(created.room), hostToken: created.hostToken, joinUrl: created.joinUrl });
  } catch (error) { next(error); }
});

router.delete('/conversations/:code', requireAccess, async (request, response, next) => {
  try {
    const room = await getHostRoom(request.params.code, request.user._id);
    if (!room) return response.status(404).json({ error: 'Conversación no encontrada o ya terminada.' });
    await closeConversationRoom(room);
    response.json({ ok: true });
  } catch (error) { next(error); }
});

router.get('/public/conversations/:code', async (request, response, next) => {
  try {
    const role = request.query.role === 'host' ? 'host' : 'guest';
    const room = await authorizeConversationRoom({ code: request.params.code, role, token: request.query.token });
    if (!room) return response.status(404).json({ error: 'Este enlace de conversación no es válido o expiró.' });
    response.json(publicRoom(room));
  } catch (error) { next(error); }
});

export default router;
