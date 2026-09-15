const $ = (selector) => document.querySelector(selector);
const status = $('#delete-status');
const loginForm = $('#deletion-login-form');
const deleteForm = $('#delete-account-form');
let me = null;

function setStatus(message = '', error = false) {
  status.textContent = message;
  status.classList.toggle('is-hidden', !message);
  status.classList.toggle('error', error);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'No se pudo completar la solicitud.');
  return payload;
}

function render() {
  const authenticated = Boolean(me?.authenticated && me?.user);
  loginForm.classList.toggle('is-hidden', authenticated);
  deleteForm.classList.toggle('is-hidden', !authenticated);
  if (authenticated) {
    $('#delete-account-email').textContent = me.user.email;
    if (me.user.role === 'owner') {
      setStatus('La cuenta owner no puede eliminarse desde este formulario.', true);
      deleteForm.querySelector('button').disabled = true;
    }
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector('button[type="submit"]');
  try {
    button.disabled = true;
    const result = await requestJson('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: $('#deletion-email').value, password: $('#deletion-password').value, next: '/account-deletion' })
    });
    me = { authenticated: true, user: result.user };
    setStatus('Sesión confirmada. Revisa la información y confirma la eliminación.');
    render();
  } catch (error) { setStatus(error.message, true); }
  finally { button.disabled = false; }
});

deleteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = deleteForm.querySelector('button[type="submit"]');
  if ($('#delete-confirmation').value.trim().toUpperCase() !== 'ELIMINAR') return setStatus('Escribe ELIMINAR para confirmar.', true);
  try {
    button.disabled = true;
    await requestJson('/api/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation: 'ELIMINAR', currentPassword: $('#delete-current-password').value })
    });
    localStorage.clear();
    location.assign('/?account=deleted');
  } catch (error) {
    setStatus(error.message, true);
    button.disabled = false;
  }
});

me = await requestJson('/api/auth/me').catch(() => ({ authenticated: false }));
render();
