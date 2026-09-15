import { AsyncLocalStorage } from 'node:async_hooks';
import AiUsageDaily from '../models/AiUsageDaily.js';

const usageContext = new AsyncLocalStorage();

const micros = (usd) => Math.max(0, Math.round((Number(usd) || 0) * 1_000_000));
const envNumber = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

function dayParts(date = new Date()) {
  const iso = date.toISOString();
  return { dateKey: iso.slice(0, 10), monthKey: iso.slice(0, 7) };
}

function featureFromUrl(url = '') {
  const path = String(url).split('?')[0];
  if (path.includes('/interpret')) return 'interpret';
  if (path.includes('/practice/score')) return 'practice_score';
  if (path.includes('/practice')) return 'practice';
  if (path.includes('/coach/')) return 'coach';
  if (path.includes('/image/')) return 'camera';
  if (path.includes('/learn/')) return 'learn';
  if (path.includes('/explain')) return 'explain';
  if (path.includes('/speak')) return 'tts';
  return 'other';
}


export function runWithAiUsage(userId, feature, callback) {
  if (!userId || typeof callback !== 'function') return callback?.();
  return usageContext.run({ userId, feature: String(feature || 'other') }, callback);
}

export async function recordFeatureRequest(feature = 'other') {
  const safeFeature = String(feature || 'other').replace(/[^a-z0-9_]/gi, '_').slice(0, 40) || 'other';
  await recordDelta({ featureRequests: 1, [`features.${safeFeature}.requests`]: 1 });
}

export function aiUsageContextMiddleware(request, response, next) {
  const userId = request.user?._id;
  if (!userId) return next();
  const feature = featureFromUrl(request.originalUrl);
  return usageContext.run({ userId, feature }, () => {
    response.on('finish', () => {
      if (response.statusCode < 500) void recordDelta({ featureRequests: 1, [`features.${feature}.requests`]: 1 });
    });
    next();
  });
}

async function recordDelta(delta = {}) {
  const context = usageContext.getStore();
  if (!context?.userId) return;
  const { dateKey, monthKey } = dayParts();
  const clean = {};
  for (const [key, value] of Object.entries(delta)) {
    const number = Number(value);
    if (Number.isFinite(number) && number !== 0) clean[key] = number;
  }
  if (!Object.keys(clean).length) return;
  try {
    await AiUsageDaily.updateOne(
      { user: context.userId, dateKey },
      { $setOnInsert: { user: context.userId, dateKey, monthKey }, $inc: clean },
      { upsert: true }
    );
  } catch (error) {
    console.warn('AI usage tracking failed:', error.message);
  }
}

function chatRates(model = '') {
  const normalized = String(model).toLowerCase();
  let input = 0.05;
  let cached = 0.005;
  let output = 0.40;
  if (normalized.includes('gpt-5.6-luna')) { input = 0.20; cached = 0.02; output = 1.20; }
  else if (normalized.includes('gpt-5.4-nano')) { input = 0.20; cached = 0.02; output = 1.25; }
  else if (normalized.includes('gpt-4o-mini')) { input = 0.15; cached = 0.075; output = 0.60; }
  return {
    input: envNumber('AI_COST_CHAT_INPUT_PER_1M_USD', input),
    cached: envNumber('AI_COST_CHAT_CACHED_INPUT_PER_1M_USD', cached),
    output: envNumber('AI_COST_CHAT_OUTPUT_PER_1M_USD', output)
  };
}

