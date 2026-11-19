/**
 * namespace "nusuk" — dikelola oleh agent Task 14-d (Nusuk Hub).
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik di ketiganya.
 * Key datar satu level di dalam namespace (tanpa "." dalam nama key).
 * Nilai id = string ASLI dari nusuk-view.tsx (tidak diparafrase).
 */
export const nusukDict = {
  id: {
    nusuk: {
      /* ---------- HERO ---------- */
      heroTitle1: "Terhubung Langsung dengan",
      heroTitle2: "Platform Nusuk",
      heroDescAuto1:
        "Jembatan data resmi ekosistem MUHDIN ke Nusuk — platform digital Kementerian Hajj & Umrah Kerajaan Saudi Arabia. Sinkronisasi otomatis berjalan dan telah tercatat",
      heroDescManual1:
        "Jembatan data resmi ekosistem MUHDIN ke Nusuk — platform digital Kementerian Hajj & Umrah Kerajaan Saudi Arabia. Sinkronisasi dijalankan manual dan telah tercatat",
      heroDescPost: "pada lingkungan {env}.",
      heroLoading:
        "Mengambil status koneksi dari registri Nusuk Kementerian Hajj & Umrah Kerajaan Saudi Arabia…",
      chipConnected: "Terhubung",
      chipDisconnected: "Terputus",
      ariaConnStatus: "Status koneksi Nusuk",
      lastSync: "Sinkron terakhir: {ago}",

      /* ---------- RELATIF WAKTU & DURASI ---------- */
      agoNever: "belum pernah",
      agoSec: "{n} detik lalu",
      agoMin: "{n} menit lalu",
      agoHour: "{n} jam lalu",
      agoDay: "{n} hari lalu",
      durMs: "{n} ms",
      durSec: "{n} dtk",

      /* ---------- METRIK LIVE ---------- */
      metricsEyebrow: "Live Metrics",
      metricsTitle: "Denyut Integrasi Nusuk",
      metricsSubtitle:
        "Angka real-time dari registri izin ekosistem MUHDIN yang tersinkron dengan platform Nusuk.",
      statActivePermits: "Izin Aktif",
      statMembersSynced: "Anggota Tersinkron",
      statSyncSuccess: "Tingkat Sukses Sinkron",
      statTotalSyncs: "Total Sinkronisasi",
      byTypeLabel: "Izin per tipe",
      typeChipTitle: "{label}: {total} total, {active} aktif",
      typeChip: "{total} total · {active} aktif",
      avgLine: "Rata-rata {dur} · {n} sinkron / 7 hari",

      /* ---------- CEK IZIN (PERMIT CHECKER) ---------- */
      checkerEyebrow: "Permit Checker",
      checkerTitle: "Cek Keaslian Izin Nusuk",
      checkerSubtitle:
        "Alat publik gratis untuk jamaah dan mitra: masukkan nomor izin dan dapatkan status resminya dalam sekejap.",
      checkerCardTitle: "Cek Izin Nusuk",
      checkerCardDesc: "Verifikasi keaslian izin yang diterbitkan melalui integrasi Nusuk–MUHDIN.",
      checkerPlaceholder: "Contoh: NSK-VSA-2026-482913",
      ariaPermitNo: "Nomor izin Nusuk",
      ariaVerifyNow: "Verifikasi nomor izin sekarang",
      verifyNow: "Verifikasi Sekarang",
      checkerHint:
        "Nomor izin tercantum pada bukti pemesanan dari penyelenggara terverifikasi MUHDIN.",
      errEmptyNo: "Masukkan nomor izin Nusuk terlebih dahulu.",
      verifyFailed: "Verifikasi gagal",
      checkedLine: "{env} · dicek {ago}",
      permitNoLabel: "Nomor Izin",
      onBehalf: "a.n. {name}",
      labelHolder: "Penyelenggara",
      labelValidity: "Masa Berlaku",
      labelPermitNote: "Keterangan Izin",
      licenseWord: "Izin",
      lastSyncShort: "Sinkron terakhir {ago}",

      /* ---------- 3 KARTU KEYAKINAN ---------- */
      trust1Title: "Data Registri Resmi",
      trust1Desc: "Sumber tunggal registri izin Nusuk-MUHDIN.",
      trust2Title: "Real-Time Sync",
      trust2Desc: "Status mencerminkan sinkronisasi terakhir.",
      trust3Title: "Anti-Izin Palsu",
      trust3Desc: "Lindungi jamaah dari dokumen tidak sah.",

      /* ---------- MATRIKS 13 EKOSISTEM ---------- */
      matrixEyebrow: "Integrasi Matrix",
      matrixTitle: "Matriks 13 Ekosistem × Nusuk",
      matrixSubtitle:
        "Peta cakupan layanan MUHDIN terhadap platform Nusuk — dari visa hingga pengawasan mutu, beserta tahapan ketersediaannya.",
      matrixPending: "Menyusun integrasi teknis",
      statusLegend:
        "Legenda status: LIVE = kanal integrasi aktif pada platform · PILOT = uji coba terbatas · bertanggal = direncanakan. Integrasi Nusuk berjalan bertahap di bawah otoritas yang berwenang.",
      syncedLive: "Izin tersinkron live",
      svc1: "Nusuk Visa Platform",
      svc2: "Nusuk Ports & Handling",
      svc3: "Nusuk Guide Registry",
      svc4: "Mashaer & Haramain Link",
      svc5: "Nusuk Mutawif Center",
      svc6: "Nusuk e-Hotel Portal",
      svc7: "Nusuk Transport Permit",
      svc8: "Nusuk Rawdah Alternative Route",
      svc9: "Nusuk Rawdah Permit",
      svc10: "Nusuk Food License",
      svc11: "Nusuk e-Thimar Retail",
      svc12: "Nusuk One-Stop Service",
      svc13: "Nusuk Oversight Link",

      /* ---------- API BRIDGE ---------- */
      apiEyebrow: "API Bridge",
      apiTitle: "Nusuk API Bridge",
      apiSubtitle:
        "Jembatan data terbuka antara MUHDIN dan Nusuk. Endpoint publik dapat dipakai mitra untuk integrasi mandiri.",
      epPublicDesc:
        "Data Hub publik — status koneksi, metrik, ekosistem, dan aktivitas sinkronisasi.",
      epVerifyDesc:
        "Cek izin — verifikasi keaslian nomor izin Nusuk secara real-time.",
      epWebhookDesc:
        "Webhook event dari Nusuk — diverifikasi via header X-Nusuk-Signature.",
      epSyncDesc:
        "Sinkronisasi penuh izin anggota — khusus admin ekosistem.",
      authPublic: "Publik",
      authSignature: "Signature",
      authAdmin: "Admin",
      ariaEndpointList: "Daftar endpoint Nusuk API",
      curlLabel: "Contoh permintaan cURL — cek izin",
      ariaCurlExample: "Contoh perintah cURL",
      curlExample: `# Verifikasi izin Handling Clearance
curl -s "https://muhdin.web.id/api/nusuk/verify?no=NSK-HDL-2026-152220" \\
  -H "Accept: application/json"`,

      /* ---------- WEBHOOK FEED ---------- */
      feedEyebrow: "Webhook Feed",
      feedTitle: "Aktivitas Sinkronisasi Terbaru",
      feedSubtitle:
        "Jejak audit setiap event yang mengalir antara Nusuk dan registri MUHDIN — transparan dan dapat diperiksa publik.",
      feedEmpty: "Belum ada aktivitas sinkronisasi tercatat.",
      recordsAffected: "{n} record terdampak",
      logSUCCESS: "SUCCESS",
      logFAILED: "FAILED",

      /* ---------- ANGGOTA PALING PATUH ---------- */
      topEyebrow: "Compliance Leaderboard",
      topTitle: "Anggota Paling Patuh",
      topSubtitle:
        "Peringkat anggota dengan izin Nusuk aktif terbanyak dan tingkat kepatuhan sinkronisasi tertinggi.",
      ariaRank: "Peringkat {n}",
      ariaCompliance: "Kepatuhan {name}",
      activePermitsShort: "izin aktif",
      pctCompliant: "{n}% patuh",

      /* ---------- CTA ---------- */
      ctaTitle1: "Penyelenggara Anda Belum",
      ctaTitle2: "Terhubung Nusuk?",
      ctaDesc:
        "Bergabunglah dengan ekosistem MUHDIN dan nikmati sinkronisasi izin otomatis ke platform Nusuk — visa, handling, hotel, hingga Rawdah — tanpa kerumitan administrasi terpisah.",
      ctaJoin: "Gabung MUHDIN",
      ctaContact: "Hubungi Tim Integrasi",
      ariaJoin: "Gabung MUHDIN sekarang",
      ariaContactTeam: "Hubungi tim integrasi",

      /* ---------- LOADING & ERROR ---------- */
      ariaLoading: "Memuat data Nusuk Hub",
      ariaError: "Gagal memuat data",
      errorTitle: "Gagal Memuat Nusuk Hub",
      retry: "Coba Lagi",
      ariaRetry: "Coba muat ulang data Nusuk",

      /* ---------- SALIN ---------- */
      copiedTitle: "Disalin ✓",
      copiedDesc: "Teks tersalin ke clipboard.",
      copyFailedTitle: "Gagal menyalin",
      copyFailedDesc: "Clipboard tidak tersedia di peramban ini.",
      copy: "Salin",
      ariaCopy: "Salin {label} ke clipboard",
      fallbackCopyLabel: "teks",

      /* ---------- LABEL BERBASIS KODE ---------- */
      permitTypeVISA: "Visa Authorization",
      permitTypeHANDLING: "Handling Clearance",
      permitTypeMUTAWIF: "Mutawif License",
      permitTypeHOTEL: "Hotel Contract",
      permitTypeTRANSPORT: "Transport Permit",
      permitTypeRAUDAH: "Rawdah Permit",
      statusACTIVE: "AKTIF",
      statusPENDING: "PENDING",
      statusEXPIRED: "KEDALUWARSA",
      statusREJECTED: "DITOLAK",
      logTypeFULL_SYNC: "Full Sync",
      logTypeWEBHOOK: "Webhook",
      logTypeCONNECTION: "Koneksi",
      envSANDBOX: "SANDBOX",
      envPRODUCTION: "PRODUCTION",
      mtPPIU: "PPIU",
      mtPIHK: "PIHK",
      mtKBIHU: "KBIHU",
      mtIPHI: "IPHI",
      mtTRAVEL_WISATA: "Travel Wisata",

      /* ---------- DATA & LAYANAN RESMI (Task 23 — riset nusuk.sa & haj.gov.sa) ---------- */
      offEyebrow: "Data Resmi Terkini",
      offTitle: "Selaras dengan Nusuk & Kementerian Hajj dan Umrah",
      offSubtitle:
        "Rujukan resmi dari nusuk.sa dan haj.gov.sa — fondasi integrasi MUHDIN dengan ekosistem digital Kerajaan Saudi Arabia.",
      offStatUsers: "Pengguna Aplikasi Nusuk",
      offStatVisas: "Visa Umrah via Nusuk Masar",
      offStatHajj: "Jamaah Haji 1446 H / 2025 M",
      offStatSeason: "Jamaah Musim Haji & Umrah 2024–2025",
      offStatNote: "Sumber rilis resmi: Kementerian Hajj & Umrah KSA · GASTAT · SPA.",
      svcTitle: "Enam Pilar Layanan Resmi Nusuk",
      svcSubtitle:
        "Semua yang dibutuhkan Tamu Allah di satu pintu — selaras dengan tagline resmi nusuk.sa: “بوابتك لرحلة إيمانية ميسّرة” (Gerbang Perjalanan Keimanan yang Mudah).",
      svc1Title: "Visa & Nusuk Masar",
      svc1Desc: "Penerbitan visa Umrah digital lewat platform Nusuk Masar — 12,4 juta visa telah diterbitkan secara resmi.",
      svc2Title: "Izin Umrah",
      svc2Desc: "Izin resmi menunaikan Umrah per tanggal dan jam melalui aplikasi Nusuk — sah, terjadwal, tanpa antre.",
      svc3Title: "Izin Rawdah Syarifah",
      svc3Desc: "Slot shalat di Rawdah Syarifah — “sebuah taman dari taman-taman surga” — dipesan mudah lewat aplikasi Nusuk.",
      svc4Title: "Paket Haji & Umrah",
      svc4Desc: "Penerbangan, akomodasi Makkah–Madinah, katering, dan transportasi dari penyelenggara terakreditasi.",
      svc5Title: "Transportasi & Mashaer",
      svc5Desc: "Mobilitas antar titik ritual — kereta Mashaer, bus resmi, dan panduan perjalanan terpandu.",
      svc6Title: "Panduan & Edukasi",
      svc6Desc: "Konten ibadah, peta suci, dan edukasi ritual yang memperkaya perjalanan keimanan.",
      quotaTitle: "Kuota Haji Indonesia 1447 H / 2026 M",
      quotaTotalLabel: "jemaah nasional",
      quotaReguler: "Reguler 92% · 203.320",
      quotaKhusus: "Khusus 8% · 17.680",
      quotaNote: "Sumber: Kementerian Agama RI. MUHDIN mengawal penyaluran kanal khusus agar tuntas, transparan, dan terpantau penuh.",
      linksTitle: "Sumber Resmi",
      linkNusuk: "nusuk.sa — Portal Resmi Nusuk",
      linkNusukDesc: "Layanan visa, izin, dan perjalanan Tamu Allah.",
      linkHajj: "haj.gov.sa — Kementerian Hajj & Umrah",
      linkHajjDesc: "Kebijakan, statistik, dan pengumuman resmi pemerintah KSA.",
      dgaNote: "Nusuk terdaftar pada Otoritas Pemerintah Digital (DGA) Kerajaan Arab Saudi — situs resmi selalu berakhiran .sa dan menggunakan HTTPS.",
      healthNote: "Syarat kesehatan: vaksin meningitis (ACWY) dan vaksinasi rutin wajib bagi seluruh Tamu Allah sebelum keberangkatan.",
      ariaOfficialLinks: "Tautan sumber resmi",

      /* ---------- Task 47 — INFO RESMI BARU (riset langsung nusuk.sa & haj.gov.sa, 28 Sep 2026) ---------- */
      esTitle: "Layanan Elektronik Resmi Kementerian Hajj & Umrah",
      esSubtitle:
        "Tiga layanan utama yang kini dapat diakses digital — sebagaimana tercantum di portal resmi haj.gov.sa. Izin Umrah dan Rawdah diterbitkan melalui aplikasi Nusuk.",
      esHajjTitle: "Pemesanan Paket Haji (Domestik)",
      esHajjDesc:
        "Layanan elektronik resmi untuk memesan paket Haji dan menerbitkan izin Haji bagi jamaah domestik Kerajaan.",
      esRawdahTitle: "Penerbitan Izin Rawdah Syarif (Pria/Wanita)",
      esRawdahDesc:
        "Pemesanan jadwal kunjungan Rawdah di Masjid Nabawi — mengatur kunjungan demi kenyamanan dan keselamatan jamaah.",
      esUmrahTitle: "Permohonan Izin Umrah",
      esUmrahDesc:
        "Penerbitan permohonan izin Umrah resmi — gratis, terjadwal per tanggal dan jam, langsung dari aplikasi Nusuk.",
      esBtn: "Akses Layanan",
      ariaEservices: "Layanan elektronik resmi Kementerian",
      rulesTitle: "Aturan Penting bagi Tamu Allah",
      rulesSubtitle:
        "Rangkuman regulasi terkini dari nusuk.sa & haj.gov.sa (2025–2026). Pastikan selalu mengonfirmasi di saluran resmi sebelum keberangkatan.",
      ariaRules: "Daftar aturan penting Tamu Allah",
      rule1Title: "Izin Umrah Gratis",
      rule1Desc:
        "Izin Umrah diterbitkan tanpa biaya melalui aplikasi Nusuk — wajib ditunjukkan saat memasuki area Mataf di Masjidil Haram.",
      rule2Title: "Rawdah Sekali per Musim",
      rule2Desc:
        "Izin Rawdah terbatas satu kali per musim Umrah. Sejak Juni 2026 pemesanan sepenuhnya via aplikasi Nusuk — tak lagi melalui tasreh grup.",
      rule3Title: "Izin Wajib, Apapun Visanya",
      rule3Desc:
        "Perizinan Nusuk wajib untuk memasuki Mataf Makkah dan Rawdah Madinah — berlaku untuk seluruh jenis visa dan izin tinggal.",
      rule4Title: "Visa Umrah Multi-Entry 1 Tahun",
      rule4Desc:
        "Visa Umrah berlaku satu tahun dengan kunjungan berulang, maksimal 90 hari tinggal per kunjungan.",
      rule5Title: "Ibadah Selesai dalam 30 Hari",
      rule5Desc:
        "Rangkaian Umrah harus dituntaskan paling lama 30 hari sejak kedatangan. Melewati masa tinggal dapat dikenakan denda.",
      rule6Title: "Akomodasi Dipesan Lebih Dulu",
      rule6Desc:
        "Sejak 2025, pengajuan visa Umrah mensyaratkan pemesanan akomodasi terlebih dahulu melalui platform resmi.",
      rule7Title: "e-Visa Turis Bisa Umrah",
      rule7Desc:
        "e-Visa turis (satu tahun, multi-entry, 90 hari per kunjungan) juga boleh menunaikan ibadah Umrah di Kerajaan.",
      rule8Title: "Fasilitas Warga GCC",
      rule8Desc:
        "Warga negara GCC bebas visa; pemegang izin tinggal GCC (minimal 3 bulan) dapat mengajukan e-visa bersama keluarga.",
      contactTitle: "Kontak Resmi & Aplikasi Nusuk",
      contactSubtitle:
        "Saluran bantuan resmi platform Nusuk — dijawab dalam Bahasa Arab & Inggris, 24 jam.",
      ariaContacts: "Kontak resmi Nusuk dan aplikasi",
      hotlineLocalLabel: "Panggilan dalam Kerajaan (KSA)",
      hotlineIntlLabel: "Panggilan dari luar Kerajaan",
      appCardLabel: "Aplikasi Resmi",
      appCardTitle: "Aplikasi Nusuk — iOS & Android",
      appCardDesc:
        "Izin, peta suci, kepadatan jamaah, jadwal sholat, dan tiket kereta Haramain — dalam satu aplikasi. Unduh di App Store & Google Play.",
      srcNote:
        "Informasi di halaman ini dirangkum langsung dari nusuk.sa dan haj.gov.sa (diperiksa langsung {date}). Regulasi perjalanan dapat berubah sewaktu-waktu — selalu konfirmasi melalui saluran resmi sebelum keberangkatan.",
    },
  },
  en: {
    nusuk: {
      /* ---------- HERO ---------- */
      heroTitle1: "Directly Connected to the",
      heroTitle2: "Nusuk Platform",
      heroDescAuto1:
        "The official data bridge of the MUHDIN ecosystem to Nusuk — the digital platform of the Ministry of Hajj & Umrah of the Kingdom of Saudi Arabia. Automatic synchronization is running and has been recorded",
      heroDescManual1:
        "The official data bridge of the MUHDIN ecosystem to Nusuk — the digital platform of the Ministry of Hajj & Umrah of the Kingdom of Saudi Arabia. Synchronization is run manually and has been recorded",
      heroDescPost: "in the {env} environment.",
      heroLoading:
        "Fetching connection status from the Nusuk registry of the Ministry of Hajj & Umrah of the Kingdom of Saudi Arabia…",
      chipConnected: "Connected",
      chipDisconnected: "Disconnected",
      ariaConnStatus: "Nusuk connection status",
      lastSync: "Last sync: {ago}",

      /* ---------- RELATIVE TIME & DURATION ---------- */
      agoNever: "never",
      agoSec: "{n} seconds ago",
      agoMin: "{n} minutes ago",
      agoHour: "{n} hours ago",
      agoDay: "{n} days ago",
      durMs: "{n} ms",
      durSec: "{n} s",

      /* ---------- LIVE METRICS ---------- */
      metricsEyebrow: "Live Metrics",
      metricsTitle: "The Pulse of Nusuk Integration",
      metricsSubtitle:
        "Real-time figures from the MUHDIN ecosystem permit registry, synchronized with the Nusuk platform.",
      statActivePermits: "Active Permits",
      statMembersSynced: "Members Synchronized",
      statSyncSuccess: "Sync Success Rate",
      statTotalSyncs: "Total Synchronizations",
      byTypeLabel: "Permits by type",
      typeChipTitle: "{label}: {total} total, {active} active",
      typeChip: "{total} total · {active} active",
      avgLine: "Average {dur} · {n} syncs / 7 days",

      /* ---------- PERMIT CHECKER ---------- */
      checkerEyebrow: "Permit Checker",
      checkerTitle: "Verify the Authenticity of a Nusuk Permit",
      checkerSubtitle:
        "A free public tool for pilgrims and partners: enter a permit number and get its official status in an instant.",
      checkerCardTitle: "Check a Nusuk Permit",
      checkerCardDesc:
        "Verify the authenticity of permits issued through the Nusuk–MUHDIN integration.",
      checkerPlaceholder: "Example: NSK-VSA-2026-482913",
      ariaPermitNo: "Nusuk permit number",
      ariaVerifyNow: "Verify the permit number now",
      verifyNow: "Verify Now",
      checkerHint:
        "The permit number is stated on the booking confirmation issued by a MUHDIN-verified provider.",
      errEmptyNo: "Please enter a Nusuk permit number first.",
      verifyFailed: "Verification failed",
      checkedLine: "{env} · checked {ago}",
      permitNoLabel: "Permit Number",
      onBehalf: "Issued for {name}",
      labelHolder: "Provider",
      labelValidity: "Validity Period",
      labelPermitNote: "Permit Notes",
      licenseWord: "License",
      lastSyncShort: "Last synchronized {ago}",

      /* ---------- 3 TRUST CARDS ---------- */
      trust1Title: "Official Registry Data",
      trust1Desc: "The single source of the Nusuk–MUHDIN permit registry.",
      trust2Title: "Real-Time Sync",
      trust2Desc: "The status reflects the latest synchronization.",
      trust3Title: "Anti-Forged Permits",
      trust3Desc: "Protect pilgrims from unauthorized documents.",

      /* ---------- 13-ECOSYSTEM MATRIX ---------- */
      matrixEyebrow: "Integration Matrix",
      matrixTitle: "The 13 Ecosystems × Nusuk Matrix",
      matrixSubtitle:
        "A map of MUHDIN service coverage against the Nusuk platform — from visas to quality oversight, along with each availability stage.",
      matrixPending: "Technical integration in preparation",
      statusLegend:
        "Status legend: LIVE = active integration channel on the platform · PILOT = limited trial · dated = planned. Nusuk integration proceeds in stages under the competent authority.",
      syncedLive: "Permits synced live",
      svc1: "Nusuk Visa Platform",
      svc2: "Nusuk Ports & Handling",
      svc3: "Nusuk Guide Registry",
      svc4: "Mashaer & Haramain Link",
      svc5: "Nusuk Mutawif Center",
      svc6: "Nusuk e-Hotel Portal",
      svc7: "Nusuk Transport Permit",
      svc8: "Nusuk Rawdah Alternative Route",
      svc9: "Nusuk Rawdah Permit",
      svc10: "Nusuk Food License",
      svc11: "Nusuk e-Thimar Retail",
      svc12: "Nusuk One-Stop Service",
      svc13: "Nusuk Oversight Link",

      /* ---------- API BRIDGE ---------- */
      apiEyebrow: "API Bridge",
      apiTitle: "Nusuk API Bridge",
      apiSubtitle:
        "An open data bridge between MUHDIN and Nusuk. Public endpoints can be used by partners for self-service integration.",
      epPublicDesc:
        "Public Hub data — connection status, metrics, ecosystems, and synchronization activity.",
      epVerifyDesc:
        "Permit check — verify the authenticity of a Nusuk permit number in real time.",
      epWebhookDesc:
        "Webhook events from Nusuk — verified via the X-Nusuk-Signature header.",
      epSyncDesc:
        "Full synchronization of member permits — ecosystem administrators only.",
      authPublic: "Public",
      authSignature: "Signature",
      authAdmin: "Admin",
      ariaEndpointList: "Nusuk API endpoint list",
      curlLabel: "Sample cURL request — permit check",
      ariaCurlExample: "Sample cURL command",
      curlExample: `# Verify a Handling Clearance permit
curl -s "https://muhdin.web.id/api/nusuk/verify?no=NSK-HDL-2026-152220" \\
  -H "Accept: application/json"`,

      /* ---------- WEBHOOK FEED ---------- */
      feedEyebrow: "Webhook Feed",
      feedTitle: "Latest Synchronization Activity",
      feedSubtitle:
        "An audit trail of every event flowing between Nusuk and the MUHDIN registry — transparent and publicly verifiable.",
      feedEmpty: "No synchronization activity recorded yet.",
      recordsAffected: "{n} records affected",
      logSUCCESS: "SUCCESS",
      logFAILED: "FAILED",

      /* ---------- MOST COMPLIANT MEMBERS ---------- */
      topEyebrow: "Compliance Leaderboard",
      topTitle: "Most Compliant Members",
      topSubtitle:
        "Ranking of members with the most active Nusuk permits and the highest synchronization compliance rate.",
      ariaRank: "Rank {n}",
      ariaCompliance: "Compliance of {name}",
      activePermitsShort: "active permits",
      pctCompliant: "{n}% compliant",

      /* ---------- CTA ---------- */
      ctaTitle1: "Your Provider Is Not Yet",
      ctaTitle2: "Connected to Nusuk?",
      ctaDesc:
        "Join the MUHDIN ecosystem and enjoy automatic permit synchronization to the Nusuk platform — visas, handling, hotels, through to Rawdah — without the hassle of separate administration.",
      ctaJoin: "Join MUHDIN",
      ctaContact: "Contact the Integration Team",
      ariaJoin: "Join MUHDIN now",
      ariaContactTeam: "Contact the integration team",

      /* ---------- LOADING & ERROR ---------- */
      ariaLoading: "Loading Nusuk Hub data",
      ariaError: "Failed to load data",
      errorTitle: "Failed to Load Nusuk Hub",
      retry: "Try Again",
      ariaRetry: "Retry loading Nusuk data",

      /* ---------- COPY ---------- */
      copiedTitle: "Copied ✓",
      copiedDesc: "Text copied to the clipboard.",
      copyFailedTitle: "Failed to copy",
      copyFailedDesc: "The clipboard is not available in this browser.",
      copy: "Copy",
      ariaCopy: "Copy {label} to clipboard",
      fallbackCopyLabel: "text",

      /* ---------- CODE-BASED LABELS ---------- */
      permitTypeVISA: "Visa Authorization",
      permitTypeHANDLING: "Handling Clearance",
      permitTypeMUTAWIF: "Mutawif License",
      permitTypeHOTEL: "Hotel Contract",
      permitTypeTRANSPORT: "Transport Permit",
      permitTypeRAUDAH: "Rawdah Permit",
      statusACTIVE: "ACTIVE",
      statusPENDING: "PENDING",
      statusEXPIRED: "EXPIRED",
      statusREJECTED: "REJECTED",
      logTypeFULL_SYNC: "Full Sync",
      logTypeWEBHOOK: "Webhook",
      logTypeCONNECTION: "Connection",
      envSANDBOX: "Sandbox",
      envPRODUCTION: "Production",
      mtPPIU: "PPIU",
      mtPIHK: "PIHK",
      mtKBIHU: "KBIHU",
      mtIPHI: "IPHI",
      mtTRAVEL_WISATA: "Travel & Tour",

      /* ---------- OFFICIAL DATA & SERVICES (Task 23 — researched from nusuk.sa & haj.gov.sa) ---------- */
      offEyebrow: "Latest Official Data",
      offTitle: "Aligned with Nusuk & the Ministry of Hajj and Umrah",
      offSubtitle:
        "Official references from nusuk.sa and haj.gov.sa — the foundation of MUHDIN's integration with the Kingdom's digital ecosystem.",
      offStatUsers: "Nusuk App Users",
      offStatVisas: "Umrah Visas via Nusuk Masar",
      offStatHajj: "Hajj Pilgrims 1446 AH / 2025 CE",
      offStatSeason: "Pilgrims, Hajj & Umrah Season 2024–2025",
      offStatNote: "Source: official releases — Saudi Ministry of Hajj & Umrah · GASTAT · SPA.",
      svcTitle: "The Six Pillars of Official Nusuk Services",
      svcSubtitle:
        "Everything the Guests of Allah need in one gateway — echoing nusuk.sa's official tagline: “بوابتك لرحلة إيمانية ميسّرة” (Your Gateway to an Easy Faith Journey).",
      svc1Title: "Visa & Nusuk Masar",
      svc1Desc: "Digital Umrah visa issuance via the Nusuk Masar platform — over 12.4 million visas officially issued.",
      svc2Title: "Umrah Permit",
      svc2Desc: "Official permit to perform Umrah by date and time through the Nusuk app — valid, scheduled, queue-free.",
      svc3Title: "Rawdah Sharifah Permit",
      svc3Desc: "Prayer slots at the Rawdah Sharifah — “a garden from the gardens of Paradise” — easily booked on the Nusuk app.",
      svc4Title: "Hajj & Umrah Packages",
      svc4Desc: "Flights, Makkah–Madinah accommodation, catering, and transport from accredited providers.",
      svc5Title: "Transport & Mashaer",
      svc5Desc: "Mobility between the ritual sites — the Mashaer train, official buses, and guided journeys.",
      svc6Title: "Guidance & Education",
      svc6Desc: "Worship content, holy-site maps, and ritual education that enrich the faith journey.",
      quotaTitle: "Indonesia Hajj Quota 1447 AH / 2026 CE",
      quotaTotalLabel: "national pilgrims",
      quotaReguler: "Regular 92% · 203,320",
      quotaKhusus: "Special 8% · 17,680",
      quotaNote: "Source: Ministry of Religious Affairs of Indonesia. MUHDIN oversees special-channel allocation to be complete, transparent, and fully monitored.",
      linksTitle: "Official Sources",
      linkNusuk: "nusuk.sa — Official Nusuk Portal",
      linkNusukDesc: "Visa, permits, and services for the Guests of Allah.",
      linkHajj: "haj.gov.sa — Ministry of Hajj & Umrah",
      linkHajjDesc: "Official Saudi government policies, statistics, and announcements.",
      dgaNote: "Nusuk is registered with the Saudi Digital Government Authority (DGA) — official sites always end in .sa and use HTTPS.",
      healthNote: "Health requirement: meningitis (ACWY) and routine vaccinations are mandatory for all Guests of Allah before departure.",
      ariaOfficialLinks: "Official source links",

      /* ---------- Task 47 — NEW OFFICIAL INFO (live research nusuk.sa & haj.gov.sa, 28 Sep 2026) ---------- */
      esTitle: "Official e-Services of the Ministry of Hajj & Umrah",
      esSubtitle:
        "Three flagship services now fully digital — as listed on the official haj.gov.sa portal. Umrah and Rawdah permits are issued through the Nusuk app.",
      esHajjTitle: "Hajj Package Booking (Domestic)",
      esHajjDesc:
        "An official e-service for booking Hajj packages and issuing Hajj permits for the Kingdom's domestic pilgrims.",
      esRawdahTitle: "Rawdah Sharif Permit (Men / Women)",
      esRawdahDesc:
        "Booking an appointment to visit the Rawdah at the Prophet's Mosque — organizing visits for worshippers' comfort and safety.",
      esUmrahTitle: "Umrah Permit Application",
      esUmrahDesc:
        "Issuing official Umrah permit requests — free of charge, scheduled by date and hour, straight from the Nusuk app.",
      esBtn: "Access Service",
      ariaEservices: "Ministry official e-services",
      rulesTitle: "Essential Rules for the Guests of Allah",
      rulesSubtitle:
        "A summary of the latest 2025–2026 regulations from nusuk.sa & haj.gov.sa. Always confirm via official channels before departure.",
      ariaRules: "Essential rules list for the Guests of Allah",
      rule1Title: "Umrah Permit Is Free",
      rule1Desc:
        "The Umrah permit is issued free of charge via the Nusuk app and must be shown when entering the Mataf area of the Grand Mosque.",
      rule2Title: "Rawdah Once per Season",
      rule2Desc:
        "Rawdah permits are limited to once per Umrah season. Since June 2026, booking is fully managed through the Nusuk app — no longer via group tasreh.",
      rule3Title: "Permit Required, Any Visa",
      rule3Desc:
        "A Nusuk permit is mandatory to enter the Mataf in Makkah and the Rawdah in Madinah — for all visa types and residency permits.",
      rule4Title: "1-Year Multiple-Entry Umrah Visa",
      rule4Desc:
        "The Umrah visa is valid for one year with repeated visits, up to 90 days of stay per visit.",
      rule5Title: "Complete Umrah Within 30 Days",
      rule5Desc:
        "The Umrah rites must be completed within 30 days of arrival. Overstaying may result in fines.",
      rule6Title: "Accommodation Booked First",
      rule6Desc:
        "Since 2025, Umrah visa applications require booking accommodation in advance through the official platform.",
      rule7Title: "Tourist e-Visa Can Perform Umrah",
      rule7Desc:
        "The tourist e-visa (one year, multiple entry, 90 days per visit) also permits performing Umrah in the Kingdom.",
      rule8Title: "GCC Citizens' Privileges",
      rule8Desc:
        "GCC citizens are visa-exempt; GCC residents (with ≥3-month permits) may apply for an e-visa together with their families.",
      contactTitle: "Official Contacts & the Nusuk App",
      contactSubtitle:
        "Official support channels of the Nusuk platform — available around the clock in Arabic and English.",
      ariaContacts: "Official Nusuk contacts and app",
      hotlineLocalLabel: "Inside the Kingdom (KSA)",
      hotlineIntlLabel: "Outside the Kingdom",
      appCardLabel: "Official App",
      appCardTitle: "Nusuk App — iOS & Android",
      appCardDesc:
        "Permits, holy-site maps, crowd density, prayer times, and Haramain train tickets — in one app. Get it on the App Store & Google Play.",
      srcNote:
        "The information on this page is compiled directly from nusuk.sa and haj.gov.sa (verified {date}). Travel regulations may change at any time — always confirm through official channels before departure.",
    },
  },
  ar: {
    nusuk: {
      /* ---------- البطل ---------- */
      heroTitle1: "اتصال مباشر مع",
      heroTitle2: "منصة نوسك",
      heroDescAuto1:
        "الجسر الرسمي لبيانات منظومة موهدين إلى نوسك — المنصة الرقمية لوزارة الحج والعمرة في المملكة العربية السعودية. تعمل المزامنة تلقائيا وقد سجلناها",
      heroDescManual1:
        "الجسر الرسمي لبيانات منظومة موهدين إلى نوسك — المنصة الرقمية لوزارة الحج والعمرة في المملكة العربية السعودية. يتم تنفيذ المزامنة يدويا وقد سجلناها",
      heroDescPost: "في بيئة {env}.",
      heroLoading:
        "جارٍ جلب حالة الاتصال من سجل نوسك في وزارة الحج والعمرة بالمملكة العربية السعودية…",
      chipConnected: "متصل",
      chipDisconnected: "غير متصل",
      ariaConnStatus: "حالة الاتصال بنوسك",
      lastSync: "آخر مزامنة: {ago}",

      /* ---------- الوقت النسبي والمدة ---------- */
      agoNever: "أبدا",
      agoSec: "قبل {n} ثانية",
      agoMin: "قبل {n} دقيقة",
      agoHour: "قبل {n} ساعة",
      agoDay: "قبل {n} يوم",
      durMs: "{n} مللي ثانية",
      durSec: "{n} ث",

      /* ---------- المؤشرات الحية ---------- */
      metricsEyebrow: "مؤشرات حية",
      metricsTitle: "نبض التكامل مع نوسك",
      metricsSubtitle:
        "أرقام فورية من سجل تراخيص منظومة موهدين المتزامن مع منصة نوسك.",
      statActivePermits: "التراخيص النشطة",
      statMembersSynced: "الأعضاء المتزامنون",
      statSyncSuccess: "معدل نجاح المزامنة",
      statTotalSyncs: "إجمالي المزامنات",
      byTypeLabel: "التراخيص حسب النوع",
      typeChipTitle: "{label}: {total} إجمالا، {active} نشط",
      typeChip: "{total} إجمالا · {active} نشط",
      avgLine: "المتوسط {dur} · {n} مزامنة / 7 أيام",

      /* ---------- مدقق التراخيص ---------- */
      checkerEyebrow: "مدقق التراخيص",
      checkerTitle: "تحقق من صحة ترخيص نوسك",
      checkerSubtitle:
        "أداة عامة مجانية للحجاج والشركاء: أدخل رقم الترخيص واحصل على حالته الرسمية في لحظات.",
      checkerCardTitle: "التحقق من ترخيص نوسك",
      checkerCardDesc:
        "تحقق من صحة التراخيص الصادرة عبر التكامل بين نوسك وموهدين.",
      checkerPlaceholder: "مثال: NSK-VSA-2026-482913",
      ariaPermitNo: "رقم ترخيص نوسك",
      ariaVerifyNow: "التحقق من رقم الترخيص الآن",
      verifyNow: "تحقق الآن",
      checkerHint:
        "رقم الترخيص مدرج في إثبات الحجز الصادر من منظم معتمد من موهدين.",
      errEmptyNo: "الرجاء إدخال رقم ترخيص نوسك أولا.",
      verifyFailed: "فشل التحقق",
      checkedLine: "{env} · تم التحقق {ago}",
      permitNoLabel: "رقم الترخيص",
      onBehalf: "باسم {name}",
      labelHolder: "المنظم",
      labelValidity: "فترة الصلاحية",
      labelPermitNote: "ملاحظات الترخيص",
      licenseWord: "ترخيص",
      lastSyncShort: "آخر مزامنة {ago}",

      /* ---------- بطاقات الثقة الثلاث ---------- */
      trust1Title: "بيانات السجل الرسمي",
      trust1Desc: "المصدر الوحيد لسجل تراخيص نوسك وموهدين.",
      trust2Title: "مزامنة فورية",
      trust2Desc: "تعكس الحالة آخر عملية مزامنة.",
      trust3Title: "ضد التراخيص المزورة",
      trust3Desc: "حماية الحجاج من المستندات غير النظامية.",

      /* ---------- مصفوفة 13 منظومة ---------- */
      matrixEyebrow: "مصفوفة التكامل",
      matrixTitle: "مصفوفة 13 منظومة × نوسك",
      matrixSubtitle:
        "خريطة تغطية خدمات موهدين لمنصة نوسك — من التأشيرات إلى الإشراف على الجودة، مع مراحل التوافر.",
      matrixPending: "جارٍ إعداد التكامل التقني",
      statusLegend:
        "مفتاح الحالة: LIVE = قناة تكامل نشطة على المنصة · PILOT = تجربة محدودة · مؤرَّخ = مُخطَّط. تكامل نوسك يسير على مراحل تحت سلطة مختصة.",
      syncedLive: "تراخيص متزامنة مباشرة",
      svc1: "منصة نوسك للتأشيرات",
      svc2: "نوسك للموانئ والمناولة",
      svc3: "سجل المرشدين في نوسك",
      svc4: "ربط المشاعر والحرمين",
      svc5: "مركز المطوفين في نوسك",
      svc6: "بوابة فنادق نوسك الإلكترونية",
      svc7: "ترخيص النقل في نوسك",
      svc8: "المسار البديل للروضة في نوسك",
      svc9: "تصريح الروضة في نوسك",
      svc10: "ترخيص الأغذية في نوسك",
      svc11: "بيع الثمار الإلكتروني في نوسك",
      svc12: "خدمة النافذة الواحدة في نوسك",
      svc13: "رابط الإشراف في نوسك",

      /* ---------- الجسر البرمجي ---------- */
      apiEyebrow: "الجسر البرمجي",
      apiTitle: "الجسر البرمجي لنوسك",
      apiSubtitle:
        "جسر بيانات مفتوح بين موهدين ونوسك. يمكن للشركاء استخدام نقاط النهاية العامة للتكامل الذاتي.",
      epPublicDesc:
        "بيانات المركز العام — حالة الاتصال والمؤشرات والمنظومات ونشاط المزامنة.",
      epVerifyDesc:
        "التحقق من الترخيص — التحقق من صحة رقم ترخيص نوسك فوريا.",
      epWebhookDesc:
        "أحداث ويبهوك من نوسك — يتم التحقق منها عبر ترويسة X-Nusuk-Signature.",
      epSyncDesc:
        "مزامنة كاملة لتراخيص الأعضاء — لمدراء المنظومة فقط.",
      authPublic: "عام",
      authSignature: "توقيع",
      authAdmin: "المدير",
      ariaEndpointList: "قائمة نقاط نهاية واجهة نوسك البرمجية",
      curlLabel: "مثال طلب cURL — التحقق من الترخيص",
      ariaCurlExample: "مثال أمر cURL",
      curlExample: `# التحقق من ترخيص المناولة
curl -s "https://muhdin.web.id/api/nusuk/verify?no=NSK-HDL-2026-152220" \\
  -H "Accept: application/json"`,

      /* ---------- بث الأحداث ---------- */
      feedEyebrow: "بث الأحداث",
      feedTitle: "أحدث نشاطات المزامنة",
      feedSubtitle:
        "سجل تدقيق لكل حدث يتدفق بين نوسك وسجل موهدين — شفاف وقابل للفحص من الجمهور.",
      feedEmpty: "لم يسجل أي نشاط مزامنة بعد.",
      recordsAffected: "تأثر {n} من السجلات",
      logSUCCESS: "ناجحة",
      logFAILED: "فاشلة",

      /* ---------- الأعضاء الأكثر التزاما ---------- */
      topEyebrow: "لوحة صدارة الالتزام",
      topTitle: "الأعضاء الأكثر التزاما",
      topSubtitle:
        "ترتيب الأعضاء الأكثر امتلاكا للتراخيص النشطة في نوسك وأعلى معدل التزام بالمزامنة.",
      ariaRank: "المرتبة {n}",
      ariaCompliance: "التزام {name}",
      activePermitsShort: "تراخيص نشطة",
      pctCompliant: "التزام {n}%",

      /* ---------- الدعوة ---------- */
      ctaTitle1: "منظمك غير متصل بعد بـ",
      ctaTitle2: "نوسك",
      ctaDesc:
        "انضم إلى منظومة موهدين واستمتع بمزامنة تلقائية للتراخيص إلى منصة نوسك — التأشيرات والمناولة والفنادق وحتى الروضة — دون تعقيدات إدارية منفصلة.",
      ctaJoin: "انضم إلى موهدين",
      ctaContact: "تواصل مع فريق التكامل",
      ariaJoin: "انضم إلى موهدين الآن",
      ariaContactTeam: "تواصل مع فريق التكامل",

      /* ---------- التحميل والخطأ ---------- */
      ariaLoading: "جارٍ تحميل بيانات مركز نوسك",
      ariaError: "فشل تحميل البيانات",
      errorTitle: "فشل تحميل مركز نوسك",
      retry: "حاول مجددا",
      ariaRetry: "أعد محاولة تحميل بيانات نوسك",

      /* ---------- النسخ ---------- */
      copiedTitle: "تم النسخ ✓",
      copiedDesc: "تم نسخ النص إلى الحافظة.",
      copyFailedTitle: "فشل النسخ",
      copyFailedDesc: "الحافظة غير متوفرة في هذا المتصفح.",
      copy: "نسخ",
      ariaCopy: "انسخ {label} إلى الحافظة",
      fallbackCopyLabel: "النص",

      /* ---------- تسميات حسب الرمز ---------- */
      permitTypeVISA: "إذن التأشيرة",
      permitTypeHANDLING: "إذن خدمات المناولة",
      permitTypeMUTAWIF: "ترخيص المطوف",
      permitTypeHOTEL: "عقد الفندق",
      permitTypeTRANSPORT: "ترخيص النقل",
      permitTypeRAUDAH: "تصريح الروضة",
      statusACTIVE: "نشط",
      statusPENDING: "قيد الانتظار",
      statusEXPIRED: "منتهي الصلاحية",
      statusREJECTED: "مرفوض",
      logTypeFULL_SYNC: "مزامنة كاملة",
      logTypeWEBHOOK: "ويبهوك",
      logTypeCONNECTION: "اتصال",
      envSANDBOX: "بيئة تجريبية",
      envPRODUCTION: "بيئة الإنتاج",
      mtPPIU: "PPIU",
      mtPIHK: "PIHK",
      mtKBIHU: "KBIHU",
      mtIPHI: "IPHI",
      mtTRAVEL_WISATA: "السفر والسياحة",

      /* ---------- البيانات والخدمات الرسمية (المهمة 23 — من nusuk.sa و haj.gov.sa) ---------- */
      offEyebrow: "أحدث البيانات الرسمية",
      offTitle: "متوافقون مع نسك ووزارة الحج والعمرة",
      offSubtitle:
        "مراجع رسمية من nusuk.sa و haj.gov.sa — أساس تكامل MUHDIN مع منظومة المملكة الرقمية.",
      offStatUsers: "مستخدمو تطبيق نسك",
      offStatVisas: "تأشيرات العمرة عبر مسار نسك",
      offStatHajj: "حجاج بيت الله ١٤٤٦ هـ / ٢٠٢٥ م",
      offStatSeason: "الحجاج في موسم الحج والعمرة ٢٠٢٤–٢٠٢٥",
      offStatNote: "المصدر: الإصدارات الرسمية — وزارة الحج والعمرة السعودية · الهيئة العامة للإحصاء · واس.",
      svcTitle: "ركائز خدمات نسك الرسمية الست",
      svcSubtitle:
        "كل ما يحتاجه ضيف الرحمن في بوابة واحدة — توافقًا مع شعار نسك الرسمي: “بوابتك لرحلة إيمانية ميسّرة”.",
      svc1Title: "التأشيرة ومسار نسك",
      svc1Desc: "إصدار تأشيرات العمرة رقميًا عبر منصة مسار نسك — أكثر من ١٢٫٤ مليون تأشيرة تم إصدارها رسميًا.",
      svc2Title: "تصريح العمرة",
      svc2Desc: "تصريح رسمي لأداء العمرة بتاريخ ووقت محددين عبر تطبيق نسك — صالح ومنظم ودون انتظار.",
      svc3Title: "تصريح الروضة الشريفة",
      svc3Desc: "مواعيد الصلاة في الروضة الشريفة — «روضة من رياض الجنة» — تُحجز بسهولة عبر تطبيق نسك.",
      svc4Title: "باقات الحج والعمرة",
      svc4Desc: "الطيران وإقامة مكة والمدينة والضيافة والنقل من منظمين معتمدين.",
      svc5Title: "النقل والمشاعر",
      svc5Desc: "التنقل بين المشاعر المقدسة — قطار المشاعر والحافلات الرسمية ورحلات مُرشَدة.",
      svc6Title: "الإرشاد والتعليم",
      svc6Desc: "محتوى تعبدي وخرائط الأراضي المقدسة وتعليم المناسك يثري رحلة الإيمان.",
      quotaTitle: "حصة الحج الإندونيسية ١٤٤٧ هـ / ٢٠٢٦ م",
      quotaTotalLabel: "حاجًا إندونيسيًا",
      quotaReguler: "عادي ٩٢٪ · ٢٠٣٫٣٢٠",
      quotaKhusus: "خاص ٨٪ · ١٧٫٦٨٠",
      quotaNote: "المصدر: وزارة الشؤون الدينية الإندونيسية. تشرف MUHDIN على توزيع القناة الخاصة بشكل كامل وشفاف ومُراقب.",
      linksTitle: "المصادر الرسمية",
      linkNusuk: "nusuk.sa — البوابة الرسمية لنسك",
      linkNusukDesc: "خدمات التأشيرات والتصاريح ورحلات ضيوف الرحمن.",
      linkHajj: "haj.gov.sa — وزارة الحج والعمرة",
      linkHajjDesc: "سياسات وإحصاءات وإعلانات حكومة المملكة الرسمية.",
      dgaNote: "نسك مسجّل لدى هيئة الحكومة الرقمية السعودية — المواقع الرسمية تنتهي دائمًا بـ .sa وتستخدم HTTPS.",
      healthNote: "الاشتراط الصحي: تطعيم الحمى الشوكية (ACWY) والتطعيمات الروتينية واجبة لجميع ضيوف الرحمن قبل السفر.",
      ariaOfficialLinks: "روابط المصادر الرسمية",

      /* ---------- المهمة 47 — معلومات رسمية جديدة (بحث مباشر من nusuk.sa و haj.gov.sa، ٢٨ سبتمبر ٢٠٢٦) ---------- */
      esTitle: "الخدمات الإلكترونية الرسمية لوزارة الحج والعمرة",
      esSubtitle:
        "ثلاث خدمات رئيسية أصبحت رقمية بالكامل — كما هو معروض في بوابة haj.gov.sa الرسمية. وتصدر تصاريح العمرة والروضة عبر تطبيق نسك.",
      esHajjTitle: "حجز باقات الحج (الداخليون)",
      esHajjDesc:
        "خدمة إلكترونية رسمية لحجز باقات الحج وإصدار تصاريح الحج للحجاج الداخليين في المملكة.",
      esRawdahTitle: "إصدار تصريح الروضة الشريفة (رجال / نساء)",
      esRawdahDesc:
        "حجز موعد لزيارة الروضة في المسجد النبوي الشريف — تنظيم الزيارات لراحة المصلين وسلامتهم.",
      esUmrahTitle: "طلب تصريح العمرة",
      esUmrahDesc:
        "إصدار طلبات تصريح العمرة رسميًا — مجانًا وبموعد محدد بالتاريخ والساعة، مباشرة من تطبيق نسك.",
      esBtn: "استخدام الخدمة",
      ariaEservices: "الخدمات الإلكترونية الرسمية للوزارة",
      rulesTitle: "أهم الأنظمة لضيوف الرحمن",
      rulesSubtitle:
        "ملخص أحدث أنظمة ٢٠٢٥–٢٠٢٦ من nusuk.sa و haj.gov.sa. تأكد دائمًا عبر القنوات الرسمية قبل السفر.",
      ariaRules: "قائمة الأنظمة المهمة لضيوف الرحمن",
      rule1Title: "تصريح العمرة مجاني",
      rule1Desc:
        "يُصدر تصريح العمرة مجانًا عبر تطبيق نسك ويجب إبرازه عند دخول منطقة المطاف في الحرم المكي.",
      rule2Title: "الروضة مرة واحدة في الموسم",
      rule2Desc:
        "تصريح الروضة محصور بمرة واحدة في موسم العمرة. ومنذ يونيو ٢٠٢٦ يتم الحجز حصريًا عبر تطبيق نسك — دون التسريح الجماعي.",
      rule3Title: "التصريح واجب لأي تأشيرة",
      rule3Desc:
        "تصريح نسك واجب لدخول المطاف في مكة والروضة في المدينة — لجميع أنواع التأشيرات والإقامات.",
      rule4Title: "تأشيرة عمرة متعددة لسنة",
      rule4Desc:
        "تأشيرة العمرة صالحة لسنة واحدة بزيارات متكررة، بحد أقصى ٩٠ يومًا إقامة لكل زيارة.",
      rule5Title: "إتمام العمرة خلال ٣٠ يومًا",
      rule5Desc:
        "يجب إتمام مناسك العمرة خلال ٣٠ يومًا كحد أقصى من الوصول. وقد تفرض غرامات على تجاوز مدة الإقامة.",
      rule6Title: "حجز الإقامة أولا",
      rule6Desc:
        "منذ ٢٠٢٥ يتطلب طلب تأشيرة العمرة حجز الإقامة مقدمًا عبر المنصة الرسمية.",
      rule7Title: "التأشيرة السياحية تصلح للعمرة",
      rule7Desc:
        "التأشيرة السياحية الإلكترونية (سنة، متعددة الدخول، ٩٠ يومًا للزيارة) تتيح أداء العمرة في المملكة.",
      rule8Title: "مزايا مواطني الخليج",
      rule8Desc:
        "مواطنو دول مجلس التعاون لا يحتاجون تأشيرة؛ ويقدم المقيمون في دول الخليج (بإقامة ٣ أشهر فأكثر) طلب التأشيرة الإلكترونية مع أسرهم.",
      contactTitle: "جهات الاتصال الرسمية وتطبيق نسك",
      contactSubtitle:
        "قنوات الدعم الرسمية لمنصة نسك — متاحة على مدار الساعة بالعربية والإنجليزية.",
      ariaContacts: "جهات الاتصال الرسمية لنسك والتطبيق",
      hotlineLocalLabel: "داخل المملكة",
      hotlineIntlLabel: "من خارج المملكة",
      appCardLabel: "التطبيق الرسمي",
      appCardTitle: "تطبيق نسك — iOS وAndroid",
      appCardDesc:
        "التصاريح وخرائط الأراضي المقدسة وكثافة الزحام ومواقيت الصلاة وتذاكر قطار الحرمين — في تطبيق واحد. متوفر على آب ستور وجوجل بلاي.",
      srcNote:
        "المعلومات في هذه الصفحة مجمعة مباشرة من nusuk.sa و haj.gov.sa (تم التحقق {date}). قد تتغير أنظمة السفر في أي وقت — تأكد دائمًا عبر القنوات الرسمية قبل السفر.",
    },
  },
} as const;
