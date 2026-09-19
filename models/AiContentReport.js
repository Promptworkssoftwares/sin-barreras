import mongoose from 'mongoose';

const aiContentReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  area: { type: String, enum: ['practice','coach','camera','explain','account','other'], default: 'other', index: true },
  reason: { type: String, enum: ['offensive','unsafe','incorrect','other'], default: 'other', index: true },
  content: { type: String, trim: true, maxlength: 4000, default: '' },
  details: { type: String, trim: true, maxlength: 1000, default: '' },
  status: { type: String, enum: ['open','reviewed','dismissed'], default: 'open', index: true },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

aiContentReportSchema.index({ status: 1, createdAt: -1 });
export default mongoose.model('AiContentReport', aiContentReportSchema);
