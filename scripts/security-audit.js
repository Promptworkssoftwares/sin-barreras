import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirs = new Set(['node_modules', '.git', 'assets', 'icons']);
const ignoredFiles = new Set(['.env']);
const textExtensions = new Set(['.js','.mjs','.cjs','.json','.html','.css','.md','.yaml','.yml','.bat','.txt','.webmanifest','.example']);

const patterns = [
  ['OpenAI API key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g],
  ['Stripe secret key', /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g],
  ['Stripe webhook secret', /\bwhsec_[A-Za-z0-9]{16,}\b/g],
  ['Google OAuth client secret', /\bGOCSPX-[A-Za-z0-9_-]{10,}\b/g],
  ['Google API key', /\bAIza[A-Za-z0-9_-]{20,}\b/g],
  ['AWS access key', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g],
  ['Private key block', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['Hardcoded development session secret', /development[-]only[-]change[-]this[-]secret/g]
];

const findings = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes:true })) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (ignoredFiles.has(entry.name)) continue;
    if (!textExtensions.has(path.extname(entry.name)) && entry.name !== '.env.example' && entry.name !== '.gitignore') continue;
    let text;
    try { text = fs.readFileSync(full, 'utf8'); } catch { continue; }
    for (const [label, regex] of patterns) {
      regex.lastIndex = 0;
      if (regex.test(text)) findings.push(`${label}: ${path.relative(root, full)}`);
    }
    const mongoRegex = /mongodb(?:\+srv)?:\/\/([^:\s/]+):([^@\s/]+)@/g;
    for (const match of text.matchAll(mongoRegex)) {
      const password = match[2] || '';
      if (!/[<>{}]|PASSWORD|SECRET|EXAMPLE|PLACEHOLDER|db_password/i.test(password)) {
        findings.push(`MongoDB URI with embedded non-placeholder password: ${path.relative(root, full)}`);
      }
    }
  }
}
walk(root);

const browserRoots = [path.join(root,'public'), path.join(root,'private')];
const sensitiveNames = ['OPENAI_API_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','MONGODB_URI','GOOGLE_CLIENT_SECRET','OWNER_PASSWORD','SESSION_SECRET','CHATGPT_OAUTH_CLIENT_SECRET'];
for (const browserRoot of browserRoots) {
  if (!fs.existsSync(browserRoot)) continue;
  const stack=[browserRoot];
  while(stack.length){
    const current=stack.pop();
    for(const entry of fs.readdirSync(current,{withFileTypes:true})){
      const full=path.join(current,entry.name);
      if(entry.isDirectory()){stack.push(full);continue;}
      if(!textExtensions.has(path.extname(entry.name))) continue;
      const text=fs.readFileSync(full,'utf8');
      for(const name of sensitiveNames) if(text.includes(name)) findings.push(`Sensitive server env name exposed in browser file (${name}): ${path.relative(root,full)}`);
    }
  }
}

const gitignore = fs.readFileSync(path.join(root,'.gitignore'),'utf8');
if (!/^\.env$/m.test(gitignore)) findings.push('.env is not ignored by .gitignore');

if (findings.length) {
  console.error('[SECURITY] Audit failed:');
  [...new Set(findings)].forEach((item) => console.error(` - ${item}`));
  process.exit(1);
}
console.log('[SECURITY] OK: no hardcoded secret patterns found in shipped source/browser files.');
