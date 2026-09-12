import mongoose from 'mongoose';

const userStateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  history: { type: [mongoose.Schema.Types.Mixed], default: [] },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  onboarding: { type: Boolean, default: false },
  practicePoints: { type: Number, default: 0, min: 0 },
  learning: { type: mongoose.Schema.Types.Mixed, default: {} },
  sounds: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true, minimize: false });

export default mongoose.model('UserState', userStateSchema);
