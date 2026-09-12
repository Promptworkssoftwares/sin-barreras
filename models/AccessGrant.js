import mongoose from 'mongoose';

const accessGrantSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  active: { type: Boolean, default: true, index: true },
  note: { type: String, trim: true, maxlength: 240, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  claimedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('AccessGrant', accessGrantSchema);
