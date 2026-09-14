import crypto from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ANDROID_PUBLISHER_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

let cachedToken = null;
let tokenExpiresAt = 0;

const base64url = (value) => Buffer.from(value).toString('base64url');

function googlePlayConfig() {
  const packageName = String(process.env.GOOGLE_PLAY_PACKAGE_NAME || '').trim();
  const productId = String(process.env.GOOGLE_PLAY_PRODUCT_ID || 'sin_barreras_monthly').trim();
  const clientEmail = String(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL || '').trim();
  const privateKey = String(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();
  return { packageName, productId, clientEmail, privateKey };
}

export function googlePlayEnabled() {
  const { packageName, productId, clientEmail, privateKey } = googlePlayConfig();
  return Boolean(packageName && productId && clientEmail && privateKey);
}

export function googlePlayPublicConfig() {
  const { packageName, productId } = googlePlayConfig();
  return { enabled: googlePlayEnabled(), packageName, productId };
}

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;
  const { clientEmail, privateKey } = googlePlayConfig();
  if (!clientEmail || !privateKey) throw new Error('Google Play Billing no está configurado en el servidor.');

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: clientEmail,
    scope: ANDROID_PUBLISHER_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600
  }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), privateKey).toString('base64url');
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });
  const payloadJson = await response.json().catch(() => ({}));
  if (!response.ok || !payloadJson.access_token) {
    throw new Error(payloadJson.error_description || 'No se pudo autenticar con Google Play Developer API.');
  }
  cachedToken = payloadJson.access_token;
  tokenExpiresAt = Date.now() + (Number(payloadJson.expires_in || 3600) * 1000);
  return cachedToken;
}

