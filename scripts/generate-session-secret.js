import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');
if (!fs.existsSync(envPath)) process.exit(0);

let source = fs.readFileSync(envPath, 'utf8');
const match = source.match(/^SESSION_SECRET=(.*)$/m);
const current = String(match?.[1] || '').trim();
const weak = current.length < 32 || /CAMBIA|CHANGE|EXAMPLE|PLACEHOLDER/i.test(current);
if (!weak) process.exit(0);

const secret = crypto.randomBytes(48).toString('base64url');
if (match) source = source.replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET=${secret}`);
else source += `\nSESSION_SECRET=${secret}\n`;
fs.writeFileSync(envPath, source);
console.log('[OK] SESSION_SECRET seguro generado localmente.');
