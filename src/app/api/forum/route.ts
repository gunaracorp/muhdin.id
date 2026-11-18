import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { spamScore } from "@/lib/anti-spam";
import { safeBody, ForumThreadSchema } from "@/lib/validation";

/**
 * v5.0 — Forum Jamaah.
 * GET  publik: daftar thread APPROVED (+ jumlah balasan disetujui),
 *              urut pinned → terbaru. Filter ?category= &q= &kelasId=
 *              (R-025 forum per-kelas; thread terikat kelas Akademi live).
 * POST publik (rate limit 3/menit/IP): ajukan thread baru → status PENDING
 *              (moderasi CMS sebelum tampil publik). R-081: bentuk payload
 *              divalidasi Zod di gerbang; R-025: kelasId opsional divalidasi.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const category = sp.get("category");
    const q = sp.get("q")?.trim();
    const kelasId = sp.get("kelasId")?.trim();

    const where: Record<string, unknown> = { status: "APPROVED" };
    if (category) where.category = category;
    if (kelasId) where.kelasId = kelasId;
    if (q) {
      where.OR = [{ title: { contains: q } }, { body: { contains: q } }, { authorName: { contains: q } }];
    }

    const threads = await db.forumThread.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { replies: { where: { status: "APPROVED" } } } },
        kelas: { select: { title: true, level: true } },
      },
    });

    return ok(
      threads.map((t) => ({
        id: t.id,
        title: t.title,
        body: t.body,
        authorName: t.authorName,
        category: t.category,
        kelasId: t.kelasId,
        kelasTitle: t.kelas?.title ?? null,
        status: t.status,
        pinned: t.pinned,
        views: t.views,
        replyCount: t._count.replies,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }))
    );
  } catch {
    return fail("Gagal memuat diskusi.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "forum-thread", 3, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const parsed = safeBody(ForumThreadSchema, body);
    if (!parsed.ok) return fail(parsed.error);
    const { title, body: threadBody, authorName, authorContact, category, kelasId } = parsed.data;

    // R-025 — kelasId opsional harus merujuk kelas yang benar-benar ada.
    if (kelasId) {
      const kelas = await db.liveClass.findUnique({ where: { id: kelasId } });
      if (!kelas) return fail("Kelas diskusi tidak ditemukan.");
    }

    // R-082 — filter anti-spam otomatis sebelum masuk antrean moderasi.
    const verdict = await spamScore({ title, text: threadBody, authorContact, entity: "thread" });
    if (verdict.action === "BLOCK") {
      return fail("Kiriman terdeteksi spam oleh filter otomatis. Sampaikan tanpa tautan/promosi.", 422);
    }

    const thread = await db.forumThread.create({
      data: {
        title,
        body: threadBody,
        authorName,
        authorContact,
        category: ["Manasik", "Dokumen", "Perjalanan", "Akomodasi", "Biaya", "Lainnya"].includes(category)
          ? category
          : "Lainnya",
        kelasId: kelasId || null,
        status: "PENDING",
        spamScore: verdict.score,
        spamReasons: verdict.reasons.length ? verdict.reasons.join("; ") : null,
      },
    });

    return ok(
      {
        id: thread.id,
        message:
          verdict.action === "HOLD"
            ? "Diskusi terkirim dan masuk antrean moderasi prioritas (tertanda filter spam). Terima kasih!"
            : "Diskusi Anda terkirim dan menunggu moderasi tim MUHDIN. Terima kasih!",
      },
      201
    );
  } catch {
    return fail("Gagal mengirim diskusi.", 500);
  }
}
