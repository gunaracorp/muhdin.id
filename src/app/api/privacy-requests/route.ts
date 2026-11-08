/**
 * Task 19 (R-078) — Hak Subjek Data Pribadi (UU PDP No. 27/2022 Pasal 5-13).
 *
 * POST /api/privacy-requests  (publik, rate-limit 5/menit)
 *   { type: "EXPORT"|"DELETE", name, contact, message? }
 *   → antrean PrivacyRequest PENDING + audit log.
 * GET /api/privacy-requests  (guardRole SUPER_ADMIN/ADMIN/VERIFIKATOR)
 *   → daftar antrean + statistik.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "privacy-requests", 5)) {
    return fail("Terlalu banyak permintaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    const type = String(body?.type || "").toUpperCase();
    const name = String(body?.name || "").trim();
    const contact = String(body?.contact || "").trim();
    const message = String(body?.message || "").trim();

    if (!["EXPORT", "DELETE"].includes(type)) return fail("Jenis permintaan tidak dikenal.");
    if (name.length < 2) return fail("Nama wajib diisi.");
    const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact);
    const isPhone = /^(\+?62|0)8\d{7,13}$/.test(contact.replace(/[\s-]/g, ""));
    if (!isEmail && !isPhone) return fail("Kontak wajib berupa email atau nomor WhatsApp yang valid.");
    if (type === "DELETE" && message.length < 10) {
      return fail("Untuk penghapusan data, jelaskan konteks permintaan (minimal 10 karakter).");
    }

    const pr = await db.privacyRequest.create({
      data: {
        type,
        name,
        contact: isPhone ? contact.replace(/[\s-]/g, "") : contact,
        message: message || null,
      },
    });

    void logAudit(req, {
      action: "CREATE",
      entity: "PrivacyRequest",
      entityId: pr.id,
      detail: `permintaan ${type} dari ${name}`,
    });

    return ok(
      {
        id: pr.id,
        type: pr.type,
        status: pr.status,
        guidance:
          type === "EXPORT"
            ? "Permintaan akses data diterima. Petugas verifikasi akan menghubungi Anda maksimal 3×24 jam kerja."
            : "Permintaan penghapusan diterima. Sesuai UU PDP, data wajib dihapus maksimal 3×24 jam kerja kecuali ada kewajiban hukum menyimpannya.",
      },
      201
    );
  } catch {
    return fail("Gagal mencatat permintaan. Coba lagi.", 500);
  }
}

export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const [rows, pending, processed] = await Promise.all([
      db.privacyRequest.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      db.privacyRequest.count({ where: { status: "PENDING" } }),
      db.privacyRequest.count({ where: { status: { not: "PENDING" } } }),
    ]);
    return ok({ rows, stats: { total: rows.length, pending, processed } });
  } catch {
    return fail("Gagal memuat permintaan PDP.", 500);
  }
}
