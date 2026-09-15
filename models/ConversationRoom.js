import mongoose from 'mongoose';

const conversationRoomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  hostUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  hostLanguage: { type: String, required: true, trim: true, maxlength: 12 },
  guestLanguage: { type: String, required: true, trim: true, maxlength: 12 },
  situation: { type: String, default: 'everyday', trim: true, maxlength: 40 },
  voice: { type: String, default: 'coral', trim: true, maxlength: 40 },
  hostTokenHash: { type: String, required: true, select: false },
  guestTokenHash: { type: String, required: true, select: false },
  status: { type: String, enum: ['active', 'closed'], default: 'active', index: true },
  guestConnectedAt: { type: Date, default: null },
  lastActivityAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

conversationRoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
conversationRoomSchema.index({ hostUser: 1, status: 1, createdAt: -1 });

export default mongoose.model('ConversationRoom', conversationRoomSchema);
