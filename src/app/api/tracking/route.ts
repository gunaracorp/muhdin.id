import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v5 Fase 3 — GPS Tracking rombongan.
 * GET  : posisi terakhir seluruh perangkat (publik). `?live=1` menjalankan
 *        satu tick simulasi gerak (random-walk halus) + simpan ping, agar
 *        peta terasa hidup pada demo tanpa perangkat fisik.
 * POST : daftarkan perangkat baru (SUPER_ADMIN/ADMIN).
 * PATCH: ubah perangkat (status/grup/posisi) (SUPER_ADMIN/ADMIN).
 */

const SITES = ["MAKKAH", "MADINAH", "JEDDAH", "MINA", "ARAFAH", "MUZDALIFAH"];
const STATUSES = ["ONLINE", "IDLE", "OFFLINE"];

/** Satu tick simulasi: gerakkan perangkat ONLINE, refresh IDLE, simpan ping. */
async function simulateTick(): Promise<void> {
  const devices = await db.trackingDevice.findMany({ where: { status: { in: ["ONLINE", "IDLE"] } } });
  const now = new Date();
  const jitter = () => Math.random() - 0.5;

  await Promise.all(
    devices.map(async (d) => {
      if (d.status === "IDLE") {
        await db.trackingDevice.update({ where: { id: d.id }, data: { lastPingAt: now } });
        return;
      }
      // Random-walk halus ≈ ±25 m per tick (interval polling 15 detik).
      const lat = d.lat + jitter() * 0.00045;
      const lng = d.lng + jitter() * 0.00045;
      const speedKph = Math.min(90, Math.max(0, d.speedKph + jitter() * 14));
      const heading = (d.heading + jitter() * 30 + 360) % 360;
      const battery = Math.max(12, d.battery - (Math.random() < 0.12 ? 1 : 0));
      await db.trackingDevice.update({
        where: { id: d.id },
        data: { lat, lng, speedKph: Math.round(speedKph * 10) / 10, heading: Math.round(heading), battery, lastPingAt: now },
      });
      await db.gpsPing.create({ data: { deviceId: d.id, lat, lng, speedKph } });
    })
  );

  // Housekeeping: ping lebih tua dari 3 jam dibuang (probabilistik agar murah).
  if (Math.random() < 0.15) {
    await db.gpsPing.deleteMany({ where: { recordedAt: { lt: new Date(Date.now() - 3 * 3600_000) } } });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get("live") === "1") {
      await simulateTick();
    }
    const devices = await db.trackingDevice.findMany({
      orderBy: [{ site: "asc" }, { groupName: "asc" }],
    });
    const online = devices.filter((d) => d.status === "ONLINE").length;
    const pax = devices.reduce((a, d) => a + d.pax, 0);
    return ok({
      devices,
      stats: {
        total: devices.length,
        online,
        pax,
        sites: new Set(devices.map((d) => d.site)).size,
        paxOnline: devices.filter((d) => d.status === "ONLINE").reduce((a, d) => a + d.pax, 0),
      },
      serverTime: new Date().toISOString(),
    });
  } catch {
    return fail("Gagal memuat data pelacakan.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const body = await req.json();
    const groupName = String(body.groupName || "").trim();
    const leader = String(body.leader || "").trim();
    if (!groupName || !leader) return fail("Nama rombongan dan ketua wajib diisi.");

    // Kode perangkat berurutan: GPS-001 …
    const last = await db.trackingDevice.findFirst({ orderBy: { code: "desc" }, select: { code: true } });
    const seq = last ? parseInt(last.code.replace(/\D/g, ""), 10) || 0 : 0;
    const code = body.code ? String(body.code).trim().toUpperCase() : `GPS-${String(seq + 1).padStart(3, "0")}`;

    const exists = await db.trackingDevice.findFirst({ where: { code }, select: { id: true } });
    if (exists) return fail("Kode perangkat sudah dipakai.");

    const device = await db.trackingDevice.create({
      data: {
        code,
        groupName,
        leader,
        pax: Math.max(1, parseInt(String(body.pax), 10) || 40),
        memberId: body.memberId ? String(body.memberId) : null,
        site: SITES.includes(String(body.site)) ? String(body.site) : "MAKKAH",
        lat: parseFloat(String(body.lat)) || 21.4225,
        lng: parseFloat(String(body.lng)) || 39.8262,
        status: STATUSES.includes(String(body.status)) ? String(body.status) : "ONLINE",
      },
    });
    await logAudit(req, { action: "TRACKING_DEVICE_CREATE", entity: "TrackingDevice", entityId: device.id, detail: code });
    return ok(device, 201);
  } catch {
    return fail("Gagal mendaftarkan perangkat.", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return fail("ID perangkat wajib diisi.");
    const existing = await db.trackingDevice.findUnique({ where: { id } });
    if (!existing) return fail("Perangkat tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!STATUSES.includes(String(body.status))) return fail("Status tidak valid.");
      data.status = String(body.status);
      data.lastPingAt = new Date();
    }
    if (body.groupName !== undefined) data.groupName = String(body.groupName).trim();
    if (body.leader !== undefined) data.leader = String(body.leader).trim();
    if (body.pax !== undefined) data.pax = Math.max(1, parseInt(String(body.pax), 10) || existing.pax);
    if (body.site !== undefined && SITES.includes(String(body.site))) data.site = String(body.site);
    if (body.lat !== undefined) data.lat = parseFloat(String(body.lat));
    if (body.lng !== undefined) data.lng = parseFloat(String(body.lng));
    if (!Object.keys(data).length) return fail("Tidak ada perubahan.");

    const device = await db.trackingDevice.update({ where: { id }, data });
    await logAudit(req, {
      action: "TRACKING_DEVICE_UPDATE",
      entity: "TrackingDevice",
      entityId: id,
      detail: `${existing.code} → ${data.status ?? existing.status}`,
    });
    return ok(device);
  } catch {
    return fail("Gagal memperbarui perangkat.", 500);
  }
}
