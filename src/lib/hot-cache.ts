/**
 * hot-cache.ts — R-068 v15.0.0 «GOD MODE» — lapisan cache respons panas.
 *
 * Cache memori proses (TTL) untuk endpoint publik yang dibaca sering dan
 * jarang berubah (statistik, FAQ, ekosistem, rencana asuransi, kendali ISMS).
 * Asal hitungan server tetap benar: cache diisi ulang setelah TTL habis, dan
 * panel CMS yang mengubah data memanggil `bust(prefix)` agar pembaca berikut
 * langsung mendapat versi baru.
 *
 * Aset statis (/_next/static, gambar) dikawal lewat header CDN di
 * next.config.ts — dua lapis strategi R-068.
 */

type Entry = { value: unknown; expiresAt: number };

const store = new Map<string, Entry>();

/** Ambil dari cache; null bila kosong/kedaluwarsa. */
export function getCache<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

/** Simpan ke cache dengan TTL milidetik. */
export function setCache(key: string, value: unknown, ttlMs = 60_000): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Ambil-atau-hitung: pola baku pemakaian di route handler.
 *   const data = await cached("faq:list", 60_000, () => db.faq.findMany(...));
 */
export async function cached<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
  const hit = getCache<T>(key);
  if (hit !== null) return hit;
  const fresh = await compute();
  setCache(key, fresh, ttlMs);
  return fresh;
}

/** Hapus cache berawalan (mis. "faq:") — dipanggil CMS setelah mutasi. */
export function bustCache(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Jumlah entri (untuk observabilitas/dev). */
export function cacheSize(): number {
  return store.size;
}
