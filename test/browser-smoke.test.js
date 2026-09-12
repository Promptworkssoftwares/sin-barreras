import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const appHtml = fs.readFileSync(new URL('../private/app.html', import.meta.url), 'utf8');
const landingHtml = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const adminHtml = fs.readFileSync(new URL('../private/admin.html', import.meta.url), 'utf8');
const javascript = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const learnJavascript = fs.readFileSync(new URL('../public/learn.js', import.meta.url), 'utf8');

const syntaxFiles = [
  'public/app.js', 'public/languages.js', 'public/learn.js', 'public/cloud.js', 'public/account-ui.js', 'public/app-bootstrap.js',
  'public/js/landing.js', 'public/js/admin.js', 'server/server.js', 'config/db.js', 'config/passport.js',
  'middleware/auth.js', 'models/User.js', 'models/AccessGrant.js', 'models/UserState.js',
  'routes/authRoutes.js', 'routes/accountRoutes.js', 'routes/billingRoutes.js', 'routes/adminRoutes.js',
  'services/accessService.js', 'services/stripeService.js', 'scripts/seed-owner.js', 'server/bootstrap.js', 'config/env.js', 'scripts/check-env.js', 'scripts/check-mongodb.js'
];

test('all production JavaScript passes Node syntax validation', () => {
  for (const file of syntaxFiles) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    assert.equal(result.status, 0, `${file} syntax error: ${result.stderr}`);
  }
});

test('all five primary app views are still wired', () => {
  for (const view of ['conversation', 'learn', 'practice', 'coach', 'camera']) assert.match(appHtml, new RegExp(`data-view=["']${view}["']`));
  assert.match(javascript, /function showView\(view\)/);
});

test('account controls are present inside the protected app', () => {
  for (const id of ['account-button', 'account-dialog', 'account-name', 'account-email', 'manage-subscription', 'account-logout']) {
    assert.match(appHtml, new RegExp(`id=["']${id}["']`));
  }
});

test('admin dashboard has real data containers instead of hard-coded fake rows', () => {
  for (const id of ['stat-users', 'stat-paid', 'stat-free', 'stat-mrr', 'users-table', 'grants-grid', 'subscriptions-table']) {
    assert.match(adminHtml, new RegExp(`id=["']${id}["']`));
  }
  assert.doesNotMatch(adminHtml, /John Doe|Jane Doe|example subscriber/i);
});

test('landing and app are separate documents', () => {
  assert.match(landingHtml, /PLAN SIN BARRERAS/);
  assert.match(appHtml, /SIN BARRERAS · APRENDER/);
  assert.doesNotMatch(landingHtml, /id="lesson-player"/);
});

test('conversation safety guards remain intact', () => {
  assert.match(javascript, /conversationSession/);
  assert.match(javascript, /AbortController/);
  assert.match(javascript, /conversationController\?\.abort\(\)/);
  assert.match(javascript, /sessionId !== state\.conversationSession/);
});

test('adaptive learning retries missed words later in the session', () => {
  assert.match(learnJavascript, /session\.exercises\.splice\(retryAt, 0, retry\)/);
  assert.match(learnJavascript, /nextReviewAt/);
});
