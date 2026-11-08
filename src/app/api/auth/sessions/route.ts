import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-077 «Sesi & Device Management» (v13.0 «GERBANG»)
 *
 * GET    /api/auth/sessions           — daftar sesi aktif akun sendiri
 *                                       (perangkat, IP, terakhir aktif, penanda sesi ini).
 * DELETE /api/auth/sessions            — logout paksa:
 *   body { id }        → cabut satu sesi milik sendiri;
 *   body { all: true } → cabut SEMUA sesi lain milik sendiri (keep current);
 *   ?userId=…          → SUPER_ADMIN boleh mencabut sesi akun lain (keamanan insiden).
 */
export async function GET() {
  const me = await getSessionUser();
  if (!me) return fail("Tidak terautentikasi.", 401);
  try {
    const activeToken = await currentToken();
    const sessions = await db.session.findMany({
      where: { userId: me.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: "desc" },
      select: {
        id: true,
        device: true,
        ip: true,
        lastSeenAt: true,
        createdAt: true,
        expiresAt: true,
        token: true,
      },
    });
    return ok(
      sessions.map((s) => ({
        id: s.id,
        device: s.device || "Perangkat tidak dikenal",
        ip: s.ip,
        lastSeenAt: s.lastSeenAt,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        current: s.token === activeToken,
      })),
    );
  } catch (e) {
    console.error("[sessions GET]", e);
    return fail("Gagal memuat daftar sesi.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return fail("Tidak terautentikasi.", 401);
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const targetUserId = new URL(req.url).searchParams.get("userId") || me.id;
    // Hanya SUPER_ADMIN yang boleh menyentuh sesi akun lain.
    if (targetUserId !== me.id && me.role !== "SUPER_ADMIN") {
      return fail("Hanya Super Admin yang boleh mencabut sesi akun lain.", 403);
    }
    const activeToken = await currentToken();

    if (body.all) {
      const r = await db.session.updateMany({
        where: {
          userId: targetUserId,
          revokedAt: null,
          ...(targetUserId === me.id && activeToken ? { token: { not: activeToken } } : {}),
        },
        data: { revokedAt: new Date() },
      });
      void logAudit(req, {
        action: "SESSIONS_REVOKE_ALL",
        entity: "Session",
        entityId: targetUserId,
        detail: `${r.count} sesi dicabut${targetUserId === me.id ? " (selain sesi ini)" : ""}`,
      });
      return ok({ revoked: r.count });
    }

    const id = String(body.id || "");
    if (!id) return fail("id sesi wajib diisi (atau kirim all:true).");
    const target = await db.session.findUnique({ where: { id } });
    if (!target || target.revokedAt || target.expiresAt < new Date()) {
      return fail("Sesi tidak ditemukan / sudah berakhir.", 404);
    }
    if (target.userId !== me.id && me.role !== "SUPER_ADMIN") {
      return fail("Tidak berhak mencabut sesi ini.", 403);
    }
    await db.session.update({ where: { id }, data: { revokedAt: new Date() } });
    void logAudit(req, {
      action: "SESSION_REVOKE",
      entity: "Session",
      entityId: id,
      detail: `Perangkat "${target.device}" dicabut${target.userId === me.id ? "" : ` (akun ${targetUserId})`}`,
    });
    return ok({ revoked: 1 });
  } catch {
    return fail("Gagal mencabut sesi.", 500);
  }
}

async function currentToken(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return store.get("muhdin_session")?.value || null;
}
