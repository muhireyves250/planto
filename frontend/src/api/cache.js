const TTL = 60_000; // 1 minute

export function getCached(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > TTL) { sessionStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

export function setCached(key, data) {
  try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

export function clearCached(key) {
  try { sessionStorage.removeItem(key); } catch {}
}
