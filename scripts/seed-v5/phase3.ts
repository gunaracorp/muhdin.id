/**
 * Fase 3 — Seed Paspor Haji Digital + GPS Tracking rombongan.
 *  24 paspor (PH-HAJ/PH-UMR-2026-xxxx) — mayoritas ACTIVE + beberapa
 *  EXPIRED/REVOKED/LOST untuk mendemokan semua status verifikasi.
 *  12 perangkat GPS tersebar di situs suci (Makkah/Madinah/Jeddah/Mina/
 *  Arafah/Muzdalifah) + riwayat ping sebagai jejak polyline peta.
 * Idempoten: skip per baris bila passportNo/code sudah ada.
 * Jalankan: npx tsx scripts/seed-v5/phase3.ts
 */
import { makeDb } from "../_db";

const db = makeDb();

/* ============ PASPOR ============ */

type P = {
  no: string; name: string; type: "HAJI" | "UMRAH"; gender: "M" | "F";
  rombongan: string; status: "ACTIVE" | "EXPIRED" | "REVOKED" | "LOST";
  issuedAgoD: number; years: number; verif: number;
};

const PASSPORTS: P[] = [
  { no: "PH-UMR-2026-0001", name: "H. Muhammad Ridwan", type: "UMRAH", gender: "M", rombongan: "Kelompok 1 Al-Furqan", status: "ACTIVE", issuedAgoD: 82, years: 2, verif: 7 },
  { no: "PH-UMR-2026-0002", name: "Hj. Siti Aminah", type: "UMRAH", gender: "F", rombongan: "Kelompok 1 Al-Furqan", status: "ACTIVE", issuedAgoD: 82, years: 2, verif: 5 },
  { no: "PH-UMR-2026-0003", name: "Ahmad Fauzi", type: "UMRAH", gender: "M", rombongan: "Kelompok 2 Nurul Iman", status: "ACTIVE", issuedAgoD: 74, years: 2, verif: 3 },
  { no: "PH-UMR-2026-0004", name: "Dewi Ratnasari", type: "UMRAH", gender: "F", rombongan: "Kelompok 2 Nurul Iman", status: "ACTIVE", issuedAgoD: 74, years: 2, verif: 4 },
  { no: "PH-UMR-2026-0005", name: "H. Abdul Karim", type: "UMRAH", gender: "M", rombongan: "Kelompok 3 Shafilah", status: "ACTIVE", issuedAgoD: 66, years: 2, verif: 2 },
  { no: "PH-UMR-2026-0006", name: "Nur Hasanah", type: "UMRAH", gender: "F", rombongan: "Kelompok 3 Shafilah", status: "ACTIVE", issuedAgoD: 66, years: 2, verif: 6 },
  { no: "PH-UMR-2026-0007", name: "Bambang Sutrisno", type: "UMRAH", gender: "M", rombongan: "Kelompok 4 Raudhah", status: "ACTIVE", issuedAgoD: 58, years: 2, verif: 1 },
  { no: "PH-UMR-2026-0008", name: "Khadijah Rahmawati", type: "UMRAH", gender: "F", rombongan: "Kelompok 4 Raudhah", status: "ACTIVE", issuedAgoD: 58, years: 2, verif: 2 },
  { no: "PH-HAJ-2026-0001", name: "H. Syamsul Bahri", type: "HAJI", gender: "M", rombongan: "KBIH Ar-Raudhah", status: "ACTIVE", issuedAgoD: 120, years: 5, verif: 9 },
  { no: "PH-HAJ-2026-0002", name: "Hj. Fatimah Zahra", type: "HAJI", gender: "F", rombongan: "KBIH Ar-Raudhah", status: "ACTIVE", issuedAgoD: 120, years: 5, verif: 8 },
  { no: "PH-HAJ-2026-0003", name: "H. Abdul Rahman", type: "HAJI", gender: "M", rombongan: "KBIH Baitullah Jaya", status: "ACTIVE", issuedAgoD: 115, years: 5, verif: 4 },
  { no: "PH-HAJ-2026-0004", name: "Hj. Maryam Ulfah", type: "HAJI", gender: "F", rombongan: "KBIH Baitullah Jaya", status: "ACTIVE", issuedAgoD: 115, years: 5, verif: 3 },
  { no: "PH-HAJ-2026-0005", name: "H. Zainal Abidin", type: "HAJI", gender: "M", rombongan: "KBIH Masjid Agung", status: "ACTIVE", issuedAgoD: 110, years: 5, verif: 2 },
  { no: "PH-HAJ-2026-0006", name: "Hj. Aminah Wibowo", type: "HAJI", gender: "F", rombongan: "KBIH Masjid Agung", status: "ACTIVE", issuedAgoD: 110, years: 5, verif: 5 },
  { no: "PH-HAJ-2027-0001", name: "H. Mahmud Yunus", type: "HAJI", gender: "M", rombongan: "KBIH Safa Marwah", status: "ACTIVE", issuedAgoD: 40, years: 5, verif: 1 },
  { no: "PH-HAJ-2027-0002", name: "Hj. Halimah Sa'diyah", type: "HAJI", gender: "F", rombongan: "KBIH Safa Marwah", status: "ACTIVE", issuedAgoD: 40, years: 5, verif: 0 },
  { no: "PH-UMR-2027-0001", name: "Rizki Pratama", type: "UMRAH", gender: "M", rombongan: "Kelompok 5 Mubarak", status: "ACTIVE", issuedAgoD: 21, years: 2, verif: 0 },
  { no: "PH-UMR-2027-0002", name: "Lestari Handayani", type: "UMRAH", gender: "F", rombongan: "Kelompok 5 Mubarak", status: "ACTIVE", issuedAgoD: 18, years: 2, verif: 0 },
  { no: "PH-UMR-2027-0003", name: "Yusuf Maulana", type: "UMRAH", gender: "M", rombongan: "Kelompok 5 Mubarak", status: "ACTIVE", issuedAgoD: 12, years: 2, verif: 0 },
  { no: "PH-UMR-2027-0004", name: "Aisyah Putri", type: "UMRAH", gender: "F", rombongan: "Kelompok 6 Hidayah", status: "ACTIVE", issuedAgoD: 9, years: 2, verif: 0 },
  // Status khusus untuk demo seluruh jalur verifikasi
  { no: "PH-UMR-2024-0018", name: "H. Darmawan Wijaya", type: "UMRAH", gender: "M", rombongan: "Kelompok 7 Sakinah", status: "EXPIRED", issuedAgoD: 900, years: 0, verif: 12 },
  { no: "PH-UMR-2024-0022", name: "Rohmah Nurjanah", type: "UMRAH", gender: "F", rombongan: "Kelompok 7 Sakinah", status: "EXPIRED", issuedAgoD: 880, years: 0, verif: 8 },
  { no: "PH-HAJ-2025-0009", name: "H. Suryadi Ali", type: "HAJI", gender: "M", rombongan: "KBIH Al-Ikhlas", status: "REVOKED", issuedAgoD: 430, years: 0, verif: 15 },
  { no: "PH-UMR-2025-0031", name: "Fitriani Azzahra", type: "UMRAH", gender: "F", rombongan: "Kelompok 8 Barokah", status: "LOST", issuedAgoD: 210, years: 0, verif: 6 },
];

