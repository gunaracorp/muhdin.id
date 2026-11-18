import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

/**
 * R-012 (v13.3) — Bergabung ke grup perjalanan dengan KODE (publik).
 * POST (rateLimit 6/menit/IP): { code, fullName, phone, cardNo? } → anggota baru.
 * Kartu jamaah (bila diisi) divalidasi — tautan antara anggota grup dan kartu QR.
 */

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "grup-join", 6, 60_000)) {
    return fail("Terlalu banyak percobaan bergabung. Coba lagi beberapa menit.", 429);
  }
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return fail("Data tidak valid.");

    const code = String(body.code || "").trim().toUpperCase();
    if (!code) return fail("Kode grup wajib diisi.");
    const fullName = String(body.fullName || "").trim();
    if (fullName.length < 3) return fail("Nama lengkap minimal 3 karakter.");
    const phone = String(body.phone || "").trim();
    if (phone && !/^[+0-9 ()-]{6,20}$/.test(phone)) return fail("Nomor WhatsApp tidak valid.");

    const group = await db.travelGroup.findUnique({ where: { code } });
    if (!group) return fail("Kode grup tidak ditemukan. Periksa kode dari panitia Anda.", 404);
    if (group.status !== "ACTIVE") return fail("Grup ini sudah diarsipkan.", 403);

    let cardNo: string | null = null;
    if (body.cardNo) {
      const card = await db.pilgrimCard.findUnique({
        where: { cardNo: String(body.cardNo).trim().toUpperCase() },
        select: { cardNo: true, status: true, fullName: true },
      });
      if (!card) return fail("Kartu jamaah tidak ditemukan — biarkan kosong bila belum punya kartu.", 404);
      if (card.status !== "ACTIVE") return fail("Kartu jamaah tidak aktif — hubungi panitia MUHDIN.", 403);
      cardNo = card.cardNo;
    }

    // Dedupe: nama identik pada grup yang sama tidak didaftarkan dua kali.
    const dup = await db.groupMember.findFirst({ where: { groupId: group.id, fullName } });
    if (dup) return fail("Nama tersebut sudah terdaftar di grup ini.", 409);

    const member = await db.groupMember.create({
      data: { groupId: group.id, fullName, phone, cardNo, role: "ANGGOTA" },
    });

    return ok(
      {
        member: { id: member.id, fullName: member.fullName, role: member.role },
        group: { code: group.code, name: group.name },
      },
      201,
    );
  } catch {
    return fail("Gagal bergabung ke grup.", 500);
  }
}
