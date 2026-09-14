(() => {
  const isAndroid = () => {
    try {
      return Boolean(window.SinBarrerasNative?.isAndroidApp?.()) || /SinBarrerasAndroid\//i.test(navigator.userAgent);
    } catch { return /SinBarrerasAndroid\//i.test(navigator.userAgent); }
  };

  async function verifyPurchase(payload) {
    const response = await fetch('/billing/google/verify', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || 'No se pudo verificar la compra de Google Play.');
      error.status = response.status;
      throw error;
    }
    return data;
  }

  const api = {
    isNativeAndroid: isAndroid(),
    subscribe(accountId = '') {
      if (!isAndroid() || !window.SinBarrerasNative?.startSubscriptionPurchase) throw new Error('Google Play Billing no está disponible en este dispositivo.');
      window.SinBarrerasNative.startSubscriptionPurchase(String(accountId || ''));
    },
    manageSubscription() {
      if (!isAndroid() || !window.SinBarrerasNative?.manageSubscription) throw new Error('La administración de Google Play no está disponible.');
      window.SinBarrerasNative.manageSubscription();
    },
    restorePurchases() {
      if (isAndroid() && window.SinBarrerasNative?.restorePurchases) window.SinBarrerasNative.restorePurchases();
    },
    async onPurchase(payloadJson) {
      const payload = typeof payloadJson === 'string' ? JSON.parse(payloadJson) : payloadJson;
      try {
        const result = await verifyPurchase(payload || {});
        // Verification happens on the server first. Only then do we acknowledge the
        // purchase in Google Play so entitlement cannot be granted from client data alone.
        if (payload?.purchaseToken && window.SinBarrerasNative?.acknowledgePurchase) {
          window.SinBarrerasNative.acknowledgePurchase(payload.purchaseToken);
        }
        window.dispatchEvent(new CustomEvent('sinbarreras:billing-success', { detail: result }));
      } catch (error) {
        // On startup the native layer can find an existing purchase before the user logs in.
        // Ignore that 401 quietly; restore runs again after the authenticated page reloads.
        if (error.status === 401) return;
        window.dispatchEvent(new CustomEvent('sinbarreras:billing-error', { detail: { message: error.message } }));
      }
    },
    onBillingError(message) {
      window.dispatchEvent(new CustomEvent('sinbarreras:billing-error', { detail: { message: String(message || 'Google Play Billing no pudo completar la operación.') } }));
    }
  };

  window.SinBarrerasPlay = api;
  if (api.isNativeAndroid) document.documentElement.classList.add('android-app');
  window.addEventListener('load', () => { if (api.isNativeAndroid) setTimeout(() => api.restorePurchases(), 700); }, { once: true });
})();
