/**
 * Task 22 — LOOKUP IZIN CERDAS (publik): isi otomatis formulir dari registri.
 * GET /api/members/lookup?licenseNo=<nomor izin>
 *
 * Pembandingan berlapis agar penulisan manusiawi tetap cocok:
 *   1) sama persis setelah dinormalisasi (huruf kecil, tanpa tanda baca/spasi)
 *   2) berisi kueri / kueri berisi nomor (izin gabung "U.159/2020 / 552/2018")
 *   3) kesamaan angka saja (hanya angka, ≥6 digit — "7832019" ⇔ "KMA 783/2019")
 *   4) nama perusahaan mengandung kueri (bila kueri bukan angka)
 * Rate limit 30/menit/IP. Tidak mengekspos kolom internal (id/createdAt…).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const digits = (s: string) => s.replace(/\D+/g, "");

export async function GET(req: NextRequest) {
  if (!rateLimit(req, "member-lookup", 30, 60_000)) {
    return fail("Terlalu banyak permintaan — coba lagi sebentar lagi.", 429);
  }
  try {
    const q = (req.nextUrl.searchParams.get("licenseNo") || "").trim();
    if (q.length < 4) return fail("Masukkan nomor izin (minimal 4 karakter).", 422);

    const members = await db.member.findMany({
      select: {
        licenseNo: true, name: true, type: true, city: true, province: true,
        phone: true, email: true, website: true, description: true,
        status: true, memberSince: true, rating: true,
      },
      orderBy: { name: "asc" },
    });

    const nq = norm(q);
    const dq = digits(q);
    // Guard: nomor izin yang ternormalisasi jadi kosong (mis. "—") tidak boleh cocok apa pun.
    const lic = (m: { licenseNo: string }) => norm(m.licenseNo);
    const hit =
      members.find((m) => lic(m) && lic(m) === nq) ||
      (nq.length >= 5 ? members.find((m) => lic(m).length >= 5 && (lic(m).includes(nq) || nq.includes(lic(m)))) : undefined) ||
      (dq.length >= 6 ? members.find((m) => digits(m.licenseNo) === dq) : undefined) ||
      (dq.length >= 6 ? members.find((m) => { const d = digits(m.licenseNo); return d.length >= 6 && (d.includes(dq) || dq.includes(d)); }) : undefined) ||
      members.find((m) => m.name.toLowerCase().includes(q.toLowerCase()));

    if (!hit) return ok({ found: false });

    return ok({
      found: true,
      member: {
        licenseNo: hit.licenseNo, name: hit.name, type: hit.type, city: hit.city,
        province: hit.province, phone: hit.phone, email: hit.email, website: hit.website,
        description: hit.description, status: hit.status, memberSince: hit.memberSince,
        rating: hit.rating,
      },
    });
  } catch {
    return fail("Gagal mencari data izin.", 500);
  }
}
