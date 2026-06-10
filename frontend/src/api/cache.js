const TTL = 600_000; // 10 minutes

export function getCached(key) {
  try {
    const raw = localStorage.getItem(`planto_cache_${key}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > TTL) { localStorage.removeItem(`planto_cache_${key}`); return null; }
    return data;
  } catch { return null; }
}

export function setCached(key, data) {
  try { localStorage.setItem(`planto_cache_${key}`, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

export function clearCached(key) {
  try { localStorage.removeItem(`planto_cache_${key}`); } catch {}
}
