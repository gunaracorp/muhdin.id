import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { logAudit } from "@/lib/audit";

/**
 * v6.0 — Ulasan pasca-perjalanan TERVERIFIKASI (hilir). Keunggulan dari
 * kompetitor: hanya pemegang Kartu Jamaah MUHDIN berstatus ACTIVE yang dapat
 * mengulas — authorName diambil otomatis dari kartu, status awal PENDING.
 * GET  publik ?packageId=: ulasan APPROVED; ?status=all butuh sesi admin.
 * POST publik (rateLimit 5/menit/IP): kirim ulasan → PENDING.
 */

function clampRate(v: unknown, fallback = 5): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(5, Math.max(1, Math.round(n))) : fallback;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const packageId = sp.get("packageId");

    if (sp.get("status") === "all") {
      const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR", "EDITOR"]);
      if (denied) return denied;
      const rows = await db.pilgrimReview.findMany({
        where: packageId ? { packageId } : undefined,
        include: { pkg: { select: { id: true, title: true, type: true } } },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      });
      return ok(rows);
    }

    if (!packageId) return fail("packageId wajib diisi.");
    const [rows, aggregate] = await Promise.all([
      db.pilgrimReview.findMany({
        where: { packageId, status: "APPROVED" },
        orderBy: [{ createdAt: "desc" }],
        take: 50,
      }),
      db.pilgrimReview.aggregate({
        where: { packageId, status: "APPROVED" },
        _avg: { rating: true, hotelRate: true, transportRate: true, guideRate: true },
        _count: true,
      }),
    ]);
    // Sembunyikan cardNo penuh dari publik + lampirkan agregat (R-014).
    return ok({
      reviews: rows.map((r) => ({ ...r, cardNo: r.cardNo.slice(0, 8) + "••••" })),
      aggregate: {
        count: aggregate._count,
        avgRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(2)) : null,
        avgHotel: aggregate._avg.hotelRate ? Number(aggregate._avg.hotelRate.toFixed(2)) : null,
        avgTransport: aggregate._avg.transportRate ? Number(aggregate._avg.transportRate.toFixed(2)) : null,
        avgGuide: aggregate._avg.guideRate ? Number(aggregate._avg.guideRate.toFixed(2)) : null,
      },
    });
  } catch {
    return fail("Gagal memuat ulasan.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(req, "pilgrim-reviews", 5, 60_000)) {
      return fail("Terlalu banyak ulasan dikirim. Coba lagi beberapa menit lagi.", 429);
    }
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const packageId = String(body.packageId || "");
    if (!packageId) return fail("Paket wajib dipilih.");
    const pkg = await db.tourPackage.findUnique({ where: { id: packageId } });
    if (!pkg) return fail("Paket tidak ditemukan.", 404);

    const cardNo = String(body.cardNo || "").trim().toUpperCase();
    if (!cardNo) return fail("Nomor kartu jamaah wajib diisi (bukti Anda pernah berangkat).");
    const card = await db.pilgrimCard.findUnique({ where: { cardNo } });
    if (!card) return fail("Kartu jamaah tidak ditemukan. Ulasan hanya untuk pemegang kartu MUHDIN.", 404);
    if (card.status !== "ACTIVE") return fail("Kartu tidak aktif — ulasan tidak dapat dikirim.", 403);

    const text = String(body.body || "").trim();
    if (text.length < 15) return fail("Tulis ulasan minimal 15 karakter agar bermanfaat bagi jamaah lain.");
    if (text.length > 1200) return fail("Ulasan maksimal 1200 karakter.");

    // R-014 — satu ulasan per kartu per paket (cegah spam dan manipulasi rating).
    const duplicate = await db.pilgrimReview.findFirst({
      where: { packageId, cardNo, status: { in: ["PENDING", "APPROVED"] } },
      select: { id: true, status: true },
    });
    if (duplicate) {
      return fail(
        duplicate.status === "PENDING"
          ? "Anda sudah mengirim ulasan untuk paket ini — sedang menunggu moderasi."
          : "Anda sudah mengulas paket ini — satu ulasan per perjalanan.",
        409
      );
    }

    const review = await db.pilgrimReview.create({
      data: {
        packageId,
        cardNo,
        authorName: card.fullName, // identitas resmi dari kartu — tidak bisa dipalsukan
        rating: clampRate(body.rating),
        hotelRate: clampRate(body.hotelRate),
        transportRate: clampRate(body.transportRate),
        guideRate: clampRate(body.guideRate),
        body: text,
        status: "PENDING",
      },
    });

    void logAudit(req, { action: "CREATE", entity: "PilgrimReview", entityId: review.id, detail: `${cardNo} → ${pkg.title} (${review.rating}★)` });
    return ok({ success: true, message: "Ulasan terkirim — menunggu moderasi. Terima kasih telah berbagi pengalaman!" }, 201);
  } catch {
    return fail("Gagal mengirim ulasan.", 500);
  }
}
