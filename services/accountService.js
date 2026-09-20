import UserState from '../models/UserState.js';
import AccessGrant from '../models/AccessGrant.js';
import AccountToken from '../models/AccountToken.js';
import AiUsageDaily from '../models/AiUsageDaily.js';
import AiCacheEntry from '../models/AiCacheEntry.js';
import ConversationRoom from '../models/ConversationRoom.js';
import AiContentReport from '../models/AiContentReport.js';
import ConversationReport from '../models/ConversationReport.js';
import { cancelUserSubscriptionNow } from './stripeService.js';
import { revokeGooglePlaySubscription } from './googlePlayService.js';

export async function deleteUserAccount(user) {
  if (!user) return;
  if (user.role === 'owner') throw new Error('La cuenta owner no puede eliminarse desde este flujo.');

  if (user.billingProvider === 'google_play') await revokeGooglePlaySubscription(user);
  else if (user.billingProvider === 'stripe') await cancelUserSubscriptionNow(user);

  await Promise.all([
    UserState.deleteOne({ user: user._id }),
    AccountToken.deleteMany({ user: user._id }),
    AiUsageDaily.deleteMany({ user: user._id }),
    AiCacheEntry.deleteMany({ user: user._id }),
    ConversationRoom.deleteMany({ hostUser: user._id }),
    AiContentReport.deleteMany({ user: user._id }),
    ConversationReport.deleteMany({ hostUser: user._id }),
    AccessGrant.updateMany({ claimedBy: user._id }, { $set: { claimedBy: null, claimedAt: null } })
  ]);
  await user.deleteOne();
}
