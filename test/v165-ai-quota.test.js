import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

const quotaService = read('services/aiQuotaService.js');
const server = read('server/server.js');
const accountRoutes = read('routes/accountRoutes.js');
const adminRoutes = read('routes/adminRoutes.js');
const appHtml = read('private/app.html');
const accountUi = read('public/account-ui.js');
const appJs = read('public/app.js');
const adminHtml = read('private/admin.html');
const adminJs = read('public/js/admin.js');
const landing = read('public/index.html');
const landingJs = read('public/js/landing.js');
const terms = read('public/terms.html');
const env = read('.env.example');
const render = read('render.yaml');


test('v1.6.6 enforces configurable per-user voice minutes and internal AI budget', () => {
  assert.match(quotaService, /AI_USER_MONTHLY_MINUTES_LIMIT/);
  assert.match(quotaService, /AI_USER_MONTHLY_BUDGET_USD/);
  assert.match(quotaService, /AI_USER_WARNING_PERCENT/);
  assert.match(quotaService, /transcriptionSeconds/);
  assert.match(quotaService, /estimatedCostMicros/);
  assert.match(quotaService, /AI_MONTHLY_LIMIT_REACHED/);
  assert.match(quotaService, /user\?\.role === 'owner'/);
  assert.match(env, /AI_USER_MONTHLY_MINUTES_LIMIT=150/);
  assert.match(env, /AI_USER_MONTHLY_BUDGET_USD=3\.00/);
  assert.match(render, /key: AI_USER_MONTHLY_MINUTES_LIMIT[\s\S]*value: "150"/);
});

test('authenticated AI endpoints and QR guest turns cannot bypass the quota', () => {
  assert.match(server, /app\.use\('\/api', requireAccess, aiUsageContextMiddleware, aiQuotaMiddleware\)/);
  assert.match(server, /await assertAiQuotaAvailable\(host\)/);
  assert.match(server, /AI_MONTHLY_LIMIT_REACHED/);
  assert.match(appJs, /error\.code === 'AI_MONTHLY_LIMIT_REACHED'/);
  assert.match(appJs, /state\.running = false/);
});

test('users can see their current usage and reset date in Mi Cuenta', () => {
  assert.match(accountRoutes, /router\.get\('\/account\/ai-usage', requireAuth/);
  assert.match(accountRoutes, /publicAiQuota/);
  for (const id of ['account-ai-usage','account-ai-usage-title','account-ai-usage-percent','account-ai-usage-bar','account-ai-voice','account-ai-reset','account-ai-usage-note']) {
    assert.match(appHtml, new RegExp(`id="${id}"`));
  }
  assert.match(accountUi, /\/api\/account\/ai-usage/);
  assert.match(accountUi, /voiceMinutesRemaining/);
  assert.match(accountUi, /sinbarreras:ai-quota/);
});

test('owner dashboard exposes per-user quota health without fake data', () => {
  assert.match(adminRoutes, /router\.get\('\/usage\/users'/);
  assert.match(adminRoutes, /getAiQuotaStatus/);
  assert.match(adminHtml, /id="quota-users-table"/);
  assert.match(adminHtml, /id="quota-warning-users"/);
  assert.match(adminHtml, /id="quota-exhausted-users"/);
  assert.match(adminJs, /\/api\/admin\/usage\/users\?limit=100/);
  assert.match(adminJs, /estimatedCostUsd/);
});

test('subscription surfaces disclose the voice-minute limit before purchase', () => {
  assert.match(landing, /pricing-usage-limit/);
  assert.match(landing, /150 minutos de voz/);
  assert.match(landingJs, /aiMonthlyMinutesLimit/);
  assert.match(terms, /límites de uso/i);
  assert.match(terms, /límite de minutos de voz por período/i);
});
