/**
 * Task 19 (R-094) — Aksi satu broadcast: jadwalkan, batalkan, kirim sekarang.
 * PUT /api/broadcasts/[id]   { action: "SCHEDULED"|"DRAFT"|"CANCELLED", scheduledAt? }
 * POST /api/broadcasts/[id]/send — kirim sekarang:
 *   • resolusi penerima sesuai audience (opt-in: nomor WA tersimpan di DB)
 *   • render {{nama}} & {{tanggal}}, kirim berurutan dengan jeda 700 ms
 *     (ramah gateway), batas 200 penerima per eksekusi
 *   • hitung sentCount/failCount + status SENT/FAILED + logNotification
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { sendWhatsAppToNumber } from "@/lib/whatsapp";
import { logNotification } from "@/lib/email";

async function resolveRecipients(audience: string): Promise<{ phone: string; name: string }[]> {
  if (audience === "KTA_ACTIVE") {
    const cards = await db.memberCard.findMany({
      where: { status: "ACTIVE" },
      include: { member: { select: { name: true, phone: true } } },
      take: 200,
    });
    return cards
      .filter((c) => c.member?.phone)
      .map((c) => ({ phone: c.member.phone as string, name: c.member.name }));
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
  // ALL_MEMBERS
  const members = await db.member.findMany({
    where: { phone: { not: null } },
    select: { name: true, phone: true },
    take: 200,
  });
  return members.filter((m): m is { name: string; phone: string } => !!m.phone).map((m) => ({ phone: m.phone, name: m.name }));
}

function render(template: string, name: string) {
  return template
    .replaceAll("{{nama}}", name)
    .replaceAll("{{tanggal}}", new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await req.json().catch(() => null);
    const action = String(body?.action || "").toUpperCase();
    if (!["SCHEDULED", "DRAFT", "CANCELLED"].includes(action)) return fail("Aksi tidak dikenal.");

    const existing = await db.broadcast.findUnique({ where: { id } });
    if (!existing) return fail("Broadcast tidak ditemukan.", 404);
    if (existing.status === "SENT" || existing.status === "SENDING") return fail("Broadcast sudah terkirim.");

    let scheduledAt = existing.scheduledAt;
    if (action === "SCHEDULED") {
      scheduledAt = body.scheduledAt ? new Date(String(body.scheduledAt)) : existing.scheduledAt;
      if (!scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now()) {
        return fail("Jadwal kirim harus di masa depan.");
      }
    }
    if (action === "DRAFT") scheduledAt = null;

    const bc = await db.broadcast.update({ where: { id }, data: { status: action, scheduledAt } });
    void logAudit(req, { action: "UPDATE", entity: "Broadcast", entityId: id, detail: `→ ${action}` });
    return ok(bc);
  } catch {
    return fail("Gagal memperbarui broadcast.", 500);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const bc = await db.broadcast.findUnique({ where: { id } });
    if (!bc) return fail("Broadcast tidak ditemukan.", 404);
    if (bc.status === "SENT" || bc.status === "SENDING") return fail("Broadcast sudah terkirim.");

    const recipients = await resolveRecipients(bc.audience);
    if (recipients.length === 0) {
      const failed = await db.broadcast.update({ where: { id }, data: { status: "FAILED" } });
      return ok({ ...failed, message: "Tidak ada penerima pada audience ini." });
    }

    await db.broadcast.update({ where: { id }, data: { status: "SENDING" } });
    let sent = 0;
    let failed = 0;
    for (const r of recipients) {
      const res = await sendWhatsAppToNumber(r.phone, render(bc.template, r.name));
      if (res.sent) {
        sent++;
      } else {
        failed++;
        await logNotification({
          channel: "WHATSAPP",
          eventType: "BROADCAST",
          status: "FAILED",
          recipient: r.phone,
          subject: bc.title,
          detail: res.detail,
        }).catch(() => undefined);
      }
      await new Promise((r2) => setTimeout(r2, 700)); // jeda ramah gateway
    }

    const done = await db.broadcast.update({
      where: { id },
      data: { status: sent > 0 ? "SENT" : "FAILED", sentCount: sent, failCount: failed, sentAt: new Date() },
    });
    void logAudit(req, { action: "SEND", entity: "Broadcast", entityId: id, detail: `${sent} terkirim, ${failed} gagal` });
    return ok({ ...done, message: `${sent} pesan terkirim, ${failed} gagal dari ${recipients.length} penerima.` });
  } catch {
    return fail("Gagal mengeksekusi broadcast.", 500);
  }
}
