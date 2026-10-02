if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {});
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SIN_BARRERAS_UPDATED') window.location.reload();
  });
}

import { bootstrapCloudState, startCloudSync } from './cloud.js?v=1.7.25';
import { initAccountUI } from './account-ui.js?v=1.7.25';
import { initUiI18n } from './ui-i18n.js?v=1.7.25';

try {
  await bootstrapCloudState();
  initUiI18n();
  await import('./app.js?v=1.7.25');
  await import('./compliance-ui.js?v=1.7.25');
  initAccountUI();
  startCloudSync();
} catch (error) {
  console.error(error);
  window.location.replace('/?session=expired');
}
