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
  if (params.get('pay') === 'required') return 'Tu cuenta está lista. Activa el plan de $5.99/mes para entrar.';
  if (params.get('billing') === 'cancelled') return 'El pago fue cancelado. No se hizo ningún cargo nuevo.';
  if (params.get('billing') === 'pending') return 'Estamos confirmando tu suscripción. Intenta abrir la app nuevamente en unos segundos.';
  if (params.get('session') === 'expired') return 'Tu sesión expiró. Inicia sesión nuevamente.';
  return '';
}

function setAuthMode(mode) {
  authMode = mode === 'register' ? 'register' : 'login';
  $('#login-form')?.classList.toggle('is-hidden', authMode !== 'login');
  $('#register-form')?.classList.toggle('is-hidden', authMode !== 'register');
  $('#login-tab')?.classList.toggle('is-active', authMode === 'login');
  $('#register-tab')?.classList.toggle('is-active', authMode === 'register');
  const title = $('#auth-title');
  const copy = $('#auth-copy');
  if (title) title.textContent = authMode === 'login' ? 'Entra a tu cuenta.' : 'Crea tu cuenta de Sin Barreras.';
  if (copy) copy.textContent = authMode === 'login'
    ? 'Tu cuenta de Sin Barreras es el acceso principal. Google es opcional.'
    : 'Crea una cuenta personal. Después podrás activar el plan de $5.99/mes o usar un acceso gratuito asignado a tu email.';
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

  google?.classList.toggle('is-hidden', !config?.googleLoginEnabled);
  chatgpt?.classList.toggle('is-hidden', !config?.chatgptLoginEnabled);
  socialBlock?.classList.toggle('is-hidden', !config?.googleLoginEnabled && !config?.chatgptLoginEnabled);

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
    me = { authenticated: true, user: result.user };
    renderAuth();
    submitButton.innerHTML = original;
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
}

async function subscribe() {
  const button = $('#subscribe-button');
  try {
    button.disabled = true;
    button.textContent = 'PREPARANDO PAGO…';
    const result = await jsonRequest('/billing/checkout', { method: 'POST' });
    window.location.assign(result.url);
  } catch (error) {
    setStatus(error.message, 'error');
    button.disabled = false;
    button.innerHTML = 'SUSCRIBIRME POR $5.99/MES <span>→</span>';
  }
}

async function init() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {});
  [config, me] = await Promise.all([
    jsonRequest('/api/public/config').catch(() => ({})),
    jsonRequest('/api/auth/me').catch(() => ({ authenticated:false }))
  ]);
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
  await submitAccountForm('/auth/register', { name: $('#register-name').value, email: $('#register-email').value, password: $('#register-password').value }, button);
});

$('#subscribe-button')?.addEventListener('click', subscribe);
$('#open-app')?.addEventListener('click', () => window.location.assign(me?.user?.role === 'owner' ? '/admin' : '/app'));
$('#landing-logout')?.addEventListener('click', async () => { await jsonRequest('/auth/logout',{method:'POST'}).catch(()=>{}); location.assign('/'); });

init();
