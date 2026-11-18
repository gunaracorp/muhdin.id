/**
 * encrypt-vault-migrate.ts — R-076 (v13.3): seragamkan brankas dokumen jamaah
 * ke format terenkripsi AES-256-GCM at-rest.
 *
 * Semua baris JamaahDoc yang docNo/fileUrl/note masih plaintext (warisan seed
 * lama) dienkripsi. Idempoten: nilai berprefiks "enc:v1:" dilewati.
 * Jalankan: bun scripts/encrypt-vault-migrate.ts
 */
import { PrismaClient } from "@prisma/client";
import { encryptField, isEncrypted } from "../src/lib/vault-crypto";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.jamaahDoc.findMany();
  let touched = 0;
  for (const r of rows) {
    const data: Record<string, unknown> = {};
    if (r.docNo && !isEncrypted(r.docNo)) data.docNo = encryptField(r.docNo);
    if (r.fileUrl && !isEncrypted(r.fileUrl)) data.fileUrl = encryptField(r.fileUrl);
    if (r.note && !isEncrypted(r.note)) data.note = encryptField(r.note);
    if (Object.keys(data).length === 0) continue;
    await prisma.jamaahDoc.update({ where: { id: r.id }, data });
    touched++;
  }
  const total = await prisma.jamaahDoc.count();
  const enc = (await prisma.jamaahDoc.findMany()).filter((r) => isEncrypted(r.docNo)).length;
  console.log(`🔐 Migrasi brankas: ${touched}/${total} dokumen disentuh; ${enc}/${total} docNo kini terenkripsi AES-256-GCM.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
