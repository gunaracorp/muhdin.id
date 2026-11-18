/**
 * fuzzy.ts — R-064 Pencarian Fuzzy & Typo-Tolerant.
 *
 * Salah ketik tetap ketemu: skoring kemiripan ringan tanpa pustaka —
 * cocok untuk SQLite yang tidak punya ekstensi FTS/LIKE fuzzy.
 *
 * Skor per kandidat (0–120):
 *   +100  substring persis (teks mentah)
 *   +90   substring hasil normalisasi
 *   +60   token judul berawalan token kueri
 *   +45   token kueri ≈ token teks (Levenshtein ≤ toleransi)
 *   +25   seluruh kueri muncul sebagai subsekuens huruf
 *   +10   sebagian token kueri cocok
 */

/** Normalisasi ringan: lowercase, buang tanda baca, pangkas ruang. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Token kueri (≥2 huruf). */
export function queryTokens(q: string): string[] {
  return normalizeText(q).split(" ").filter((t) => t.length >= 2);
}

/** Jarak Levenshtein klasik (O(n·m), aman untuk teks pendek). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1, // hapus
        cur[j - 1] + 1, // sisip
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // ganti
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Toleransi typo proporsional panjang token. */
function tol(len: number): number {
  if (len >= 8) return 3;
  if (len >= 5) return 2;
  if (len >= 4) return 1;
  return 0; // token terlalu pendek — harus persis
}

/** Kueri muncul sebagai subsekuens huruf (huruf berurutan, boleh terpisah). */
function isSubsequence(needle: string, hay: string): boolean {
  let i = 0;
  for (const ch of hay) {
    if (ch === needle[i]) i++;
    if (i === needle.length) return true;
  }
  return i === needle.length;
}

/**
 * Skor kemiripan kueri terhadap sekumpulan teks kandidat
 * (mis. [judul, ringkasan, isi]). Semakin besar semakin cocok; 0 = tidak cocok.
 */
export function fuzzyScore(rawQuery: string, texts: (string | null | undefined)[]): number {
  const q = normalizeText(rawQuery);
  if (!q) return 0;
  const qTokens = q.split(" ");
  let best = 0;

  for (const raw of texts) {
    if (!raw) continue;
    const norm = normalizeText(raw);
    let score = 0;

    // substring persis / ternormalisasi
    if (raw.toLowerCase().includes(rawQuery.toLowerCase())) score = Math.max(score, 100);
    if (q && norm.includes(q)) score = Math.max(score, 90);

    const words = norm.split(" ").filter(Boolean);

    // awalan token (prefix match)
    for (const qt of qTokens) {
      if (words.some((w) => w.startsWith(qt))) score = Math.max(score, 60);
    }

    // typo-tolerant: token ≈ token (Levenshtein)
    for (const qt of qTokens) {
      const t = tol(qt.length);
      if (t === 0) continue;
      for (const w of words) {
        if (Math.abs(w.length - qt.length) > t) continue;
        if (levenshtein(qt, w) <= t) {
          score = Math.max(score, 45);
          break;
        }
      }
    }

    // subsekuens seluruh kueri
    if (q.replace(/ /g, "").length >= 3 && isSubsequence(q.replace(/ /g, ""), norm.replace(/ /g, ""))) {
      score = Math.max(score, 25);
    }

    // sebagian token cocok
    const hit = qTokens.filter((qt) => words.some((w) => w.includes(qt))).length;
    if (hit > 0 && hit < qTokens.length) score = Math.max(score, 10 + hit * 5);

    best = Math.max(best, score);
  }
  return best;
}
