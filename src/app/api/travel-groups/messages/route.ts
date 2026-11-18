import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { logAudit } from "@/lib/audit";

/**
 * R-012 (v13.3) — Chat singkat grup perjalanan (portal, berbasis KODE).
 * GET  ?code=MHD-GR-XXXX&after=<ISO>: pesan terbaru untuk polling ringan.
 * POST (rateLimit 10/menit/IP): { code, authorName, body } → pesan baru
 *      (maks 500 karakter).
 * DELETE admin ?id=: moderasi CMS — hapus pesan bermasalah.
 */

const CHAT_TAKE = 60;
const MAX_LEN = 500;

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const code = sp.get("code")?.trim().toUpperCase();
    if (!code) return fail("Kode grup wajib diisi.");
    const group = await db.travelGroup.findUnique({ where: { code }, select: { id: true, status: true } });
    if (!group) return fail("Kode grup tidak ditemukan.", 404);

    const after = sp.get("after");
    const messages = await db.groupMessage.findMany({
      where: {
        groupId: group.id,
        ...(after ? { createdAt: { gt: new Date(after) } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: CHAT_TAKE,
    });
    return ok(messages);
  } catch {
    return fail("Gagal memuat pesan grup.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "grup-chat", 10, 60_000)) {
    return fail("Obrolan terlalu cepat. Tarik napas, lalu kirim lagi.", 429);
  }
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return fail("Data tidak valid.");

    const code = String(body.code || "").trim().toUpperCase();
    if (!code) return fail("Kode grup wajib diisi.");
    const authorName = String(body.authorName || "").trim();
    if (authorName.length < 2 || authorName.length > 40) return fail("Nama pengirim 2–40 karakter.");
    const text = String(body.body || "").trim();
    if (!text) return fail("Pesan tidak boleh kosong.");
    if (text.length > MAX_LEN) return fail(`Pesan maksimal ${MAX_LEN} karakter.`);

    const group = await db.travelGroup.findUnique({ where: { code }, select: { id: true, status: true } });
    if (!group) return fail("Kode grup tidak ditemukan.", 404);
    if (group.status !== "ACTIVE") return fail("Grup ini sudah diarsipkan — obrolan ditutup.", 403);

    const msg = await db.groupMessage.create({
      data: { groupId: group.id, authorName, body: text },
    });

    // Jaga ringan: buang pesan tertua bila ruang melebihi 300 baris.
    const total = await db.groupMessage.count({ where: { groupId: group.id } });
    if (total > 300) {
      const oldest = await db.groupMessage.findMany({
        where: { groupId: group.id },
        orderBy: { createdAt: "asc" },
        take: total - 300,
        select: { id: true },
      });
      await db.groupMessage.deleteMany({ where: { id: { in: oldest.map((o) => o.id) } } });
    }

    return ok(
      { id: msg.id, authorName: msg.authorName, body: msg.body, createdAt: msg.createdAt },
      201,
    );
  } catch {
    return fail("Gagal mengirim pesan.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const id = req.nextUrl.searchParams.get("id")?.trim();
    if (!id) return fail("Parameter id wajib.");
    const row = await db.groupMessage.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "GroupMessage", entityId: id, detail: `${row.authorName}: ${row.body.slice(0, 40)}` });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus pesan.", 500);
  }
}
