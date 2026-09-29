const $ = (selector) => document.querySelector(selector);

async function requestJson(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'No se pudo completar la solicitud.');
  return payload;
}

function status(message = '', error = false) {
  const node = $('#temporary-password-status');
  node.textContent = message;
  node.classList.toggle('is-hidden', !message);
  node.classList.toggle('error', error);
}

async function init() {
  const me = await requestJson('/api/auth/me').catch(() => ({ authenticated: false }));
  if (!me.authenticated) return location.assign('/?login=required');
  if (!me.user?.mustChangePassword) return location.assign(me.user?.role === 'owner' ? '/admin' : (me.user?.hasAccess ? '/app' : '/?pay=required'));
}

$('#temporary-password-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = $('#new-password').value;
  const confirmation = $('#confirm-password').value;
  const accepted = Boolean($('#temporary-terms').checked);
  if (password !== confirmation) return status('Las contraseñas no coinciden.', true);
  if (!accepted) return status('Debes aceptar los Términos y la Política de Privacidad.', true);
  const button = $('#temporary-password-submit');
  button.disabled = true;
  status('');
  try {
    const result = await requestJson('/api/account/temporary-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, confirmation, termsAccepted: true, ageConfirmed: true })
    });
    location.assign(result.redirect || '/app');
  } catch (error) {
    status(error.message, true);
    button.disabled = false;
  }
});

$('#temporary-password-logout')?.addEventListener('click', async () => {
  await requestJson('/auth/logout', { method: 'POST' }).catch(() => {});
  location.assign('/');
});

init();
