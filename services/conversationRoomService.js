import crypto from 'node:crypto';
import ConversationRoom from '../models/ConversationRoom.js';

const eventLogs = new Map();
const ROOM_MINUTES = 90;
const MAX_EVENT_LOG = 80;
const EVENT_LOG_TTL_MS = ROOM_MINUTES * 60_000 + 5 * 60_000;

const hashToken = (value = '') => crypto.createHash('sha256').update(String(value)).digest('hex');
const rawToken = () => crypto.randomBytes(24).toString('base64url');
const safeCode = (value = '') => String(value).trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

async function uniqueCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 8; attempt += 1) {
    let code = '';
    for (let i = 0; i < 6; i += 1) code += alphabet[crypto.randomInt(0, alphabet.length)];
    if (!(await ConversationRoom.exists({ code }))) return code;
  }
  throw new Error('No pudimos crear un código de conversación. Intenta nuevamente.');
}

export async function createConversationRoom({ hostUser, hostLanguage, guestLanguage, situation, voice, baseUrl }) {
  const code = await uniqueCode();
  const hostToken = rawToken();
  const guestToken = rawToken();
  const expiresAt = new Date(Date.now() + ROOM_MINUTES * 60_000);
  const room = await ConversationRoom.create({
    code,
    hostUser,
    hostLanguage,
    guestLanguage,
    situation,
    voice,
    hostTokenHash: hashToken(hostToken),
    guestTokenHash: hashToken(guestToken),
    expiresAt,
    lastActivityAt: new Date()
  });
  const joinUrl = `${String(baseUrl).replace(/\/$/, '')}/join/${code}#token=${encodeURIComponent(guestToken)}`;
  return { room, hostToken, guestToken, joinUrl };
}

export async function authorizeConversationRoom({ code, role, token, includeSecrets = false }) {
  const normalizedCode = safeCode(code);
  if (!normalizedCode || !['host', 'guest'].includes(role) || !token) return null;
  let query = ConversationRoom.findOne({ code: normalizedCode, status: 'active', expiresAt: { $gt: new Date() } });
  if (includeSecrets || token) query = query.select('+hostTokenHash +guestTokenHash');
  const room = await query;
  if (!room) return null;
  const expected = role === 'host' ? room.hostTokenHash : room.guestTokenHash;
  const actual = hashToken(token);
  const expectedBuffer = Buffer.from(expected || '', 'utf8');
  const actualBuffer = Buffer.from(actual, 'utf8');
  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) return null;
  return room;
}

export async function getHostRoom(code, hostUserId) {
  return ConversationRoom.findOne({ code: safeCode(code), hostUser: hostUserId, status: 'active', expiresAt: { $gt: new Date() } });
}

export async function markRoomActivity(room, { guestConnected = false } = {}) {
  if (!room) return;
  const update = { lastActivityAt: new Date() };
  if (guestConnected && !room.guestConnectedAt) update.guestConnectedAt = new Date();
  await ConversationRoom.updateOne({ _id: room._id }, { $set: update });
}


export function emitRoomEvent(code, event, payload = {}) {
  const key = safeCode(code);
  if (!key) return null;

  const now = Date.now();
  const state = eventLogs.get(key) || { cursor: 0, events: [], touchedAt: now };
  state.cursor += 1;
  state.touchedAt = now;
  state.events.push({ id: state.cursor, event, payload, createdAt: new Date(now).toISOString() });
  if (state.events.length > MAX_EVENT_LOG) state.events.splice(0, state.events.length - MAX_EVENT_LOG);
  eventLogs.set(key, state);


  // Opportunistic cleanup keeps the in-memory log bounded without another timer.
  for (const [roomCode, log] of eventLogs) {
    if (now - Number(log.touchedAt || now) > EVENT_LOG_TTL_MS) eventLogs.delete(roomCode);
  }
  return state.cursor;
}

export function getRoomEvents(code, after = 0) {
  const key = safeCode(code);
  const state = eventLogs.get(key);
  const cursor = state?.cursor || 0;
  const from = Math.max(0, Number.parseInt(after, 10) || 0);
  const events = state?.events?.filter((item) => item.id > from) || [];
  return { cursor, events };
}

export async function closeConversationRoom(room) {
  if (!room) return;
  await ConversationRoom.updateOne({ _id: room._id }, { $set: { status: 'closed', lastActivityAt: new Date() } });
  emitRoomEvent(room.code, 'room-closed', { code: room.code });
  const key = safeCode(room.code);
  setTimeout(() => eventLogs.delete(key), 60_000).unref?.();
}

export function publicRoom(room) {
  return {
    code: room.code,
    hostLanguage: room.hostLanguage,
    guestLanguage: room.guestLanguage,
    situation: room.situation,
    status: room.status,
    guestConnected: Boolean(room.guestConnectedAt),
    expiresAt: room.expiresAt
  };
}
