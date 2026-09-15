const $ = (selector) => document.querySelector(selector);
const status = $('#reset-status');
const form = $('#reset-password-form');
const token = new URLSearchParams(location.search).get('token') || '';

function setStatus(message, error = false) {
  status.textContent = message;
  status.classList.remove('is-hidden');
  status.classList.toggle('error', error);
}

if (!token) {
  setStatus('Este enlace no contiene un token válido. Solicita un nuevo enlace desde Iniciar sesión.', true);
  form.querySelector('button').disabled = true;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = $('#new-password').value;
  const confirmation = $('#confirm-password').value;
  const button = form.querySelector('button[type="submit"]');
  if (password !== confirmation) return setStatus('Las contraseñas no coinciden.', true);
  try {
    button.disabled = true;
    const response = await fetch('/auth/reset-password', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'No se pudo actualizar la contraseña.');
    setStatus(payload.message || 'Contraseña actualizada.');
    form.reset();
    setTimeout(() => location.assign('/?password=reset'), 900);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    button.disabled = false;
  }
});
