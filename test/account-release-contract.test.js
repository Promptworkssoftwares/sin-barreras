import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

const authRoutes = read('routes/authRoutes.js');
const accountRoutes = read('routes/accountRoutes.js');
const tokenModel = read('models/AccountToken.js');
const tokenService = read('services/accountTokenService.js');
const usageModel = read('models/AiUsageDaily.js');
const usageService = read('services/aiUsageService.js');
const adminRoutes = read('routes/adminRoutes.js');
const server = read('server/server.js');
const sw = read('public/sw.js');
const packageRelease = read('scripts/package-release.js');
const packageJson = JSON.parse(read('package.json'));
const deletionPage = read('public/account-deletion.html');
const deletionJs = read('public/js/account-deletion.js');
const resetPage = read('public/reset-password.html');


test('local registrations require email verification before access is granted', () => {
  assert.match(authRoutes, /emailVerificationRequired:\s*true/);
  assert.match(authRoutes, /createAccountToken\(user, 'verify_email'/);
  assert.match(authRoutes, /sendVerificationEmail/);
  assert.match(authRoutes, /router\.get\('\/verify-email'/);
  assert.match(authRoutes, /applyFreeGrant\(user\)/);
  assert.match(tokenModel, /verify_email/);
  assert.match(tokenService, /createHash\('sha256'\)/);
  assert.match(tokenModel, /expireAfterSeconds:\s*0/);
});

test('forgot password uses expiring one-time tokens and a public reset page', () => {
  assert.match(authRoutes, /router\.post\('\/forgot-password'/);
  assert.match(authRoutes, /createAccountToken\(user, 'reset_password'/);
  assert.match(authRoutes, /router\.post\('\/reset-password'/);
  assert.match(authRoutes, /consumeAccountToken\(token, 'reset_password'\)/);
  assert.match(resetPage, /Nueva contraseña/i);
});

test('users can delete their own account without an active paid entitlement', () => {
  assert.match(accountRoutes, /router\.delete\('\/account', requireAuth/);
  assert.match(accountRoutes, /confirmation !== 'ELIMINAR'/);
  assert.match(deletionPage, /Eliminar mi cuenta/i);
  assert.match(deletionJs, /requestJson\('\/api\/account'/);
});

test('AI usage is persisted per user and exposed to the owner dashboard', () => {
  assert.match(usageModel, /estimatedCostMicros/);
  assert.match(usageModel, /monthKey/);
  assert.match(usageService, /recordChatUsage/);
  assert.match(usageService, /recordTranscriptionUsage/);
  assert.match(usageService, /recordTtsUsage/);
  assert.match(adminRoutes, /router\.get\('\/usage'/);
  assert.match(adminRoutes, /getCurrentMonthAiCostUsd/);
});

test('production CSP is enabled and blocks inline script attributes and framing', () => {
  assert.match(server, /contentSecurityPolicy:\s*\{/);
  assert.match(server, /scriptSrcAttr:\s*\["'none'"\]/);
  assert.match(server, /frameAncestors:\s*\["'none'"\]/);
  assert.doesNotMatch(server, /contentSecurityPolicy:\s*false/);
});

test('sensitive account pages are never cached by the service worker', () => {
  assert.match(sw, /'\/reset-password'/);
  assert.match(sw, /'\/account-deletion'/);
});

test('release packaging excludes secrets, dependencies, and signing material', () => {
  assert.equal(packageJson.scripts['package:release'], 'npm test && node scripts/package-release.js');
  assert.match(packageRelease, /'\.env'/);
  assert.match(packageRelease, /'node_modules'/);
  assert.match(packageRelease, /'keystore\.properties'/);
  assert.match(packageRelease, /jks\|keystore/);
});
