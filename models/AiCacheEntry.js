import mongoose from 'mongoose';

const aiCacheEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  kind: {
    type: String,
    enum: ['translation', 'tts', 'practice_generation', 'phrase_lesson', 'practice_evaluation'],
    required: true,
    index: true
  },
  keyHash: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  hits: { type: Number, default: 0, min: 0 },
  lastUsedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
}, { timestamps: true, minimize: false });

aiCacheEntrySchema.index({ user: 1, kind: 1, keyHash: 1 }, { unique: true });
aiCacheEntrySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
aiCacheEntrySchema.index({ user: 1, kind: 1, lastUsedAt: -1 });

export default mongoose.model('AiCacheEntry', aiCacheEntrySchema);
