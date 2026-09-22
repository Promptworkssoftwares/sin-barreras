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
  const settingsButton = $('#settings-button');
  const settingsUsageCard = $('#settings-ai-usage');
  const settingsUsageTitle = $('#settings-ai-usage-title');
  const settingsUsagePercent = $('#settings-ai-usage-percent');
  const settingsUsageBar = $('#settings-ai-usage-bar');
  const settingsUsageRemaining = $('#settings-ai-remaining');
  const settingsUsageReset = $('#settings-ai-reset');
  const settingsUsageNote = $('#settings-ai-usage-note');

  function formatResetDate(value) {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('es-US', { month:'short', day:'numeric' }) : '—';
  }

  function renderAiUsage(quota = {}) {
    const used = Number(quota.voiceMinutesUsed || 0);
    const limit = Number(quota.minutesLimit || 0);
    const hasVoiceLimit = Number.isFinite(limit) && limit > 0;
    const remaining = Math.max(0, Number(quota.voiceMinutesRemaining || 0));
    const voicePercent = hasVoiceLimit
      ? Math.max(0, Math.min(100, Number(quota.voicePercent ?? ((used / limit) * 100)) || 0))
      : 0;
    const effective = Math.max(0, Math.min(100, Number(quota.effectivePercent || 0)));
    const stateName = quota.exhausted ? 'exhausted' : quota.warning ? 'warning' : 'normal';

    if (usageCard) {
      usageCard.dataset.state = stateName;
      if (quota.unlimited) {
        if (usageTitle) usageTitle.textContent = 'Acceso owner sin límite';
        if (usagePercent) usagePercent.textContent = '∞';
        if (usageBar) usageBar.style.width = '0%';
        if (usageVoice) usageVoice.textContent = 'Voz: sin límite';
        if (usageReset) usageReset.textContent = 'Protección owner activa';
        if (usageNote) usageNote.textContent = 'La cuenta owner no consume el límite mensual de usuarios.';
      } else {
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
            ? `Te quedan ${remaining.toFixed(1)} min de voz. El uso general de IA también tiene protección automática.`
            : 'El uso general de IA tiene protección automática para mantener el servicio disponible.';
        }
      }
    }

    if (settingsUsageCard) {
      settingsUsageCard.dataset.state = stateName;
      const meter = settingsUsageBar?.parentElement;
      if (quota.unlimited) {
        if (settingsUsageTitle) settingsUsageTitle.textContent = 'Minutos sin límite';
        if (settingsUsagePercent) settingsUsagePercent.textContent = 'OWNER';
        if (settingsUsageBar) settingsUsageBar.style.width = '0%';
        if (settingsUsageRemaining) settingsUsageRemaining.textContent = 'Tu cuenta owner tiene acceso total.';
        if (settingsUsageReset) settingsUsageReset.textContent = 'Sin límite';
        if (settingsUsageNote) settingsUsageNote.textContent = 'La protección mensual se aplica a las cuentas de usuarios.';
        meter?.setAttribute('aria-valuenow', '0');
      } else {
        if (settingsUsageTitle) settingsUsageTitle.textContent = hasVoiceLimit ? `${used.toFixed(1)} / ${limit.toFixed(0)} minutos` : `${used.toFixed(1)} minutos usados`;
        if (settingsUsagePercent) settingsUsagePercent.textContent = hasVoiceLimit ? `${voicePercent.toFixed(0)}% usado` : 'Uso activo';
        if (settingsUsageBar) settingsUsageBar.style.width = `${voicePercent}%`;
        if (settingsUsageReset) settingsUsageReset.textContent = `Renueva: ${formatResetDate(quota.resetAt)}`;
        if (settingsUsageRemaining) {
          settingsUsageRemaining.textContent = hasVoiceLimit
            ? quota.exhausted && quota.reason === 'voice_minutes'
              ? 'Has usado todos los minutos incluidos.'
              : `Te quedan ${remaining.toFixed(1)} minutos.`
            : 'Tu plan tiene protección automática de uso.';
        }
        if (settingsUsageNote) {
          if (quota.exhausted) settingsUsageNote.textContent = quota.reason === 'voice_minutes'
            ? 'La voz con IA vuelve a estar disponible cuando renueve tu período.'
            : 'El límite general de IA de tu plan se alcanzó; se restablece al renovar.';
          else if (quota.warning) settingsUsageNote.textContent = `Ya utilizaste al menos ${Number(quota.warningPercent || 80).toFixed(0)}% del límite incluido.`;
          else settingsUsageNote.textContent = 'Incluye traducción de voz y el uso protegido de funciones con IA.';
        }
        meter?.setAttribute('aria-valuenow', String(Math.round(voicePercent)));
      }
    }
  }

  async function loadAiUsage() {
    if (!usageCard && !settingsUsageCard) return;
    try {
      const result = await jsonRequest('/api/account/ai-usage');
      renderAiUsage(result.quota || {});
    } catch (error) {
      if (usageTitle) usageTitle.textContent = 'Uso no disponible';
      if (usageNote) usageNote.textContent = error.message;
      if (settingsUsageTitle) settingsUsageTitle.textContent = 'Uso no disponible';
      if (settingsUsageRemaining) settingsUsageRemaining.textContent = 'No pudimos consultar tus minutos ahora.';
      if (settingsUsageNote) settingsUsageNote.textContent = error.message;
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
  settingsButton?.addEventListener('click', () => { void loadAiUsage(); });
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
