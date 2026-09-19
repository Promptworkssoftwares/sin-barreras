import bcrypt from 'bcryptjs';
import { loadEnvironment, validateMongoEnvironment } from '../config/env.js';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

loadEnvironment();
validateMongoEnvironment();
await connectDB();
const email = String(process.env.REVIEWER_EMAIL || '').trim().toLowerCase();
const password = String(process.env.REVIEWER_PASSWORD || '');
if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 10) {
  console.error('Configura REVIEWER_EMAIL y REVIEWER_PASSWORD (mínimo 10 caracteres) en .env.');
  process.exit(1);
}
const passwordHash = await bcrypt.hash(password, 12);
const now = new Date();
const reviewer = await User.findOneAndUpdate(
  { email },
  { $set: {
    name: 'Google Play Reviewer', role: 'user', accountStatus: 'active', freeAccess: true,
    freeAccessGrantedAt: now, passwordHash, emailVerifiedAt: now, emailVerificationRequired: false,
    ageConfirmedAt: now, termsAcceptedAt: now, privacyAcceptedAt: now
  } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
).select('+passwordHash');
console.log(`Cuenta de revisión lista: ${reviewer.email}`);
process.exit(0);
