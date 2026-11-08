/**
 * seed-fitur-v7.ts — data demo v7.0: PINDAI IZIN 360°.
 * Registri perusahaan + dokumen izin untuk mesin pemindaian kelengkapan
 * BPW/PPIU/PIHK. Kasus utama: PT Arofah Global (BPW murni — akreditasi mati,
 * belum berizin umrah/haji/IATA) sesuai skenario owner.
 * Idempoten: bersihkan registri dahulu, lalu isi ulang.
 * Jalankan: bun prisma/seed-fitur-v7.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const at = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY);

interface SeedDoc {
  requirementKey: string;
  docNo: string;
  issuedBy: string;
  validUntil: Date | null;
}

async function main() {
  console.log("🧹 Membersihkan registri Pindai Izin…");
  await prisma.registryDoc.deleteMany();
  await prisma.registryCompany.deleteMany();

  const KEMENAG = "Kemenag RI — BPHU";
  const AKRED = "Lembaga Akreditasi Kemenag";
  const OSS = "OSS-RBA Kemeninvest/BKPM";
  const KUMHAM = "Kemenkumham RI";
  const DJP = "DJP Kemenkeu RI";

  const rows: {
    nib: string;
    name: string;
    legalEntity: string;
    city: string;
    province: string;
    phone?: string;
    website?: string;
    note?: string;
    docs: SeedDoc[];
  }[] = [
    {
      // ==== KASUS UTAMA OWNER: BPW murni, banyak kekurangan ====
      nib: "8120012345678",
      name: "PT Arofah Global",
      legalEntity: "PT",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      phone: "+62 21 7280 1122",
      note: "Kasus pemindaian utama — BPW belum berizin umrah; akreditasi lama mati.",
      docs: [
        { requirementKey: "NIB", docNo: "8120012345678", issuedBy: OSS, validUntil: null },
        { requirementKey: "AKTA", docNo: "AHU-AH.01.03-0098776", issuedBy: KUMHAM, validUntil: null },
        { requirementKey: "NPWP", docNo: "01.234.567.8-091.000", issuedBy: DJP, validUntil: null },
        { requirementKey: "BPW", docNo: "NIB-KBLI 79120", issuedBy: OSS, validUntil: at(800) },
        {
          requirementKey: "PPIU_AKREDITASI",
          docNo: "AKR-PPIU/2021/331",
          issuedBy: AKRED,
          validUntil: at(-400),
        },
      ],
    },
    {
      // ==== Kontras: lengkap penuh PPIU + PIHK + IATA (skor 100) ====
      nib: "8120099887766",
      name: "PT Anugrah Kareba Tour",
      legalEntity: "PT",
      city: "Makassar",
      province: "Sulawesi Selatan",
      phone: "+62 411 442 8899",
      note: "Contoh pemegang izin lengkap — jalur BPW → PPIU → PIHK tuntas.",
      docs: [
        { requirementKey: "NIB", docNo: "8120099887766", issuedBy: OSS, validUntil: null },
        { requirementKey: "AKTA", docNo: "AHU-AH.01.03-1120934", issuedBy: KUMHAM, validUntil: null },
        { requirementKey: "NPWP", docNo: "90.876.543.2-643.000", issuedBy: DJP, validUntil: null },
        { requirementKey: "BPW", docNo: "NIB-KBLI 79120", issuedBy: OSS, validUntil: at(900) },
        { requirementKey: "PPIU", docNo: "U-542/2024/Dit.BU", issuedBy: KEMENAG, validUntil: at(1200) },
        { requirementKey: "PPIU_AKREDITASI", docNo: "AKR-PPIU/2024/0871-A", issuedBy: AKRED, validUntil: at(900) },
        { requirementKey: "PIHK", docNo: "PIHK-22/2023/Dit.BH", issuedBy: KEMENAG, validUntil: at(1100) },
        { requirementKey: "PIHK_ESCROW", docNo: "SKL-BSI-778812", issuedBy: "BSI — penampungan BPKH", validUntil: at(1000) },
        { requirementKey: "IATA", docNo: "ID-55-6601", issuedBy: "IATA", validUntil: at(500) },
        { requirementKey: "MUTHOWIF_SDM", docNo: "SERT-MTW/2025/2011", issuedBy: "Lembaga Pelatihan Kemenag", validUntil: at(600) },
        { requirementKey: "ASURANSI", docNo: "POL-TKF/2026/9901", issuedBy: "Takaful Umrah Insurance", validUntil: at(300) },
        { requirementKey: "DIGITAL", docNo: "MHD-VER-2026-0031", issuedBy: "Verifikasi Ekosistem MUHDIN", validUntil: at(700) },
      ],
    },
    {
      // ==== Kontras: PPIU aktif, akreditasi & asuransi segera berakhir ====
      nib: "8120044556677",
      name: "CV Mabrur Safar Lestari",
      legalEntity: "CV",
      city: "Surabaya",
      province: "Jawa Timur",
      phone: "+62 31 880 7712",
      note: "Dua dokumen masuk jendela ≤90 hari — uji status EXPIRING.",
      docs: [
        { requirementKey: "NIB", docNo: "8120044556677", issuedBy: OSS, validUntil: null },
        { requirementKey: "AKTA", docNo: "AHU-0044112", issuedBy: KUMHAM, validUntil: null },
        { requirementKey: "NPWP", docNo: "44.556.677.8-301.000", issuedBy: DJP, validUntil: null },
        { requirementKey: "BPW", docNo: "NIB-KBLI 79120", issuedBy: OSS, validUntil: at(850) },
        { requirementKey: "PPIU", docNo: "U-771/2023/Dit.BU", issuedBy: KEMENAG, validUntil: at(700) },
        { requirementKey: "PPIU_AKREDITASI", docNo: "AKR-PPIU/2022/1204-B", issuedBy: AKRED, validUntil: at(60) },
        { requirementKey: "MUTHOWIF_SDM", docNo: "SERT-MTW/2024/1777", issuedBy: "Lembaga Pelatihan Kemenag", validUntil: at(500) },
        { requirementKey: "ASURANSI", docNo: "POL-TKF/2023/4310", issuedBy: "Takaful Umrah Insurance", validUntil: at(45) },
      ],
    },
    {
      // ==== Kontras: PIHK aktif, izin umrah mati ====
      nib: "8120033445566",
      name: "PT Safar Madinah Utama",
      legalEntity: "PT",
      city: "Jakarta Pusat",
      province: "DKI Jakarta",
      phone: "+62 21 3199 8845",
      note: "PIHK berjalan, izin umrah mati 30 hari lalu — darurat perpanjangan.",
      docs: [
        { requirementKey: "NIB", docNo: "8120033445566", issuedBy: OSS, validUntil: null },
        { requirementKey: "AKTA", docNo: "AHU-AH.01.02-770021", issuedBy: KUMHAM, validUntil: null },
        { requirementKey: "NPWP", docNo: "33.445.566.7-052.000", issuedBy: DJP, validUntil: null },
        { requirementKey: "BPW", docNo: "NIB-KBLI 79120", issuedBy: OSS, validUntil: at(1000) },
        { requirementKey: "PPIU", docNo: "U-310/2022/Dit.BU", issuedBy: KEMENAG, validUntil: at(-30) },
        { requirementKey: "PIHK", docNo: "PIHK-57/2024/Dit.BH", issuedBy: KEMENAG, validUntil: at(1050) },
        { requirementKey: "PIHK_ESCROW", docNo: "SKL-BANKMUAMALAT-33011", issuedBy: "Bank Muamalat — penampungan BPKH", validUntil: at(950) },
        { requirementKey: "MUTHOWIF_SDM", docNo: "SERT-MTW/2025/2254", issuedBy: "Lembaga Pelatihan Kemenag", validUntil: at(650) },
        { requirementKey: "ASURANSI", docNo: "POL-BSY/2026/7702", issuedBy: "Bsyariah Insurance", validUntil: at(400) },
      ],
    },
    {
      // ==== Kontras: BPW dasar saja — jalur naik penuh ====
      nib: "8120077889900",
      name: "PT Barokah Wisata Nusantara",
      legalEntity: "PT",
      city: "Medan",
      province: "Sumatera Utara",
      phone: "+62 61 452 7788",
      note: "BPW dasar — kandidat jalur naik kelas ke PPIU.",
      docs: [
        { requirementKey: "NIB", docNo: "8120077889900", issuedBy: OSS, validUntil: null },
        { requirementKey: "AKTA", docNo: "AHU-0088123", issuedBy: KUMHAM, validUntil: null },
        { requirementKey: "NPWP", docNo: "77.889.900.1-011.000", issuedBy: DJP, validUntil: null },
        { requirementKey: "BPW", docNo: "NIB-KBLI 79120", issuedBy: OSS, validUntil: at(950) },
      ],
    },
    {
      // ==== Kontras: koperasi tanpa izin usaha perjalanan ====
      nib: "8120022334455",
      name: "Koperasi Jamaah Cahaya Haramain",
      legalEntity: "KOPERASI",
      city: "Bandung",
      province: "Jawa Barat",
      phone: "+62 22 665 9090",
      note: "Legalitas dasar ada, belum punya izin BPW — langkah pertama: izin usaha.",
      docs: [
        { requirementKey: "NIB", docNo: "8120022334455", issuedBy: OSS, validUntil: null },
        { requirementKey: "AKTA", docNo: "BH-09/2020/KOPERASI", issuedBy: "Kemenkop UKM RI", validUntil: null },
        { requirementKey: "NPWP", docNo: "22.334.455.6-206.000", issuedBy: DJP, validUntil: null },
      ],
    },
    {
      // ==== Kontras: PPIU utuh, gap SDM & asuransi (tier 2) ====
      nib: "8120066778899",
      name: "PT Hidayah Tour & Travel",
      legalEntity: "PT",
      city: "Semarang",
      province: "Jawa Tengah",
      phone: "+62 24 760 3322",
      note: "Izin & akreditasi utuh — kekurangan muthowif bersertifikat & asuransi.",
      docs: [
        { requirementKey: "NIB", docNo: "8120066778899", issuedBy: OSS, validUntil: null },
        { requirementKey: "AKTA", docNo: "AHU-0066334", issuedBy: KUMHAM, validUntil: null },
        { requirementKey: "NPWP", docNo: "66.778.899.0-506.000", issuedBy: DJP, validUntil: null },
        { requirementKey: "BPW", docNo: "NIB-KBLI 79120", issuedBy: OSS, validUntil: at(880) },
        { requirementKey: "PPIU", docNo: "U-889/2024/Dit.BU", issuedBy: KEMENAG, validUntil: at(1150) },
        { requirementKey: "PPIU_AKREDITASI", docNo: "AKR-PPIU/2024/0992-B", issuedBy: AKRED, validUntil: at(820) },
      ],
    },
    {
      // ==== Kontras: PPIU+PIHK aktif, escrow segera berakhir, digital mati ====
      nib: "8120055667788",
      name: "PT Lazuardi Hijrah Mandiri",
      legalEntity: "PT",
      city: "Bogor",
      province: "Jawa Barat",
      phone: "+62 251 883 4411",
      website: "lazuardihijrah.example.id",
      note: "Escrow masuk jendela ≤90 hari; verifikasi digital kedaluwarsa — perlu tindak lanjut.",
      docs: [
        { requirementKey: "NIB", docNo: "8120055667788", issuedBy: OSS, validUntil: null },
        { requirementKey: "AKTA", docNo: "AHU-0055223", issuedBy: KUMHAM, validUntil: null },
        { requirementKey: "NPWP", docNo: "55.667.788.9-402.000", issuedBy: DJP, validUntil: null },
        { requirementKey: "BPW", docNo: "NIB-KBLI 79120", issuedBy: OSS, validUntil: at(920) },
        { requirementKey: "PPIU", docNo: "U-655/2023/Dit.BU", issuedBy: KEMENAG, validUntil: at(980) },
        { requirementKey: "PPIU_AKREDITASI", docNo: "AKR-PPIU/2023/1105-A", issuedBy: AKRED, validUntil: at(760) },
        { requirementKey: "PIHK", docNo: "PIHK-74/2024/Dit.BH", issuedBy: KEMENAG, validUntil: at(1010) },
        { requirementKey: "PIHK_ESCROW", docNo: "SKL-BSI-990231", issuedBy: "BSI — penampungan BPKH", validUntil: at(30) },
        { requirementKey: "IATA", docNo: "ID-55-7710", issuedBy: "IATA", validUntil: at(240) },
        { requirementKey: "MUTHOWIF_SDM", docNo: "SERT-MTW/2025/2401", issuedBy: "Lembaga Pelatihan Kemenag", validUntil: at(520) },
        { requirementKey: "ASURANSI", docNo: "POL-TKF/2026/6650", issuedBy: "Takaful Umrah Insurance", validUntil: at(310) },
        { requirementKey: "DIGITAL", docNo: "MHD-VER-2025-0117", issuedBy: "Verifikasi Ekosistem MUHDIN", validUntil: at(-15) },
      ],
    },
  ];

  console.log("🏢 Menyemai registri perusahaan…");
  for (const row of rows) {
    await prisma.registryCompany.create({
      data: {
        nib: row.nib,
        name: row.name,
        legalEntity: row.legalEntity,
        city: row.city,
        province: row.province,
        phone: row.phone ?? "",
        website: row.website ?? null,
        note: row.note ?? null,
        docs: { create: row.docs },
      },
    });
    console.log(`   ✓ ${row.name} — ${row.docs.length} dokumen`);
  }

  const total = await prisma.registryCompany.count();
  const totalDocs = await prisma.registryDoc.count();
  console.log(`✅ Registri Pindai Izin siap: ${total} perusahaan, ${totalDocs} dokumen.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed v7 gagal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
