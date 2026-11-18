import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail, parseIntOr, slugify } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { describeRule } from "@/lib/pricing"; // R-043 — label promo musiman/early bird

/**
 * v5.0 — Marketplace Paket Ibadah.
 * GET  publik: daftar paket PUBLISHED (+ ?status=all utk admin, butuh sesi).
 *              Filter: ?type= &city= &q= ; urut featured → tanggal berangkat.
 * POST admin [SUPER_ADMIN, ADMIN, EDITOR]: buat paket milik anggota terverifikasi.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const statusParam = sp.get("status");
    let statusFilter: string | undefined = "PUBLISHED";
    if (statusParam === "all") {
      const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "VERIFIKATOR"]);
      if (denied) return denied;
      statusFilter = undefined;
    } else if (statusParam && statusParam !== "all") {
      statusFilter = statusParam;
    }

    const type = sp.get("type");
    const city = sp.get("city");
    const q = sp.get("q")?.trim();

    const where: Record<string, unknown> = { status: statusFilter };
    if (type) where.type = type;
    if (city) where.city = { contains: city };
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { city: { contains: q } },
        { member: { is: { name: { contains: q } } } },
      ];
    }

    const rows = await db.tourPackage.findMany({
      where,
      include: {
        member: {
          select: { id: true, name: true, type: true, city: true, licenseNo: true, status: true, rating: true },
        },
        // R-043 — aturan harga aktif ikut dikirim untuk badge promo katalog.
        priceRules: {
          where: { active: true },
          select: { kind: true, adjustType: true, value: true, monthFrom: true, monthTo: true, deadline: true, label: true },
        },
      },
      orderBy: [{ featured: "desc" }, { departureDate: "asc" }, { createdAt: "desc" }],
    });

    // Label promo ringkas per paket (Early Bird s.d. <tanggal> / Musim Nov–Feb).
    return ok(
      rows.map((p) => ({
        ...p,
        promos: (p.priceRules ?? []).slice(0, 2).map((r) => describeRule(r)),
      }))
    );
  } catch {
    return fail("Gagal memuat paket.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const memberId = String(body.memberId || "");
    const title = String(body.title || "").trim();
    if (!memberId) return fail("Anggota penyelenggara wajib dipilih.");
    if (title.length < 5) return fail("Judul paket minimal 5 karakter.");

    const member = await db.member.findUnique({ where: { id: memberId } });
    if (!member) return fail("Anggota tidak ditemukan.", 404);

    const price = parseIntOr(String(body.price ?? "") || null, 0) as number;
    const durationDays = parseIntOr(String(body.durationDays ?? "") || null, 9) as number;
    const slots = parseIntOr(String(body.slots ?? "") || null, 40) as number;
    const slotsTaken = parseIntOr(String(body.slotsTaken ?? "") || null, 0) as number;
    const departureDate = body.departureDate ? new Date(String(body.departureDate)) : null;
    if (departureDate && Number.isNaN(departureDate.getTime())) {
      return fail("Tanggal keberangkatan tidak valid.");
    }

    // R-057 SEO — slug landing unik otomatis dari judul bila tidak diisi.
    const slugBase = slugify(body.slug || title).slice(0, 80) || `paket-${Date.now().toString(36)}`;
    let slug = slugBase;
    let n = 2;
    while (await db.tourPackage.findUnique({ where: { slug } })) slug = `${slugBase}-${n++}`;

    const pkg = await db.tourPackage.create({
      data: {
        memberId,
        title,
        type: ["UMROH", "HAJI", "ZIARAH", "WISATA_ISLAMI"].includes(String(body.type)) ? String(body.type) : "UMROH",
        city: String(body.city || member.city || ""),
        description: String(body.description || ""),
        price: Math.max(0, price),
        durationDays: Math.max(1, durationDays),
        departureDate,
        slots: Math.max(1, slots),
        slotsTaken: Math.min(Math.max(0, slotsTaken), Math.max(1, slots)),
        hotelMakkah: String(body.hotelMakkah || ""),
        hotelMadinah: String(body.hotelMadinah || ""),
        airline: String(body.airline || ""),
        status: ["PUBLISHED", "DRAFT", "CLOSED"].includes(String(body.status)) ? String(body.status) : "PUBLISHED",
        featured: Boolean(body.featured),
        slug,
        image: body.image ? String(body.image) : null,
        metaDescription: body.metaDescription ? String(body.metaDescription).slice(0, 160) : null,
      },
      include: {
        member: {
          select: { id: true, name: true, type: true, city: true, licenseNo: true, status: true, rating: true },
        },
      },
    });

    void logAudit(req, { action: "CREATE", entity: "TourPackage", entityId: pkg.id, detail: pkg.title });
    return ok(pkg, 201);
  } catch {
    return fail("Gagal menambah paket.", 500);
  }
}
