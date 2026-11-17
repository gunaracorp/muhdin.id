/**
 * v131.ts — kamus i18n v13.1 «PANEN & PANTAU»:
 *  • status — Papan Status Layanan Publik (R-097, `#/status`)
 *  • darurat.duty — Petugas Jaga 24/7 (R-096, seksi di `#/darurat`)
 *  • nps — Survei NPS pasca-perjalanan (R-092, widget `#/pesanan`)
 * Satu file berisi ketiga locale { id, en, ar } dengan key identik.
 */
export const v131Dict = {
  id: {
    status: {
      hero: {
        eyebrow: "PAPAN STATUS LAYANAN",
        title: "STATUS SISTEM MUHDIN — TRANSPARAN SETIAP SAAT",
        subtitle:
          "Mitrama dan jamaah berhak tahu kondisi sistem kapan pun. Angka di halaman ini diukur langsung saat halaman dibuka dan setiap sampel tersimpan sebagai riwayat — bukan klaim, tapi bukti.",
      },
      live: {
        title: "Kesehatan Saat Ini",
        db: "Database",
        dbOk: "Beroperasi",
        dbDown: "Gangguan",
        latency: "Latensi kueri",
        uptime: "Uptime proses",
        memory: "Memori proses",
        node: "Runtime",
      },
      data: {
        title: "Ukuran Data Inti",
        members: "Anggota terverifikasi",
        packages: "Paket marketplace",
        orders: "Pesanan",
        reviews: "Ulasan disetujui",
      },
      history: {
        title: "Riwayat 60 Sampel Terakhir",
        subtitle: "Setiap buka halaman mencatat satu sampel — latensi database selama 7 hari terakhir.",
        uptimePct: "Sampel sehat",
        avgLatency: "Latensi rata-rata",
        samples: "Jumlah sampel",
        empty: "Belum ada riwayat — muat ulang halaman untuk sampel pertama.",
      },
      footer: "Butuh bantuan langsung? Hubungi sekretariat atau halaman darurat 24/7.",
    },
    duty: {
      eyebrow: "DUTY OFFICER 24/7",
      title: "PETUGAS JAGA SIAP MELAYANI",
      subtitle:
        "Jamaah tak pernah sendirian — jadwal piket berjenjang dengan eskalasi otomatis: bila petugas pertama tak menjawab dalam batas menit, kontak naik ke petugas berikutnya.",
      onDuty: "Jaga hari ini",
      escalation: "Eskalasi",
      minutes: "menit",
      order: "Urutan",
      roster: "Roster lengkap",
      shiftDays: "Hari jaga",
      days: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
      role: {
        KOORDINATOR: "Koordinator",
        MARSHAL: "Marshal",
        MEDIS: "Tenaga Medis",
        IT_SUPPORT: "Dukungan TI",
      },
      callCta: "Telepon",
      waCta: "WhatsApp",
      empty: "Jadwal piket sedang disusun — gunakan kanal darurat resmi di atas.",
    },
    nps: {
      title: "Bagaimana pengalaman Anda dengan MUHDIN?",
      subtitle: "Skor 0–10: seberapa besar kemungkinan Anda merekomendasikan layanan ini?",
      comment: "Ceritakan singkat (opsional)",
      send: "Kirim Penilaian",
      thanks: "Terima kasih! Masukan Anda langsung dihitung ke skor NPS manajemen.",
      lowLabel: "Tidak mungkin",
      highLabel: "Sangat mungkin",
      saved: "Terkirim",
    },
  },
  en: {
    status: {
      hero: {
        eyebrow: "SERVICE STATUS BOARD",
        title: "MUHDIN SYSTEM STATUS — TRANSPARENT, ALWAYS",
        subtitle:
          "Partners and pilgrims deserve to know the system's condition at any time. The figures here are measured live as the page opens and every sample is stored as history — evidence, not claims.",
      },
      live: {
        title: "Current Health",
        db: "Database",
        dbOk: "Operational",
        dbDown: "Degraded",
        latency: "Query latency",
        uptime: "Process uptime",
        memory: "Process memory",
        node: "Runtime",
      },
      data: {
        title: "Core Data Metrics",
        members: "Verified members",
        packages: "Marketplace packages",
        orders: "Orders",
        reviews: "Approved reviews",
      },
      history: {
        title: "Last 60 Samples",
        subtitle: "Every page view records one sample — database latency over the last 7 days.",
        uptimePct: "Healthy samples",
        avgLatency: "Average latency",
        samples: "Samples",
        empty: "No history yet — refresh the page for the first sample.",
      },
      footer: "Need direct help? Contact the secretariat or the 24/7 emergency page.",
    },
    duty: {
      eyebrow: "DUTY OFFICER 24/7",
      title: "DUTY OFFICERS READY TO SERVE",
      subtitle:
        "Pilgrims are never alone — a tiered rota with automatic escalation: if the first officer doesn't answer within the minutes limit, contact moves to the next officer.",
      onDuty: "On duty today",
      escalation: "Escalation",
      minutes: "min",
      order: "Order",
      roster: "Full roster",
      shiftDays: "Duty days",
      days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      role: {
        KOORDINATOR: "Coordinator",
        MARSHAL: "Marshal",
        MEDIS: "Medical",
        IT_SUPPORT: "IT Support",
      },
      callCta: "Call",
      waCta: "WhatsApp",
      empty: "The rota is being arranged — use the official emergency channels above.",
    },
    nps: {
      title: "How was your MUHDIN experience?",
      subtitle: "Score 0–10: how likely are you to recommend this service?",
      comment: "Tell us briefly (optional)",
      send: "Send Rating",
      thanks: "Thank you! Your input feeds the management NPS score directly.",
      lowLabel: "Not likely",
      highLabel: "Very likely",
      saved: "Sent",
    },
  },
  ar: {
    status: {
      hero: {
        eyebrow: "لوحة حالة الخدمة",
        title: "حالة نظام مؤذن — شفافة دائمًا",
        subtitle:
          "الشركاء والحجاج يحق لهم معرفة حالة النظام في أي وقت. الأرقام هنا تُقاس مباشرة عند فتح الصفحة وكل عينة تُسجل كسجل — دليل وليس ادعاء.",
      },
      live: {
        title: "الصحة الحالية",
        db: "قاعدة البيانات",
        dbOk: "تعمل",
        dbDown: "خلل",
        latency: "زمن الاستعلام",
        uptime: "مدة التشغيل",
        memory: "ذاكرة العملية",
        node: "بيئة التشغيل",
      },
      data: {
        title: "مؤشرات البيانات الأساسية",
        members: "أعضاء موثقون",
        packages: "باقات السوق",
        orders: "الطلبات",
        reviews: "مراجعات معتمدة",
      },
      history: {
        title: "آخر 60 عينة",
        subtitle: "كل زيارة للصفحة تسجل عينة — زمن استجابة قاعدة البيانات خلال آخر 7 أيام.",
        uptimePct: "عينات سليمة",
        avgLatency: "متوسط زمن الاستجابة",
        samples: "عدد العينات",
        empty: "لا يوجد سجل بعد — حدّث الصفحة لأول عينة.",
      },
      footer: "تحتاج مساعدة مباشرة؟ تواصل مع الأمانة أو صفحة الطوارئ 24/7.",
    },
    duty: {
      eyebrow: "المسؤول المتاح 24/7",
      title: "المسؤولون على أهبة الاستعداد",
      subtitle:
        "الحاج لا يبقى وحيدًا — جدول نوبتية متدرج مع تصعيد تلقائي: إذا لم يجيب المسؤول الأول خلال الحد المحدد، ينتقل التواصل إلى المسؤول التالي.",
      onDuty: "في الخدمة اليوم",
      escalation: "التصعيد",
      minutes: "دقيقة",
      order: "الترتيب",
      roster: "القائمة الكاملة",
      shiftDays: "أيام النوبة",
      days: ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"],
      role: {
        KOORDINATOR: "منسق",
        MARSHAL: "مرشد ميداني",
        MEDIS: "طاقم طبي",
        IT_SUPPORT: "دعم تقني",
      },
      callCta: "اتصال",
      waCta: "واتساب",
      empty: "جدول النوبتية قيد الترتيب — استخدم قنوات الطوارئ الرسمية أعلاه.",
    },
    nps: {
      title: "كيف كانت تجربتك مع مؤذن؟",
      subtitle: "درجة 0–10: ما مدى احتمال توصيتك بهذه الخدمة؟",
      comment: "شاركنا باختصار (اختياري)",
      send: "أرسل التقييم",
      thanks: "شكرًا لك! رأيك يُحتسب مباشرة في مؤشر NPS للإدارة.",
      lowLabel: "مستحيل",
      highLabel: "بالكلية",
      saved: "تم الإرسال",
    },
  },
};
