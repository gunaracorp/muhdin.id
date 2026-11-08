/**
 * seed-compliance.ts — v12.1 GOD-MODE IZIN COMPLIANCE CHECKER.
 *
 * Mengisi riwayat audit kepatuhan demo yang realistis untuk papan tren:
 *   • 2 audit historis (±45 & ±20 hari lalu) + 1 kondisi terkini
 *   • Snapshot ComplianceScore per perusahaan per titik waktu (tren naik)
 *   • Temuan ComplianceFinding berprioritas (tier engine a–l)
 *
 * Idempoten: dilewati bila sudah ada ComplianceAudit.
 * Jalankan: npx tsx scripts/seed-compliance.ts
 */
import { PrismaClient } from "@prisma/client";
import { auditCompany, gradeOf, type Grade } from "../src/lib/compliance-engine";

const db = new PrismaClient();

const DAY = 86_400_000;

/** Agregat audit dari daftar skor (untuk baris audit historis). */
function aggregate(scores: number[]) {
  const total = scores.length;
  const avg = total ? scores.reduce((s, x) => s + x, 0) / total : 0;
  let passed = 0;
  let warnings = 0;
  let critical = 0;
  for (const g of scores.map(gradeOf) as Grade[]) {
    if (g === "A" || g === "B") passed += 1;
    else if (g === "C" || g === "D") warnings += 1;
    else critical += 1;
  }
  return { total, avg, passed, warnings, critical };
}

async function main() {
  const existing = await db.complianceAudit.count();
  if (existing > 0) {
    console.log(`⏭️  ComplianceAudit sudah ada (${existing}) — seed dilewati (idempoten).`);
    return;
  }

  const companies = await db.registryCompany.findMany({ include: { docs: true }, orderBy: { name: "asc" } });
  if (companies.length === 0) {
    console.log("⚠️  Registri kosong — jalankan seed registri terlebih dahulu.");
    return;
  }

  // Nilai kondisi terkini semua perusahaan sekali (dasar tren historis).
  const results = companies.map((c) => ({
    company: c,
    ...auditCompany(
      { nib: c.nib, name: c.name, legalEntity: c.legalEntity, city: c.city, province: c.province, note: c.note },
      c.docs.map((d) => ({
        requirementKey: d.requirementKey,
        docNo: d.docNo,
        issuedBy: d.issuedBy,
        validUntil: d.validUntil ? d.validUntil.toISOString() : null,
      }))
    ),
  }));

  const now = Date.now();
  const points: { daysAgo: number; delta: number; label: string }[] = [
    { daysAgo: 45, delta: -8, label: "Audit Q3 — pemeriksaan menyeluruh" },
    { daysAgo: 20, delta: -4, label: "Audit tindak lanjut — verifikasi perbaikan dokumen" },
  ];

  for (const p of points) {
    const at = new Date(now - p.daysAgo * DAY);
    const scores = results.map((r) => Math.max(0, r.scan.score + p.delta));
    const agg = aggregate(scores);
    const audit = await db.complianceAudit.create({
      data: {
        scope: "ALL",
        triggeredBy: "system",
        total: agg.total,
        passed: agg.passed,
        warnings: agg.warnings,
        critical: agg.critical,
        avgScore: agg.avg,
        expiredDocs: results.reduce((s, r) => s + r.scan.summary.expired, 0) + (p.delta < -4 ? 1 : 0),
        expiringDocs: results.reduce((s, r) => s + r.scan.summary.expiring, 0),
        missingDocs: results.reduce((s, r) => s + r.scan.summary.missing, 0),
        notified: true,
        note: p.label,
        startedAt: at,
        finishedAt: new Date(at.getTime() + 90_000),
      },
    });

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const score = Math.max(0, r.scan.score + p.delta);
      await db.complianceScore.create({
        data: {
          companyId: r.company.id,
          score,
          grade: gradeOf(score),
          risk: r.risk,
          heldClasses: JSON.stringify(r.scan.heldClasses),
          currentClass: r.scan.currentClass,
          validCount: r.scan.summary.valid,
          expiringCount: r.scan.summary.expiring,
          expiredCount: r.scan.summary.expired,
          missingCount: r.scan.summary.missing,
          checkedAt: at,
        },
      });
      // Historis: temuan sama, ditambah satu temuan MISSING pada audit terlama
      // (menggambarkan dokumen yang belum direkam kini sudah masuk).
      const findings = p.delta <= -8 ? r.findings : r.findings.slice(0, Math.max(0, r.findings.length - 1));
      if (findings.length > 0) {
        await db.complianceFinding.createMany({
          data: findings.map((f) => ({
            auditId: audit.id,
            companyId: r.company.id,
            companyName: r.company.name,
            companyNib: r.company.nib,
            requirementKey: f.requirementKey,
            letter: f.letter,
            category: f.category,
            relevance: f.relevance,
            status: f.status,
            tier: f.tier,
            severity: f.severity,
            message: f.message,
            createdAt: at,
          })),
        });
      }
    }
    console.log(`✅ Audit historis ${p.daysAgo} hari lalu: ${agg.total} perusahaan, rata-rata ${Math.round(agg.avg)}`);
  }

  // Snapshot kondisi terkini (hari ini) — tanpa baris audit, hanya skor + temuan
  // berjalan agar papan tren langsung punya titik "sekarang".
  for (const r of results) {
    await db.complianceScore.create({
      data: {
        companyId: r.company.id,
        score: r.scan.score,
        grade: r.grade,
        risk: r.risk,
        heldClasses: JSON.stringify(r.scan.heldClasses),
        currentClass: r.scan.currentClass,
        validCount: r.scan.summary.valid,
        expiringCount: r.scan.summary.expiring,
        expiredCount: r.scan.summary.expired,
        missingCount: r.scan.summary.missing,
        checkedAt: new Date(),
      },
    });
  }

  console.log(`🎉 Seed compliance selesai — ${companies.length} perusahaan × 3 titik waktu.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