/* ============ PERANGKAT GPS ============ */

type D = {
  code: string; group: string; leader: string; pax: number; site: string;
  lat: number; lng: number; status: "ONLINE" | "IDLE" | "OFFLINE"; battery: number; speed: number;
};

const DEVICES: D[] = [
  { code: "GPS-001", group: "Rombongan Al-Furqan 1", leader: "Ust. Hasan Basri", pax: 45, site: "MAKKAH", lat: 21.42251, lng: 39.82623, status: "ONLINE", battery: 92, speed: 4.5 },
  { code: "GPS-002", group: "Rombongan Al-Furqan 2", leader: "Ust. Ibrahim Latif", pax: 42, site: "MAKKAH", lat: 21.41902, lng: 39.82451, status: "ONLINE", battery: 87, speed: 12.0 },
  { code: "GPS-003", group: "Rombongan Nurul Iman", leader: "Ust. Abdul Ghani", pax: 48, site: "MAKKAH", lat: 21.42513, lng: 39.82911, status: "ONLINE", battery: 76, speed: 0 },
  { code: "GPS-004", group: "Rombongan Shafilah", leader: "Ust. Musa Ali", pax: 38, site: "MINA", lat: 21.41321, lng: 39.89311, status: "ONLINE", battery: 64, speed: 22.5 },
  { code: "GPS-005", group: "Rombongan Raudhah", leader: "Ust. Salim Bahri", pax: 44, site: "MINA", lat: 21.41502, lng: 39.89012, status: "IDLE", battery: 58, speed: 0 },
  { code: "GPS-006", group: "Rombongan Arafah Barokah", leader: "Ust. Yusuf Hamid", pax: 50, site: "ARAFAH", lat: 21.35412, lng: 39.98421, status: "IDLE", battery: 71, speed: 0 },
  { code: "GPS-007", group: "Rombongan Muzdalifah", leader: "Ust. Ahmad Dahlan", pax: 40, site: "MUZDALIFAH", lat: 21.38602, lng: 39.94412, status: "ONLINE", battery: 83, speed: 15.5 },
  { code: "GPS-008", group: "Rombongan Nabawi 1", leader: "Ust. Umar Faruq", pax: 46, site: "MADINAH", lat: 24.46721, lng: 39.61121, status: "ONLINE", battery: 95, speed: 3.5 },
  { code: "GPS-009", group: "Rombongan Nabawi 2", leader: "Ust. Ali Ridho", pax: 43, site: "MADINAH", lat: 24.46402, lng: 39.60912, status: "ONLINE", battery: 88, speed: 8.0 },
  { code: "GPS-010", group: "Rombongan Hijaz Express", leader: "Ust. Ismail Wan", pax: 41, site: "JEDDAH", lat: 21.67962, lng: 39.15651, status: "ONLINE", battery: 79, speed: 45.0 },
  { code: "GPS-011", group: "Rombongan Thoybah", leader: "Ust. Khalid Umar", pax: 47, site: "JEDDAH", lat: 21.68311, lng: 39.15302, status: "ONLINE", battery: 52, speed: 35.5 },
  { code: "GPS-012", group: "Rombongan Makkah Line", leader: "Ust. Ja'far Shodiq", pax: 39, site: "MAKKAH", lat: 21.42081, lng: 39.83121, status: "OFFLINE", battery: 14, speed: 0 },
];

