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
  const deleteButton = $('#account-delete');
  const deleteDialog = $('#delete-account-dialog');
  const deleteForm = $('#delete-account-form');
  const deletePassword = $('#delete-account-password');
  const deleteConfirmation = $('#delete-account-confirmation');
  const deleteStatus = $('#delete-account-status');
  const usageCard = $('#account-ai-usage');
  const usageTitle = $('#account-ai-usage-title');
  const usagePercent = $('#account-ai-usage-percent');
  const usageBar = $('#account-ai-usage-bar');
  const usageVoice = $('#account-ai-voice');
  const usageReset = $('#account-ai-reset');
  const usageNote = $('#account-ai-usage-note');

  function formatResetDate(value) {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('es-US', { month:'short', day:'numeric' }) : '—';
  }

  function renderAiUsage(quota = {}) {
    if (!usageCard) return;
    if (quota.unlimited) {
      usageCard.dataset.state = 'normal';
      if (usageTitle) usageTitle.textContent = 'Acceso owner sin límite';
      if (usagePercent) usagePercent.textContent = '∞';
      if (usageBar) usageBar.style.width = '0%';
      if (usageVoice) usageVoice.textContent = 'Voz: sin límite';
      if (usageReset) usageReset.textContent = 'Protección owner activa';
      if (usageNote) usageNote.textContent = 'La cuenta owner no consume el límite mensual de usuarios.';
      return;
    }

    const used = Number(quota.voiceMinutesUsed || 0);
    const limit = Number(quota.minutesLimit || 0);
    const hasVoiceLimit = Number.isFinite(limit) && limit > 0;
    const effective = Math.max(0, Math.min(100, Number(quota.effectivePercent || 0)));
    usageCard.dataset.state = quota.exhausted ? 'exhausted' : quota.warning ? 'warning' : 'normal';
    if (usageTitle) usageTitle.textContent = quota.exhausted ? 'Límite del período alcanzado' : hasVoiceLimit ? `${used.toFixed(1)} de ${limit.toFixed(0)} min de voz` : 'Uso de IA del período';
    if (usagePercent) usagePercent.textContent = `${effective.toFixed(0)}%`;
    if (usageBar) usageBar.style.width = `${effective}%`;
    if (usageVoice) usageVoice.textContent = hasVoiceLimit ? `Voz: ${used.toFixed(1)} / ${limit.toFixed(0)} min` : `Voz procesada: ${used.toFixed(1)} min`;
    if (usageReset) usageReset.textContent = `Renueva: ${formatResetDate(quota.resetAt)}`;
    if (usageNote) {
      if (quota.exhausted) usageNote.textContent = quota.reason === 'voice_minutes'
        ? 'Usaste los minutos de voz incluidos. Las funciones de IA volverán a estar disponibles al renovarse tu período.'
        : 'Alcanzaste el uso de IA incluido en tu plan. Las funciones de IA volverán a estar disponibles al renovarse tu período.';
      else if (quota.warning) usageNote.textContent = 'Estás cerca del límite incluido. Puedes seguir usando la app hasta completar tu período.';
      else usageNote.textContent = hasVoiceLimit
        ? `Te quedan ${Number(quota.voiceMinutesRemaining || 0).toFixed(1)} min de voz. El uso general de IA también tiene protección automática.`
        : 'El uso general de IA tiene protección automática para mantener el servicio disponible.';
    }
  }

  async function loadAiUsage() {
    if (!usageCard) return;
    try {
      const result = await jsonRequest('/api/account/ai-usage');
      renderAiUsage(result.quota || {});
    } catch (error) {
      if (usageTitle) usageTitle.textContent = 'Uso no disponible';
      if (usageNote) usageNote.textContent = error.message;
    }
  }

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
    else if (user.subscriptionStatus === 'trialing') {
      const end = user.currentPeriodEnd ? new Date(user.currentPeriodEnd) : null;
      const when = end && !Number.isNaN(end.getTime()) ? end.toLocaleDateString('es-US', { month:'short', day:'numeric', year:'numeric' }) : '';
      plan.textContent = `PRUEBA GRATIS${when ? ` · HASTA ${when.toUpperCase()}` : ''}`;
    }
    else if (user.subscriptionStatus === 'active') plan.textContent = 'PLAN SIN BARRERAS · $5.99/MES';
    else plan.textContent = 'SIN SUSCRIPCIÓN ACTIVA';
  }
  if (admin) admin.hidden = user.role !== 'owner';
  if (deleteButton) deleteButton.hidden = user.role === 'owner';
  if (manage) manage.hidden = user.role === 'owner' || !user.canManageBilling;

  button?.addEventListener('click', () => { dialog?.showModal(); void loadAiUsage(); });
  window.addEventListener('sinbarreras:ai-quota', (event) => renderAiUsage(event.detail || {}));
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

  deleteButton?.addEventListener('click', () => {
    dialog?.close();
    if (deletePassword) deletePassword.value = '';
    if (deleteConfirmation) deleteConfirmation.value = '';
    if (deleteStatus) deleteStatus.textContent = '';
    deleteDialog?.showModal();
  });
  deleteForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const confirmation = String(deleteConfirmation?.value || '').trim().toUpperCase();
    const submit = $('#delete-account-confirm');
    if (confirmation !== 'ELIMINAR') {
      if (deleteStatus) deleteStatus.textContent = 'Escribe ELIMINAR para confirmar.';
      return;
    }
    try {
      if (submit) submit.disabled = true;
      if (deleteStatus) deleteStatus.textContent = 'Eliminando cuenta…';
      await jsonRequest('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'ELIMINAR', currentPassword: deletePassword?.value || '' })
      });
      localStorage.clear();
      window.location.assign('/?account=deleted');
    } catch (error) {
      if (deleteStatus) deleteStatus.textContent = error.message;
      if (submit) submit.disabled = false;
    }
  });
  logout?.addEventListener('click', async () => {
    try { await window.SinBarrerasCloud?.syncNow?.(); } catch {}
    await jsonRequest('/auth/logout', { method: 'POST' }).catch(() => ({}));
    localStorage.removeItem('sinBarreras.currentUserId');
    window.location.assign('/');
  });
}
