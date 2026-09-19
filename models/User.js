import mongoose from 'mongoose';

const providerSchema = new mongoose.Schema({
  provider: { type: String, enum: ['google', 'chatgpt'], required: true },
  providerId: { type: String, required: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  name: { type: String, trim: true, maxlength: 120, default: '' },
  avatarUrl: { type: String, trim: true, maxlength: 800, default: '' },
  role: { type: String, enum: ['user', 'owner'], default: 'user', index: true },
  passwordHash: { type: String, select: false, default: null },
  emailVerifiedAt: { type: Date, default: null },
  emailVerificationRequired: { type: Boolean, default: false, index: true },
  ageConfirmedAt: { type: Date, default: null },
  termsAcceptedAt: { type: Date, default: null },
  privacyAcceptedAt: { type: Date, default: null },
  providers: { type: [providerSchema], default: [] },
  accountStatus: { type: String, enum: ['active', 'revoked'], default: 'active', index: true },
  freeAccess: { type: Boolean, default: false, index: true },
  freeAccessGrantedAt: { type: Date, default: null },
  stripeCustomerId: { type: String, default: null, index: true, sparse: true },
  stripeSubscriptionId: { type: String, default: null, index: true, sparse: true },
  billingProvider: { type: String, enum: ['none', 'stripe', 'google_play'], default: 'none', index: true },
  googlePlayProductId: { type: String, default: null },
  googlePlayPurchaseToken: { type: String, trim: true, index: true, unique: true, sparse: true },
  googlePlayOrderId: { type: String, default: null },
  googlePlaySubscriptionState: { type: String, default: '', maxlength: 80 },
  googlePlayVerifiedAt: { type: Date, default: null },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'],
    default: 'none',
    index: true
  },
  currentPeriodEnd: { type: Date, default: null },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  lastLoginAt: { type: Date, default: null },
  subscriptionAmount: { type: Number, default: null, min: 0 },
  subscriptionCurrency: { type: String, default: 'usd', lowercase: true, trim: true, maxlength: 8 },
  subscriptionInterval: { type: String, enum: ['day', 'week', 'month', 'year', null], default: null },
  subscriptionIntervalCount: { type: Number, default: 1, min: 1 }
}, { timestamps: true });

userSchema.methods.hasAppAccess = function hasAppAccess() {
  if (this.accountStatus !== 'active') return false;
  if (this.role === 'owner' || this.freeAccess) return true;
  if (!['active', 'trialing'].includes(this.subscriptionStatus)) return false;
  if (this.billingProvider === 'google_play') {
    const expiry = this.currentPeriodEnd ? new Date(this.currentPeriodEnd).getTime() : 0;
    return Number.isFinite(expiry) && expiry > Date.now();
  }
  return true;
};

export default mongoose.model('User', userSchema);
