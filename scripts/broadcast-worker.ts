/**
 * broadcast-worker.ts — Task 19 (R-094): eksekutor broadcast terjadwal.
 *
 * Memproses Broadcast berstatus SCHEDULED yang jadwalnya telah lewat:
 * render template per penerima ({{nama}}, {{tanggal}}), kirim berurutan
 * dengan jeda 700 ms, catat sentCount/failCount → status SENT/FAILED.
 *
 * Jalankan berkala (pilih salah satu):
 *   crontab — "every 5 minutes": cd /home/z/my-project && npx tsx scripts/broadcast-worker.ts >> logs/broadcast.log 2>&1
 *   pm2     — pm2 start scripts/broadcast-worker.ts --cron-restart (interval 5 menit) --no-autorestart
 *
 * Idempoten: hanya menyentuh baris berstatus SCHEDULED (guard updateMany).
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/* Modul WA portal dipakai ulang agar kontrak provider sama persis. */
import { sendWhatsAppToNumber } from "../src/lib/whatsapp";

async function resolveRecipients(audience: string): Promise<{ phone: string; name: string }[]> {
  if (audience === "KTA_ACTIVE") {
    const cards = await db.memberCard.findMany({
      where: { status: "ACTIVE" },
      include: { member: { select: { name: true, phone: true } } },
      take: 200,
    });
    return cards.filter((c) => c.member?.phone).map((c) => ({ phone: c.member!.phone as string, name: c.member.name }));
  }
  if (audience === "PENDING_ORDERS") {
    const orders = await db.order.findMany({
      where: { status: "PENDING" },
      select: { customerName: true, customerPhone: true },
      distinct: ["customerPhone"],
      take: 200,
    });
    return orders.map((o) => ({ phone: o.customerPhone, name: o.customerName }));
  }
  const members = await db.member.findMany({ where: { phone: { not: null } }, select: { name: true, phone: true }, take: 200 });
  return members.filter((m): m is { name: string; phone: string } => !!m.phone);
}

async function processDue() {
  const due = await db.broadcast.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
    take: 5,
  });
  for (const bc of due) {
    // Guard atomik: klaim pekerjaan agar dua worker tidak menggandakan kirim.
    const claim = await db.broadcast.updateMany({
      where: { id: bc.id, status: "SCHEDULED" },
      data: { status: "SENDING" },
    });
    if (claim.count === 0) continue;

    const recipients = await resolveRecipients(bc.audience);
    let sent = 0;
    let failed = 0;
    for (const r of recipients) {
      const msg = bc.template
        .replaceAll("{{nama}}", r.name)
        .replaceAll("{{tanggal}}", new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
      const res = await sendWhatsAppToNumber(r.phone, msg);
      if (res.sent) sent++;
      else failed++;
      await new Promise((r2) => setTimeout(r2, 700));
    }
    await db.broadcast.update({
      where: { id: bc.id },
      data: { status: sent > 0 ? "SENT" : "FAILED", sentCount: sent, failCount: failed, sentAt: new Date() },
    });
    console.log(`[broadcast] ${bc.title}: ${sent} terkirim, ${failed} gagal (${recipients.length} penerima).`);
  }
  if (due.length === 0) console.log("[broadcast] tidak ada jadwal jatuh tempo.");
}

processDue()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
