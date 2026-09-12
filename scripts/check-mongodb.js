import { loadEnvironment, validateMongoEnvironment, describeMongoConfig } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';

function explain(error, username) {
  const message = String(error?.message || error || '');
  if (error?.code === 8000 || error?.codeName === 'AtlasError' || /bad auth|authentication failed/i.test(message)) {
    return [
      'AUTH_FAILED: MongoDB Atlas rechazó las credenciales.',
      `Database User usado por .env: ${username}`,
      'Verifica ese mismo Database User y su contraseña en Atlas > Security > Database Access.'
    ].join('\n');
  }
  if (/ENOTFOUND|querySrv|ECONNREFUSED|getaddrinfo|ServerSelection/i.test(message)) {
    return 'NETWORK_OR_DNS: no se pudo alcanzar el cluster. Revisa conexión, DNS y Atlas > Network Access.';
  }
  if (/not authorized|whitelist|network access|IP/i.test(message)) {
    return 'NETWORK_ACCESS: Atlas parece estar bloqueando la IP actual. Revisa Atlas > Security > Network Access.';
  }
  return message;
}

let safe = null;
try {
  loadEnvironment();
  safe = describeMongoConfig(validateMongoEnvironment());
  process.stdout.write(`[TEST] Conectando a ${safe.host} / ${safe.dbName} como ${safe.username}... `);
  await connectDB();
  const mongoose = (await import('mongoose')).default;
  await mongoose.connection.db.admin().ping();
  console.log('OK');
  console.log('[OK] MongoDB Atlas conectado correctamente.');
  await disconnectDB();
  process.exit(0);
} catch (error) {
  console.log('FALLO');
  console.error(`[ERROR] ${explain(error, safe?.username || 'usuario definido en MONGODB_URI')}`);
  try { await disconnectDB(); } catch {}
  process.exit(1);
}
