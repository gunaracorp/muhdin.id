/**
 * vault-crypto.ts — R-076 Enkripsi At-Rest Dokumen Jamaah (v13.3).
 *
 * Brankas dokumen (JamaahDoc) dienkripsi level field memakai AES-256-GCM:
 * bocor database pun isi brankas (nomor dokumen, tautan berkas, catatan)
 * tetap terlindungi selama kunci VAULT_KEY tidak ikut bocor.
 *
 * Format tersimpan: "enc:v1:<iv_b64>:<tag_b64>:<ct_b64>".
 * - Nilai tanpa prefiks dianggap warisan plaintext dan dilewati apa adanya
 *   (kompatibel mundur — scripts/encrypt-vault-migrate.ts menyeragamkan).
 * - Nilai kosong/null tidak dienkripsi (tak ada rahasia untuk dilindungi).
 *
 * Kunci: VAULT_KEY (env) → 32 byte via scrypt (salt konstan "muhdin-vault-v1").
 * Bila VAULT_KEY kosong (dev/demo), derivasi dari konstanta modul — di produksi
 * WAJIB mengisi VAULT_KEY agar enkripsi at-rest benar-benar bermakna.
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const PREFIX = "enc:v1:";
const SALT = "muhdin-vault-v1";

let cachedKey: Buffer | null = null;

function vaultKey(): Buffer {
  if (cachedKey) return cachedKey;
  const material = process.env.VAULT_KEY || "muhdin-dev-fallback-key-ubah-di-produksi";
  cachedKey = scryptSync(material, SALT, 32);
  return cachedKey;
}

/** Enkripsi satu field → "enc:v1:iv:tag:ct". Null/kosong/plaintext-warisan tak tersentuh. */
export function encryptField(plain: string | null | undefined): string | null {
  if (plain === null || plain === undefined) return null;
  const value = String(plain);
  if (!value || value.startsWith(PREFIX)) return value;
  try {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", vaultKey(), iv);
    const ct = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
  } catch {
    // Gagal enkripsi: jangan pernah menyimpan plaintext kebalikan harapan —
    // lempar agar pemanggil memutus alur (fail-closed).
    throw new Error("vault-crypto: gagal mengenkripsi field");
  }
}

/** Dekripsi satu field → plaintext. Warisan plaintext & null dilewati apa adanya. */
export function decryptField(stored: string | null | undefined): string | null {
  if (stored === null || stored === undefined) return null;
  const value = String(stored);
  if (!value.startsWith(PREFIX)) return value;
  try {
    const [, , ivB64, tagB64, ctB64] = value.split(":");
    if (!ivB64 || !tagB64 || !ctB64) return "";
    const decipher = createDecipheriv("aes-256-gcm", vaultKey(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]);
    return pt.toString("utf8");
  } catch {
    // Tag auth gagal = data rusak/ubah-sengaja/kunci salah — kembalikan tanda rusak.
    return "〔terenkripsi — kunci tidak cocok〕";
  }
}

/** Enkripsi trio field brankas sekaligus (docNo, fileUrl, note). */
export function encryptVaultTrio(docNo: string | null | undefined, fileUrl: string | null | undefined, note: string | null | undefined) {
  return {
    docNo: encryptField(docNo),
    fileUrl: fileUrl ? encryptField(fileUrl) : fileUrl ?? null,
    note: note ? encryptField(note) : note ?? null,
  } as const;
}

/** Dekripsi trio field brankas sekaligus. */
export function decryptVaultTrio<T extends { docNo: string | null; fileUrl: string | null; note: string | null }>(row: T) {
  return {
    ...row,
    docNo: decryptField(row.docNo),
    fileUrl: decryptField(row.fileUrl),
    note: decryptField(row.note),
  } as T;
}

/** Penanda nilai telah terenkripsi (untuk migrasi & indikator UI). */
export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}
