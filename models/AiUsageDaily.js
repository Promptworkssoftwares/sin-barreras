import mongoose from 'mongoose';

const aiUsageDailySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  dateKey: { type: String, required: true, index: true },
  monthKey: { type: String, required: true, index: true },
  featureRequests: { type: Number, default: 0, min: 0 },
  openAiCalls: { type: Number, default: 0, min: 0 },
  chatCalls: { type: Number, default: 0, min: 0 },
  transcriptionCalls: { type: Number, default: 0, min: 0 },
  ttsCalls: { type: Number, default: 0, min: 0 },
  visionCalls: { type: Number, default: 0, min: 0 },
  inputTokens: { type: Number, default: 0, min: 0 },
  cachedInputTokens: { type: Number, default: 0, min: 0 },
  outputTokens: { type: Number, default: 0, min: 0 },
  transcriptionSeconds: { type: Number, default: 0, min: 0 },
  ttsCharacters: { type: Number, default: 0, min: 0 },
  estimatedTtsSeconds: { type: Number, default: 0, min: 0 },
  imageCalls: { type: Number, default: 0, min: 0 },
  cacheHits: { type: Number, default: 0, min: 0 },
  translationCacheHits: { type: Number, default: 0, min: 0 },
  ttsCacheHits: { type: Number, default: 0, min: 0 },
  lessonCacheHits: { type: Number, default: 0, min: 0 },
  evaluationCacheHits: { type: Number, default: 0, min: 0 },
  localEvaluationHits: { type: Number, default: 0, min: 0 },
  estimatedCostMicros: { type: Number, default: 0, min: 0 },
  features: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true, minimize: false });

aiUsageDailySchema.index({ user: 1, dateKey: 1 }, { unique: true });
aiUsageDailySchema.index({ monthKey: 1, dateKey: 1 });

export default mongoose.model('AiUsageDaily', aiUsageDailySchema);
