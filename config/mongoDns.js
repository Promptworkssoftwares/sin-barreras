import dns from 'node:dns';

// Google goes first because some mobile networks/hotspots reject Cloudflare DNS
// while allowing Google DNS. Each resolver is probed independently before use.
const DEFAULT_PUBLIC_DNS = Object.freeze(['8.8.8.8', '1.1.1.1']);
let preparedHost = null;
let preparedResult = null;

const clean = (value) => String(value ?? '').trim();

function parseBoolean(value, defaultValue = true) {
  const normalized = clean(value).toLowerCase();
  if (!normalized) return defaultValue;
  if (['1', 'true', 'yes', 'on', 'si', 'sí'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return defaultValue;
}

export function parseDnsServers(value) {
  const servers = clean(value)
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  return servers.length ? [...new Set(servers)] : [...DEFAULT_PUBLIC_DNS];
}

export function isLoopbackDnsServer(server) {
  const normalized = clean(server).replace(/^\[|\]$/g, '').toLowerCase();
  return normalized === '::1' || normalized === '0:0:0:0:0:0:0:1' || normalized.startsWith('127.');
}

export function shouldUseImmediateFallback(servers = dns.getServers()) {
  return servers.length > 0 && servers.every(isLoopbackDnsServer);
}

function isDnsResolutionError(error) {
  const code = clean(error?.code).toUpperCase();
  const message = clean(error?.message);
  return [
    'ECONNREFUSED',
    'ETIMEOUT',
    'ENOTFOUND',
    'ENODATA',
    'ESERVFAIL',
    'EREFUSED',
    'EAI_AGAIN'
  ].includes(code) || /querySrv|queryTxt|dns|resolver/i.test(message);
}

function resolveWithResolver(resolver, method, name) {
  return new Promise((resolve, reject) => {
    resolver[method](name, (error, records) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(records);
    });
  });
}

async function verifyWithResolver(resolver, host) {
  const records = await resolveWithResolver(resolver, 'resolveSrv', `_mongodb._tcp.${host}`);
  if (!Array.isArray(records) || records.length === 0) {
    const error = new Error(`MongoDB SRV no devolvió servidores para ${host}.`);
    error.code = 'MONGODB_DNS_EMPTY';
    throw error;
  }

  // Atlas publishes TXT options. ENODATA is valid for generic mongodb+srv
  // hosts without TXT options; other failures mean that resolver is not safe
  // to use with the MongoDB driver.
  try {
    await resolveWithResolver(resolver, 'resolveTxt', host);
  } catch (error) {
    if (clean(error?.code).toUpperCase() !== 'ENODATA') throw error;
  }

  return records;
}

async function verifyCurrentResolver(host) {
  return verifyWithResolver(dns, host);
}

async function probeDnsServer(server, host) {
  const resolver = new dns.Resolver({ timeout: 2500, tries: 2 });
  resolver.setServers([server]);
  await verifyWithResolver(resolver, host);
  return server;
}

async function findWorkingFallbackServers(servers, host) {
  const working = [];
  const failures = [];

  // Probe one at a time. Node/c-ares may not advance to the next DNS server
  // after certain connection-refused responses, so a plain [dns1, dns2] list
  // is not reliable enough on every mobile carrier.
  for (const server of servers) {
    try {
      await probeDnsServer(server, host);
      working.push(server);
    } catch (error) {
      failures.push({ server, error });
    }
  }

  return { working, failures };
}

/**
 * Prepares DNS BEFORE Mongoose/MongoDB is imported.
 *
 * Why this must run early:
 * The MongoDB Node driver uses mongodb+srv:// DNS lookups. Some versions of
 * Node/driver code capture their resolver when the module is imported. If
 * Mongoose is imported first while Windows reports a dead local resolver such
 * as 127.0.0.1, changing DNS afterwards can be too late.
 *
 * Behavior:
 * - Keeps the system DNS when SRV/TXT work.
 * - Detects loopback-only DNS such as 127.0.0.1.
 * - Probes configured fallback resolvers one-by-one.
 * - Uses only resolvers that actually answered MongoDB SRV/TXT queries.
 * - Changes DNS only for this Node.js process, never Windows globally.
 */
export async function prepareMongoDns(uri) {
  const parsed = new URL(uri);
  if (parsed.protocol !== 'mongodb+srv:') {
    return { mode: 'not-required', host: parsed.hostname, servers: dns.getServers() };
  }

  const host = parsed.hostname;
  if (preparedHost === host && preparedResult) return preparedResult;

  const fallbackEnabled = parseBoolean(process.env.MONGODB_DNS_FALLBACK, true);
  const fallbackServers = parseDnsServers(process.env.MONGODB_DNS_SERVERS);
  const systemServers = dns.getServers();

  if (!fallbackEnabled) {
    preparedHost = host;
    preparedResult = { mode: 'system', host, servers: systemServers, fallbackEnabled: false };
    return preparedResult;
  }

  let systemError = null;

  if (!shouldUseImmediateFallback(systemServers)) {
    try {
      await verifyCurrentResolver(host);
      preparedHost = host;
      preparedResult = { mode: 'system', host, servers: dns.getServers(), fallbackEnabled: true };
      return preparedResult;
    } catch (error) {
      systemError = error;
      if (!isDnsResolutionError(error)) throw error;
    }
  } else {
    systemError = Object.assign(
      new Error(`Node.js está usando un DNS local loopback (${systemServers.join(', ')}) para MongoDB SRV.`),
      { code: 'MONGODB_DNS_LOOPBACK' }
    );
  }

  const { working, failures } = await findWorkingFallbackServers(fallbackServers, host);

  if (!working.length) {
    const details = failures
      .map(({ server, error }) => `${server}: ${error?.code || 'ERROR'} ${error?.message || ''}`.trim())
      .join(' | ');
    const error = new Error(
      `No se pudo resolver MongoDB Atlas por DNS del sistema ni por DNS alterno. ` +
      `Sistema: ${systemError?.message || 'sin detalle'}. ` +
      `Alternos probados: ${details || fallbackServers.join(', ')}.`
    );
    error.code = 'MONGODB_DNS_FALLBACK_FAILED';
    error.cause = failures[0]?.error || systemError;
    throw error;
  }

  // IMPORTANT: configure the process-wide resolver BEFORE importing Mongoose.
  // The bootstrap does exactly that. Put the verified working DNS first and do
  // not keep a resolver that was proven broken for this network.
  dns.setServers(working);

  // Final verification uses the same global callback resolver that the process
  // now exposes to modules loaded after this point.
  try {
    await verifyCurrentResolver(host);
  } catch (error) {
    const wrapped = new Error(
      `Se encontró DNS alterno funcional (${working.join(', ')}), pero la verificación global falló: ${error.message}`
    );
    wrapped.code = 'MONGODB_DNS_GLOBAL_VERIFY_FAILED';
    wrapped.cause = error;
    throw wrapped;
  }

  preparedHost = host;
  preparedResult = {
    mode: 'fallback',
    host,
    servers: dns.getServers(),
    fallbackEnabled: true,
    systemServers,
    recoveredFrom: systemError?.code || 'DNS_ERROR',
    rejectedServers: failures.map(({ server }) => server)
  };

  console.warn(
    `[DNS] MongoDB DNS corregido para este proceso: ${preparedResult.servers.join(', ')} ` +
    `(resolver anterior: ${systemServers.join(', ') || 'ninguno'}).`
  );

  if (preparedResult.rejectedServers.length) {
    console.warn(`[DNS] DNS alternos no utilizables en esta red: ${preparedResult.rejectedServers.join(', ')}.`);
  }

  return preparedResult;
}
