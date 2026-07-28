/**
 * Storage abstraction over Vercel KV.
 *
 * Falls back to an in-memory Map when KV env vars are absent (local dev
 * without `vercel env pull`). Data persists only for the lifetime of the
 * Node.js process in that mode — which is fine for local testing.
 *
 * SERVER-ONLY — never import this in client components.
 */

import { DEFAULT_NAMES } from './names';
import { SEED_CONFIG } from './seed';

// ─── In-memory fallback ───────────────────────────────────────────────────
const mem = new Map();

function isKVAvailable() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvGet(key) {
  if (!isKVAvailable()) return mem.get(key) ?? null;
  const { kv } = await import('@vercel/kv');
  return kv.get(key);
}

async function kvSet(key, value) {
  if (!isKVAvailable()) { mem.set(key, value); return; }
  const { kv } = await import('@vercel/kv');
  await kv.set(key, value);
}

async function kvDel(key) {
  if (!isKVAvailable()) { mem.delete(key); return; }
  const { kv } = await import('@vercel/kv');
  await kv.del(key);
}

// ─── KV key constants ─────────────────────────────────────────────────────
const K = {
  LOCK:           'lock',
  CURRENT_CONFIG: 'current_config',
  HISTORY_INDEX:  'history_index',
  ADMIN_PASSWORD: 'admin_password',
  NAMES:          'names',
  hi: (id) => `history:${id}`,
};

// ─── Names ────────────────────────────────────────────────────────────────
/** Returns KV override if set, otherwise the hardcoded DEFAULT_NAMES. */
export async function getNames() {
  const kvNames = await kvGet(K.NAMES);
  return kvNames || DEFAULT_NAMES;
}

/** Persist a custom names list to KV (override the hardcoded defaults). */
export async function setNames(names) {
  await kvSet(K.NAMES, names);
}

/** Remove KV override, reverting to DEFAULT_NAMES. */
export async function resetNames() {
  await kvDel(K.NAMES);
}

// ─── Lock ─────────────────────────────────────────────────────────────────
export async function getLock() {
  const lock = await kvGet(K.LOCK);
  if (!lock) return { locked: false, unlockAt: null };

  // Auto-unlock once the cooldown expires
  if (lock.locked && lock.unlockAt && Date.now() > lock.unlockAt) {
    const unlocked = { locked: false, unlockAt: null };
    await kvSet(K.LOCK, unlocked);
    return unlocked;
  }
  return lock;
}

export async function setLock(state) {
  await kvSet(K.LOCK, state);
}

// ─── Admin Password ───────────────────────────────────────────────────────
export async function getAdminPassword() {
  return (await kvGet(K.ADMIN_PASSWORD)) || process.env.ADMIN_PASSWORD || 'xi4seat';
}

export async function setAdminPassword(newPassword) {
  await kvSet(K.ADMIN_PASSWORD, newPassword);
}

// ─── Current Config ───────────────────────────────────────────────────────
export async function getCurrentConfig() {
  let config = await kvGet(K.CURRENT_CONFIG);
  if (!config) {
    // First run: seed KV with the existing configuration
    await kvSet(K.CURRENT_CONFIG, SEED_CONFIG);
    config = SEED_CONFIG;
  }
  return config;
}

export async function setCurrentConfig(config) {
  await kvSet(K.CURRENT_CONFIG, config);
}

// ─── History ──────────────────────────────────────────────────────────────
export async function getHistoryIndex() {
  return (await kvGet(K.HISTORY_INDEX)) || [];
}

export async function getHistoryItem(id) {
  return kvGet(K.hi(id));
}

/** Archive a config under the given id and prepend it to the history index. */
export async function saveHistoryItem(id, config) {
  const now = new Date();
  const dd   = String(now.getDate()).padStart(2, '0');
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh   = String(now.getHours()).padStart(2, '0');
  const min  = String(now.getMinutes()).padStart(2, '0');
  const ss   = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${dd}-${mm}-${yyyy}_${hh}-${min}-${ss}`;

  await kvSet(K.hi(id), config);

  const index = await getHistoryIndex();
  index.unshift({ filename: id, timestamp });
  await kvSet(K.HISTORY_INDEX, index.slice(0, 50)); // keep last 50
}

export async function clearAllHistory() {
  const index = await getHistoryIndex();
  for (const item of index) {
    await kvDel(K.hi(item.filename));
  }
  await kvSet(K.HISTORY_INDEX, []);
}
