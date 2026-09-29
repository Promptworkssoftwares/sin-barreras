import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('owner free access creates a real account with a temporary password that must be changed', () => {
  const admin = read('routes/adminRoutes.js');
  const user = read('models/User.js');
  const account = read('routes/accountRoutes.js');
  const middleware = read('middleware/auth.js');
  assert.match(admin, /temporaryPassword/);
  assert.match(admin, /bcrypt\.hash\(temporaryPassword, 12\)/);
  assert.match(admin, /mustChangePassword = true/);
  assert.match(user, /mustChangePassword/);
  assert.match(account, /router\.post\('\/account\/temporary-password'/);
  assert.match(middleware, /PASSWORD_CHANGE_REQUIRED/);
  assert.match(read('public/change-password.html'), /Crea tu contraseña personal/i);
});

test('Google OAuth production callback can never silently fall back to localhost', () => {
  const passport = read('config/passport.js');
  const render = read('render.yaml');
  assert.match(passport, /resolveGoogleCallbackUrl/);
  assert.match(passport, /Google OAuth requiere GOOGLE_CALLBACK_URL o APP_URL/);
  assert.match(render, /GOOGLE_CALLBACK_URL[\s\S]*https:\/\/sin-barreras\.onrender\.com\/auth\/google\/callback/);
  assert.match(render, /APP_URL[\s\S]*https:\/\/sin-barreras\.onrender\.com/);
});

test('temporary-password page is never cached as public app content', () => {
  const sw = read('public/sw.js');
  assert.match(sw, /change-password/);
});
