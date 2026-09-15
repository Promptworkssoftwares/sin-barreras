import crypto from 'node:crypto';
import ConversationRoom from '../models/ConversationRoom.js';

const streams = new Map();
const ROOM_MINUTES = 90;

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
  const joinUrl = `${String(baseUrl).replace(/\/$/, '')}/join/${code}?token=${encodeURIComponent(guestToken)}`;
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

export function addRoomStream(code, response) {
  const key = safeCode(code);
  if (!streams.has(key)) streams.set(key, new Set());
  streams.get(key).add(response);
  return () => {
    const set = streams.get(key);
    if (!set) return;
    set.delete(response);
    if (!set.size) streams.delete(key);
  };
}

export function emitRoomEvent(code, event, payload = {}) {
  const key = safeCode(code);
  const clients = streams.get(key);
  if (!clients?.size) return;
  const body = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const response of [...clients]) {
    try { response.write(body); }
    catch { clients.delete(response); }
  }
  if (!clients.size) streams.delete(key);
}

export async function closeConversationRoom(room) {
  if (!room) return;
  await ConversationRoom.updateOne({ _id: room._id }, { $set: { status: 'closed', lastActivityAt: new Date() } });
  emitRoomEvent(room.code, 'room-closed', { code: room.code });
  const clients = streams.get(room.code);
  if (clients) {
    for (const response of clients) {
      try { response.end(); } catch { /* noop */ }
    }
    streams.delete(room.code);
  }
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
