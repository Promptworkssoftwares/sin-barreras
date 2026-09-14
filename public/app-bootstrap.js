import { bootstrapCloudState, startCloudSync } from './cloud.js?v=1.4.44';
import { initAccountUI } from './account-ui.js?v=1.4.44';

try {
  await bootstrapCloudState();
  await import('./app.js?v=1.4.44');
  initAccountUI();
  startCloudSync();
} catch (error) {
  console.error(error);
  window.location.replace('/?session=expired');
}