async function playRequest(path, { method = 'GET', body } = {}) {
  if (!googlePlayEnabled()) throw new Error('Google Play Billing no está configurado en el servidor.');
  const accessToken = await getAccessToken();
  const response = await fetch(`https://androidpublisher.googleapis.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const error = new Error(data?.error?.message || `Google Play Developer API respondió ${response.status}.`);
    error.status = response.status;
    error.code = data?.error?.status || '';
    throw error;
  }
  return data;
}

function mapSubscriptionState(state, expiryTime) {
  const expiry = expiryTime ? new Date(expiryTime) : null;
  const future = Boolean(expiry && Number.isFinite(expiry.getTime()) && expiry.getTime() > Date.now());
  switch (state) {
    case 'SUBSCRIPTION_STATE_ACTIVE': return 'active';
    // Google documents grace period as entitled access while payment is retried.
    case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD': return future ? 'active' : 'past_due';
    case 'SUBSCRIPTION_STATE_CANCELED': return future ? 'active' : 'canceled';
    case 'SUBSCRIPTION_STATE_ON_HOLD': return 'past_due';
    case 'SUBSCRIPTION_STATE_PAUSED': return 'paused';
    case 'SUBSCRIPTION_STATE_PENDING': return 'incomplete';
    case 'SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED': return 'canceled';
    case 'SUBSCRIPTION_STATE_EXPIRED': return 'canceled';
    default: return future ? 'active' : 'none';
  }
}

function latestMatchingLineItem(data, productId) {
  const items = Array.isArray(data?.lineItems) ? data.lineItems.filter((item) => item?.productId === productId) : [];
  return items.sort((a, b) => {
    const left = a?.expiryTime ? new Date(a.expiryTime).getTime() : 0;
    const right = b?.expiryTime ? new Date(b.expiryTime).getTime() : 0;
    return right - left;
  })[0] || null;
}

export async function verifyGooglePlaySubscription({ purchaseToken, requestedProductId }) {
  const token = String(purchaseToken || '').trim();
  if (!token || token.length < 16) throw new Error('Token de compra de Google Play inválido.');
  const { packageName, productId } = googlePlayConfig();
  if (!googlePlayEnabled()) throw new Error('Google Play Billing no está configurado en el servidor.');
  if (requestedProductId && String(requestedProductId) !== productId) throw new Error('Producto de Google Play no válido.');

  const path = `/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(token)}`;
  const data = await playRequest(path);
  const matchingItem = latestMatchingLineItem(data, productId);
  if (!matchingItem) throw new Error('La compra no corresponde al plan de Sin Barreras.');

  const expiryTime = matchingItem.expiryTime || null;
  const subscriptionStatus = mapSubscriptionState(data.subscriptionState, expiryTime);
  const expiryMs = expiryTime ? new Date(expiryTime).getTime() : 0;
  const entitlementState = ['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD', 'SUBSCRIPTION_STATE_CANCELED'].includes(data.subscriptionState);
  const hasEntitlement = Boolean(entitlementState && expiryMs > Date.now());

  return {
    packageName,
    productId,
    purchaseToken: token,
    orderId: data.latestOrderId || '',
    subscriptionState: data.subscriptionState || '',
    acknowledgementState: data.acknowledgementState || '',
    subscriptionStatus,
    currentPeriodEnd: expiryTime ? new Date(expiryTime) : null,
    cancelAtPeriodEnd: data.subscriptionState === 'SUBSCRIPTION_STATE_CANCELED',
    hasEntitlement,
    externalAccountIdentifiers: data.externalAccountIdentifiers || null
  };
}

export async function applyGooglePlayVerification(user, verification, { orderId = '' } = {}) {
  if (!user || !verification?.purchaseToken) throw new Error('No se pudo sincronizar la compra de Google Play.');

  const externalAccountId = verification.externalAccountIdentifiers?.obfuscatedExternalAccountId || '';
  if (externalAccountId) {
    const expectedAccountId = crypto.createHash('sha256').update(String(user._id)).digest('hex');
    if (externalAccountId !== expectedAccountId) {
      throw new Error('Esta compra de Google Play pertenece a otra cuenta de Sin Barreras.');
    }
  }

  const existing = await user.constructor.findOne({
    googlePlayPurchaseToken: verification.purchaseToken,
    _id: { $ne: user._id }
  }).select('_id email');
  if (existing) throw new Error('Esta compra de Google Play ya está vinculada a otra cuenta de Sin Barreras.');

  user.billingProvider = 'google_play';
  user.googlePlayProductId = verification.productId;
  user.googlePlayPurchaseToken = verification.purchaseToken;
  user.googlePlayOrderId = String(orderId || verification.orderId || '');
  user.googlePlaySubscriptionState = verification.subscriptionState || '';
  user.googlePlayVerifiedAt = new Date();
  user.subscriptionStatus = verification.subscriptionStatus;
  user.currentPeriodEnd = verification.currentPeriodEnd;
  user.cancelAtPeriodEnd = Boolean(verification.cancelAtPeriodEnd);
  await user.save();
  return user;
}

export async function syncGooglePlaySubscriptionForUser(user, { purchaseToken, requestedProductId, orderId = '' } = {}) {
  const verification = await verifyGooglePlaySubscription({ purchaseToken, requestedProductId });
  await applyGooglePlayVerification(user, verification, { orderId });
  return verification;
}

export async function refreshGooglePlayEntitlement(user, { force = false } = {}) {
  if (!user || user.billingProvider !== 'google_play' || !user.googlePlayPurchaseToken || !googlePlayEnabled()) return user;
  const lastVerified = user.googlePlayVerifiedAt ? new Date(user.googlePlayVerifiedAt).getTime() : 0;
  const expiry = user.currentPeriodEnd ? new Date(user.currentPeriodEnd).getTime() : 0;
  const stale = !lastVerified || (Date.now() - lastVerified) >= REFRESH_INTERVAL_MS;
  const periodExpired = !expiry || expiry <= Date.now();
  if (!force && !stale && !periodExpired) return user;

  const verification = await verifyGooglePlaySubscription({
    purchaseToken: user.googlePlayPurchaseToken,
    requestedProductId: user.googlePlayProductId || undefined
  });
  await applyGooglePlayVerification(user, verification);
  return user;
}

export async function cancelGooglePlaySubscription(user) {
  if (!user?.googlePlayPurchaseToken) return null;
  const { packageName } = googlePlayConfig();
  const token = encodeURIComponent(user.googlePlayPurchaseToken);
  const path = `/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptionsv2/tokens/${token}:cancel`;
  await playRequest(path, {
    method: 'POST',
    body: { cancellationContext: { cancellationType: 'USER_REQUESTED_STOP_RENEWALS' } }
  });
  user.cancelAtPeriodEnd = true;
  user.googlePlayVerifiedAt = new Date();
  await user.save();
  try { await refreshGooglePlayEntitlement(user, { force: true }); } catch {}
  return user;
}

export async function revokeGooglePlaySubscription(user) {
  if (!user?.googlePlayPurchaseToken) return null;
  const { packageName } = googlePlayConfig();
  const token = encodeURIComponent(user.googlePlayPurchaseToken);
  const path = `/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptionsv2/tokens/${token}:revoke`;
  // Permanent account deletion should not leave a user paying for access they can no longer use.
  // A prorated refund terminates entitlement immediately and refunds the unused portion.
  await playRequest(path, {
    method: 'POST',
    body: { revocationContext: { proratedRefund: {} } }
  });
  user.subscriptionStatus = 'canceled';
  user.currentPeriodEnd = new Date();
  user.cancelAtPeriodEnd = true;
  user.googlePlaySubscriptionState = 'SUBSCRIPTION_STATE_CANCELED';
  user.googlePlayVerifiedAt = new Date();
  await user.save();
  return user;
}
