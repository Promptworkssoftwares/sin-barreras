import AiUsageDaily from '../models/AiUsageDaily.js';

const DAY_MS = 86_400_000;

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function isoDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function startOfUtcMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

function addUtcMonthsClamped(date, deltaMonths) {
  const source = new Date(date);
  const target = new Date(source);
  const day = source.getUTCDate();
  target.setUTCDate(1);
  target.setUTCMonth(target.getUTCMonth() + deltaMonths);
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

function addUtcYearsClamped(date, deltaYears) {
  const source = new Date(date);
  const target = new Date(source);
  const month = source.getUTCMonth();
  const day = source.getUTCDate();
  target.setUTCDate(1);
  target.setUTCFullYear(target.getUTCFullYear() + deltaYears);
  target.setUTCMonth(month);
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), month + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

function subtractBillingInterval(end, interval = 'month', count = 1) {
  const safeCount = Math.max(1, Number(count) || 1);
  const start = new Date(end);
  if (interval === 'day') return new Date(start.getTime() - safeCount * DAY_MS);
  if (interval === 'week') return new Date(start.getTime() - safeCount * 7 * DAY_MS);
  if (interval === 'year') return addUtcYearsClamped(start, -safeCount);
  return addUtcMonthsClamped(start, -safeCount);
}

export function aiQuotaConfig() {
  return {
    minutesLimit: envNumber('AI_USER_MONTHLY_MINUTES_LIMIT', 150),
    budgetUsd: envNumber('AI_USER_MONTHLY_BUDGET_USD', 3),
    warningPercent: clamp(envNumber('AI_USER_WARNING_PERCENT', 80), 1, 100)
  };
}

export function quotaPeriodForUser(user, now = new Date()) {
  const current = new Date(now);
  const currentPeriodEnd = user?.currentPeriodEnd ? new Date(user.currentPeriodEnd) : null;
  const hasValidEnd = currentPeriodEnd && Number.isFinite(currentPeriodEnd.getTime()) && currentPeriodEnd.getTime() > current.getTime();

  if (hasValidEnd && user?.subscriptionStatus === 'trialing') {
    const trialDays = Math.max(1, envNumber('AI_TRIAL_PERIOD_DAYS', envNumber('GOOGLE_PLAY_FREE_TRIAL_DAYS', 7) || 7));
    return {
      basis: 'trial',
      start: new Date(currentPeriodEnd.getTime() - trialDays * DAY_MS),
      end: currentPeriodEnd
    };
  }

  if (hasValidEnd && ['active', 'trialing'].includes(String(user?.subscriptionStatus || ''))) {
    return {
      basis: 'billing_cycle',
      start: subtractBillingInterval(currentPeriodEnd, user?.subscriptionInterval || 'month', user?.subscriptionIntervalCount || 1),
      end: currentPeriodEnd
    };
  }

  const start = startOfUtcMonth(current);
  return {
    basis: 'calendar_month',
    start,
    end: addUtcMonthsClamped(start, 1)
  };
}

async function aggregatePeriodUsage(userId, period) {
  const startKey = isoDateKey(period.start);
  const endKey = isoDateKey(period.end);
  const [row] = await AiUsageDaily.aggregate([
    { $match: { user: userId, dateKey: { $gte: startKey, $lte: endKey } } },
    { $group: {
      _id: null,
      featureRequests: { $sum: '$featureRequests' },
      openAiCalls: { $sum: '$openAiCalls' },
      transcriptionSeconds: { $sum: '$transcriptionSeconds' },
      estimatedTtsSeconds: { $sum: '$estimatedTtsSeconds' },
      estimatedCostMicros: { $sum: '$estimatedCostMicros' }
    } }
  ]);
  return {
    featureRequests: Number(row?.featureRequests || 0),
    openAiCalls: Number(row?.openAiCalls || 0),
    transcriptionSeconds: Number(row?.transcriptionSeconds || 0),
    estimatedTtsSeconds: Number(row?.estimatedTtsSeconds || 0),
    estimatedCostMicros: Number(row?.estimatedCostMicros || 0)
  };
}

export async function getAiQuotaStatus(user, { now = new Date() } = {}) {
  const config = aiQuotaConfig();
  const period = quotaPeriodForUser(user, now);
  const ownerUnlimited = user?.role === 'owner';
  const usage = user?._id ? await aggregatePeriodUsage(user._id, period) : {
    featureRequests: 0,
    openAiCalls: 0,
    transcriptionSeconds: 0,
    estimatedTtsSeconds: 0,
    estimatedCostMicros: 0
  };

  const voiceMinutesUsed = usage.transcriptionSeconds / 60;
  const estimatedCostUsd = usage.estimatedCostMicros / 1_000_000;
  const minutesLimited = !ownerUnlimited && config.minutesLimit > 0;
  const budgetLimited = !ownerUnlimited && config.budgetUsd > 0;
  const voicePercent = minutesLimited ? clamp((voiceMinutesUsed / config.minutesLimit) * 100, 0, 999) : 0;
  const generalUsagePercent = budgetLimited ? clamp((estimatedCostUsd / config.budgetUsd) * 100, 0, 999) : 0;
  const effectivePercent = ownerUnlimited ? 0 : Math.max(voicePercent, generalUsagePercent);
  const voiceExhausted = minutesLimited && voiceMinutesUsed >= config.minutesLimit;
  const budgetExhausted = budgetLimited && estimatedCostUsd >= config.budgetUsd;
  const exhausted = voiceExhausted || budgetExhausted;
  const warning = !exhausted && effectivePercent >= config.warningPercent;

  return {
    unlimited: ownerUnlimited,
    periodBasis: period.basis,
    periodStart: period.start.toISOString(),
    resetAt: period.end.toISOString(),
    minutesLimit: ownerUnlimited || !minutesLimited ? null : config.minutesLimit,
    voiceMinutesUsed: Number(voiceMinutesUsed.toFixed(2)),
    voiceMinutesRemaining: ownerUnlimited || !minutesLimited ? null : Number(Math.max(0, config.minutesLimit - voiceMinutesUsed).toFixed(2)),
    voicePercent: Number(Math.min(100, voicePercent).toFixed(1)),
    generalUsagePercent: Number(Math.min(100, generalUsagePercent).toFixed(1)),
    effectivePercent: Number(Math.min(100, effectivePercent).toFixed(1)),
    warningPercent: config.warningPercent,
    warning,
    exhausted,
    reason: voiceExhausted ? 'voice_minutes' : budgetExhausted ? 'general_ai_usage' : '',
    featureRequests: usage.featureRequests,
    openAiCalls: usage.openAiCalls,
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
    budgetUsd: ownerUnlimited || !budgetLimited ? null : config.budgetUsd
  };
}

export function publicAiQuota(status) {
  if (!status) return null;
  return {
    unlimited: Boolean(status.unlimited),
    periodBasis: status.periodBasis,
    periodStart: status.periodStart,
    resetAt: status.resetAt,
    minutesLimit: status.minutesLimit,
    voiceMinutesUsed: status.voiceMinutesUsed,
    voiceMinutesRemaining: status.voiceMinutesRemaining,
    voicePercent: status.voicePercent,
    generalUsagePercent: status.generalUsagePercent,
    effectivePercent: status.effectivePercent,
    warningPercent: status.warningPercent,
    warning: Boolean(status.warning),
    exhausted: Boolean(status.exhausted),
    reason: status.reason,
    featureRequests: status.featureRequests
  };
}

export async function assertAiQuotaAvailable(user) {
  const status = await getAiQuotaStatus(user);
  if (!status.exhausted) return status;
  const error = new Error(status.reason === 'voice_minutes'
    ? 'Alcanzaste los minutos de voz incluidos en este período. Tu uso se restablecerá en la próxima renovación.'
    : 'Alcanzaste el límite de uso de IA incluido en este período. Tu uso se restablecerá en la próxima renovación.');
  error.statusCode = 429;
  error.code = 'AI_MONTHLY_LIMIT_REACHED';
  error.quota = publicAiQuota(status);
  throw error;
}

export async function aiQuotaMiddleware(request, response, next) {
  try {
    const status = await assertAiQuotaAvailable(request.user);
    request.aiQuota = status;
    next();
  } catch (error) {
    if (error.code === 'AI_MONTHLY_LIMIT_REACHED') {
      return response.status(429).json({ error: error.message, code: error.code, quota: error.quota });
    }
    next(error);
  }
}
