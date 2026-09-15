import crypto from 'node:crypto';
import AccountToken from '../models/AccountToken.js';

const hashToken = (token) => crypto.createHash('sha256').update(String(token || '')).digest('hex');

export async function createAccountToken(user, type, ttlMinutes) {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + Math.max(5, Number(ttlMinutes) || 30) * 60_000);
  await AccountToken.deleteMany({ user: user._id, type });
  await AccountToken.create({
    user: user._id,
    email: user.email,
    type,
    tokenHash: hashToken(rawToken),
    expiresAt
  });
  return { rawToken, expiresAt };
}

export async function findValidAccountToken(rawToken, type) {
  const token = String(rawToken || '').trim();
  if (token.length < 32) return null;
  return AccountToken.findOne({
    tokenHash: hashToken(token),
    type,
    expiresAt: { $gt: new Date() }
  });
}

export async function consumeAccountToken(rawToken, type) {
  const record = await findValidAccountToken(rawToken, type);
  if (!record) return null;
  await record.deleteOne();
  return record;
}

export async function clearAccountTokens(userId) {
  await AccountToken.deleteMany({ user: userId });
}
