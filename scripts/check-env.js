import { loadEnvironment, validateMongoEnvironment, describeMongoConfig } from '../config/env.js';

try {
  const { envPath } = loadEnvironment();
  const config = validateMongoEnvironment();
  const safe = describeMongoConfig(config);

  const sessionSecret = String(process.env.SESSION_SECRET || '').trim();
  if (sessionSecret.length < 32) throw new Error('SESSION_SECRET debe tener al menos 32 caracteres. Ejecuta install.bat para generarlo automáticamente.');
  if (process.env.NODE_ENV === 'production') {
    const origins = String(process.env.ALLOWED_ORIGINS || '').split(',').map((v) => v.trim()).filter(Boolean);
    if (!origins.length || origins.includes('*')) throw new Error('En producción ALLOWED_ORIGINS debe contener el dominio exacto y no puede usar *.');
  }
  console.log(`[OK] Configuración cargada desde: ${envPath}`);
  console.log(`[OK] MongoDB user: ${safe.username}`);
  console.log(`[OK] MongoDB cluster: ${safe.host}`);
  console.log(`[OK] MongoDB database: ${safe.dbName}`);
  console.log('[OK] MongoDB usa exclusivamente MONGODB_URI + MONGODB_DB_NAME desde .env');
  process.exit(0);
} catch (error) {
  console.error(`[ERROR] ${error?.message || error}`);
  process.exit(1);
}
