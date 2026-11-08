/**
 * v11 — KEANGGOTAAN POWER PACK (benchmark fitur Nusuk.sa).
 *
 * Engine bersama untuk: KTA Digital (kartu anggota ber-QR + tier),
 * poin loyalty (buku besar PointLedger), kode referal, sertifikat,
 * kode booking & tebusan benefit.
 *
 * Prinsip:
 *  - Semua nomor kode deterministik-unik & aman dibaca manusia.
 *  - Setiap perubahan poin lewat awardPoints() → tercatat di PointLedger
 *    dengan saldo akhir (audit-friendly) + tier dihitung ulang otomatis.
 *  - Terbit kartu idempoten (satu Member maksimal satu KTA).
 */
import { createHash, randomInt } from "crypto";
import { db } from "@/lib/db";

// ---------- Tier ----------
export const TIERS = ["KLASIK", "VERIFIED", "PLATINUM"] as const;
export type Tier = (typeof TIERS)[number];

/** Ambang poin tier: KLASIK < 300 ≤ VERIFIED < 800 ≤ PLATINUM. */
export const TIER_THRESHOLDS = { VERIFIED: 300, PLATINUM: 800 } as const;

export function tierFor(points: number): Tier {
  if (points >= TIER_THRESHOLDS.PLATINUM) return "PLATINUM";
  if (points >= TIER_THRESHOLDS.VERIFIED) return "VERIFIED";
  return "KLASIK";
}

// ---------- Kode unik ----------
function digits(n: number): string {
  return String(randomInt(0, 10 ** n)).padStart(n, "0");
}

/** Nomor KTA: KTA-2026-00001 (sekuens per tahun). */
export async function generateCardNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.memberCard.count();
  return `KTA-${year}-${String(count + 1).padStart(5, "0")}`;
}

/** Kode referal stabil dari id kartu: MHD-REF-8HEXA. */
export function generateReferralCode(cardId: string): string {
  const hash = createHash("sha256").update(`ref:${cardId}`).digest("hex");
  return `MHD-REF-${hash.slice(0, 8).toUpperCase()}`;
}

/** Kode acak berprefix: BKG / BNF / SERT. */
export async function generateSerial(prefix: "BKG" | "BNF" | "SERT"): Promise<string> {
  const year = new Date().getFullYear();
  const seq: Record<string, number> = {
    BKG: await db.slotBooking.count(),
    BNF: await db.benefitRedemption.count(),
    SERT: await db.certificate.count(),
  };
  return `${prefix}-${year}-${digits(4)}${String(seq[prefix] + 1).padStart(4, "0")}`;
}

// ---------- Poin ----------
export type PointReason = "REGISTER" | "REFERRAL" | "ACADEMY" | "BOOKING" | "REDEEM" | "ADMIN";

export const POINT_RULES = {
  REGISTER: 50,
  REFERRAL: 100,
  ACADEMY: 0, // dinamis per kursus (rewardPoints)
} as const;

/**
 * Tambah/kurangi poin satu kartu + catat ledger + hitung ulang tier.
 * delta boleh negatif (redeem). Mengembalikan kartu terbaru.
 */
export async function awardPoints(
  cardId: string,
  delta: number,
  reason: PointReason,
  note?: string
) {
  const card = await db.memberCard.findUnique({ where: { id: cardId } });
  if (!card) throw new Error("Kartu tidak ditemukan.");
  const balanceAfter = Math.max(0, card.points + delta);
  const [updated] = await db.$transaction([
    db.pointLedger.create({
      data: { cardId, delta, reason, note: note ?? null, balanceAfter },
    }),
    db.memberCard.update({
      where: { id: cardId },
      data: { points: balanceAfter, tier: tierFor(balanceAfter) },
    }),
  ]);
  return updated;
}

// ---------- Terbit KTA ----------
/** Terbitkan KTA untuk satu member (idempoten — kartu lama dikembalikan). */
export async function issueCardForMember(memberId: string) {
  const existing = await db.memberCard.findUnique({ where: { memberId } });
  if (existing) return { card: existing, created: false };
  const cardNo = await generateCardNo();
  const card = await db.memberCard.create({
    data: { cardNo, memberId, referralCode: "" },
  });
  const created = await db.memberCard.update({
    where: { id: card.id },
    data: { referralCode: generateReferralCode(card.id) },
  });
  await awardPoints(created.id, POINT_RULES.REGISTER, "REGISTER", "Pendaftaran awal KTA Digital");
  return { card: created, created: true };
}

/** Terbitkan KTA untuk semua Member TERVERIFIKASI yang belum punya kartu. */
export async function issueMissingCards() {
  const members = await db.member.findMany({
    where: { status: "TERVERIFIKASI", card: null },
    select: { id: true },
  });
  let issued = 0;
  for (const m of members) {
    await issueCardForMember(m.id);
    issued += 1;
  }
  return { issued, scanned: members.length };
}

/** Cari kartu dari kode referal (untuk hadiah poin perujuk). */
export async function findCardByReferral(code: string) {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  return db.memberCard.findFirst({
    where: { referralCode: clean, status: "ACTIVE" },
    include: { member: { select: { name: true, type: true } } },
  });
}
