import express from 'express';
import User from '../models/User.js';
import UserState from '../models/UserState.js';
import AccessGrant from '../models/AccessGrant.js';
import { requireOwner } from '../middleware/auth.js';
import { normalizeEmail, publicUser } from '../services/accessService.js';
import { cancelUserSubscriptionNow, scheduleUserSubscriptionCancellation } from '../services/stripeService.js';
import { cancelGooglePlaySubscription, revokeGooglePlaySubscription } from '../services/googlePlayService.js';

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
    const [totalUsers, activePaid, freeUsers, revoked, grants] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments(paidFilter()),
      User.countDocuments({ role: 'user', accountStatus: 'active', freeAccess: true }),
      User.countDocuments({ role: 'user', accountStatus: 'revoked' }),
      AccessGrant.countDocuments({ active: true })
    ]);
    response.json({ totalUsers, activePaid, freeUsers, revoked, grants, monthlyRevenue: activePaid * ((Number(process.env.STRIPE_MONTHLY_AMOUNT || 599)) / 100) });
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
    if (user.billingProvider === 'google_play') await revokeGooglePlaySubscription(user);
    else await cancelUserSubscriptionNow(user);
    await UserState.deleteOne({ user: user._id });
    await AccessGrant.updateMany({ claimedBy: user._id }, { $set: { claimedBy: null, claimedAt: null } });
    await user.deleteOne();
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
