import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { safeBody, LiveClassRegisterSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";

/**
 * R-024 v14.1 — Pendaftaran publik kelas live (endpoint terpisah dari CRUD
 * admin): rate-limit 6/menit, satu nomor per kelas (anti ganda), kuota kelas
 * dicek server-side. Pengingat dua kanal (WA + push) menyusul menjelang kelas.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(req, "kelas-register", 6, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const parsed = safeBody(LiveClassRegisterSchema, body);
    if (!parsed.ok) return fail(parsed.error);

    const kelas = await db.liveClass.findUnique({ where: { id: parsed.data.classId } });
    if (!kelas) return fail("Kelas tidak ditemukan.", 404);
    if (kelas.status !== "SCHEDULED" && kelas.status !== "LIVE") {
      return fail("Kelas ini sudah ditutup untuk pendaftaran.");
    }
    const registered = await db.liveClassRegistration.count({ where: { classId: kelas.id } });
    if (registered >= kelas.capacity) {
      return fail("Kuota kelas sudah penuh — pantau kelas lain yang dibuka.");
    }
    const dup = await db.liveClassRegistration.findUnique({
      where: { classId_phone: { classId: kelas.id, phone: parsed.data.phone } },
    });
    if (dup) return fail("Nomor WhatsApp ini sudah terdaftar di kelas ini.");

    const reg = await db.liveClassRegistration.create({
      data: {
        classId: kelas.id,
        name: parsed.data.name,
        phone: parsed.data.phone,
      },
    });
    void logAudit(req, {
      action: "CREATE",
      entity: "LiveClassRegistration",
      entityId: reg.id,
      detail: `${parsed.data.name} → ${kelas.title}`,
    });
    return ok(
      {
        registration: { id: reg.id, classId: kelas.id, name: reg.name },
        class: { title: kelas.title, startsAt: kelas.startsAt, platform: kelas.platform, durationMin: kelas.durationMin },
        message: `Terdaftar di "${kelas.title}". Pengingat dikirim via WhatsApp & notifikasi sebelum kelas dimulai.`,
      },
      201
    );
  } catch {
    return fail("Gagal mendaftarkan kelas.", 500);
  }
}
