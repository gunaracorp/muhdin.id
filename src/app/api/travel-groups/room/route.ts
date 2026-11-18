import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";

/**
 * R-012 (v13.3) — Ruang grup perjalanan (portal publik berbasis KODE GRUP).
 * GET ?code=MHD-GR-XXXX: seluruh isi ruang — profil grup, kontak marshal,
 * daftar anggota, jadwal kumpul (mendatang dulu), dan 60 pesan terakhir.
 * Gerbang aksesnya kode grup yang dibagikan panitia ke jamaah rombongan.
 */

const CHAT_TAKE = 60;

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
    if (!code) return fail("Kode grup wajib diisi.");

    const group = await db.travelGroup.findUnique({
      where: { code },
      include: {
        pkg: { select: { id: true, title: true, departureDate: true, city: true } },
        members: { orderBy: [{ role: "desc" }, { joinedAt: "asc" }] },
        schedules: { orderBy: { startsAt: "asc" } },
        messages: { orderBy: { createdAt: "desc" }, take: CHAT_TAKE },
      },
    });
    if (!group) return fail("Kode grup tidak ditemukan. Periksa kembali kode dari panitia Anda.", 404);
    if (group.status !== "ACTIVE") return fail("Grup ini sudah diarsipkan — hubungi panitia bila perlu akses.", 403);

    // Pesan dikirim terlama-dulu untuk render chat; jadwal dipisah mendatang/lewat.
    const now = Date.now();
    return ok({
      group: {
        id: group.id,
        code: group.code,
        name: group.name,
        departureDate: group.departureDate,
        marshalName: group.marshalName,
        marshalPhone: group.marshalPhone,
        notes: group.notes,
        pkg: group.pkg,
      },
      members: group.members.map((m) => ({ id: m.id, fullName: m.fullName, phone: m.phone, role: m.role, cardNo: m.cardNo })),
      schedules: group.schedules.map((s) => ({ id: s.id, title: s.title, location: s.location, startsAt: s.startsAt, note: s.note, past: s.startsAt.getTime() < now })),
      messages: [...group.messages].reverse().map((m) => ({ id: m.id, authorName: m.authorName, body: m.body, createdAt: m.createdAt })),
    });
  } catch {
    return fail("Gagal memuat ruang grup.", 500);
  }
}
