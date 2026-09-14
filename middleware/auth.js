import { refreshGooglePlayEntitlement } from '../services/googlePlayService.js';

export function requireAuth(request, response, next) {
  if (request.isAuthenticated?.() && request.user) return next();
  if (request.originalUrl.startsWith('/api/')) return response.status(401).json({ error: 'Debes iniciar sesión.' });
  return response.redirect('/?login=required');
}

export async function requireAccess(request, response, next) {
  if (!request.isAuthenticated?.() || !request.user) {
    if (request.originalUrl.startsWith('/api/')) return response.status(401).json({ error: 'Debes iniciar sesión.' });
    return response.redirect('/?login=required');
  }

  if (request.user.billingProvider === 'google_play') {
    try {
      await refreshGooglePlayEntitlement(request.user);
    } catch (error) {
      // Never grant access from a failed network call. Existing Google Play access is
      // still bounded by currentPeriodEnd in User.hasAppAccess().
      console.warn('Google Play entitlement refresh failed:', error.message);
    }
  }

  if (!request.user.hasAppAccess()) {
    if (request.originalUrl.startsWith('/api/')) return response.status(402).json({ error: 'Necesitas una suscripción activa o acceso gratuito para usar Sin Barreras.', code: 'SUBSCRIPTION_REQUIRED' });
    return response.redirect('/?pay=required');
  }
  next();
}

export function requireOwner(request, response, next) {
  if (!request.isAuthenticated?.() || !request.user) {
    if (request.originalUrl.startsWith('/api/')) return response.status(401).json({ error: 'Debes iniciar sesión.' });
    return response.redirect('/?login=required');
  }
  if (request.user.role !== 'owner') {
    if (request.originalUrl.startsWith('/api/')) return response.status(403).json({ error: 'No autorizado.' });
    return response.redirect('/app');
  }
  next();
}
