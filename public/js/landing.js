const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let config = null;
let me = null;
let authMode = 'login';

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'No se pudo completar la solicitud.');
  return payload;
}

function setStatus(message = '', type = '') {
  const status = $('#auth-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('is-hidden', !message);
  status.classList.toggle('error', type === 'error');
}

function messageFromQuery() {
  const params = new URLSearchParams(location.search);
  if (params.get('auth') === 'chatgpt-unavailable') return 'Sign in with ChatGPT todavía no está habilitado. Usa tu cuenta de Sin Barreras o Google.';
  if (params.get('auth') === 'google-not-configured') return 'Google todavía no está configurado. Puedes entrar con tu cuenta de Sin Barreras.';
  if (params.get('auth') === 'failed') return 'No fue posible completar el inicio de sesión.';
  if (params.get('pay') === 'required') return 'Tu cuenta está lista. Activa el plan para entrar.';
  if (params.get('billing') === 'cancelled') return 'El pago fue cancelado. No se hizo ningún cargo nuevo.';
  if (params.get('billing') === 'pending') return 'Estamos confirmando tu suscripción. Intenta abrir la app nuevamente en unos segundos.';
  if (params.get('session') === 'expired') return 'Tu sesión expiró. Inicia sesión nuevamente.';
  if (params.get('email') === 'verified') return 'Email verificado correctamente. Ya puedes iniciar sesión.';
  if (params.get('email') === 'invalid') return 'El enlace de verificación no es válido o ya venció. Solicita uno nuevo.';
  if (params.get('account') === 'deleted') return 'Tu cuenta y sus datos fueron eliminados.';
  if (params.get('password') === 'reset') return 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.';
  return '';
}

function setAuthMode(mode) {
  authMode = ['login', 'register', 'forgot'].includes(mode) ? mode : 'login';
  $('#login-form')?.classList.toggle('is-hidden', authMode !== 'login');
  $('#register-form')?.classList.toggle('is-hidden', authMode !== 'register');
  $('#forgot-form')?.classList.toggle('is-hidden', authMode !== 'forgot');
  $('#login-tab')?.classList.toggle('is-active', authMode === 'login');
  $('#register-tab')?.classList.toggle('is-active', authMode === 'register');
  const title = $('#auth-title');
  const copy = $('#auth-copy');
  if (title) title.textContent = authMode === 'login' ? 'Entra a tu cuenta.' : authMode === 'register' ? 'Crea tu cuenta de Sin Barreras.' : 'Recupera tu contraseña.';
  if (copy) copy.textContent = authMode === 'login'
    ? 'Tu cuenta de Sin Barreras es el acceso principal. Google es opcional.'
    : authMode === 'register'
      ? 'Crea una cuenta personal. Te enviaremos un enlace para verificar tu email antes de iniciar sesión.'
      : 'Escribe el email de tu cuenta local y te enviaremos un enlace de un solo uso.';
  setStatus(messageFromQuery());
}

function openAuth(mode = 'login') {
  setAuthMode(mode);
  renderAuth();
  $('#auth-dialog')?.showModal();
}

function renderAuth() {
  const localAuth = $('#local-auth');
  const socialBlock = $('#social-auth-block');
  const providers = $('#provider-actions');
  const member = $('#member-actions');
  const google = $('#google-login');
  const chatgpt = $('#chatgpt-login');
  const message = messageFromQuery();
  if (message) setStatus(message);

  const nativeAndroid = Boolean(window.SinBarrerasPlay?.isNativeAndroid);
  google?.classList.toggle('is-hidden', nativeAndroid || !config?.googleLoginEnabled);
  chatgpt?.classList.toggle('is-hidden', nativeAndroid || !config?.chatgptLoginEnabled);
  socialBlock?.classList.toggle('is-hidden', nativeAndroid || (!config?.googleLoginEnabled && !config?.chatgptLoginEnabled));

  if (!me?.authenticated) {
    localAuth?.classList.remove('is-hidden');
    providers?.classList.remove('is-hidden');
    member?.classList.add('is-hidden');
    return;
  }

  localAuth?.classList.add('is-hidden');
  socialBlock?.classList.add('is-hidden');
  providers?.classList.add('is-hidden');
  member?.classList.remove('is-hidden');
  const user = me.user;
  $('#member-name').textContent = user.name || (user.role === 'owner' ? 'Owner' : 'Usuario');
  $('#member-email').textContent = user.email || '';
  const avatar = $('#member-avatar');
  if (avatar) avatar.innerHTML = user.avatarUrl ? `<img src="${user.avatarUrl.replace(/"/g,'&quot;')}" alt="" referrerpolicy="no-referrer">` : (user.name || user.email || 'SB').slice(0,2).toUpperCase();

  const openButton = $('#open-app');
  if (openButton) {
    openButton.classList.toggle('is-hidden', !user.hasAccess);
    openButton.innerHTML = user.role === 'owner' ? 'ABRIR ADMIN DASHBOARD <span>→</span>' : 'ABRIR SIN BARRERAS <span>→</span>';
  }
  $('#subscribe-button')?.classList.toggle('is-hidden', user.hasAccess || user.role === 'owner');

  if (user.role === 'owner') setStatus('OWNER · Acceso total incluido. Esta cuenta nunca necesita pagar una suscripción.');
  else if (user.freeAccess) setStatus('Tu email tiene acceso gratuito otorgado por el owner. No necesitas pagar.');
}

async function submitAccountForm(endpoint, payload, submitButton) {
  try {
    setStatus('');
    submitButton.disabled = true;
    const original = submitButton.innerHTML;
    submitButton.textContent = 'PROCESANDO…';
    const result = await jsonRequest(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (result.redirect) return location.assign(result.redirect);
    if (result.verificationRequired) {
      const registeredEmail = $('#register-email')?.value || '';
      setAuthMode('login');
      if ($('#login-email')) $('#login-email').value = registeredEmail;
      setStatus(result.message || 'Revisa tu email para verificar la cuenta.');
      submitButton.innerHTML = original;
      return;
    }
    me = { authenticated: true, user: result.user };
    renderAuth();
    submitButton.innerHTML = original;
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
}


function renderGooglePlayOffer(offer = null) {
  if (!window.SinBarrerasPlay?.isNativeAndroid) return;
  const configuredDays = Math.max(0, Number(config?.googlePlayTrialDays || 7));
  const hasFreeTrial = Boolean(offer?.hasFreeTrial);
  const days = Number(offer?.freeTrialDays || configuredDays || 7);
  const displayPrice = String(offer?.formattedPrice || '').trim();
  const currency = String(config?.currency || 'USD');
  const fallbackPrice = `${currency} ${Number(config?.price || 5.99).toFixed(2)}`;
  const priceText = displayPrice || fallbackPrice;

  $('#hero-trial-note')?.classList.toggle('is-hidden', !hasFreeTrial);
  $('#play-trial-badge')?.classList.toggle('is-hidden', !hasFreeTrial);
  $('#pricing-renewal-note')?.classList.toggle('is-hidden', !hasFreeTrial);
  $('#member-trial-note')?.classList.toggle('is-hidden', !hasFreeTrial);

  if ($('#hero-plan-note')) $('#hero-plan-note').textContent = hasFreeTrial
    ? `${days} días gratis · luego ${priceText}/mes · cancela cuando quieras`
    : `${priceText}/mes · cancela cuando quieras`;
  if ($('#hero-trial-note') && hasFreeTrial) $('#hero-trial-note').textContent = `${days} días gratis para nuevos suscriptores elegibles en Google Play.`;
  if ($('#play-trial-badge') && hasFreeTrial) $('#play-trial-badge').innerHTML = `<strong>${days} DÍAS GRATIS</strong><span>para nuevos suscriptores elegibles en Google Play</span>`;
  if ($('#pricing-price') && displayPrice) $('#pricing-price').innerHTML = `<strong>${displayPrice}</strong><small>/ mes después de la prueba</small>`;
  const button = $('#subscribe-button');
  if (button && !me?.user?.hasAccess) button.innerHTML = hasFreeTrial
    ? `COMENZAR ${days} DÍAS GRATIS <span>→</span>`
    : `SUSCRIBIRME POR ${priceText}/MES <span>→</span>`;
  const pricingButton = $('#pricing-login');
  if (pricingButton && !me?.user?.hasAccess && hasFreeTrial) pricingButton.innerHTML = `CREAR CUENTA · ${days} DÍAS GRATIS <span>→</span>`;
  if ($('#pricing-payment-note')) $('#pricing-payment-note').textContent = 'Pago y renovación administrados por Google Play.';
}

async function subscribe() {
  const button = $('#subscribe-button');
  try {
    button.disabled = true;
    if (window.SinBarrerasPlay?.isNativeAndroid) {
      button.textContent = 'ABRIENDO GOOGLE PLAY…';
      window.SinBarrerasPlay.subscribe(me?.user?.id || '');
      return;
    }
    button.textContent = 'PREPARANDO PAGO…';
    const result = await jsonRequest('/billing/checkout', { method: 'POST' });
    window.location.assign(result.url);
  } catch (error) {
    setStatus(error.message, 'error');
    button.disabled = false;
    button.innerHTML = `SUSCRIBIRME POR ${config?.currency || 'USD'} ${Number(config?.price || 5.99).toFixed(2)}/MES <span>→</span>`;
  }
}

async function init() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {});
  [config, me] = await Promise.all([
    jsonRequest('/api/public/config').catch(() => ({})),
    jsonRequest('/api/auth/me').catch(() => ({ authenticated:false }))
  ]);
  const price = Number(config?.price || 5.99);
  const currency = String(config?.currency || 'USD');
  if ($('#hero-plan-price')) $('#hero-plan-price').textContent = `${currency} ${price.toFixed(2)}`;
  if ($('#pricing-price')) $('#pricing-price').innerHTML = `<sup>${currency === 'USD' ? '$' : ''}</sup><strong>${price.toFixed(2)}</strong><small>/ mes</small>`;
  if ($('#subscribe-button')) $('#subscribe-button').innerHTML = `SUSCRIBIRME POR ${currency} ${price.toFixed(2)}/MES <span>→</span>`;
  if (window.SinBarrerasPlay?.isNativeAndroid) {
    if ($('#pricing-payment-note')) $('#pricing-payment-note').textContent = 'Pago y renovación administrados por Google Play.';
    renderGooglePlayOffer(window.SinBarrerasPlay?.offer || null);
    window.SinBarrerasPlay?.refreshOffer?.();
  }
  if (me?.user?.hasAccess) {
    ['#hero-login','#pricing-login','#nav-login'].forEach((selector) => {
      const el = $(selector);
      if (el) el.textContent = me.user.role === 'owner' ? 'Admin Dashboard' : 'Abrir app';
    });
  }
  if (new URLSearchParams(location.search).toString()) openAuth('login');
}

$('#nav-login')?.addEventListener('click', () => {
  if (me?.user?.hasAccess) location.assign(me.user.role === 'owner' ? '/admin' : '/app');
  else openAuth('login');
});
$('#hero-login')?.addEventListener('click', () => {
  if (me?.user?.hasAccess) location.assign(me.user.role === 'owner' ? '/admin' : '/app');
  else openAuth('register');
});
$('#pricing-login')?.addEventListener('click', () => {
  if (me?.user?.hasAccess) location.assign(me.user.role === 'owner' ? '/admin' : '/app');
  else openAuth('register');
});

$$('[data-auth-mode]').forEach((button) => button.addEventListener('click', () => setAuthMode(button.dataset.authMode)));
$$('[data-close]').forEach((button) => button.addEventListener('click', () => document.getElementById(button.dataset.close)?.close()));

$('#login-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  await submitAccountForm('/auth/login', { email: $('#login-email').value, password: $('#login-password').value }, button);
});

