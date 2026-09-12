import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import User from '../models/User.js';
import { applyFreeGrant, normalizeEmail } from '../services/accessService.js';

async function upsertSocialUser({ provider, providerId, email, name, avatarUrl }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error(`El proveedor ${provider} no devolvió un email válido.`);

  const ownerEmail = normalizeEmail(process.env.OWNER_EMAIL);
  let user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    user = new User({
      email: normalizedEmail,
      name: String(name || '').slice(0, 120),
      avatarUrl: String(avatarUrl || '').slice(0, 800),
      role: normalizedEmail === ownerEmail ? 'owner' : 'user',
      providers: [{ provider, providerId }],
      accountStatus: 'active',
      lastLoginAt: new Date()
    });
  } else {
    if (!user.providers.some((item) => item.provider === provider && item.providerId === providerId)) {
      user.providers.push({ provider, providerId });
    }
    if (name) user.name = String(name).slice(0, 120);
    if (avatarUrl) user.avatarUrl = String(avatarUrl).slice(0, 800);
    if (normalizedEmail === ownerEmail) user.role = 'owner';
    user.lastLoginAt = new Date();
  }

  await user.save();
  await applyFreeGrant(user);
  return user;
}

passport.serializeUser((user, done) => done(null, String(user._id)));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user || false);
  } catch (error) {
    done(error);
  }
});

export function configurePassport() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  if (googleEnabled) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.APP_URL}/auth/google/callback`,
      passReqToCallback: false
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || profile._json?.email;
        const verified = profile._json?.email_verified;
        if (verified === false) return done(null, false, { message: 'Google no confirmó este email.' });
        const user = await upsertSocialUser({
          provider: 'google',
          providerId: profile.id,
          email,
          name: profile.displayName,
          avatarUrl: profile.photos?.[0]?.value || ''
        });
        done(null, user);
      } catch (error) {
        done(error);
      }
    }));
  }

  const chatgptEnabled = String(process.env.CHATGPT_OAUTH_ENABLED).toLowerCase() === 'true'
    && process.env.CHATGPT_OAUTH_CLIENT_ID
    && process.env.CHATGPT_OAUTH_CLIENT_SECRET
    && process.env.CHATGPT_OAUTH_AUTHORIZATION_URL
    && process.env.CHATGPT_OAUTH_TOKEN_URL
    && process.env.CHATGPT_OAUTH_USERINFO_URL;

  if (chatgptEnabled) {
    const strategy = new OAuth2Strategy({
      authorizationURL: process.env.CHATGPT_OAUTH_AUTHORIZATION_URL,
      tokenURL: process.env.CHATGPT_OAUTH_TOKEN_URL,
      clientID: process.env.CHATGPT_OAUTH_CLIENT_ID,
      clientSecret: process.env.CHATGPT_OAUTH_CLIENT_SECRET,
      callbackURL: process.env.CHATGPT_OAUTH_CALLBACK_URL || `${process.env.APP_URL}/auth/chatgpt/callback`,
      state: true
    }, async (accessToken, _refreshToken, profile, done) => {
      try {
        const user = await upsertSocialUser({
          provider: 'chatgpt',
          providerId: String(profile.id || profile.sub || ''),
          email: profile.email,
          name: profile.name || profile.preferred_username || '',
          avatarUrl: profile.picture || ''
        });
        done(null, user);
      } catch (error) {
        done(error);
      }
    });

    strategy.userProfile = function userProfile(accessToken, done) {
      fetch(process.env.CHATGPT_OAUTH_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
        .then(async (response) => {
          if (!response.ok) throw new Error('No fue posible leer el perfil de ChatGPT.');
          return response.json();
        })
        .then((profile) => done(null, profile))
        .catch(done);
    };
    passport.use('chatgpt', strategy);
  }

  return { googleEnabled, chatgptEnabled: Boolean(chatgptEnabled) };
}

export default passport;
