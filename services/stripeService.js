import Stripe from 'stripe';
import User from '../models/User.js';

let stripeInstance = null;

export function stripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe() {
  if (!stripeEnabled()) throw new Error('Stripe no está configurado todavía.');
  if (!stripeInstance) stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeInstance;
}

export async function ensureStripeCustomer(user) {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripe().customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: { userId: String(user._id) }
  });
  user.stripeCustomerId = customer.id;
  await user.save();
  return customer.id;
}

export async function syncSubscription(subscription) {
  const userId = subscription.metadata?.userId;
  let user = userId ? await User.findById(userId) : null;
  if (!user && subscription.customer) user = await User.findOne({ stripeCustomerId: String(subscription.customer) });
  if (!user) return null;

  user.stripeCustomerId = String(subscription.customer || user.stripeCustomerId || '');
  user.stripeSubscriptionId = subscription.id;
  user.billingProvider = 'stripe';
  user.subscriptionStatus = subscription.status || 'none';
  user.currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
  user.cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);
  await user.save();
  return user;
}

export async function syncCheckoutSession(session, expectedUser = null) {
  let user = expectedUser;
  if (!user && session.metadata?.userId) user = await User.findById(session.metadata.userId);
  if (!user) return null;

  if (session.customer) { user.stripeCustomerId = String(session.customer); user.billingProvider = 'stripe'; }
  if (session.subscription) {
    const subscription = await stripe().subscriptions.retrieve(String(session.subscription));
    return syncSubscription(subscription);
  }
  await user.save();
  return user;
}

export async function scheduleUserSubscriptionCancellation(user) {
  if (!user?.stripeSubscriptionId) return null;
  if (!stripeEnabled()) throw new Error('Stripe no está configurado; no se puede cancelar una suscripción existente de forma segura.');
  try {
    const subscription = await stripe().subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: true });
    await syncSubscription(subscription);
    return subscription;
  } catch (error) {
    if (error?.code === 'resource_missing') return null;
    throw error;
  }
}

export async function cancelUserSubscriptionNow(user) {
  if (!user?.stripeSubscriptionId) return null;
  if (!stripeEnabled()) throw new Error('Stripe no está configurado; no se puede cancelar una suscripción existente de forma segura.');
  try {
    const subscription = await stripe().subscriptions.cancel(user.stripeSubscriptionId);
    await syncSubscription(subscription);
    return subscription;
  } catch (error) {
    if (error?.code === 'resource_missing') return null;
    throw error;
  }
}
