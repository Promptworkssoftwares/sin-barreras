import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import User from '../models/User.js';
import { applyFreeGrant, normalizeEmail } from '../services/accessService.js';


function normalizeBaseUrl(value = '') {
  const raw = String(value || '').trim().replace(/\/$/, '');
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.origin;
  } catch { return ''; }
}

export function resolveGoogleCallbackUrl() {
  const explicit = String(process.env.GOOGLE_CALLBACK_URL || '').trim();
  const production = process.env.NODE_ENV === 'production';
  if (explicit) {
    try {
      const url = new URL(explicit);
      const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
      if (!production || (url.protocol === 'https:' && !local)) return url.toString();
      console.warn(`[AUTH] Ignorando GOOGLE_CALLBACK_URL inseguro para producción: ${explicit}`);
    } catch {
      console.warn('[AUTH] GOOGLE_CALLBACK_URL no es una URL válida; se intentará derivar desde APP_URL.');
    }
  }

  const candidates = [process.env.APP_URL, process.env.RENDER_EXTERNAL_URL, process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : '', 'https://sin-barreras.onrender.com'];
  for (const candidate of candidates) {
    const base = normalizeBaseUrl(candidate);
    if (!base) continue;
    const url = new URL(base);
    const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    if (production && (url.protocol !== 'https:' || local)) continue;
    return `${base}/auth/google/callback`;
  }

  if (production) throw new Error('Google OAuth requiere GOOGLE_CALLBACK_URL o APP_URL con una URL HTTPS pública en producción.');
  return 'http://localhost:3000/auth/google/callback';
}

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
      emailVerifiedAt: new Date(),
      emailVerificationRequired: false,
      lastLoginAt: new Date()
    });
  } else {
    if (!user.providers.some((item) => item.provider === provider && item.providerId === providerId)) {
      user.providers.push({ provider, providerId });
    }
    if (name) user.name = String(name).slice(0, 120);
    if (avatarUrl) user.avatarUrl = String(avatarUrl).slice(0, 800);
    if (normalizedEmail === ownerEmail) user.role = 'owner';
    user.emailVerifiedAt = user.emailVerifiedAt || new Date();
    user.emailVerificationRequired = false;
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
    const googleCallbackUrl = resolveGoogleCallbackUrl();
    console.log(`[AUTH] Google OAuth callback: ${googleCallbackUrl}`);
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: googleCallbackUrl,
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
