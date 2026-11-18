/**
 * escrow.ts — R-050 v15.0.0 «GOD MODE» — siklus hidup escrow pembayaran.
 *
 * HELD dibuat otomatis saat pesanan LUNAS (applyPaid) — dana ditahan aman
 * hingga layanan terverifikasi. RELEASE dilakukan panitia via CMS (#/escrow);
 * REFUND otomatis saat pengajuan refund pesanan LUNAS disetujui.
 * Semua fungsi gagal-aman: kegagalan escrow tidak boleh menggagalkan
 * pembayaran/refund yang sudah sah.
 */

export type EscrowState = "HELD" | "RELEASED" | "REFUNDED";

/** Buat / pastikan escrow HELD untuk pesanan LUNAS (idempoten per nomor). */
export async function escrowHold(order: {
  number: string;
  amount: number;
}): Promise<void> {
  try {
    await (await import("@/lib/db")).db.escrowEvent.upsert({
      where: { orderNumber: order.number },
      update: {}, // sudah ada → biarkan statusnya
      create: {
        orderNumber: order.number,
        amount: order.amount,
        state: "HELD",
        reason: "Dana jamaah ditahan aman hingga layanan terverifikasi.",
        actor: "SISTEM",
      },
    });
  } catch {
    /* gagal-aman — pembayaran tetap sah tanpa escrow */
  }
}

/** Putuskan escrow (RELEASE/REFUND) — hanya dari HELD, ber-audit di pemanggil. */
export async function escrowSettle(
  orderNumber: string,
  state: Exclude<EscrowState, "HELD">,
  reason: string,
  actor: string,
): Promise<void> {
  try {
    await (await import("@/lib/db")).db.escrowEvent.updateMany({
      where: { orderNumber, state: "HELD" },
      data: { state, reason, actor },
    });
  } catch {
    /* gagal-aman */
  }
}
