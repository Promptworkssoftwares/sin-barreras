import mongoose from 'mongoose';

const accountTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  type: { type: String, enum: ['verify_email', 'reset_password'], required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

accountTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
accountTokenSchema.index({ user: 1, type: 1 });

export default mongoose.model('AccountToken', accountTokenSchema);
