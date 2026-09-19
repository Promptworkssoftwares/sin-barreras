import mongoose from 'mongoose';

const conversationReportSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, uppercase: true, trim: true, maxlength: 8, index: true },
  hostUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reporterRole: { type: String, enum: ['host','guest'], required: true },
  reportedRole: { type: String, enum: ['host','guest'], required: true },
  reason: { type: String, enum: ['harassment','threats','hate','sexual','scam','other'], default: 'other', index: true },
  content: { type: String, trim: true, maxlength: 4000, default: '' },
  status: { type: String, enum: ['open','reviewed','dismissed'], default: 'open', index: true },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });
conversationReportSchema.index({ status: 1, createdAt: -1 });
export default mongoose.model('ConversationReport', conversationReportSchema);