$('#register-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  const accepted = Boolean($('#register-terms')?.checked);
  if (!accepted) { setStatus('Debes confirmar que tienes 18 años o más y aceptar los Términos y la Política de Privacidad.', 'error'); return; }
  await submitAccountForm('/auth/register', { name: $('#register-name').value, email: $('#register-email').value, password: $('#register-password').value, termsAccepted: accepted, ageConfirmed: accepted }, button);
});

$('#forgot-password-link')?.addEventListener('click', () => {
  if ($('#forgot-email')) $('#forgot-email').value = $('#login-email')?.value || '';
  setAuthMode('forgot');
});
$('#back-to-login')?.addEventListener('click', () => setAuthMode('login'));
$('#forgot-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  try {
    button.disabled = true;
    const result = await jsonRequest('/auth/forgot-password', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email: $('#forgot-email').value }) });
    setStatus(result.message);
  } catch (error) { setStatus(error.message, 'error'); }
  finally { button.disabled = false; }
});
$('#resend-verification')?.addEventListener('click', async () => {
  const email = $('#login-email')?.value?.trim();
  if (!email) return setStatus('Escribe primero el email de tu cuenta.', 'error');
  try {
    const result = await jsonRequest('/auth/resend-verification', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email }) });
    setStatus(result.message);
  } catch (error) { setStatus(error.message, 'error'); }
});

$('#subscribe-button')?.addEventListener('click', subscribe);
$('#open-app')?.addEventListener('click', () => window.location.assign(me?.user?.role === 'owner' ? '/admin' : '/app'));
$('#landing-logout')?.addEventListener('click', async () => { await jsonRequest('/auth/logout',{method:'POST'}).catch(()=>{}); location.assign('/'); });
window.addEventListener('sinbarreras:billing-success', () => { setStatus('Suscripción de Google Play confirmada. Abriendo Sin Barreras…'); setTimeout(() => location.assign('/app?welcome=1'), 350); });
window.addEventListener('sinbarreras:billing-error', (event) => { const button=$('#subscribe-button'); if(button) button.disabled=false; if(window.SinBarrerasPlay?.isNativeAndroid) renderGooglePlayOffer(window.SinBarrerasPlay?.offer || null); else if(button) button.innerHTML=`SUSCRIBIRME POR ${config?.currency || 'USD'} ${Number(config?.price || 5.99).toFixed(2)}/MES <span>→</span>`; setStatus(event.detail?.message || 'No se pudo completar el pago.', 'error'); });
window.addEventListener('sinbarreras:billing-offer', (event) => renderGooglePlayOffer(event.detail || null));

init();
