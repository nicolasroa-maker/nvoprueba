/**
 * Drop-in replacement para window.storage de claude.ai artifacts.
 * Usa el backend Express+SQLite via /api/store.
 *
 * API idéntica:
 *   await storeGet(key, shared)   → { value } | null
 *   await storeSet(key, value, shared) → { value }
 */

const API = '/api/store';

export async function storeGet(key, shared = true) {
  try {
    const res = await fetch(`${API}/${encodeURIComponent(key)}?shared=${shared}`);
    const data = await res.json();
    return data; // null o { key, value, shared }
  } catch (e) {
    console.error('storeGet error:', e);
    return null;
  }
}

export async function storeSet(key, value, shared = true) {
  try {
    const res = await fetch(`${API}/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, shared }),
    });
    return await res.json();
  } catch (e) {
    console.error('storeSet error:', e);
    return { value };
  }
}
