const $ = (selector) => document.querySelector(selector);

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'No se pudo completar la acción.');
  return payload;
}

export function initAccountUI() {
  const user = window.SinBarrerasUser;
  if (!user) return;
  const button = $('#account-button');
  const dialog = $('#account-dialog');
  const avatar = $('#account-avatar');
  const name = $('#account-name');
  const email = $('#account-email');
  const plan = $('#account-plan');
  const manage = $('#manage-subscription');
  const admin = $('#open-admin');
  const logout = $('#account-logout');

  if (avatar) {
    if (user.avatarUrl) avatar.innerHTML = `<img src="${user.avatarUrl.replace(/"/g, '&quot;')}" alt="" referrerpolicy="no-referrer">`;
    else avatar.textContent = (user.name || user.email || 'SB').slice(0, 2).toUpperCase();
  }
  if (button) button.textContent = (user.name || user.email || 'SB').slice(0, 1).toUpperCase();
  if (name) name.textContent = user.name || 'Usuario de Sin Barreras';
  if (email) email.textContent = user.email;
  if (plan) {
    if (user.role === 'owner') plan.textContent = 'OWNER · ACCESO TOTAL';
    else if (user.freeAccess) plan.textContent = 'ACCESO GRATUITO OTORGADO';
    else if (['active', 'trialing'].includes(user.subscriptionStatus)) plan.textContent = 'PLAN SIN BARRERAS · $5.99/MES';
    else plan.textContent = 'SIN SUSCRIPCIÓN ACTIVA';
  }
  if (admin) admin.hidden = user.role !== 'owner';
  if (manage) manage.hidden = user.role === 'owner' || !user.canManageBilling;

  button?.addEventListener('click', () => dialog?.showModal());
  manage?.addEventListener('click', async () => {
    try {
      manage.disabled = true;
      if (user.billingProvider === 'google_play') {
        if (window.SinBarrerasPlay?.isNativeAndroid) {
          window.SinBarrerasPlay.manageSubscription();
          return;
        }
        const config = await jsonRequest('/billing/google/config');
        const url = new URL('https://play.google.com/store/account/subscriptions');
        if (config.productId) url.searchParams.set('sku', config.productId);
        if (config.packageName) url.searchParams.set('package', config.packageName);
        window.location.assign(url.toString());
        return;
      }
      const result = await jsonRequest('/billing/portal', { method: 'POST' });
      window.location.assign(result.url);
    } catch (error) {
      alert(error.message);
    } finally { manage.disabled = false; }
  });
  admin?.addEventListener('click', () => window.location.assign('/admin'));
  logout?.addEventListener('click', async () => {
    try { await window.SinBarrerasCloud?.syncNow?.(); } catch {}
    await jsonRequest('/auth/logout', { method: 'POST' }).catch(() => ({}));
    localStorage.removeItem('sinBarreras.currentUserId');
    window.location.assign('/');
  });
}
