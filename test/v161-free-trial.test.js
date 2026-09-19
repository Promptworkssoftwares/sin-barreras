import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const activity = read('android/app/src/main/java/com/promptworks/sinbarreras/MainActivity.java');
const gradle = read('android/app/build.gradle');
const playBridge = read('public/play-billing.js');
const playService = read('services/googlePlayService.js');
const landing = read('public/index.html');
const landingJs = read('public/js/landing.js');
const adminRoutes = read('routes/adminRoutes.js');

test('Google Play free trial is configured as a 7-day eligible offer', () => {
  assert.match(gradle, /PLAY_TRIAL_OFFER_TAG.*sb-7-day-trial/);
  assert.match(activity, /P7D/);
  assert.match(activity, /getPriceAmountMicros\(\) == 0L/);
  assert.match(activity, /getOfferTags\(\)/);
  assert.match(activity, /selectPreferredOffer/);
});

test('Android prefers an eligible 7-day trial and falls back to the regular base plan', () => {
  const taggedTrial = activity.indexOf('sevenDayTrial && preferredTag');
  const anyTrial = activity.indexOf('anySevenDayTrial != null');
  const basePlan = activity.indexOf('regularBasePlan != null');
  assert.ok(taggedTrial >= 0 && anyTrial > taggedTrial && basePlan > anyTrial);
});

test('Google Play backend identifies the free-trial phase from SubscriptionPurchaseV2', () => {
  assert.match(playService, /offerPhase/);
  assert.match(playService, /freeTrial/);
  assert.match(playService, /isFreeTrial \? 'trialing' : 'active'/);
});

test('trial disclosure is visible only when Google Play reports trial eligibility', () => {
  assert.match(landing, /play-trial-badge/);
  assert.match(landing, /7 DÍAS GRATIS/);
  assert.match(landingJs, /hasFreeTrial/);
  assert.match(landingJs, /COMENZAR \$\{days\} DÍAS GRATIS/);
  assert.match(playBridge, /sinbarreras:billing-offer/);
});

test('admin MRR excludes free-trial users from realized recurring revenue', () => {
  assert.match(adminRoutes, /trialUsers = paidUsers\.filter/);
  assert.match(adminRoutes, /billedUsers = paidUsers\.filter/);
  assert.match(adminRoutes, /subscriptionStatus === 'active'/);
  assert.match(adminRoutes, /MRR excluye pruebas gratis/);
});

test('release ships exact Google Play subscription setup instructions and AAB helpers', () => {
  assert.ok(fs.existsSync(new URL('../GOOGLE_PLAY_SUBSCRIPTION_SETUP.md', import.meta.url)));
  assert.ok(fs.existsSync(new URL('../android/create-upload-key.bat', import.meta.url)));
  assert.ok(fs.existsSync(new URL('../android/check-aab-ready.bat', import.meta.url)));
  assert.match(read('.env.example'), /GOOGLE_PLAY_FREE_TRIAL_DAYS=7/);
  assert.match(read('.env.example'), /GOOGLE_PLAY_TRIAL_OFFER_TAG=sb-7-day-trial/);
});
