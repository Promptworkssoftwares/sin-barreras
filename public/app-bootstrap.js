if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {});
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SIN_BARRERAS_UPDATED') window.location.reload();
  });
}

import { bootstrapCloudState, startCloudSync } from './cloud.js?v=1.6.6';
import { initAccountUI } from './account-ui.js?v=1.6.6';

try {
  await bootstrapCloudState();
  await import('./app.js?v=1.6.6');
  await import('./compliance-ui.js?v=1.6.6');
  initAccountUI();
  startCloudSync();
} catch (error) {
  console.error(error);
  window.location.replace('/?session=expired');
}
