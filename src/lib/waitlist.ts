/**
 * Task 19 (R-040) — mesin daftar tunggu otomatis.
 * Dipakai oleh route waitlist (GET publik list) dan titik pembebasan slot:
 * pembatalan order/booking maupun penambahan slot panitia.
 */
import { db } from "@/lib/db";
import { sendWhatsAppToNumber } from "@/lib/whatsapp";
import { logNotification } from "@/lib/email";

/** Tawarkan slot yang baru dibebaskan ke antrean teratas (atomik per entri). */
export async function offerWaitlistSlot(packageId: string, freeSlots: number): Promise<number> {
  if (freeSlots <= 0) return 0;
  const pkg = await db.tourPackage.findUnique({ where: { id: packageId }, select: { title: true, slots: true, slotsTaken: true } });
  if (!pkg || pkg.slotsTaken >= pkg.slots) return 0;

  const entries = await db.waitlistEntry.findMany({
    where: { packageId, status: "WAITING" },
    orderBy: { createdAt: "asc" },
    take: freeSlots,
  });
  let offered = 0;
  for (const e of entries) {
    const upd = await db.waitlistEntry.updateMany({
      where: { id: e.id, status: "WAITING" }, // atomik — anti ganda-tawaran
      data: { status: "OFFERED", offeredAt: new Date() },
    });
    if (upd.count === 0) continue;
    offered++;
    void sendWhatsAppToNumber(
      e.phone,
      `Assalamu'alaikum ${e.name}, kabar baik! Kursi "${pkg.title}" yang Anda tunggu telah tersedia (${e.quantity} orang). Hubungi panitia MUHDIN 0812 2234 5856 untuk konfirmasi dalam 24 jam. Terima kasih.`
    )
      .then((res) =>
        logNotification({
          channel: "WHATSAPP",
          eventType: "WAITLIST",
          status: res.sent ? "SENT" : "FAILED",
          recipient: e.phone,
          subject: `Tawaran kursi — ${pkg.title}`,
          detail: res.detail,
        }).catch(() => undefined)
      );
  }
  return offered;
}
