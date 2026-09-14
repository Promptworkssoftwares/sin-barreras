import dns from 'node:dns';
import { loadEnvironment, validateMongoEnvironment, describeMongoConfig } from '../config/env.js';
import { prepareMongoDns } from '../config/mongoDns.js';

function explain(error, username) {
  const message = String(error?.message || error || '');
  if (error?.code === 8000 || error?.codeName === 'AtlasError' || /bad auth|authentication failed/i.test(message)) {
    return [
      'AUTH_FAILED: MongoDB Atlas rechazó las credenciales.',
      `Database User usado por .env: ${username}`,
      'Verifica ese mismo Database User y su contraseña en Atlas > Security > Database Access.'
    ].join('\n');
  }
  if (error?.code === 'MONGODB_DNS_FALLBACK_FAILED' || error?.code === 'MONGODB_DNS_GLOBAL_VERIFY_FAILED') {
    return `DNS_FALLBACK_FAILED: ${message}`;
  }
  if (/ENOTFOUND|querySrv|queryTxt|ECONNREFUSED|getaddrinfo|ServerSelection/i.test(message)) {
    return 'NETWORK_OR_DNS: no se pudo alcanzar el cluster después del manejo DNS automático. Revisa conexión y Atlas > Network Access.';
  }
  if (/not authorized|whitelist|network access|IP/i.test(message)) {
    return 'NETWORK_ACCESS: Atlas parece estar bloqueando la IP actual. Revisa Atlas > Security > Network Access.';
  }
  return message;
}

let safe = null;
let disconnectDB = null;
try {
  loadEnvironment();
  const mongoConfig = validateMongoEnvironment();
  safe = describeMongoConfig(mongoConfig);

  console.log(`[TEST] DNS inicial de Node: ${dns.getServers().join(', ') || 'ninguno'}`);
  const dnsResult = await prepareMongoDns(mongoConfig.uri);
  console.log(`[TEST] DNS preparado: ${dnsResult.mode} -> ${dns.getServers().join(', ') || 'ninguno'}`);

  // Import Mongoose only AFTER DNS is prepared, exactly like bootstrap.js.
  const dbModule = await import('../config/db.js');
  disconnectDB = dbModule.disconnectDB;

  process.stdout.write(`[TEST] Conectando a ${safe.host} / ${safe.dbName} como ${safe.username}... `);
  await dbModule.connectDB();
  const mongoose = (await import('mongoose')).default;
  await mongoose.connection.db.admin().ping();
  console.log('OK');
  console.log('[OK] MongoDB Atlas conectado correctamente.');
  await disconnectDB();
  process.exit(0);
} catch (error) {
  console.log('FALLO');
  console.error(`[ERROR] ${explain(error, safe?.username || 'usuario definido en MONGODB_URI')}`);
  try { if (disconnectDB) await disconnectDB(); } catch {}
  process.exit(1);
}