export async function recordChatUsage({ model, usage, vision = false } = {}) {
  const inputTokens = Number(usage?.prompt_tokens ?? usage?.input_tokens ?? 0) || 0;
  const outputTokens = Number(usage?.completion_tokens ?? usage?.output_tokens ?? 0) || 0;
  const cachedInputTokens = Number(usage?.prompt_tokens_details?.cached_tokens ?? usage?.input_tokens_details?.cached_tokens ?? 0) || 0;
  const uncached = Math.max(0, inputTokens - cachedInputTokens);
  const rates = chatRates(model);
  const cost = (uncached / 1_000_000) * rates.input + (cachedInputTokens / 1_000_000) * rates.cached + (outputTokens / 1_000_000) * rates.output;
  await recordDelta({
    openAiCalls: 1,
    chatCalls: 1,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    imageCalls: vision ? 1 : 0,
    visionCalls: vision ? 1 : 0,
    estimatedCostMicros: micros(cost)
  });
}

export async function recordTranscriptionUsage({ seconds = 0 } = {}) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const perMinute = envNumber('AI_COST_TRANSCRIPTION_PER_MINUTE_USD', 0.006);
  await recordDelta({
    openAiCalls: 1,
    transcriptionCalls: 1,
    transcriptionSeconds: safeSeconds,
    estimatedCostMicros: micros((safeSeconds / 60) * perMinute)
  });
}

export async function recordTtsUsage({ characters = 0 } = {}) {
  const safeCharacters = Math.max(0, Number(characters) || 0);
  const charsPerMinute = Math.max(100, envNumber('AI_TTS_CHARS_PER_MINUTE', 900));
  const estimatedSeconds = (safeCharacters / charsPerMinute) * 60;
  const perMinute = envNumber('AI_COST_TTS_PER_MINUTE_USD', 0.015);
  await recordDelta({
    openAiCalls: 1,
    ttsCalls: 1,
    ttsCharacters: safeCharacters,
    estimatedTtsSeconds: estimatedSeconds,
    estimatedCostMicros: micros((estimatedSeconds / 60) * perMinute)
  });
}

export async function getAiUsageSummary({ days = 30 } = {}) {
  const safeDays = Math.max(1, Math.min(365, Number(days) || 30));
  const since = new Date(Date.now() - (safeDays - 1) * 86_400_000).toISOString().slice(0, 10);
  const rows = await AiUsageDaily.aggregate([
    { $match: { dateKey: { $gte: since } } },
    { $group: {
      _id: '$dateKey',
      featureRequests: { $sum: '$featureRequests' },
      openAiCalls: { $sum: '$openAiCalls' },
      inputTokens: { $sum: '$inputTokens' },
      cachedInputTokens: { $sum: '$cachedInputTokens' },
      outputTokens: { $sum: '$outputTokens' },
      transcriptionSeconds: { $sum: '$transcriptionSeconds' },
      ttsCharacters: { $sum: '$ttsCharacters' },
      imageCalls: { $sum: '$imageCalls' },
      estimatedCostMicros: { $sum: '$estimatedCostMicros' }
    } },
    { $sort: { _id: 1 } }
  ]);
  const totals = rows.reduce((acc, row) => {
    for (const key of ['featureRequests','openAiCalls','inputTokens','cachedInputTokens','outputTokens','transcriptionSeconds','ttsCharacters','imageCalls','estimatedCostMicros']) acc[key] += Number(row[key] || 0);
    return acc;
  }, { featureRequests:0, openAiCalls:0, inputTokens:0, cachedInputTokens:0, outputTokens:0, transcriptionSeconds:0, ttsCharacters:0, imageCalls:0, estimatedCostMicros:0 });
  return {
    days: safeDays,
    totals: { ...totals, estimatedCostUsd: totals.estimatedCostMicros / 1_000_000 },
    daily: rows.map((row) => ({ date: row._id, ...row, estimatedCostUsd: Number(row.estimatedCostMicros || 0) / 1_000_000 }))
  };
}

export async function getCurrentMonthAiCostUsd() {
  const monthKey = new Date().toISOString().slice(0, 7);
  const [result] = await AiUsageDaily.aggregate([
    { $match: { monthKey } },
    { $group: { _id: null, micros: { $sum: '$estimatedCostMicros' } } }
  ]);
  return Number(result?.micros || 0) / 1_000_000;
}
