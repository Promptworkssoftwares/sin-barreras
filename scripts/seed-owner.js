import { loadEnvironment, validateMongoEnvironment } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { ensureOwnerAccount } from '../services/ownerService.js';

loadEnvironment();
validateMongoEnvironment();
await connectDB();
const owner = await ensureOwnerAccount();
if (!owner) {
  console.error('Configura OWNER_EMAIL y OWNER_PASSWORD en .env.');
  process.exit(1);
}
console.log(`Owner listo: ${owner.email}`);
process.exit(0);
