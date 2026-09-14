import AccessGrant from '../models/AccessGrant.js';

export const normalizeEmail = (value = '') => String(value).trim().toLowerCase();

export async function applyFreeGrant(user) {
  if (user.role === 'owner') {
    let changed = false;
    if (!user.freeAccess) { user.freeAccess = true; changed = true; }
    if (!user.freeAccessGrantedAt) { user.freeAccessGrantedAt = new Date(); changed = true; }
    if (changed) await user.save();
    return user;
  }

  const email = normalizeEmail(user.email);
  const grant = await AccessGrant.findOne({ email, active: true });
  const shouldHaveFreeAccess = Boolean(grant);
  let changed = false;

  if (user.freeAccess !== shouldHaveFreeAccess) {
    user.freeAccess = shouldHaveFreeAccess;
    user.freeAccessGrantedAt = shouldHaveFreeAccess ? new Date() : null;
    changed = true;
  }

  if (grant && String(grant.claimedBy || '') !== String(user._id)) {
    grant.claimedBy = user._id;
    grant.claimedAt = new Date();
    await grant.save();
  }

  if (changed) await user.save();
  return user;
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    accountStatus: user.accountStatus,
    freeAccess: Boolean(user.freeAccess),
    subscriptionStatus: user.subscriptionStatus,
    currentPeriodEnd: user.currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(user.cancelAtPeriodEnd),
    billingProvider: user.billingProvider || (user.stripeCustomerId ? 'stripe' : 'none'),
    canManageBilling: user.role !== 'owner' && Boolean(user.stripeCustomerId || user.googlePlayPurchaseToken),
    hasAccess: user.hasAppAccess()
  };
}
