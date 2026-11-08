/**
 * password-lockout.ts — v12.3 «AMANAH» — R-075 Anti brute-force.
 *
 * Penguncian per-Email di memori proses (Map), melengkapi rate-limit
 * per-IP: lima kegagalan dalam 15 menit mengunci percobaan selama 15
 * menit. Kegagalan terhitung juga untuk password salah MAUPUN kode 2FA
 * salah; login sukses menghapus hitungan.
 */

const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60_000; // jendela hitung kegagalan
const LOCK_MS = 15 * 60_000; // durasi terkunci

const fails = new Map<string, number[]>();
const locks = new Map<string, number>();

function housekeeping() {
  const now = Date.now();
  if (fails.size > 500) {
    for (const [k, v] of fails) {
      const alive = v.filter((t) => now - t < WINDOW_MS);
      if (alive.length === 0) fails.delete(k);
      else fails.set(k, alive);
    }
  }
  if (locks.size > 200) {
    for (const [k, until] of locks) if (until < now) locks.delete(k);
  }
}

/** Status terkunci? → { locked: true, retryAfterMenit }. */
export function lockState(email: string): { locked: boolean; minutes: number } {
  const key = email.toLowerCase();
  const until = locks.get(key) ?? 0;
  if (until > Date.now()) {
    return { locked: true, minutes: Math.max(1, Math.ceil((until - Date.now()) / 60_000)) };
  }
  return { locked: false, minutes: 0 };
}

/** Catat satu kegagalan; bila mencapai batas → kunci, return true. */
export function recordFail(email: string): boolean {
  housekeeping();
  const key = email.toLowerCase();
  const now = Date.now();
  const list = (fails.get(key) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  fails.set(key, list);
  if (list.length >= MAX_FAILS) {
    locks.set(key, now + LOCK_MS);
    fails.delete(key);
    return true;
  }
  return false;
}

/** Hapus hitungan (dipanggil saat login sukses / sandi diubah). */
export function clearFails(email: string): void {
  const key = email.toLowerCase();
  fails.delete(key);
  locks.delete(key);
}
