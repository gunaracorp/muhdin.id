import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { fail } from "@/lib/api-helpers";

/**
 * v5 Fase 3 — Gambar QR paspor (PNG) untuk dicetak di kartu e-paspor.
 * Isi QR: URL verifikasi publik (/verifikasi-paspor/<nomor>) sehingga
 * petugas cukup memindai dengan kamera ponsel apa pun.
 * Konten deterministik per nomor → aman di-cache 24 jam.
 */

/** Cache memori kecil agar pemindaian berulang tidak regenerasi PNG. */
const cache = new Map<string, Uint8Array>();
const CACHE_MAX = 300;

export async function GET(req: NextRequest, ctx: { params: Promise<{ no: string }> }) {
  try {
    const { no } = await ctx.params;
    const passportNo = decodeURIComponent(no).trim().toUpperCase();

    const exists = await db.hajjPassport.findUnique({
      where: { passportNo },
      select: { passportNo: true },
    });
    if (!exists) return fail("Paspor tidak ditemukan.", 404);

    const cached = cache.get(passportNo);
    if (cached) return png(cached);

    const target = `${req.nextUrl.origin}/verifikasi-paspor/${passportNo}`;
    const buf = await QRCode.toBuffer(target, {
      type: "png",
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0B3D2E", light: "#FFFFFF" },
    });
    const bytes = new Uint8Array(buf);
    if (cache.size >= CACHE_MAX) cache.clear();
    cache.set(passportNo, bytes);
    return png(bytes);
  } catch {
    return fail("Gagal membuat QR.", 500);
  }
}

function png(bytes: Uint8Array): Response {
  // BodyInit (DOM) menuntut Uint8Array<ArrayBuffer> — salin ke buffer baru.
  const buf = new Uint8Array(bytes.byteLength);
  buf.set(bytes);
  return new Response(buf, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
