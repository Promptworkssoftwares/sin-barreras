import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(projectRoot, '.env');
let loaded = false;

export function loadEnvironment() {
  if (loaded) return { projectRoot, envPath };
  loaded = true;

  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.error) throw result.error;
  }

  return { projectRoot, envPath };
}

const clean = (value) => String(value ?? '').trim();

function parseMongoUri(uri) {
  try {
    const parsed = new URL(uri);
    if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol)) throw new Error('invalid protocol');
    return parsed;
  } catch {
    throw new Error('MONGODB_URI no es una URI válida de MongoDB Atlas. Copia la URI completa desde Atlas > Connect > Drivers.');
  }
}

export function getMongoConfig() {
  const uri = clean(process.env.MONGODB_URI);
  const dbName = clean(process.env.MONGODB_DB_NAME);

  if (!uri) {
    throw new Error('Falta MONGODB_URI en .env.');
  }
  if (!dbName) {
    throw new Error('Falta MONGODB_DB_NAME en .env.');
  }
  if (/<db_password>|YOUR_PASSWORD|TU_PASSWORD|YOUR_DB_USER|TU_USUARIO|YOUR_CLUSTER|TU_CLUSTER|YOUR_HOST|TU_HOST/i.test(uri)) {
    throw new Error('MONGODB_URI todavía contiene un marcador de ejemplo. En esta versión solo debes reemplazar <db_password> por la contraseña real de Atlas.');
  }

  const parsed = parseMongoUri(uri);
  if (!parsed.username) throw new Error('MONGODB_URI no contiene el Database User de Atlas.');
  if (!parsed.password) throw new Error('MONGODB_URI no contiene la contraseña del Database User de Atlas.');
  if (!parsed.hostname) throw new Error('MONGODB_URI no contiene el host del cluster de Atlas.');

  return {
    uri,
    dbName,
    username: decodeURIComponent(parsed.username),
    host: parsed.hostname,
    appName: parsed.searchParams.get('appName') || 'SinBarreras'
  };
}

export function validateMongoEnvironment() {
  return getMongoConfig();
}

export function describeMongoConfig(config = getMongoConfig()) {
  return {
    username: config.username,
    host: config.host,
    dbName: config.dbName,
    appName: config.appName
  };
}