/* ============ EKSEKUSI ============ */

async function main() {
  const members = await db.member.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 60 });
  const now = Date.now();
  const DAY = 86400_000;

  // --- Paspor ---
  let issued = 0;
  for (const p of PASSPORTS) {
    const exists = await db.hajjPassport.findFirst({ where: { passportNo: p.no }, select: { id: true } });
    if (exists) continue;
    const member = members[(issued * 7 + 3) % members.length]; // sebar merata
    const issuedAt = new Date(now - p.issuedAgoD * DAY);
    const expiresAt =
      p.status === "EXPIRED"
        ? new Date(now - 45 * DAY)
        : new Date(now + (p.years || 2) * 365.25 * DAY);
    await db.hajjPassport.create({
      data: {
        passportNo: p.no,
        holderName: p.name,
        type: p.type,
        gender: p.gender,
        nationality: "IDN",
        rombongan: p.rombongan,
        memberId: member?.id ?? null,
        status: p.status,
        issuedAt,
        expiresAt,
        verificationCount: p.verif,
        lastVerifiedAt: p.verif > 0 ? new Date(now - Math.floor(Math.random() * 20 + 1) * DAY) : null,
        notes: p.status === "REVOKED" ? "Dicabut oleh Dewan Verifikasi — temuan dokumen." : null,
      },
    });
    issued++;
  }

  // --- Perangkat GPS + riwayat ping ---
  let created = 0;
  for (const [i, d] of DEVICES.entries()) {
    const exists = await db.trackingDevice.findFirst({ where: { code: d.code }, select: { id: true } });
    if (exists) continue;
    const member = members[(i * 5 + 1) % members.length];
    const dev = await db.trackingDevice.create({
      data: {
        code: d.code,
        groupName: d.group,
        leader: d.leader,
        pax: d.pax,
        memberId: member?.id ?? null,
        site: d.site,
        lat: d.lat,
        lng: d.lng,
        speedKph: d.speed,
        heading: Math.floor(Math.random() * 360),
        battery: d.battery,
        status: d.status,
        lastPingAt: new Date(now - Math.floor(Math.random() * 3) * 60_000),
      },
    });
    // Riwayat 12 ping (interval 90 detik) — jalan mundur dari posisi kini
    // sehingga jejak polyline mengarah ke posisi terakhir.
    const STEP = 0.00035;
    let lat = d.lat, lng = d.lng;
    const back: { lat: number; lng: number; t: Date }[] = [];
    for (let k = 0; k < 12; k++) {
      back.push({ lat, lng, t: new Date(now - k * 90_000) });
      lat += (Math.random() - 0.3) * STEP;
      lng += (Math.random() - 0.3) * STEP;
    }
    for (const b of back.reverse()) {
      await db.gpsPing.create({ data: { deviceId: dev.id, lat: b.lat, lng: b.lng, speedKph: d.speed, recordedAt: b.t } });
    }
    created++;
  }

  const [pCount, dCount, pingCount] = await Promise.all([
    db.hajjPassport.count(),
    db.trackingDevice.count(),
    db.gpsPing.count(),
  ]);
  console.log(
    `Fase 3 seed selesai — paspor baru: ${issued} (total ${pCount}), perangkat baru: ${created} (total ${dCount}), ping: ${pingCount}`
  );
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
