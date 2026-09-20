import crypto from 'node:crypto';
import AiCacheEntry from '../models/AiCacheEntry.js';
import { recordCacheHit } from './aiUsageService.js';

const CACHE_VERSION = 'v1';
const cacheEnabled = () => !['0', 'false', 'off', 'no'].includes(String(process.env.AI_CACHE_ENABLED || 'true').trim().toLowerCase());
const DAY_MS = 86_400_000;

const envDays = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.min(365, value) : fallback;
};

const ttlDaysFor = (kind) => ({
  translation: envDays('AI_CACHE_TRANSLATION_DAYS', 30),
  tts: envDays('AI_CACHE_TTS_DAYS', 30),
  phrase_lesson: envDays('AI_CACHE_LESSON_DAYS', 45),
  practice_evaluation: envDays('AI_CACHE_EVALUATION_DAYS', 14)
}[kind] || 14);

const normalizePart = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return String(value).normalize('NFKC').replace(/\s+/gu, ' ').trim();
};

export function aiCacheKey(kind, parts = []) {
  const source = [CACHE_VERSION, kind, ...parts.map(normalizePart)].join('\u241F');
  return crypto.createHash('sha256').update(source).digest('hex');
}

export async function getAiCache({ userId, kind, parts, feature = kind }) {
  if (!cacheEnabled() || !userId || !kind) return null;
  try {
    const keyHash = aiCacheKey(kind, parts);
    const now = new Date();
    const entry = await AiCacheEntry.findOne({ user: userId, kind, keyHash, expiresAt: { $gt: now } }).lean();
    if (!entry) return null;

    const expiresAt = new Date(Date.now() + ttlDaysFor(kind) * DAY_MS);
    void AiCacheEntry.updateOne(
      { _id: entry._id },
      { $inc: { hits: 1 }, $set: { lastUsedAt: now, expiresAt } }
    ).catch(() => {});
    await recordCacheHit({ kind, feature });
    return entry.payload;
  } catch (error) {
    console.warn(`AI cache read failed (${kind}):`, error.message);
    return null;
  }
}

export async function setAiCache({ userId, kind, parts, payload }) {
  if (!cacheEnabled() || !userId || !kind || payload === undefined || payload === null) return;
  const keyHash = aiCacheKey(kind, parts);
  const expiresAt = new Date(Date.now() + ttlDaysFor(kind) * DAY_MS);
  try {
    await AiCacheEntry.updateOne(
      { user: userId, kind, keyHash },
      {
        $set: { payload, lastUsedAt: new Date(), expiresAt },
        $setOnInsert: { user: userId, kind, keyHash, hits: 0 }
      },
      { upsert: true }
    );
  } catch (error) {
    // Cache failures must never break a paid product function.
    console.warn(`AI cache write failed (${kind}):`, error.message);
  }
}

export async function deleteUserAiCache(userId) {
  if (!userId) return;
  await AiCacheEntry.deleteMany({ user: userId });
}
