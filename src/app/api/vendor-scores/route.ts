/**
 * Task 19 (R-047) — Skor Kualitas Vendor.
 *
 * GET  /api/vendor-scores  (guardRole SUPER_ADMIN/ADMIN/VERIFIKATOR)
 *      → daftar penyelenggara + komponen skor + nilai & grade tersimpan.
 * POST /api/vendor-scores  → hitung ulang & simpan skor seluruh anggota
 *      terverifikasi. Komposisi:
 *
 *   60% rating ulasan jamaah (rata-rata ulasan APPROVED atas paket milik
 *        penyelenggara, 1–5 → 0–100; belum dinilai = netral 75)
 *   25% kesehatan keluhan (CLOSED / total keluhan atas nama anggota;
 *        tanpa keluhan = netral 75 — keluhan dicocokkan via targetMember)
 *   15% aktivitas katalog (paket PUBLISHED; ≥3 penuh, proporsional)
 *   grade: A ≥85 · B ≥70 · C ≥55 · D <55
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

function gradeOf(score: number): "A" | "B" | "C" | "D" {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
}

async function computeFor(member: { id: string; name: string }) {
  const pkgs = await db.tourPackage.findMany({
    where: { memberId: member.id },
    select: { id: true, status: true, reviews: { where: { status: "APPROVED" }, select: { rating: true } } },
  });
  const allRatings = pkgs.flatMap((p) => p.reviews.map((r) => r.rating));
  const ratingScore = allRatings.length > 0
    ? ((allRatings.reduce((a, b) => a + b, 0) / allRatings.length - 1) / 4) * 100
    : 75;

  const complaints = await db.complaint.count({ where: { targetMember: member.name } });
  const complaintScore = complaints > 0
    ? (await db.complaint.count({ where: { targetMember: member.name, status: "CLOSED" } }) / complaints) * 100
    : 75;

  const published = pkgs.filter((p) => p.status === "PUBLISHED").length;
  const catalogScore = published >= 3 ? 100 : (published / 3) * 100;

  const score = Math.round(0.6 * ratingScore + 0.25 * complaintScore + 0.15 * catalogScore);
  return {
    score,
    grade: gradeOf(score),
    reviewCount: allRatings.length,
    avgRating: allRatings.length ? Number((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(2)) : null,
    complaintCount: complaints,
    publishedPackages: published,
  };
}

export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const members = await db.member.findMany({
      where: { status: "TERVERIFIKASI" },
      select: {
        id: true, name: true, type: true, city: true,
        qualityScore: true, qualityGrade: true, qualityUpdatedAt: true,
      },
      orderBy: [{ qualityScore: "desc" }, { name: "asc" }],
      take: 200,
    });
    const rows = await Promise.all(
      members.map(async (m) => ({ ...m, ...(await computeFor(m)) }))
    );
    rows.sort((a, b) => b.score - a.score);
    return ok({ rows });
  } catch {
    return fail("Gagal memuat skor vendor.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const members = await db.member.findMany({
      where: { status: "TERVERIFIKASI" },
      select: { id: true, name: true },
    });
    let updated = 0;
    for (const m of members) {
      const { score, grade } = await computeFor(m);
      await db.member.update({
        where: { id: m.id },
        data: { qualityScore: score, qualityGrade: grade, qualityUpdatedAt: new Date() },
      });
      updated++;
    }
    void logAudit(req, { action: "RECALC", entity: "VendorScore", detail: `${updated} anggota dinilai ulang` });
    return ok({ updated });
  } catch {
    return fail("Gagal menghitung ulang skor vendor.", 500);
  }
}
