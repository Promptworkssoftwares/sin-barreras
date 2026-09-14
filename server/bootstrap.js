import { loadEnvironment, validateMongoEnvironment, describeMongoConfig } from '../config/env.js';
import { prepareMongoDns } from '../config/mongoDns.js';

function friendlyStartupError(error, mongo) {
  const message = String(error?.message || error || 'Error desconocido');
  const code = error?.code;
  const codeName = error?.codeName;

  if (code === 8000 || codeName === 'AtlasError' || /bad auth|authentication failed/i.test(message)) {
    return [
      'MongoDB Atlas rechazó las credenciales del Database User.',
      `Usuario leído desde .env: ${mongo?.username || 'desconocido'}`,
      'Revisa MONGODB_URI y confirma esa contraseña en Atlas > Security > Database Access.'
    ].join('\n');
  }

  if (code === 'MONGODB_DNS_FALLBACK_FAILED' || code === 'MONGODB_DNS_GLOBAL_VERIFY_FAILED') {
    return [
      'No se pudo resolver MongoDB Atlas por DNS.',
      'Sin Barreras probó el DNS del sistema y los DNS alternos configurados antes de cargar Mongoose.',
      message,
      'Ejecuta npm run mongo:test para ver el diagnóstico completo.'
    ].join('\n');
  }

  if (/ENOTFOUND|querySrv|queryTxt|ECONNREFUSED|getaddrinfo|ServerSelection/i.test(message)) {
    return [
      'No se pudo alcanzar MongoDB Atlas.',
      'La app prepara DNS antes de cargar el driver de MongoDB para funcionar en Wi-Fi, hotspot y redes con DNS local roto.',
      'Ejecuta npm run mongo:test para ver el diagnóstico completo.'
    ].join('\n');
  }

  return message;
}

let mongo = null;
try {
  loadEnvironment();
  const mongoConfig = validateMongoEnvironment();
  mongo = describeMongoConfig(mongoConfig);

  // CRITICAL: run this before importing server.js. server.js imports Mongoose,
  // and the MongoDB driver may capture its DNS resolver during module load.
  await prepareMongoDns(mongoConfig.uri);

  await import('./server.js');
} catch (error) {
  console.error('\n==========================================');
  console.error('  Sin Barreras - Error de inicio');
  console.error('==========================================');
  console.error(friendlyStartupError(error, mongo));
  console.error('\nRevisa el diagnóstico anterior y vuelve a ejecutar start.bat.\n');
  process.exit(1);
}
