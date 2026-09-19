import express from 'express';
import User from '../models/User.js';
import AccessGrant from '../models/AccessGrant.js';
import { requireOwner } from '../middleware/auth.js';
import { normalizeEmail, publicUser } from '../services/accessService.js';
import { calculateStripeMrr, scheduleUserSubscriptionCancellation } from '../services/stripeService.js';
import { cancelGooglePlaySubscription } from '../services/googlePlayService.js';
import { deleteUserAccount } from '../services/accountService.js';
import { getAiUsageSummary, getCurrentMonthAiCostUsd } from '../services/aiUsageService.js';
import AiContentReport from '../models/AiContentReport.js';
import ConversationReport from '../models/ConversationReport.js';

const router = express.Router();
router.use(requireOwner);

function paidFilter() {
  return {
    role: 'user',
    accountStatus: 'active',
    subscriptionStatus: { $in: ['active', 'trialing'] },
    $or: [
      { billingProvider: { $ne: 'google_play' } },
      { billingProvider: 'google_play', currentPeriodEnd: { $gt: new Date() } }
    ]
  };
}

function leanUserHasAccess(user) {
  if (user.accountStatus !== 'active') return false;
  if (user.freeAccess) return true;
  if (!['active', 'trialing'].includes(user.subscriptionStatus)) return false;
  if (user.billingProvider === 'google_play') {
    const expiry = user.currentPeriodEnd ? new Date(user.currentPeriodEnd).getTime() : 0;
    return Number.isFinite(expiry) && expiry > Date.now();
  }
  return true;
}

router.get('/stats', async (_request, response, next) => {
  try {
    const paidQuery = paidFilter();
    const [totalUsers, paidUsers, freeUsers, revoked, grants, aiCostMonthUsd] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.find(paidQuery),
      User.countDocuments({ role: 'user', accountStatus: 'active', freeAccess: true }),
      User.countDocuments({ role: 'user', accountStatus: 'revoked' }),
      AccessGrant.countDocuments({ active: true }),
      getCurrentMonthAiCostUsd()
    ]);

    const trialUsers = paidUsers.filter((user) => user.subscriptionStatus === 'trialing');
    const billedUsers = paidUsers.filter((user) => user.subscriptionStatus === 'active');
    const stripeUsers = billedUsers.filter((user) => user.billingProvider === 'stripe');
    const googleUsers = billedUsers.filter((user) => user.billingProvider === 'google_play');
    const stripeMrr = await calculateStripeMrr(stripeUsers);
    const googleCurrency = String(process.env.GOOGLE_PLAY_CURRENCY || process.env.STRIPE_CURRENCY || 'usd').toUpperCase();
    const configuredGoogleCents = Math.max(0, Number(process.env.GOOGLE_PLAY_MONTHLY_AMOUNT || process.env.STRIPE_MONTHLY_AMOUNT || 599));
    let googlePlayMrrUsd = 0;
    let googlePlayEstimatedUsers = 0;
    for (const user of googleUsers) {
      const sameCurrency = String(user.subscriptionCurrency || googleCurrency).toUpperCase() === googleCurrency;
      const stored = sameCurrency && Number.isFinite(Number(user.subscriptionAmount)) ? Number(user.subscriptionAmount) : null;
      googlePlayMrrUsd += (stored ?? configuredGoogleCents) / 100;
      if (stored == null) googlePlayEstimatedUsers += 1;
    }

    const comparableCurrency = stripeMrr.currency === googleCurrency;
    const grossMrrUsd = comparableCurrency ? stripeMrr.amountUsd + googlePlayMrrUsd : stripeMrr.amountUsd;
    response.json({
      totalUsers,
      activePaid: billedUsers.length,
      activeTrials: trialUsers.length,
      freeUsers,
      revoked,
      grants,
      monthlyRevenue: grossMrrUsd,
      revenue: {
        currency: 'USD',
        grossMrrUsd,
        stripeMrrUsd: stripeMrr.amountUsd,
        googlePlayMrrUsd: comparableCurrency ? googlePlayMrrUsd : 0,
        stripeExactUsers: stripeMrr.exactUsers,
        stripeMissingUsers: stripeMrr.missingUsers,
        googlePlayEstimatedUsers,
        basis: 'MRR excluye pruebas gratis. Stripe usa el precio recurrente sincronizado. Google Play usa el precio mensual configurado cuando la compra no expone un precio regional.'
      },
      aiCostMonthUsd,
      estimatedGrossMarginUsd: grossMrrUsd - aiCostMonthUsd
    });
  } catch (error) { next(error); }
});


