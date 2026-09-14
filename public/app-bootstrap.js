import { bootstrapCloudState, startCloudSync } from './cloud.js?v=1.4.43';
import { initAccountUI } from './account-ui.js?v=1.4.43';

try {
  await bootstrapCloudState();
  await import('./app.js?v=1.4.43');
  initAccountUI();
  startCloudSync();
} catch (error) {
  console.error(error);
  window.location.replace('/?session=expired');
}
