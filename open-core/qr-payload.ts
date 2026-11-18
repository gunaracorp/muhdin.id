/**
 * open-core/qr-payload.ts — Encode/parse payload QR kartu jamaah (referensi).
 *
 * Format payload `MHD-…` tervalidasi: JSON ringkas + checksum FNV-1a agar
 * salah ketik/tamper terdeteksi. Tanpa PII sensitif — hanya referensi yang
 * bisa diverifikasi lewat endpoint publik. Deterministik & murni.
 */

export interface QrPayload {
  kind: "CARD" | "PASSPORT" | "CERT";
  /** kode unik, mis. MHD-2026-0123 / MHD-MT-DASAR-2026-0042 */
  code: string;
  /** unix detik penerbitan */
  ts: number;
}

/** Checksum FNV-1a 32-bit — cukup untuk deteksi salah ketik, bukan kriptografi. */
export function checksum(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0").toUpperCase();
}

/* Base64url aman Node & browser (Buffer ada di Node; btoa/atob di browser). */
function toB64(text: string): string {
  try {
    return Buffer.from(text, "utf8").toString("base64url");
  } catch {
    return btoa(unescape(encodeURIComponent(text)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
}

function fromB64(text: string): string {
  try {
    return Buffer.from(text, "base64url").toString("utf8");
  } catch {
    return decodeURIComponent(escape(atob(text.replace(/-/g, "+").replace(/_/g, "/"))));
  }
}

/** Encode payload → string QR `MHD1.<base64url>.<CHECKSUM>`. */
export function encodeQrPayload(payload: QrPayload): string {
  const code = payload.code.trim().toUpperCase();
  if (!/^MHD-[A-Z0-9-]{4,60}$/.test(code)) {
    throw new Error("Kode QR tidak sesuai format MHD-…");
  }
  if (!Number.isInteger(payload.ts) || payload.ts <= 0) {
    throw new Error("Timestamp tidak valid.");
  }
  const body = toB64(JSON.stringify({ ...payload, code }));
  return `MHD1.${body}.${checksum(body)}`;
}

/** Parse string QR → payload (verifikasi checksum). */
export function parseQrPayload(
  raw: string
): { ok: true; data: QrPayload } | { ok: false; error: string } {
  const parts = raw.trim().split(".");
  if (parts.length !== 3 || parts[0] !== "MHD1") {
    return { ok: false, error: "Format QR tidak dikenali." };
  }
  const [, body, sum] = parts;
  if (checksum(body) !== sum.toUpperCase()) {
    return { ok: false, error: "Checksum tidak cocok — payload rusak/dua-ganda." };
  }
  try {
    const data = JSON.parse(fromB64(body)) as QrPayload;
    if (!["CARD", "PASSPORT", "CERT"].includes(data.kind)) {
      return { ok: false, error: "Jenis QR tidak dikenal." };
    }
    if (!/^MHD-[A-Z0-9-]{4,60}$/.test(data.code ?? "")) {
      return { ok: false, error: "Kode di dalam QR tidak valid." };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Payload tidak dapat dibaca." };
  }
}
