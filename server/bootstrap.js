import { loadEnvironment, validateMongoEnvironment, describeMongoConfig } from '../config/env.js';

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

  if (/ENOTFOUND|querySrv|ECONNREFUSED|getaddrinfo|ServerSelection/i.test(message)) {
    return 'No se pudo alcanzar MongoDB Atlas. Revisa DNS, conexión y Atlas > Network Access.';
  }

  return message;
}

let mongo = null;
try {
  loadEnvironment();
  mongo = describeMongoConfig(validateMongoEnvironment());
  await import('./server.js');
} catch (error) {
  console.error('\n==========================================');
  console.error('  Sin Barreras - Error de inicio');
  console.error('==========================================');
  console.error(friendlyStartupError(error, mongo));
  console.error('\nCorrige .env y vuelve a ejecutar start.bat.\n');
  process.exit(1);
}
