/**
 * totp.ts — v12.3 «AMANAH» — Autentikasi Dua Faktor TOTP (RFC 6238).
 *
 * Implementasi mandiri dengan node:crypto (tanpa dependensi baru):
 *  - Secret base32 (RFC 4648, tanpa padding) sepanjang 20 byte → 32 karakter.
 *  - Kode 6 digit per langkah 30 detik, HMAC-SHA1, sesuai Google Authenticator.
 *  - Verifikasi dengan jendela ±1 langkah (toleransi drift jam ±30 s).
 *  - Perbandingan selalu timing-safe.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** base32 encode (RFC 4648, tanpa padding "="). */
export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

/** base32 decode — menerima huruf kecil/spasi/label; karakter liar diabaikan. */
export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** Secret acak 20 byte (32 karakter base32). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** Kode TOTP 6 digit untuk suatu langkah waktu. */
function hotp(secret: Buffer, counter: number, digits = 6): string {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x1_0000_0000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(bin % 10 ** digits).padStart(digits, "0");
}

/** Kode TOTP saat ini (untuk pengujian/CLI). */
export function totpNow(secretBase32: string, atMs: number = Date.now()): string {
  return hotp(base32Decode(secretBase32), Math.floor(atMs / 30_000));
}

/**
 * Verifikasi kode dengan jendela ±1 langkah (drift jam ±30 detik).
 * Selalu timing-safe terhadap kode kandidat.
 */
export function verifyTotp(secretBase32: string, code: string, atMs: number = Date.now()): boolean {
  const clean = String(code || "").replace(/[\s-]/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  const secret = base32Decode(secretBase32);
  if (secret.length === 0) return false;
  const step = Math.floor(atMs / 30_000);
  for (const drift of [-1, 0, 1]) {
    const candidate = Buffer.from(hotp(secret, step + drift));
    const given = Buffer.from(clean);
    if (candidate.length === given.length && timingSafeEqual(candidate, given)) return true;
  }
  return false;
}

/** URI otpauth:// untuk QR Google Authenticator/Authy/dll. */
export function otpauthUri(email: string, secretBase32: string): string {
  const label = encodeURIComponent(`MUHDIN:${email}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer: "MUHDIN",
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
