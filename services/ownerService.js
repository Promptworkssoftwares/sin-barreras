import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { normalizeEmail } from './accessService.js';

export async function ensureOwnerAccount() {
  const email = normalizeEmail(process.env.OWNER_EMAIL);
  const password = String(process.env.OWNER_PASSWORD || '');

  if (!email && !password) {
    console.warn('[WARN] OWNER_EMAIL/OWNER_PASSWORD no están configurados. El Admin Dashboard no tendrá login local hasta configurarlos.');
    return null;
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('OWNER_EMAIL no es válido. Corrige OWNER_EMAIL en .env.');
  }
  if (password.length < 10) {
    throw new Error('OWNER_PASSWORD debe tener al menos 10 caracteres. Corrígelo en .env.');
  }

  let user = await User.findOne({ email }).select('+passwordHash');
  if (!user) user = new User({ email });

  const passwordMatches = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!passwordMatches) user.passwordHash = await bcrypt.hash(password, 12);

  user.role = 'owner';
  user.accountStatus = 'active';
  user.freeAccess = true;
  user.emailVerifiedAt = user.emailVerifiedAt || new Date();
  user.emailVerificationRequired = false;
  if (!user.freeAccessGrantedAt) user.freeAccessGrantedAt = new Date();
  await user.save();

  if (user.stripeSubscriptionId && ['active', 'trialing', 'past_due'].includes(user.subscriptionStatus)) {
    console.warn('[WARN] La cuenta owner tiene una suscripción Stripe existente. El owner ya tiene acceso gratis; cancela esa suscripción en Stripe para evitar futuros cobros.');
  }

  console.log(`[OK] Owner protegido y con acceso total: ${email}`);
  return user;
}