router.get('/usage', async (request, response, next) => {
  try {
    const days = Math.max(1, Math.min(365, Number(request.query.days || 30)));
    response.json(await getAiUsageSummary({ days }));
  } catch (error) { next(error); }
});


router.get('/reports/ai', async (request, response, next) => {
  try {
    const status = ['open','reviewed','dismissed','all'].includes(String(request.query.status || '')) ? String(request.query.status) : 'open';
    const filter = status === 'all' ? {} : { status };
    const items = await AiContentReport.find(filter).sort({ createdAt: -1 }).limit(200).populate('user', 'email name').lean();
    response.json({ items });
  } catch (error) { next(error); }
});

router.patch('/reports/ai/:id', async (request, response, next) => {
  try {
    const status = ['reviewed','dismissed'].includes(String(request.body?.status || '')) ? String(request.body.status) : null;
    if (!status) return response.status(400).json({ error: 'Estado inválido.' });
    const item = await AiContentReport.findByIdAndUpdate(request.params.id, { $set: { status, reviewedAt: new Date(), reviewedBy: request.user._id } }, { new: true });
    if (!item) return response.status(404).json({ error: 'Reporte no encontrado.' });
    response.json({ ok: true, item });
  } catch (error) { next(error); }
});

router.get('/reports/conversations', async (request, response, next) => {
  try {
    const status = ['open','reviewed','dismissed','all'].includes(String(request.query.status || '')) ? String(request.query.status) : 'open';
    const filter = status === 'all' ? {} : { status };
    const items = await ConversationReport.find(filter).sort({ createdAt: -1 }).limit(200).populate('hostUser', 'email name').lean();
    response.json({ items });
  } catch (error) { next(error); }
});

router.patch('/reports/conversations/:id', async (request, response, next) => {
  try {
    const status = ['reviewed','dismissed'].includes(String(request.body?.status || '')) ? String(request.body.status) : null;
    if (!status) return response.status(400).json({ error: 'Estado inválido.' });
    const item = await ConversationReport.findByIdAndUpdate(request.params.id, { $set: { status, reviewedAt: new Date(), reviewedBy: request.user._id } }, { new: true });
    if (!item) return response.status(404).json({ error: 'Reporte no encontrado.' });
    response.json({ ok: true, item });
  } catch (error) { next(error); }
});

router.get('/users', async (request, response, next) => {
  try {
    const q = String(request.query.q || '').trim();
    const status = String(request.query.status || 'all');
    const page = Math.max(1, Number(request.query.page || 1));
    const limit = Math.min(50, Math.max(10, Number(request.query.limit || 20)));
    const filter = { role: 'user' };
    const conditions = [];
    if (q) conditions.push({ $or: [{ email: { $regex: q, $options: 'i' } }, { name: { $regex: q, $options: 'i' } }] });
    if (status === 'paid') {
      const paid = paidFilter();
      delete paid.role;
      conditions.push(paid);
    }
    if (status === 'free') conditions.push({ freeAccess: true });
    if (status === 'revoked') conditions.push({ accountStatus: 'revoked' });
    if (status === 'pending') conditions.push({
      freeAccess: false,
      accountStatus: 'active',
      $or: [
        { subscriptionStatus: { $nin: ['active', 'trialing'] } },
        { billingProvider: 'google_play', currentPeriodEnd: { $lte: new Date() } }
      ]
    });
    if (conditions.length) filter.$and = conditions;

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter)
    ]);
    response.json({
      items: items.map((user) => ({
        ...publicUser({ ...user, hasAppAccess() { return leanUserHasAccess(user); } }),
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        currentPeriodEnd: user.currentPeriodEnd,
        cancelAtPeriodEnd: Boolean(user.cancelAtPeriodEnd),
        stripeCustomerId: user.stripeCustomerId
      })),
      page, limit, total, pages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (error) { next(error); }
});

