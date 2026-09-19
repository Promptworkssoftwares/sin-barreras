import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const gradle = read('android/app/build.gradle');
const manifest = read('android/app/src/main/AndroidManifest.xml');
const activity = read('android/app/src/main/java/com/promptworks/sinbarreras/MainActivity.java');
const playBridge = read('public/play-billing.js');
const playService = read('services/googlePlayService.js');
const userModel = read('models/User.js');
const billingRoutes = read('routes/billingRoutes.js');


test('Android release targets the current Google Play API requirement', () => {
  assert.match(gradle, /compileSdk = 36/);
  assert.match(gradle, /targetSdk = 36/);
  assert.match(gradle, /applicationId = 'com\.promptworks\.sinbarreras'/);
  assert.match(gradle, /versionName = '1.6.1'/);
  assert.match(gradle, /versionCode = 1601/);
});

test('Android uses Google Play Billing 9.1.0 and the configured subscription product', () => {
  assert.match(gradle, /com\.android\.billingclient:billing:9\.1\.0/);
  assert.match(gradle, /PLAY_SUBSCRIPTION_PRODUCT_ID.*sin_barreras_monthly/);
  assert.match(activity, /BillingClient\.newBuilder/);
  assert.match(activity, /enableAutoServiceReconnection/);
  assert.match(activity, /queryProductDetailsAsync/);
  assert.match(activity, /queryPurchasesAsync/);
});

test('purchase verification happens server-side before native acknowledgement', () => {
  assert.match(playBridge, /verifyPurchase\(payload/);
  const verifyIndex = playBridge.indexOf('await verifyPurchase(payload');
  const ackIndex = playBridge.indexOf('acknowledgePurchase(payload.purchaseToken)');
  assert.ok(verifyIndex >= 0 && ackIndex > verifyIndex);
  assert.match(playService, /purchases\/subscriptionsv2\/tokens/);
  assert.match(billingRoutes, /syncGooglePlaySubscriptionForUser/);
});

test('Google Play purchases are bound to one Sin Barreras account', () => {
  assert.match(activity, /setObfuscatedAccountId/);
  assert.match(activity, /SHA-256/);
  assert.match(playService, /obfuscatedExternalAccountId/);
  assert.match(playService, /googlePlayPurchaseToken: verification\.purchaseToken/);
  assert.match(userModel, /googlePlayPurchaseToken: \{ type: String, trim: true, index: true, unique: true, sparse: true \}/);
});

test('Google Play entitlement is time-bounded in the user model', () => {
  assert.match(userModel, /billingProvider === 'google_play'/);
  assert.match(userModel, /expiry > Date\.now\(\)/);
  assert.match(playService, /SUBSCRIPTION_STATE_IN_GRACE_PERIOD/);
  assert.match(playService, /SUBSCRIPTION_STATE_CANCELED/);
});

test('WebView only keeps Sin Barreras on the trusted in-app origin and blocks cleartext traffic', () => {
  assert.match(gradle, /WEB_APP_HOST.*sin-barreras\.onrender\.com/);
  assert.match(activity, /TRUSTED_HOST\.equalsIgnoreCase\(host\)/);
  assert.match(activity, /ACTION_VIEW/);
  assert.match(manifest, /android:usesCleartextTraffic="false"/);
  assert.match(manifest, /android:networkSecurityConfig="@xml\/network_security_config"/);
});

test('microphone and camera are declared and runtime-gated', () => {
  assert.match(manifest, /android\.permission\.RECORD_AUDIO/);
  assert.match(manifest, /android\.permission\.CAMERA/);
  assert.match(activity, /RESOURCE_AUDIO_CAPTURE/);
  assert.match(activity, /RESOURCE_VIDEO_CAPTURE/);
  assert.match(activity, /requestPermissions/);
});
