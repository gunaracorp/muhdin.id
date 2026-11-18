/**
 * R-098 v15.0.0 «GOD MODE» — Register kendali ISO 27001 (ISMS).
 * GET  : publik — daftar kendali per kategori + ringkasan kesiapan
 *        (cache 60 dtk) untuk seksi transparansi keamanan.
 * POST : CMS — tambah kendali (CrudManager).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardRole } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { cached, bustCache } from "@/lib/hot-cache";

export async function GET() {
  try {
    const controls = await cached("isms:list", 60_000, async () =>
      db.iSMSControl.findMany({ orderBy: { code: "asc" } }),
    );
    const summary = {
      total: controls.length,
      implemented: controls.filter((c) => c.status !== "PLANNED").length,
      verified: controls.filter((c) => c.status === "VERIFIED").length,
    };
    const readiness =
      controls.length > 0 ? Math.round((summary.implemented / summary.total) * 100) : 0;
    return ok({ summary, readiness, controls });
  } catch {
    return fail("Gagal memuat register kendali ISMS.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim().toUpperCase();
    const title = String(body.title || "").trim();
    if (!code || !title) return fail("Kode dan judul kendali wajib diisi.");
    const control = await db.iSMSControl.create({
      data: {
        code,
        title,
        category: String(body.category || "Teknologi"),
        status: String(body.status || "PLANNED").toUpperCase(),
        evidence: body.evidence ? String(body.evidence) : null,
      },
    });
    bustCache("isms:");
    void logAudit(req, {
      action: "CREATE",
      entity: "ISMSControl",
      entityId: control.id,
      detail: `kendali ${control.code} ditambahkan`,
    });
    return ok(control, 201);
  } catch {
    return fail("Gagal membuat kendali (kode mungkin sudah dipakai).", 500);
  }
}