router.patch('/users/:id/revoke', async (request, response, next) => {
  try {
    const user = await User.findOneAndUpdate({ _id: request.params.id, role: 'user' }, { $set: { accountStatus: 'revoked' } }, { new: true });
    if (!user) return response.status(404).json({ error: 'Usuario no encontrado.' });
    response.json({ ok: true, user: publicUser(user) });
  } catch (error) { next(error); }
});

router.patch('/users/:id/restore', async (request, response, next) => {
  try {
    const user = await User.findOneAndUpdate({ _id: request.params.id, role: 'user' }, { $set: { accountStatus: 'active' } }, { new: true });
    if (!user) return response.status(404).json({ error: 'Usuario no encontrado.' });
    response.json({ ok: true, user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/users/:id/cancel-subscription', async (request, response, next) => {
  try {
    const user = await User.findOne({ _id: request.params.id, role: 'user' });
    if (!user) return response.status(404).json({ error: 'Usuario no encontrado.' });
    if (user.billingProvider === 'google_play') await cancelGooglePlaySubscription(user);
    else await scheduleUserSubscriptionCancellation(user);
    const refreshed = await User.findById(user._id);
    response.json({ ok: true, user: publicUser(refreshed) });
  } catch (error) { next(error); }
});

router.delete('/users/:id', async (request, response, next) => {
  try {
    const user = await User.findOne({ _id: request.params.id, role: 'user' });
    if (!user) return response.status(404).json({ error: 'Usuario no encontrado.' });
    await deleteUserAccount(user);
    response.json({ ok: true });
  } catch (error) { next(error); }
});

router.get('/grants', async (_request, response, next) => {
  try {
    const grants = await AccessGrant.find({ active: true }).sort({ createdAt: -1 }).lean();
    response.json({ items: grants });
  } catch (error) { next(error); }
});

router.post('/grants', async (request, response, next) => {
  try {
    const email = normalizeEmail(request.body?.email);
    const note = String(request.body?.note || '').trim().slice(0, 240);
    if (!/^\S+@\S+\.\S+$/.test(email)) return response.status(400).json({ error: 'Escribe un email válido.' });
    const grant = await AccessGrant.findOneAndUpdate(
      { email },
      { $set: { active: true, note, createdBy: request.user._id }, $setOnInsert: { email } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const user = await User.findOne({ email, role: 'user' });
    if (user) {
      user.freeAccess = true;
      user.freeAccessGrantedAt = new Date();
      grant.claimedBy = user._id;
      grant.claimedAt = new Date();
      await Promise.all([user.save(), grant.save()]);
    }
    response.status(201).json({ ok: true, grant });
  } catch (error) { next(error); }
});

router.delete('/grants/:id', async (request, response, next) => {
  try {
    const grant = await AccessGrant.findById(request.params.id);
    if (!grant) return response.status(404).json({ error: 'Acceso gratuito no encontrado.' });
    grant.active = false;
    await grant.save();
    const user = await User.findOne({ email: grant.email, role: 'user' });
    if (user) {
      user.freeAccess = false;
      user.freeAccessGrantedAt = null;
      await user.save();
    }
    response.json({ ok: true });
  } catch (error) { next(error); }
});

export default router;
