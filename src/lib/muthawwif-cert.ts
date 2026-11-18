/**
 * muthawwif-cert.ts — R-021 Jalur Sertifikasi Muthawwif Berjenjang (v13.3).
 *
 * Tiga jenjang dengan syarat yang tegas dan terukur — bukan gelar kehormatan:
 *   DASAR    : lulus ujian manasik dasar (skor ≥ 70).
 *   LANJUTAN : lulus DASAR + jam pelayanan ≥ 200 + ujian jenjang ≥ 80.
 *   MENTOR   : lulus LANJUTAN + jam pelayanan ≥ 500 + ujian jenjang ≥ 85
 *              + pengalaman ≥ 3 tahun (membimbing & menguji).
 *
 * Evaluasi server-side murni dari data tercatat (jam, skor, jenjang lulus
 * sebelumnya) — MUHDIN tidak menaikkan jenjang tanpa bukti terukur.
 */

export const CERT_LEVELS = ["DASAR", "LANJUTAN", "MENTOR"] as const;
export type CertLevel = (typeof CERT_LEVELS)[number];

export interface CertRequirement {
  label: string;
  minScore: number;
  minHours: number;
  minYears: number;
  prior: CertLevel | null;
  /** Hak yang melekat pada jenjang (untuk tampilan jalur). */
  privileges: string;
}

export const CERT_REQUIREMENTS: Record<CertLevel, CertRequirement> = {
  DASAR: {
    label: "Dasar",
    minScore: 70,
    minHours: 0,
    minYears: 0,
    prior: null,
    privileges: "Membimbing rombongan umrah dengan pendampingan senior.",
  },
  LANJUTAN: {
    label: "Lanjutan",
    minScore: 80,
    minHours: 200,
    minYears: 0,
    prior: "DASAR",
    privileges: "Membimbing mandiri, termasuk rombongan lansia & keluarga.",
  },
  MENTOR: {
    label: "Mentor",
    minScore: 85,
    minHours: 500,
    minYears: 3,
    prior: "LANJUTAN",
    privileges: "Membimbing muthawwif junior, menguji ujian jenjang, calon manajer lapangan.",
  },
};

export interface CertCandidateData {
  examScore: number;
  serviceHours: number;
  experienceYears: number;
  /** Jenjang yang sudah PASSED (urut DASAR → MENTOR). */
  passedLevels: readonly string[];
}

export interface CertEvaluation {
  eligible: boolean;
  reasons: string[];
}

/** Evaluasi kelayakan satu jenjang dari data tercatat — gagal = daftar alasan. */
export function evaluateCert(level: CertLevel, c: CertCandidateData): CertEvaluation {
  const req = CERT_REQUIREMENTS[level];
  const reasons: string[] = [];

  if (req.prior && !c.passedLevels.includes(req.prior)) {
    reasons.push(`Harus lulus jenjang ${CERT_REQUIREMENTS[req.prior].label} lebih dahulu.`);
  }
  if (c.examScore < req.minScore) {
    reasons.push(`Skor ujian ${c.examScore} < syarat ${req.minScore}.`);
  }
  if (c.serviceHours < req.minHours) {
    reasons.push(`Jam pelayanan ${c.serviceHours} < syarat ${req.minHours} jam.`);
  }
  if (c.experienceYears < req.minYears) {
    reasons.push(`Pengalaman ${c.experienceYears} tahun < syarat ${req.minYears} tahun.`);
  }

  return { eligible: reasons.length === 0, reasons };
}

/** Nomor sertifikat internal: MHD-MT-<LEVEL>-<tahun>-<urut 4 digit>. */
export async function genCertNo(
  level: CertLevel,
  countFn: (startsWith: string) => Promise<number>,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MHD-MT-${level}-${year}-`;
  const n = (await countFn(prefix)) + 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

/** Jenjang tertinggi yang PASSED (untuk lencana portal) — null bila belum ada. */
export function highestPassedLevel(levels: readonly string[]): CertLevel | null {
  for (const lv of [...CERT_LEVELS].reverse()) {
    if (levels.includes(lv)) return lv;
  }
  return null;
}

/** Masa berlaku sertifikat 24 bulan — pembaruan lewat pencatatan ulang. */
export function certExpiryFrom(now: Date = new Date()): Date {
  return new Date(now.getTime() + 24 * 30 * 24 * 60 * 60 * 1000);
}
