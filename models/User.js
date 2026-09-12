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
  providers: { type: [providerSchema], default: [] },
  accountStatus: { type: String, enum: ['active', 'revoked'], default: 'active', index: true },
  freeAccess: { type: Boolean, default: false, index: true },
  freeAccessGrantedAt: { type: Date, default: null },
  stripeCustomerId: { type: String, default: null, index: true, sparse: true },
  stripeSubscriptionId: { type: String, default: null, index: true, sparse: true },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'],
    default: 'none',
    index: true
  },
  currentPeriodEnd: { type: Date, default: null },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  lastLoginAt: { type: Date, default: null }
}, { timestamps: true });

userSchema.methods.hasAppAccess = function hasAppAccess() {
  if (this.accountStatus !== 'active') return false;
  if (this.role === 'owner' || this.freeAccess) return true;
  return ['active', 'trialing'].includes(this.subscriptionStatus);
};

export default mongoose.model('User', userSchema);
