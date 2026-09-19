import express from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import passport from '../config/passport.js';
import User from '../models/User.js';
import { publicUser, normalizeEmail, applyFreeGrant } from '../services/accessService.js';
import { refreshGooglePlayEntitlement } from '../services/googlePlayService.js';
import { createAccountToken, consumeAccountToken, clearAccountTokens } from '../services/accountTokenService.js';
import { assertEmailDeliveryConfigured, sendPasswordResetEmail, sendVerificationEmail } from '../services/emailService.js';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function authRedirect(user) {
  if (user?.role === 'owner') return '/admin';
  return user?.hasAppAccess() ? '/app' : '/?pay=required';
}

function safeNext(value) {
  const next = String(value || '').trim();
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '';
  return ['/account-deletion', '/app', '/admin'].includes(next) ? next : '';
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
  const recoveryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Espera unos minutos antes de volver a intentar.' }
  });

  router.post('/register', authLimiter, async (request, response, next) => {
    let user = null;
    try {
      assertEmailDeliveryConfigured();
      const email = normalizeEmail(request.body?.email);
      const name = String(request.body?.name || '').trim().slice(0, 120);
      const password = String(request.body?.password || '');
      const termsAccepted = request.body?.termsAccepted === true || request.body?.termsAccepted === 'true';
      const ageConfirmed = request.body?.ageConfirmed === true || request.body?.ageConfirmed === 'true';
      const ownerEmail = normalizeEmail(process.env.OWNER_EMAIL);

      if (!EMAIL_RE.test(email)) return response.status(400).json({ error: 'Escribe un email válido.' });
      if (!name || name.length < 2) return response.status(400).json({ error: 'Escribe tu nombre.' });
      if (password.length < 10) return response.status(400).json({ error: 'La contraseña debe tener al menos 10 caracteres.' });
      if (!termsAccepted || !ageConfirmed) return response.status(400).json({ error: 'Debes confirmar que tienes 18 años o más y aceptar los Términos y la Política de Privacidad.' });
      if (ownerEmail && email === ownerEmail) {
        return response.status(403).json({ error: 'Este email está reservado para la cuenta owner. Usa Iniciar sesión.' });
      }

      const existing = await User.findOne({ email });
      if (existing) return response.status(409).json({ error: 'Ya existe una cuenta con este email. Inicia sesión o recupera tu contraseña.' });

      user = await User.create({
        email,
        name,
        role: 'user',
        accountStatus: 'active',
        passwordHash: await bcrypt.hash(password, 12),
        emailVerificationRequired: true,
        emailVerifiedAt: null,
        ageConfirmedAt: new Date(),
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        lastLoginAt: null
      });
      const { rawToken } = await createAccountToken(user, 'verify_email', 24 * 60);
      await sendVerificationEmail(user, rawToken);

      response.status(201).json({
        ok: true,
        verificationRequired: true,
        message: 'Cuenta creada. Revisa tu email y confirma tu dirección antes de iniciar sesión.'
      });
    } catch (error) {
      if (user?._id && !user.emailVerifiedAt) {
        await Promise.allSettled([clearAccountTokens(user._id), user.deleteOne()]);
      }
      if (error?.code === 11000) return response.status(409).json({ error: 'Ya existe una cuenta con este email.' });
      next(error);
    }
  });

  router.get('/verify-email', recoveryLimiter, async (request, response, next) => {
    try {
      const record = await consumeAccountToken(request.query?.token, 'verify_email');
      if (!record) return response.redirect('/?email=invalid');
      const user = await User.findById(record.user);
      if (!user) return response.redirect('/?email=invalid');
      user.emailVerifiedAt = new Date();
      user.emailVerificationRequired = false;
      await user.save();
      await applyFreeGrant(user);
      await clearAccountTokens(user._id);
      return response.redirect('/?email=verified');
    } catch (error) { next(error); }
  });

  router.post('/resend-verification', recoveryLimiter, async (request, response, next) => {
    try {
      assertEmailDeliveryConfigured();
      const email = normalizeEmail(request.body?.email);
      if (!EMAIL_RE.test(email)) return response.status(400).json({ error: 'Escribe un email válido.' });
      const user = await User.findOne({ email }).select('+passwordHash');
      if (user?.emailVerificationRequired && !user.emailVerifiedAt && user.passwordHash) {
        const { rawToken } = await createAccountToken(user, 'verify_email', 24 * 60);
        await sendVerificationEmail(user, rawToken);
      }
      response.json({ ok: true, message: 'Si la cuenta necesita verificación, enviamos un nuevo enlace a ese email.' });
    } catch (error) { next(error); }
  });

  router.post('/forgot-password', recoveryLimiter, async (request, response, next) => {
    try {
      assertEmailDeliveryConfigured();
      const email = normalizeEmail(request.body?.email);
      if (!EMAIL_RE.test(email)) return response.status(400).json({ error: 'Escribe un email válido.' });
      const user = await User.findOne({ email }).select('+passwordHash');
      if (user?.passwordHash && user.accountStatus === 'active') {
        const { rawToken } = await createAccountToken(user, 'reset_password', 30);
        await sendPasswordResetEmail(user, rawToken);
      }
      response.json({ ok: true, message: 'Si existe una cuenta local con ese email, enviamos un enlace para restablecer la contraseña.' });
    } catch (error) { next(error); }
  });

  router.post('/reset-password', recoveryLimiter, async (request, response, next) => {
    try {
      const token = String(request.body?.token || '').trim();
      const password = String(request.body?.password || '');
      if (password.length < 10) return response.status(400).json({ error: 'La contraseña debe tener al menos 10 caracteres.' });
      if (!termsAccepted || !ageConfirmed) return response.status(400).json({ error: 'Debes confirmar que tienes 18 años o más y aceptar los Términos y la Política de Privacidad.' });
      const record = await consumeAccountToken(token, 'reset_password');
      if (!record) return response.status(400).json({ error: 'Este enlace no es válido o ya venció. Solicita uno nuevo.' });
      const user = await User.findById(record.user).select('+passwordHash');
      if (!user || user.accountStatus !== 'active') return response.status(400).json({ error: 'No fue posible restablecer esta cuenta.' });
      user.passwordHash = await bcrypt.hash(password, 12);
      user.emailVerifiedAt = user.emailVerifiedAt || new Date();
      user.emailVerificationRequired = false;
      await user.save();
      await clearAccountTokens(user._id);
      response.json({ ok: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
    } catch (error) { next(error); }
  });

  router.post('/login', authLimiter, async (request, response, next) => {
    try {
      const email = normalizeEmail(request.body?.email);
      const password = String(request.body?.password || '');
      const nextPath = safeNext(request.body?.next);
      if (!EMAIL_RE.test(email) || !password) return response.status(400).json({ error: 'Email y contraseña son requeridos.' });

      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
        return response.status(401).json({ error: 'Email o contraseña incorrectos.' });
      }
      if (user.accountStatus !== 'active') {
        return response.status(403).json({ error: 'Esta cuenta está revocada. Contacta al administrador.' });
      }
      if (user.emailVerificationRequired && !user.emailVerifiedAt) {
        return response.status(403).json({
          error: 'Debes verificar tu email antes de iniciar sesión. Revisa tu correo o solicita un nuevo enlace.',
          code: 'EMAIL_NOT_VERIFIED'
        });
      }

      if (email === normalizeEmail(process.env.OWNER_EMAIL)) {
        user.role = 'owner';
        user.freeAccess = true;
        user.emailVerifiedAt = user.emailVerifiedAt || new Date();
        user.emailVerificationRequired = false;
        if (!user.freeAccessGrantedAt) user.freeAccessGrantedAt = new Date();
      }
      user.lastLoginAt = new Date();
      await user.save();
      if (user.role !== 'owner') {
        await applyFreeGrant(user);
        if (user.billingProvider === 'google_play') {
          try { await refreshGooglePlayEntitlement(user, { force: true }); }
          catch (error) { console.warn('Google Play login refresh failed:', error.message); }
        }
      }

      request.login(user, (error) => {
        if (error) return next(error);
        response.json({ ok: true, user: publicUser(user), redirect: nextPath || authRedirect(user) });
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
    passport.authenticate('google', { failureRedirect: '/?auth=failed' })(request, response, async () => {
      if (request.user?.billingProvider === 'google_play') {
        try { await refreshGooglePlayEntitlement(request.user, { force: true }); }
        catch (error) { console.warn('Google Play Google-login refresh failed:', error.message); }
      }
      response.redirect(authRedirect(request.user));
    });
  });

  router.get('/chatgpt', (request, response, next) => {
    if (!chatgptEnabled) return response.redirect('/?auth=chatgpt-unavailable');
    passport.authenticate('chatgpt', { scope: ['openid', 'profile', 'email'] })(request, response, next);
  });

  router.get('/chatgpt/callback', (request, response, next) => {
    if (!chatgptEnabled) return response.redirect('/?auth=chatgpt-unavailable');
    passport.authenticate('chatgpt', { failureRedirect: '/?auth=failed' })(request, response, async () => {
      if (request.user?.billingProvider === 'google_play') {
        try { await refreshGooglePlayEntitlement(request.user, { force: true }); }
        catch (error) { console.warn('Google Play ChatGPT-login refresh failed:', error.message); }
      }
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
