import express from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import passport from '../config/passport.js';
import User from '../models/User.js';
import { publicUser, normalizeEmail, applyFreeGrant } from '../services/accessService.js';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function authRedirect(user) {
  if (user?.role === 'owner') return '/admin';
  return user?.hasAppAccess() ? '/app' : '/?pay=required';
}

export function createAuthRouter({ googleEnabled, chatgptEnabled }) {
  const router = express.Router();
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Espera unos minutos antes de volver a intentar.' }
  });

  router.post('/register', authLimiter, async (request, response, next) => {
    try {
      const email = normalizeEmail(request.body?.email);
      const name = String(request.body?.name || '').trim().slice(0, 120);
      const password = String(request.body?.password || '');
      const ownerEmail = normalizeEmail(process.env.OWNER_EMAIL);

      if (!EMAIL_RE.test(email)) return response.status(400).json({ error: 'Escribe un email válido.' });
      if (!name || name.length < 2) return response.status(400).json({ error: 'Escribe tu nombre.' });
      if (password.length < 10) return response.status(400).json({ error: 'La contraseña debe tener al menos 10 caracteres.' });
      if (ownerEmail && email === ownerEmail) {
        return response.status(403).json({ error: 'Este email está reservado para la cuenta owner. Usa Iniciar sesión.' });
      }

      const existing = await User.findOne({ email });
      if (existing) return response.status(409).json({ error: 'Ya existe una cuenta con este email. Inicia sesión o usa Google si vinculaste esa cuenta.' });

      const user = await User.create({
        email,
        name,
        role: 'user',
        accountStatus: 'active',
        passwordHash: await bcrypt.hash(password, 12),
        lastLoginAt: new Date()
      });
      await applyFreeGrant(user);

      request.login(user, (error) => {
        if (error) return next(error);
        response.status(201).json({ ok: true, user: publicUser(user), redirect: authRedirect(user) });
      });
    } catch (error) {
      if (error?.code === 11000) return response.status(409).json({ error: 'Ya existe una cuenta con este email.' });
      next(error);
    }
  });

  router.post('/login', authLimiter, async (request, response, next) => {
    try {
      const email = normalizeEmail(request.body?.email);
      const password = String(request.body?.password || '');
      if (!EMAIL_RE.test(email) || !password) return response.status(400).json({ error: 'Email y contraseña son requeridos.' });

      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
        return response.status(401).json({ error: 'Email o contraseña incorrectos.' });
      }
      if (user.accountStatus !== 'active') {
        return response.status(403).json({ error: 'Esta cuenta está revocada. Contacta al administrador.' });
      }

      // OWNER_EMAIL always wins. This protects the owner even if an older database
      // record was previously created as a normal user.
      if (email === normalizeEmail(process.env.OWNER_EMAIL)) {
        user.role = 'owner';
        user.freeAccess = true;
        if (!user.freeAccessGrantedAt) user.freeAccessGrantedAt = new Date();
      }
      user.lastLoginAt = new Date();
      await user.save();
      if (user.role !== 'owner') await applyFreeGrant(user);

      request.login(user, (error) => {
        if (error) return next(error);
        response.json({ ok: true, user: publicUser(user), redirect: authRedirect(user) });
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/google', (request, response, next) => {
    if (!googleEnabled) return response.redirect('/?auth=google-not-configured');
    passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })(request, response, next);
  });

  router.get('/google/callback', (request, response, next) => {
    if (!googleEnabled) return response.redirect('/?auth=google-not-configured');
    passport.authenticate('google', { failureRedirect: '/?auth=failed' })(request, response, () => {
      response.redirect(authRedirect(request.user));
    });
  });

  router.get('/chatgpt', (request, response, next) => {
    if (!chatgptEnabled) return response.redirect('/?auth=chatgpt-unavailable');
    passport.authenticate('chatgpt', { scope: ['openid', 'profile', 'email'] })(request, response, next);
  });

  router.get('/chatgpt/callback', (request, response, next) => {
    if (!chatgptEnabled) return response.redirect('/?auth=chatgpt-unavailable');
    passport.authenticate('chatgpt', { failureRedirect: '/?auth=failed' })(request, response, () => {
      response.redirect(authRedirect(request.user));
    });
  });

  router.post('/logout', (request, response, next) => {
    request.logout((error) => {
      if (error) return next(error);
      request.session?.destroy(() => response.json({ ok: true }));
    });
  });

  return router;
}
