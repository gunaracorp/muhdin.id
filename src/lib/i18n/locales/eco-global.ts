/**
 * namespace "ecoGlobal" — Task 41 (v15.2.0) MUHDIN GLOBAL ECOSYSTEM.
 * Arsitektur ekosistem bisnis: MUHDIN orchestrator, MHUTU OS, 6 Business
 * Engines (AROFAHAJJ = Supply Engine / Master Vendor), peta entitas, alur
 * transaksi, tier vendor, scorecard, hub procurement (peta jalan).
 * Sumber: arsitektur_ekosistem_muhdin.png + Governance Pack (MVA-AGS-001
 * dsb., berstatus DRAFT — klaim "Appointed" ditandai sebagai finalisasi).
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik.
 */
export const ecoGlobalDict = {
  id: {
    ecoGlobal: {
      eyebrow: "MUHDIN GLOBAL ECOSYSTEM",
      title: "Satu Ekosistem · Banyak Mesin Bisnis",
      subtitle:
        "Arsitektur terpadu perjalanan ibadah: MUHDIN mengatur tata kelola, MHUTU menjadi sistem operasi digital, dan mesin-mesin bisnis spesialis bekerja dengan standar yang sama — terikat perjanjian, bukan kepemilikan.",
      lastUpdate: "Pembaruan Task 41 — 19 November 2026",

      orchestratorBadge: "ECOSYSTEM ORCHESTRATOR",
      orchestratorTitle: "MUHDIN.ID",
      orchestratorDesc:
        "Trust · Governance · Strategic Partnership · Network — mengatur standar, verifikasi, dan integrasi seluruh aktor ekosistem.",

      osBadge: "DIGITAL OPERATING SYSTEM",
      osTitle: "MHUTU",
      osDesc: "Platform inti & sistem of record ekosistem.",
      osModulesTitle: "Enam modul inti",
      osModules: {
        identity: "Identitas — MUHDIN ID & profil jamaah",
        organization: "Organisasi — PPIU/PIHK & mitra",
        verification: "Verifikasi — identitas & dokumen",
        journey: "Journey — booking & rencana perjalanan",
        documents: "Dokumen — visa, kontrak & consent",
        control: "Kontrol — audit trail & dashboard",
      },

      enginesTitle: "Enam Mesin Bisnis Ekosistem",
      enginesDesc:
        "Setiap mesin punya spesialisasi, SOP, dan tanggung jawabnya sendiri. MUHDIN bukan perusahaan yang mengerjakan semuanya sendiri — MUHDIN adalah pengatur ekosistem.",
      engines: {
        trust: {
          name: "Trust Engine",
          owner: "MUHDIN.ID",
          desc: "Identitas, verifikasi & tata kelola — standar kepercayaan satu ekosistem.",
        },
        supply: {
          name: "Supply Engine",
          owner: "AROFAHAJJ.COM — PT AROFAH GLOBAL SISTEM",
          desc: "Master Vendor & Supply Chain Aggregator — ticketing, visa, agregasi vendor & pengadaan.",
        },
        legal: {
          name: "Legal Engine",
          owner: "PUSATPERIZINAN.COM",
          desc: "Legalitas badan usaha, perizinan & kepatuhan regulasi.",
        },
        advisory: {
          name: "Advisory Engine",
          owner: "GCONSULTANT — GUNARA.WEB.ID",
          desc: "Strategi bisnis, manajemen & tata kelola organisasi.",
        },
        certification: {
          name: "Certification Engine",
          owner: "SERTIFIKASI.AROFAHAJJ.COM",
          desc: "Pengembangan kompetensi & layanan sertifikasi sesuai skema dan kewenangan.",
        },
        protection: {
          name: "Protection Engine",
          owner: "Perusahaan asuransi berizin",
          desc: "Integrasi asuransi & klaim — polis dan keputusan klaim tetap milik penanggung berizin.",
        },
      },

      arofahBadge: "SUPPLY ENGINE — SPOTLIGHT",
      arofahTitle: "AROFAHAJJ.COM",
      arofahSub: "PT AROFAH GLOBAL SISTEM — Master Vendor & Supply Chain Aggregator",
      arofahDesc:
        "Mesin agregasi dan pengelolaan jaringan vendor penyedia kebutuhan perjalanan umrah: mengonsolidasikan permintaan PPIU, memilih vendor, mengelola penawaran, pemenuhan, rekonsiliasi dan pelaporan.",
      arofahPillarsTitle: "Empat pilar layanan",
      arofahPillars: {
        ticketing: "Ticketing Hub — pusat penyedia tiket umrah",
        visa: "Visa Hub — koordinasi penyedia layanan visa",
        vendor: "Vendor Network — pengelolaan seluruh vendor mitra",
        partner: "Partner Management — kontrak, harga & performa vendor",
      },
      arofahStatus:
        "Status penunjukan: Perjanjian Master Vendor (MVA-AGS-001) berstatus draft kerja — klaim «Appointed Master Vendor» digunakan setelah penunjukan formal ditandatangani.",
      arofahBoundary:
        "Batas kewenangan: Arofahajj mengoordinasikan pengadaan dan proses layanan visa — bukan penerbit atau penjamin keputusan visa, bukan PPIU, dan bukan penanggung asuransi. Keputusan visa mengikuti otoritas dan kanal resmi.",
      ctaArofah: "Kunjungi Arofahajj.com",
      ctaCert: "Layanan Sertifikasi",
      ctaEcoPage: "Lihat Arsitektur Ekosistem",

      entitiesTitle: "Peta Entitas & Tanggung Jawab",
      entitiesDesc: "Lima entitas, satu standar — setiap mesin punya pembukuan dan tanggung jawabnya sendiri.",
      entities: {
        muhdin: {
          name: "MUHDIN.ID",
          role: "Ecosystem Orchestrator",
          resp: "Mengatur tata kelola dan integrasi seluruh ekosistem.",
        },
        arofah: {
          name: "AROFAHAJJ.COM",
          role: "Master Vendor & Supply Chain Aggregator",
          resp: "Mengelola jaringan vendor tiket, visa & pemasok.",
        },
        perizinan: {
          name: "PUSATPERIZINAN.COM",
          role: "Licensing & Regulatory Engine",
          resp: "Legalitas badan usaha, perizinan & kepatuhan.",
        },
        gconsultant: {
          name: "GCONSULTANT — GUNARA.WEB.ID",
          role: "Business Advisory Engine",
          resp: "Strategi bisnis, manajemen, tata kelola & pengembangan organisasi.",
        },
        sertifikasi: {
          name: "SERTIFIKASI.AROFAHAJJ.COM",
          role: "Certification & Competency Engine",
          resp: "Layanan sertifikasi sesuai skema & kewenangan PT AROFAH GLOBAL SISTEM.",
        },
      },
      entitiesNote:
        "Hubungan legal diikat melalui perjanjian masing-masing — struktur ini bukan pernyataan afiliasi kepemilikan antar-perusahaan.",

      flowTitle: "Transaction & Supply Chain Flow",
      flowDesc: "Setiap transaksi punya jejak yang bisa diperiksa — dari permintaan sampai laporan ekosistem.",
      flow: {
        s1: { title: "PPIU / Travel Umrah", desc: "Mengajukan kebutuhan tiket, visa & layanan perjalanan." },
        s2: { title: "MUHDIN.ID", desc: "Menghubungkan permintaan dengan ekosistem & mengarahkan ke master vendor." },
        s3: { title: "AROFAHAJJ.COM", desc: "Menerima, mengonsolidasikan, memilih vendor & mengelola penawaran." },
        s4: { title: "Sub-Vendor", desc: "Menyediakan tiket, visa & layanan sesuai kontrak dan kewenangannya." },
        s5: { title: "AROFAHAJJ.COM", desc: "Mengendalikan pemenuhan pesanan, rekonsiliasi, dokumentasi & pelaporan." },
        s6: { title: "MUHDIN Control Tower", desc: "Menerima data transaksi, status pesanan, performa vendor & laporan ekosistem." },
      },

      tiersTitle: "Tiga Lapis Jaringan Vendor",
      tiers: {
        t1: { name: "Tier 1 — Anchor Suppliers", desc: "Penyedia tiket utama, konsolidator & mitra pengurusan visa berkewenangan." },
        t2: { name: "Tier 2 — Strategic Suppliers", desc: "Agen tiket, penyedia kapasitas tambahan & mitra operasional terkontrak." },
        t3: { name: "Tier 3 — Operational Suppliers", desc: "Vendor pendukung berbasis order, wilayah & kebutuhan tertentu." },
      },

      scorecardTitle: "Vendor Performance Scorecard",
      scorecardDesc: "Status vendor tidak ditentukan harga murah saja — kualitas pemenuhan & legalitas adalah bobot terbesar.",
      scorecard: {
        legal: "Legalitas & otorisasi — 25%",
        quality: "Kualitas pemenuhan — 20%",
        price: "Harga & daya saing — 15%",
        capacity: "Ketersediaan kapasitas — 15%",
        refund: "Refund & penyelesaian keluhan — 10%",
        admin: "Ketepatan administrasi & keuangan — 10%",
        data: "Keamanan data — 5%",
      },
      scorecardCatsTitle: "Kategori evaluasi",
      scorecardCats: {
        platinum: "Platinum — vendor strategis berperforma terbaik",
        gold: "Gold — vendor prioritas",
        silver: "Silver — vendor aktif",
        restricted: "Restricted — pembatasan transaksi / pemulihan performa",
        suspended: "Suspended — sementara tidak menerima order",
      },

      hubBadge: "PETA JALAN",
      hubTitle: "MHUTU Supply & Procurement Hub",
      hubDesc: "Delapan modul aplikasi yang menggerakkan Arofahajj secara digital (direncanakan).",
      hubModules: {
        directory: "Supplier Directory — direktori pemasok & sub-vendor",
        verification: "Supplier Verification — identitas, legalitas & dokumen",
        rfq: "RFQ Management — permintaan penawaran dari PPIU",
        quotation: "Quotation Engine — perbandingan harga, kapasitas & ketentuan",
        po: "Purchase Order — pesanan & penugasan vendor",
        fulfillment: "Fulfillment Tracker — penerbitan tiket & progres visa",
        finance: "Finance & Settlement — invoice, pembayaran, rekonsiliasi & refund",
        performance: "Vendor Performance — SLA, komplain, kecepatan & kualitas",
      },

      governanceTitle: "Tata Kelola & Batas Peran",
      governanceNote:
        "Blueprint konseptual ekosistem — bukan pernyataan status izin atau afiliasi. MUHDIN menetapkan standar; Arofahajj mengelola vendor berdasarkan penunjukan & perjanjian kerja sama; vendor bertanggung jawab atas produknya; PPIU tetap bertanggung jawab atas penyelenggaraan perjalanan; perusahaan asuransi berizin tetap memegang polis & klaim. Seluruh data jamaah mengikuti prinsip perlindungan data pribadi (PDP).",
    },
  },
  en: {
    ecoGlobal: {
      eyebrow: "MUHDIN GLOBAL ECOSYSTEM",
      title: "One Ecosystem · Multiple Business Engines",
      subtitle:
        "An integrated pilgrimage architecture: MUHDIN governs, MHUTU runs as the digital operating system, and specialized business engines work under one standard — bound by agreements, not ownership.",
      lastUpdate: "Task 41 update — 19 November 2026",

      orchestratorBadge: "ECOSYSTEM ORCHESTRATOR",
      orchestratorTitle: "MUHDIN.ID",
      orchestratorDesc:
        "Trust · Governance · Strategic Partnership · Network — setting standards, verification, and integration across the ecosystem.",

      osBadge: "DIGITAL OPERATING SYSTEM",
      osTitle: "MHUTU",
      osDesc: "The core platform & system of record.",
      osModulesTitle: "Six core modules",
      osModules: {
        identity: "Identity — MUHDIN ID & pilgrim profile",
        organization: "Organization — PPIU/PIHK & partners",
        verification: "Verification — identity & documents",
        journey: "Journey — booking & travel planning",
        documents: "Documents — visa, contracts & consent",
        control: "Control — audit trail & dashboards",
      },

      enginesTitle: "Six Ecosystem Business Engines",
      enginesDesc:
        "Each engine has its own specialty, SOP, and accountability. MUHDIN is not a company doing everything itself — MUHDIN is the ecosystem orchestrator.",
      engines: {
        trust: {
          name: "Trust Engine",
          owner: "MUHDIN.ID",
          desc: "Identity, verification & governance — one ecosystem standard of trust.",
        },
        supply: {
          name: "Supply Engine",
          owner: "AROFAHAJJ.COM — PT AROFAH GLOBAL SISTEM",
          desc: "Master Vendor & Supply Chain Aggregator — ticketing, visa, vendor aggregation & procurement.",
        },
        legal: {
          name: "Legal Engine",
          owner: "PUSATPERIZINAN.COM",
          desc: "Business legality, licensing & regulatory compliance.",
        },
        advisory: {
          name: "Advisory Engine",
          owner: "GCONSULTANT — GUNARA.WEB.ID",
          desc: "Business strategy, management & organizational governance.",
        },
        certification: {
          name: "Certification Engine",
          owner: "SERTIFIKASI.AROFAHAJJ.COM",
          desc: "Competency development & certification services within its schemes and authority.",
        },
        protection: {
          name: "Protection Engine",
          owner: "Licensed insurers",
          desc: "Insurance integration & claims — policies and claim decisions remain with licensed insurers.",
        },
      },

      arofahBadge: "SUPPLY ENGINE — SPOTLIGHT",
      arofahTitle: "AROFAHAJJ.COM",
      arofahSub: "PT AROFAH GLOBAL SISTEM — Master Vendor & Supply Chain Aggregator",
      arofahDesc:
        "The aggregation engine for the umrah travel supply network: consolidating PPIU demand, selecting vendors, managing quotations, fulfillment, reconciliation and reporting.",
      arofahPillarsTitle: "Four service pillars",
      arofahPillars: {
        ticketing: "Ticketing Hub — umrah ticket supply center",
        visa: "Visa Hub — visa service provider coordination",
        vendor: "Vendor Network — managing all partner vendors",
        partner: "Partner Management — vendor contracts, pricing & performance",
      },
      arofahStatus:
        "Appointment status: the Master Vendor Agreement (MVA-AGS-001) is a working draft — the «Appointed Master Vendor» claim applies once the formal appointment is signed.",
      arofahBoundary:
        "Scope boundaries: Arofahajj coordinates procurement and visa service processes — it is not a visa decision issuer or guarantor, not a PPIU, and not an insurer. Visa decisions follow the competent authority and official channels.",
      ctaArofah: "Visit Arofahajj.com",
      ctaCert: "Certification Services",
      ctaEcoPage: "View Ecosystem Architecture",

      entitiesTitle: "Entity Map & Responsibilities",
      entitiesDesc: "Five entities, one standard — each engine keeps its own books and accountability.",
      entities: {
        muhdin: {
          name: "MUHDIN.ID",
          role: "Ecosystem Orchestrator",
          resp: "Governs ecosystem-wide standards and integration.",
        },
        arofah: {
          name: "AROFAHAJJ.COM",
          role: "Master Vendor & Supply Chain Aggregator",
          resp: "Manages the ticket, visa & supplier vendor network.",
        },
        perizinan: {
          name: "PUSATPERIZINAN.COM",
          role: "Licensing & Regulatory Engine",
          resp: "Business legality, licensing & compliance.",
        },
        gconsultant: {
          name: "GCONSULTANT — GUNARA.WEB.ID",
          role: "Business Advisory Engine",
          resp: "Business strategy, management, governance & organizational development.",
        },
        sertifikasi: {
          name: "SERTIFIKASI.AROFAHAJJ.COM",
          role: "Certification & Competency Engine",
          resp: "Certification services within PT AROFAH GLOBAL SISTEM's schemes and authority.",
        },
      },
      entitiesNote:
        "Legal relationships are bound by each party's own agreements — this structure is not a statement of corporate ownership or affiliation.",

      flowTitle: "Transaction & Supply Chain Flow",
      flowDesc: "Every transaction leaves an auditable trail — from request to ecosystem reporting.",
      flow: {
        s1: { title: "PPIU / Umrah Travel", desc: "Submits ticket, visa & travel service requirements." },
        s2: { title: "MUHDIN.ID", desc: "Connects demand to the ecosystem and directs it to the master vendor." },
        s3: { title: "AROFAHAJJ.COM", desc: "Receives, consolidates, selects vendors & manages quotations." },
        s4: { title: "Sub-Vendor", desc: "Provides tickets, visa services & supplies per contract and authority." },
        s5: { title: "AROFAHAJJ.COM", desc: "Controls order fulfillment, reconciliation, documentation & reporting." },
        s6: { title: "MUHDIN Control Tower", desc: "Receives transaction data, order status, vendor performance & ecosystem reports." },
      },

      tiersTitle: "Three-Tier Vendor Network",
      tiers: {
        t1: { name: "Tier 1 — Anchor Suppliers", desc: "Primary ticket providers, consolidators & authorized visa partners." },
        t2: { name: "Tier 2 — Strategic Suppliers", desc: "Ticket agents, additional capacity providers & contracted operational partners." },
        t3: { name: "Tier 3 — Operational Suppliers", desc: "Supporting vendors engaged per order, region & specific needs." },
      },

      scorecardTitle: "Vendor Performance Scorecard",
      scorecardDesc: "Vendor status is never about the cheapest price — fulfillment quality & legality carry the largest weights.",
      scorecard: {
        legal: "Legality & authorization — 25%",
        quality: "Fulfillment quality — 20%",
        price: "Price & competitiveness — 15%",
        capacity: "Capacity availability — 15%",
        refund: "Refund & complaint resolution — 10%",
        admin: "Administrative & financial accuracy — 10%",
        data: "Data security — 5%",
      },
      scorecardCatsTitle: "Evaluation categories",
      scorecardCats: {
        platinum: "Platinum — top-performing strategic vendors",
        gold: "Gold — priority vendors",
        silver: "Silver — active vendors",
        restricted: "Restricted — transaction limits / performance recovery",
        suspended: "Suspended — temporarily not receiving orders",
      },

      hubBadge: "ROADMAP",
      hubTitle: "MHUTU Supply & Procurement Hub",
      hubDesc: "Eight application modules that will digitally drive Arofahajj (planned).",
      hubModules: {
        directory: "Supplier Directory — suppliers & sub-vendors",
        verification: "Supplier Verification — identity, legality & documents",
        rfq: "RFQ Management — quotation requests from PPIU",
        quotation: "Quotation Engine — price, capacity & terms comparison",
        po: "Purchase Order — orders & vendor assignment",
        fulfillment: "Fulfillment Tracker — ticket issuance & visa progress",
        finance: "Finance & Settlement — invoices, payments, reconciliation & refunds",
        performance: "Vendor Performance — SLA, complaints, speed & quality",
      },

      governanceTitle: "Governance & Role Boundaries",
      governanceNote:
        "A conceptual ecosystem blueprint — not a statement of licensing status or affiliation. MUHDIN sets standards; Arofahajj manages vendors under appointment & cooperation agreements; vendors are responsible for their products; PPIU remains responsible for trip operation; licensed insurers retain policies & claims. All pilgrim data follows personal data protection (PDP) principles.",
    },
  },
  ar: {
    ecoGlobal: {
      eyebrow: "منظومة موهدين العالمية",
      title: "منظومة واحدة · محركات أعمال متعددة",
      subtitle:
        "معمارية متكاملة لرحلة الحج والعمرة: موهدين يحكم الانضباط، ومهوتو نظام تشغيل رقمي، ومحركات أعمال متخصصة تعمل بمعيار واحد — مرتبطة باتفاقيات لا بملكية.",
      lastUpdate: "تحديث المهمة 41 — 19 نوفمبر 2026",

      orchestratorBadge: "منظم المنظومة",
      orchestratorTitle: "MUHDIN.ID",
      orchestratorDesc: "الثقة · الحوكمة · الشراكة الاستراتيجية · الشبكة — يضع المعايير والتحقق والتكامل عبر المنظومة.",

      osBadge: "نظام التشغيل الرقمي",
      osTitle: "MHUTU",
      osDesc: "المنصة الأساسية وسجل المنظومة.",
      osModulesTitle: "ست وحدات أساسية",
      osModules: {
        identity: "الهوية — معرف موهدين وملف الحاج",
        organization: "التنظيم — PPIU/PIHK والشركاء",
        verification: "التحقق — الهوية والوثائق",
        journey: "الرحلة — الحجز وخطط السفر",
        documents: "الوثائق — التأشيرة والعقود والموافقات",
        control: "التحكم — سجل التدقيق ولوحات المعلومات",
      },

      enginesTitle: "ستة محركات أعمال للمنظومة",
      enginesDesc:
        "لكل محرك تخصصه وإجراءاته ومسؤوليته. موهدين ليس شركة تقوم بكل شيء بنفسها — موهدين منظم المنظومة.",
      engines: {
        trust: {
          name: "محرك الثقة",
          owner: "MUHDIN.ID",
          desc: "الهوية والتحقق والحوكمة — معيار ثقة واحد للمنظومة.",
        },
        supply: {
          name: "محرك التوريد",
          owner: "AROFAHAJJ.COM — PT AROFAH GLOBAL SISTEM",
          desc: "المورد الرئيسي ومجمّع سلسلة الإمداد — التذاكر والتأشيرات وتجميع الموردين والمشتريات.",
        },
        legal: {
          name: "المحرك القانوني",
          owner: "PUSATPERIZINAN.COM",
          desc: "الأهلية القانونية للشركات والتراخيص والامتثال التنظيمي.",
        },
        advisory: {
          name: "محرك الاستشارات",
          owner: "GCONSULTANT — GUNARA.WEB.ID",
          desc: "استراتيجية الأعمال والإدارة وحوكمة المنظمات.",
        },
        certification: {
          name: "محرك الاعتماد",
          owner: "SERTIFIKASI.AROFAHAJJ.COM",
          desc: "تطوير الكفاءات وخدمات الاعتماد وفق المخططات والصلاحيات الممنوحة.",
        },
        protection: {
          name: "محرك الحماية",
          owner: "شركات التأمين المرخصة",
          desc: "تكامل التأمين والمطالبات — وثائق وقرارات المطالبات بيد شركات التأمين المرخصة.",
        },
      },

      arofahBadge: "محرك التوريد — تسليط الضوء",
      arofahTitle: "AROFAHAJJ.COM",
      arofahSub: "PT AROFAH GLOBAL SISTEM — المورد الرئيسي ومجمّع سلسلة الإمداد",
      arofahDesc:
        "محرك تجميع وإدارة شبكة موردي خدمات السفر للعمرة: تجميع طلبات PPIU واختيار الموردين وإدارة العروض والتنفيذ والتسوية والتقارير.",
      arofahPillarsTitle: "أربع ركائز للخدمة",
      arofahPillars: {
        ticketing: "مركز التذاكر — مركز توفير تذاكر العمرة",
        visa: "مركز التأشيرات — تنسيق مزودي خدمات التأشيرة",
        vendor: "شبكة الموردين — إدارة جميع الشركاء",
        partner: "إدارة الشركاء — العقود والأسعار وأداء الموردين",
      },
      arofahStatus:
        "حالة التعيين: اتفاقية المورد الرئيسي (MVA-AGS-001) مسودة عمل — يستخدم وصف «المورد الرئيسي المعيَّن» بعد توقيع التعيين الرسمي.",
      arofahBoundary:
        "حدود الصلاحيات: ينسّق أروفاهج المشتريات وعمليات خدمات التأشيرة — وليس مصدر قرار تأشيرة أو ضامنًا لها، وليس PPIU، وليس شركة تأمين. قرارات التأشيرة تتبع الجهة المختصة والقنوات الرسمية.",
      ctaArofah: "زيارة Arofahajj.com",
      ctaCert: "خدمات الاعتماد",
      ctaEcoPage: "عرض معمارية المنظومة",

      entitiesTitle: "خريطة الكيانات والمسؤوليات",
      entitiesDesc: "خمس كيانات ومعيار واحد — لكل محرك دفاتره ومسؤوليته.",
      entities: {
        muhdin: {
          name: "MUHDIN.ID",
          role: "منظم المنظومة",
          resp: "يضع معايير المنظومة وتكاملها.",
        },
        arofah: {
          name: "AROFAHAJJ.COM",
          role: "المورد الرئيسي ومجمّع سلسلة الإمداد",
          resp: "يدير شبكة موردي التذاكر والتأشيرات والتوريد.",
        },
        perizinan: {
          name: "PUSATPERIZINAN.COM",
          role: "محرك التراخيص والتنظيم",
          resp: "الأهلية القانونية والتراخيص والامتثال.",
        },
        gconsultant: {
          name: "GCONSULTANT — GUNARA.WEB.ID",
          role: "محرك الاستشارات التجارية",
          resp: "استراتيجية الأعمال والإدارة والحوكمة وتطوير المنظمات.",
        },
        sertifikasi: {
          name: "SERTIFIKASI.AROFAHAJJ.COM",
          role: "محرك الاعتماد والكفاءات",
          resp: "خدمات اعتماد وفق مخططات وصلاحيات PT AROFAH GLOBAL SISTEM.",
        },
      },
      entitiesNote:
        "ترتبط العلاقات القانونية باتفاقيات كل طرف — هذه الهيكلية ليست بيان ملكية أو انتماء بين الشركات.",

      flowTitle: "تدفق المعاملات وسلسلة الإمداد",
      flowDesc: "لكل معاملة أثر قابل للتدقيق — من الطلب حتى تقارير المنظومة.",
      flow: {
        s1: { title: "PPIU / وكالة العمرة", desc: "تقدم احتياجات التذاكر والتأشيرات وخدمات السفر." },
        s2: { title: "MUHDIN.ID", desc: "يربط الطلب بالمنظومة ويوجهه للمورد الرئيسي." },
        s3: { title: "AROFAHAJJ.COM", desc: "يستقبل ويجمع ويختار الموردين ويدير العروض." },
        s4: { title: "المورد الفرعي", desc: "يوفر التذاكر والتأشيرات والخدمات وفق العقد والصلاحية." },
        s5: { title: "AROFAHAJJ.COM", desc: "يتحكم في التنفيذ والتسوية والتوثيق والتقارير." },
        s6: { title: "برج تحكم موهدين", desc: "يستقبل بيانات المعاملات وحالة الطلبات وأداء الموردين وتقارير المنظومة." },
      },

      tiersTitle: "شبكة موردين بثلاث طبقات",
      tiers: {
        t1: { name: "الطبقة 1 — الموردون الأساسيون", desc: "مزودو التذاكر الرئيسيون والمجمّعون وشركاء التأشيرات المخولون." },
        t2: { name: "الطبقة 2 — الموردون الاستراتيجيون", desc: "وكلاء التذاكر ومزودو الطاقة الإضافية والشركاء التشغيليون المتعاقدون." },
        t3: { name: "الطبقة 3 — الموردون التشغيليون", desc: "موردون داعمون بحسب الطلب والمنطقة والاحتياجات الخاصة." },
      },

      scorecardTitle: "بطاقة أداء الموردين",
      scorecardDesc: "حالة المورد لا تُحدد بأرخص سعر — جودة التنفيذ والأهلية تحمل أكبر الأوزان.",
      scorecard: {
        legal: "الأهلية والترخيص — 25%",
        quality: "جودة التنفيذ — 20%",
        price: "السعر والتنافسية — 15%",
        capacity: "توافر الطاقة — 15%",
        refund: "الاسترداد ومعالجة الشكاوى — 10%",
        admin: "دقة الإدارة والمالية — 10%",
        data: "أمن البيانات — 5%",
      },
      scorecardCatsTitle: "فئات التقييم",
      scorecardCats: {
        platinum: "بلاتيني — موردين استراتيجيين بأفضل أداء",
        gold: "ذهبي — موردين ذوو أولوية",
        silver: "فضي — موردين نشطون",
        restricted: "مقيَّد — قيود على المعاملات / تعافي الأداء",
        suspended: "موقوف — لا يستقبل طلبات مؤقتًا",
      },

      hubBadge: "خارطة الطريق",
      hubTitle: "مركز التوريد والمشتريات MHUTU",
      hubDesc: "ثماني وحدات تطبيقية ستقود أروفاهج رقميًا (مخطط لها).",
      hubModules: {
        directory: "دليل الموردين — الموردون والموردون الفرعيون",
        verification: "التحقق من الموردين — الهوية والأهلية والوثائق",
        rfq: "إدارة طلبات العروض — طلبات عرض الأسعار من PPIU",
        quotation: "محرك العروض — مقارنة الأسعار والطاقة والشروط",
        po: "أوامر الشراء — الطلبات وإسناد الموردين",
        fulfillment: "متتبع التنفيذ — إصدار التذاكر وتقدم التأشيرة",
        finance: "المالية والتسوية — الفواتير والمدفوعات والتسوية والاسترداد",
        performance: "أداء الموردين — مستوى الخدمة والشكاوى والسرعة والجودة",
      },

      governanceTitle: "الحوكمة وحدود الأدوار",
      governanceNote:
        "مخطط مفاهيمي للمنظومة — وليس بيانًا عن حالة التراخيص أو الانتماء. موهدين يضع المعايير؛ وأروفاهج يدير الموردين بموجب التعيين واتفاقيات التعاون؛ والمورد مسؤول عن منتجه؛ وPPIU تبقى مسؤولة عن تنفيذ الرحلة؛ وشركات التأمين المرخصة تحتفظ بالوثائق والمطالبات. جميع بيانات الحاج تلتزم بمبادئ حماية البيانات الشخصية.",
    },
  },
};
