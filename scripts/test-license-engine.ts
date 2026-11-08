/**
 * Uji cepat engine Pindai Izin (bun scripts/test-license-engine.ts).
 * Kasus: PT Arofah Global — BPW murni, akreditasi mati, tanpa PPIU/PIHK/IATA.
 */
import { buildScan } from "../src/lib/license-engine";

const arofah = { nib: "8120012345678", name: "PT Arofah Global", legalEntity: "PT", city: "Jakarta Selatan", province: "DKI Jakarta" };
const docs = [
  { requirementKey: "NIB", docNo: "8120012345678", validUntil: null },
  { requirementKey: "AKTA", docNo: "AHU-0098776", validUntil: null },
  { requirementKey: "NPWP", docNo: "01.234.567.8-091.000", validUntil: null },
  { requirementKey: "BPW", docNo: "NIB-BPW/79120", validUntil: new Date(Date.now() + 800 * 86400000) },
  { requirementKey: "PPIU_AKREDITASI", docNo: "AKR-PPIU/2021/331", validUntil: new Date(Date.now() - 400 * 86400000) },
];

const r = buildScan(arofah, docs);
console.log(JSON.stringify({
  classStatus: r.classStatus,
  held: r.heldClasses,
  current: r.currentClass,
  next: r.nextClass,
  score: r.score,
  summary: r.summary,
  reco: r.recommendations.map((x) => `${x.letter}:${x.key}:${x.status}:t${x.tier}`),
}, null, 1));

// Ekspektasi: BPW aktif; jalur naik ke PPIU (e dulu, baru f); akreditasi mati = EXPIRED;
// PIHK/escrow/SDM/asuransi menyusul; nilai tambah i & l terakhir.
const ok =
  r.classStatus.BPW === "AKTIF" &&
  r.classStatus.PPIU === "TIDAK_ADA" &&
  r.classStatus.PIHK === "TIDAK_ADA" &&
  r.nextClass === "PPIU" &&
  r.recommendations.map((x) => x.letter).join("") === "efghjkil" &&
  r.recommendations[1].key === "PPIU_AKREDITASI" &&
  r.recommendations[1].status === "EXPIRED" &&
  r.summary.expired === 1 &&
  r.score >= 30 && r.score <= 60;
console.log(ok ? "✅ ENGINE OK" : "❌ ENGINE MISMATCH");
if (!ok) process.exit(1);
