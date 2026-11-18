import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail, parseIntOr } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { logAudit } from "@/lib/audit";

/**
 * R-023 (v13.3) — Bank Soal Manasik Berjenjang.
 * GET  publik ?level=DASAR|LANJUTAN|MENTOR&n=10: sesi latihan — soal teracak
 *              + opsi teracak server-side, TANPA kunci jawaban/pembahasan.
 * POST publik (rateLimit 12/menit/IP) mode "submit": koreksi server-side —
 *              skor + jawaban benar + pembahasan per butir.
 * POST admin [SUPER_ADMIN, ADMIN, EDITOR]: tambah butir soal (opsi tersimpan
 *              dalam urutan asli; pengacakan hanya terjadi saat menyajikan).
 * DELETE admin ?id=: hapus butir.
 */

const LEVELS = ["DASAR", "LANJUTAN", "MENTOR"] as const;
const MAX_N = 20;

/** Fisher-Yates di atas salinan array — murni, tanpa mutasi input. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface SoalRow {
  id: string;
  level: string;
  category: string;
  question: string;
  options: string;
  answerIdx: number;
  explanation: string;
}

/** Susun butir untuk sesi latihan: opsi teracak; kunci & pembahasan tak dikirim. */
function toExercise(r: SoalRow) {
  let opts: string[] = [];
  try {
    const parsed: unknown = JSON.parse(r.options);
    if (Array.isArray(parsed)) opts = parsed.map((o) => String(o));
  } catch {
    opts = [];
  }
  return {
    id: r.id,
    level: r.level,
    category: r.category,
    question: r.question,
    options: shuffle(opts),
  };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const level = (sp.get("level") || "DASAR").toUpperCase();
    if (!LEVELS.includes(level as (typeof LEVELS)[number])) return fail("Level harus DASAR, LANJUTAN, atau MENTOR.");
    const n = Math.min(MAX_N, Math.max(1, parseIntOr(sp.get("n"), 10)));

    const rows = (await db.soalManasik.findMany({
      where: { level, active: true },
      orderBy: { createdAt: "desc" },
    })) as unknown as SoalRow[];

    const picked = shuffle(rows).slice(0, n);
    return ok({ level, total: rows.length, soal: picked.map(toExercise) });
  } catch {
    return fail("Gagal memuat bank soal manasik.", 500);
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail("Data tidak valid.");

  // ===== Koreksi sesi latihan (publik, rate-limited) =====
  if (body.mode === "submit") {
    if (!rateLimit(req, "soal-submit", 12, 60_000)) {
      return fail("Terlalu banyak pengajuan latihan. Sebentar lagi, ya.", 429);
    }
    const level = String(body.level || "").toUpperCase();
    if (!LEVELS.includes(level as (typeof LEVELS)[number])) return fail("Level tidak valid.");
    const answers = Array.isArray(body.answers) ? (body.answers as { id?: unknown; idx?: unknown }[]) : [];
    if (answers.length === 0) return fail("Tidak ada jawaban untuk dinilai.");
    if (answers.length > MAX_N) return fail("Jumlah jawaban melebihi batas sesi.");

    const ids = answers.map((a) => String(a.id || "")).filter(Boolean);
    const rows = await db.soalManasik.findMany({ where: { id: { in: ids }, level, active: true } });
    const byId = new Map(rows.map((r) => [r.id, r]));

    let correctCount = 0;
    const result = answers
      .map((a) => {
        const row = byId.get(String(a.id || ""));
        if (!row) return null;
        let opts: string[] = [];
        try {
          const parsed: unknown = JSON.parse(row.options);
          if (Array.isArray(parsed)) opts = parsed.map((o) => String(o));
        } catch {
          opts = [];
        }
        const chosen = Math.floor(Number(a.idx));
        const isCorrect = chosen === row.answerIdx;
        if (isCorrect) correctCount++;
        return {
          id: row.id,
          question: row.question,
          chosenIdx: Number.isFinite(chosen) ? chosen : -1,
          correctIdx: row.answerIdx,
          correctText: opts[row.answerIdx] ?? "",
          isCorrect,
          explanation: row.explanation,
        };
      })
      .filter(Boolean) as {
      id: string;
      question: string;
      chosenIdx: number;
      correctIdx: number;
      correctText: string;
      isCorrect: boolean;
      explanation: string;
    }[];

    const score = result.length > 0 ? Math.round((correctCount / result.length) * 100) : 0;
    return ok({ level, total: result.length, correct: correctCount, score });
  }

  // ===== Tambah butir (admin) =====
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;

  const level = String(body.level || "").toUpperCase();
  if (!LEVELS.includes(level as (typeof LEVELS)[number])) return fail("Level harus DASAR, LANJUTAN, atau MENTOR.");
  const question = String(body.question || "").trim();
  if (question.length < 10) return fail("Pertanyaan minimal 10 karakter.");
  const options = Array.isArray(body.options) ? (body.options as unknown[]).map((o) => String(o).trim()).filter(Boolean) : [];
  if (options.length < 2 || options.length > 6) return fail("Opsi harus 2–6 pilihan.");
  const answerIdx = Math.floor(Number(body.answerIdx));
  if (!Number.isFinite(answerIdx) || answerIdx < 0 || answerIdx >= options.length) return fail("Indeks jawaban benar tidak sesuai daftar opsi.");

  const row = await db.soalManasik.create({
    data: {
      level,
      category: ["UMUM", "RUKUN", "LARANGAN", "DOA", "WAKTU", "WANITA"].includes(String(body.category))
        ? String(body.category)
        : "UMUM",
      question,
      options: JSON.stringify(options),
      answerIdx,
      explanation: String(body.explanation || "").trim(),
      active: body.active === false ? false : true,
    },
  });

  void logAudit(req, { action: "CREATE", entity: "SoalManasik", entityId: row.id, detail: `${level}: ${question.slice(0, 60)}` });
  return ok(row, 201);
}

export async function DELETE(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const id = req.nextUrl.searchParams.get("id")?.trim();
    if (!id) return fail("Parameter id wajib.");
    const row = await db.soalManasik.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "SoalManasik", entityId: id, detail: row.level });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus butir soal.", 500);
  }
}
