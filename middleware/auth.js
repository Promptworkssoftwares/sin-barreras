export function requireAuth(request, response, next) {
  if (request.isAuthenticated?.() && request.user) return next();
  if (request.originalUrl.startsWith('/api/')) return response.status(401).json({ error: 'Debes iniciar sesión.' });
  return response.redirect('/?login=required');
}

export function requireAccess(request, response, next) {
  if (!request.isAuthenticated?.() || !request.user) {
    if (request.originalUrl.startsWith('/api/')) return response.status(401).json({ error: 'Debes iniciar sesión.' });
    return response.redirect('/?login=required');
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
