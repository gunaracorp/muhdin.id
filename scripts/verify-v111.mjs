/**
 * verify-v111.mjs — verifikasi E2E v11.1 langsung ke Prisma Postgres.
 * Pakai: node scripts/verify-v111.mjs
 */
import pg from "pg";
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ override: true });

const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

const tables = [
  "MembershipApplication", "AcademyEnrollment", "SlotBooking",
  "BenefitRedemption", "NotificationLog", "MemberCard", "PointLedger", "Certificate",
];
console.log("=== JUMLAH BARIS DI PRISMA POSTGRES ===");
for (const t of tables) {
  const r = await c.query(`SELECT COUNT(*)::int AS n FROM "${t}"`);
  console.log(`${t.padEnd(24)}: ${r.rows[0].n}`);
}

console.log("\n=== PENDAFTARAN TERAKHIR ===");
const app = await c.query(
  `SELECT "ticketCode", "orgName", "queueNumber", status, "createdAt" FROM "MembershipApplication"
   ORDER BY "createdAt" DESC LIMIT 2`
);
app.rows.forEach((r) => console.log(` #${r.queueNumber} ${r.ticketCode} ${r.orgName} [${r.status}] ${r.createdAt.toISOString()}`));

console.log("\n=== LOG NOTIFIKASI 8 TERAKHIR ===");
const logs = await c.query(
  `SELECT channel, "eventType", status, recipient, left(detail, 70) AS detail, "createdAt"
   FROM "NotificationLog" ORDER BY "createdAt" DESC LIMIT 8`
);
logs.rows.forEach((r) =>
  console.log(` ${r.createdAt.toISOString().slice(5, 16)} ${r.channel.padEnd(9)} ${r.eventType.padEnd(12)} ${r.status.padEnd(6)} → ${r.recipient.slice(0, 30).padEnd(30)} | ${r.detail}`)
);

const enroll = await c.query(
  `SELECT e.name, e.email, e.status, c.title FROM "AcademyEnrollment" e
   JOIN "AcademyCourse" c ON c.slug = e."courseSlug" ORDER BY e."startedAt" DESC LIMIT 2`
);
console.log("\n=== ENROLL TERAKHIR ===");
enroll.rows.forEach((r) => console.log(` ${r.name} <${r.email}> [${r.status}] ${r.title.slice(0, 40)}`));

await c.end();
console.log("\nVERIFIKASI SELESAI ✓");
