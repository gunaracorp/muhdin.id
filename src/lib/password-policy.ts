/**
 * password-policy.ts — v12.3 «AMANAH» — R-075 Kebijakan Password.
 *
 * Sumber kebenaran tunggal kekuatan sandi untuk semua titik set-password
 * (buat akun, reset, ganti sandi). Mengembalikan `null` bila lolos, atau
 * pesan satu kalimat bila ditolak — dipakai bersama zod di rute API.
 */

/** Sampel sandi yang terlalu umum — blok di gerbang. */
const COMMON = new Set([
  "password", "password1", "password12", "password123", "12345678", "123456789",
  "1234567890", "qwerty123", "qwertyuiop", "admin1234", "muhdin2026",
  "samsung1", "iloveyou1", "anggur1", "indonesia1",
]);

/**
 * Validasi kebijakan: minimal 8 karakter, mengandung huruf DAN angka,
 * tidak masuk daftar sandi umum. Maksimum 128 karakter (jaga scrypt).
 */
export function passwordIssue(pw: string): string | null {
  if (typeof pw !== "string" || pw.length < 8)
    return "Password minimal 8 karakter.";
  if (pw.length > 128)
    return "Password maksimal 128 karakter.";
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw))
    return "Password harus mengandung huruf dan angka (contoh: amanah2026).";
  if (COMMON.has(pw.toLowerCase()))
    return "Password terlalu umum — pilih kombinasi lain yang lebih kuat.";
  return null;
}
