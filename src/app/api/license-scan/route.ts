import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { buildScan, type EngineDoc } from "@/lib/license-engine";

/**
 * v7.0 — PINDAI IZIN 360° (publik).
 * GET /api/license-scan?q=<NIB | nama perusahaan | nomor izin>
 *
 * Mesin pencari dossier kelengkapan izin BPW/PPIU/PIHK: input satu baris →
 * sistem membuka dossier perusahaan, mendeteksi kelas usaha yang dipegang,
 * menilai 12 syarat (a–l) dan menyusun rekomendasi berprioritas.
 * Rate limit 30/menit/IP (form publik anti-spam). Tidak mengungkap dokumen
 * sensitif — hanya nomor dokumen, penerbit, dan masa berlaku.
 */
export async function GET(req: NextRequest) {
  if (!rateLimit(req, "license-scan", 30, 60_000)) {
    return fail("Terlalu banyak permintaan — coba lagi sebentar lagi.", 429);
  }
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (q.length < 3) return fail("Masukkan NIB, nomor izin, atau nama perusahaan (min. 3 karakter).", 422);

    const companies = await db.registryCompany.findMany({
      include: { docs: { orderBy: { updatedAt: "desc" } } },
      orderBy: { name: "asc" },
    });
    if (companies.length === 0) return ok({ found: false, reason: "EMPTY_REGISTRY" });

    const ql = q.toLowerCase();
    const qDigits = q.replace(/\D+/g, "");

    // 1) NIB / nomor dokumen persis → 2) NIB mengandung → 3) nama mengandung.
    const exactDoc = companies.filter(
      (c) =>
        (qDigits.length >= 6 && c.nib === qDigits) ||
        c.docs.some((d) => d.docNo && d.docNo.toLowerCase() === ql)
    );
    const nibPartial = exactDoc.length === 0 ? companies.filter((c) => c.nib.includes(qDigits) && qDigits.length >= 4) : [];
    const byName = exactDoc.length === 0 && nibPartial.length === 0 ? companies.filter((c) => c.name.toLowerCase().includes(ql)) : [];

    const matches = exactDoc.length > 0 ? exactDoc : nibPartial.length > 0 ? nibPartial : byName;

    if (matches.length === 0) {
      return ok({ found: false, reason: "NOT_FOUND" });
    }

    if (matches.length > 1) {
      // Beberapa kandidat — kembalikan daftar ringkas agar pengguna memilih.
      return ok({
        found: false,
        reason: "MULTIPLE",
        candidates: matches.map((c) => ({
          id: c.id,
          nib: c.nib,
          name: c.name,
          legalEntity: c.legalEntity,
          city: c.city,
          province: c.province,
          docCount: c.docs.length,
        })),
      });
    }

    const company = matches[0];
    const docs: EngineDoc[] = company.docs.map((d) => ({
      requirementKey: d.requirementKey,
      docNo: d.docNo,
      issuedBy: d.issuedBy,
      validUntil: d.validUntil ? d.validUntil.toISOString() : null,
    }));

    const scan = buildScan(
      {
        nib: company.nib,
        name: company.name,
        legalEntity: company.legalEntity,
        city: company.city,
        province: company.province,
        note: company.note,
      },
      docs
    );

    return ok({ found: true as const, scannedAt: new Date().toISOString(), scan });
  } catch {
    return fail("Gagal memindai — silakan coba lagi.", 500);
  }
}
