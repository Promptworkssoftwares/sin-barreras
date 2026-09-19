import express from 'express';
import { requireAccess } from '../middleware/auth.js';
import { API_LANGUAGE_NAMES } from '../public/languages.js';
import { resolveQrPortalBaseUrl } from '../services/cloudflarePortalService.js';
import {
  acceptConversationTerms,
  authorizeConversationRoom,
  blockConversationRoom,
  closeConversationRoom,
  createConversationRoom,
  getHostRoom,
  publicRoom
} from '../services/conversationRoomService.js';
import ConversationReport from '../models/ConversationReport.js';

const router = express.Router();
const SAFE_SITUATIONS = new Set(['everyday','work','construction','medical','school','restaurant','bank','interview','hotel','shopping','emergency','legal']);
const SAFE_VOICES = new Set(['alloy','ash','ballad','coral','echo','fable','onyx','nova','sage','shimmer','verse','marin','cedar']);

router.post('/conversations', requireAccess, async (request, response, next) => {
  try {
    const hostLanguage = String(request.body?.hostLanguage || '').trim();
    if (!(request.body?.termsAccepted === true || request.body?.termsAccepted === 'true')) return response.status(400).json({ error: 'Acepta los Términos y las reglas de conversación antes de crear la sala.' });
    const guestLanguage = String(request.body?.guestLanguage || '').trim();
    if (!API_LANGUAGE_NAMES[hostLanguage] || !API_LANGUAGE_NAMES[guestLanguage] || hostLanguage === guestLanguage) {
      return response.status(400).json({ error: 'Selecciona dos idiomas distintos y compatibles.' });
    }
    const situation = SAFE_SITUATIONS.has(request.body?.situation) ? request.body.situation : 'everyday';
    const voice = SAFE_VOICES.has(String(request.body?.voice || '').toLowerCase()) ? String(request.body.voice).toLowerCase() : 'coral';
    const baseUrl = await resolveQrPortalBaseUrl(request);
    const created = await createConversationRoom({ hostUser: request.user._id, hostLanguage, guestLanguage, situation, voice, baseUrl });
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
    const token = request.get('X-SB-Conversation-Token') || request.query.token;
    const room = await authorizeConversationRoom({ code: request.params.code, role, token });
    if (!room) return response.status(404).json({ error: 'Este enlace de conversación no es válido o expiró.' });
    response.json(publicRoom(room));
  } catch (error) { next(error); }
});


router.post('/public/conversations/:code/accept', async (request, response, next) => {
  try {
    const role = request.body?.role === 'host' ? 'host' : 'guest';
    const token = request.get('X-SB-Conversation-Token') || request.body?.token;
    const room = await authorizeConversationRoom({ code: request.params.code, role, token });
    if (!room) return response.status(404).json({ error: 'Esta conversación no es válida o expiró.' });
    await acceptConversationTerms(room, role);
    response.json({ ok: true, room: publicRoom(room) });
  } catch (error) { next(error); }
});

router.post('/public/conversations/:code/report', async (request, response, next) => {
  try {
    const role = request.body?.role === 'host' ? 'host' : 'guest';
    const token = request.get('X-SB-Conversation-Token') || request.body?.token;
    const room = await authorizeConversationRoom({ code: request.params.code, role, token });
    if (!room) return response.status(404).json({ error: 'Esta conversación no es válida o expiró.' });
    const reason = ['harassment','threats','hate','sexual','scam','other'].includes(String(request.body?.reason || '')) ? String(request.body.reason) : 'other';
    const content = String(request.body?.content || '').trim().slice(0, 4000);
    await ConversationReport.create({ roomCode: room.code, hostUser: room.hostUser, reporterRole: role, reportedRole: role === 'host' ? 'guest' : 'host', reason, content });
    response.status(201).json({ ok: true, message: 'Reporte enviado.' });
  } catch (error) { next(error); }
});

router.post('/public/conversations/:code/block', async (request, response, next) => {
  try {
    const role = request.body?.role === 'host' ? 'host' : 'guest';
    const token = request.get('X-SB-Conversation-Token') || request.body?.token;
    const room = await authorizeConversationRoom({ code: request.params.code, role, token });
    if (!room) return response.status(404).json({ error: 'Esta conversación no es válida o expiró.' });
    const reason = ['harassment','threats','hate','sexual','scam','other'].includes(String(request.body?.reason || '')) ? String(request.body.reason) : 'other';
    await ConversationReport.create({ roomCode: room.code, hostUser: room.hostUser, reporterRole: role, reportedRole: role === 'host' ? 'guest' : 'host', reason, content: String(request.body?.content || '').trim().slice(0, 4000) });
    await blockConversationRoom(room, role);
    response.json({ ok: true, message: 'Participante bloqueado. La conversación terminó.' });
  } catch (error) { next(error); }
});

export default router;
