/**
 * waai.ts — i18n halaman WhatsApp AI Chatbot (v5 Fase 2).
 * Namespace: waai.* — tiga bahasa penuh (id/en/ar).
 */
export const waaiDict = {
  id: {
    waai: {
      hero: {
        eyebrow: "Layanan AI v5",
        title: "Chatbot AI WhatsApp",
        subtitle:
          "Sahabat MUHDIN kini hadir di WhatsApp — jawab pertanyaan jamaah otomatis 24 jam dengan data portal yang hidup.",
        badge: "Didukung AI",
      },
      chat: {
        title: "Sahabat MUHDIN",
        subtitle: "WhatsApp AI — online 24 jam",
        online: "online",
        welcome:
          "Assalamu'alaikum! 👋\n\nSaya *Sahabat MUHDIN* di WhatsApp. Tanya apa saja: biaya umrah, verifikasi penyelenggara, checklist perlengkapan, agenda kegiatan.",
        placeholder: "Ketik pesan…",
        thinking: "mengetik…",
        error: "Maaf, koneksi terganggu. Coba lagi ya.",
        disclaimer: "Simulasi otak bot asli — jawaban identik dengan bot WhatsApp sungguhan.",
        chips: [
          "Biaya paket umrah berapa?",
          "Cara cek verifikasi penyelenggara",
          "Checklist perlengkapan haji",
        ],
        inputAria: "Ketik pesan untuk Sahabat MUHDIN",
        sendAria: "Kirim pesan",
      },
      steps: {
        title: "Aktifkan Bot di WhatsApp Asli — 3 Langkah",
        s1t: "1. Hubungkan gateway",
        s1d: "Di CMS → Pengaturan WhatsApp: pilih provider (Fonnte / Wablas / WhatsApp Cloud API) dan isi token gateway Anda.",
        s2t: "2. Arahkan webhook",
        s2d: "Set URL webhook gateway ke /api/whatsapp/webhook pada domain portal ini. Bila pakai rahasia, isi botWebhookSecret di CMS dan pakai header X-Webhook-Token.",
        s3t: "3. Nyalakan saklar",
        s3d: "Aktifkan saklar \"Bot AI\" di CMS. Uji dengan mengirim pesan ke nomor gateway — bot membalas otomatis dalam bahasa pengirim.",
      },
      features: {
        title: "Yang Dikuasai Bot",
        f1: "Data hidup portal: jumlah anggota terverifikasi, sebaran provinsi, agenda terdekat, berita terbaru",
        f2: "Trilingual otomatis: Indonesia, Inggris, Arab — mengikuti bahasa pengirim",
        f3: "Manasik & fikih harian dengan adab: doa, tata cara, checklist ibadah",
        f4: "Eskalasi sopan ke petugas saat pertanyaan di luar kemampuan (WhatsApp resmi 0811 1116 5165)",
      },
      cta: {
        title: "Ingin langsung ngobrol?",
        desc: "Hubungi WhatsApp resmi MUHDIN — didampingi petugas + bot AI.",
        btn: "Chat WhatsApp Resmi",
      },
    },
  },
  en: {
    waai: {
      hero: {
        eyebrow: "v5 AI Service",
        title: "WhatsApp AI Chatbot",
        subtitle:
          "Sahabat MUHDIN is now on WhatsApp — answering pilgrims automatically 24/7 with live portal data.",
        badge: "AI-powered",
      },
      chat: {
        title: "Sahabat MUHDIN",
        subtitle: "WhatsApp AI — online 24/7",
        online: "online",
        welcome:
          "Peace be upon you! 👋\n\nI am *Sahabat MUHDIN* on WhatsApp. Ask me anything: umrah package prices, organizer verification, packing checklists, upcoming events.",
        placeholder: "Type a message…",
        thinking: "typing…",
        error: "Sorry, connection issue. Please try again.",
        disclaimer: "Simulation of the real bot brain — answers are identical to the live WhatsApp bot.",
        chips: [
          "How much is an umrah package?",
          "How to verify an organizer",
          "Hajj packing checklist",
        ],
        inputAria: "Type a message for Sahabat MUHDIN",
        sendAria: "Send message",
      },
      steps: {
        title: "Activate the Bot on Real WhatsApp — 3 Steps",
        s1t: "1. Connect a gateway",
        s1d: "In CMS → WhatsApp Settings: pick a provider (Fonnte / Wablas / WhatsApp Cloud API) and fill in your gateway token.",
        s2t: "2. Point the webhook",
        s2d: "Set the gateway webhook URL to /api/whatsapp/webhook on this portal domain. If using a secret, set botWebhookSecret in the CMS and send the X-Webhook-Token header.",
        s3t: "3. Flip the switch",
        s3d: "Enable the \"AI Bot\" switch in the CMS. Test by messaging the gateway number — the bot replies automatically in the sender's language.",
      },
      features: {
        title: "What the Bot Knows",
        f1: "Live portal data: verified member counts, province coverage, upcoming events, latest news",
        f2: "Auto-trilingual: Indonesian, English, Arabic — following the sender's language",
        f3: "Daily rituals & fiqh with proper adab: prayers, procedures, worship checklists",
        f4: "Polite escalation to human staff beyond its capability (official WhatsApp +62 811 1116 5165)",
      },
      cta: {
        title: "Want to chat right away?",
        desc: "Contact MUHDIN's official WhatsApp — assisted by staff + AI bot.",
        btn: "Chat Official WhatsApp",
      },
    },
  },
  ar: {
    waai: {
      hero: {
        eyebrow: "خدمة الذكاء v5",
        title: "بوت واتساب الذكي",
        subtitle:
          "صاحب مُهدين الآن على واتساب — يجيب عن أسئلة الحجاج تلقائياً على مدار الساعة ببيانات البوابة الحية.",
        badge: "مدعوم بالذكاء",
      },
      chat: {
        title: "صاحب مُهدين",
        subtitle: "واتساب ذكي — متصل ٢٤ ساعة",
        online: "متصل",
        welcome:
          "السلام عليكم! 👋\n\nأنا *صاحب مُهدين* على واتساب. اسألني عن أي شيء: أسعار عمرة، التحقق من المنظمين، قائمة التجهيزات، الفعاليات القادمة.",
        placeholder: "اكتب رسالة…",
        thinking: "يكتب…",
        error: "عذراً، حدث خلل في الاتصال. حاول مرة أخرى.",
        disclaimer: "محاكاة لعقل البوت الحقيقي — الإجابات مطابقة لبوت واتساب الفعلي.",
        chips: [
          "كم سعر باقة العمرة؟",
          "كيف أتحقق من المنظم؟",
          "قائمة تجهيزات الحج",
        ],
        inputAria: "اكتب رسالة لصاحب مُهدين",
        sendAria: "إرسال الرسالة",
      },
      steps: {
        title: "شغّل البوت على واتساب الحقيقي — ٣ خطوات",
        s1t: "١. اربط البوابة (Gateway)",
        s1d: "في لوحة الإدارة ← إعدادات واتساب: اختر المزود (Fonnte / Wablas / WhatsApp Cloud API) وأدخل رمز البوابة.",
        s2t: "٢. وجّه الويبهوك",
        s2d: "اضبط رابط الويبهوك على ‎/api/whatsapp/webhook في نطاق البوابة. إن استخدمت سراً، عيّن botWebhookSecret في اللوحة وأرسل ترويسة X-Webhook-Token.",
        s3t: "٣. شغّل المفتاح",
        s3d: "فعّل مفتاح «البوت الذكي» في اللوحة. جرّب بإرسال رسالة لرقم البوابة — يرد البوت تلقائياً بلغة المُرسل.",
      },
      features: {
        title: "ما يعرفه البوت",
        f1: "بيانات حية: عدد الأعضاء الموثوقين، توزيع المحافظات، الفعاليات القادمة، آخر الأخبار",
        f2: "ثلاث لغات تلقائياً: الإندونيسية والإنجليزية والعربية — بحسب لغة المُرسل",
        f3: "المناسك والفقه اليومي بأدب كامل: الأدعية والإجراءات وقوائم العبادة",
        f4: "تحويل مهذب للموظفين عند الحاجة (واتساب رسمي +٦٢ ٨١١ ١١١٦ ٥١٦٥)",
      },
      cta: {
        title: "تريد الدردشة الآن؟",
        desc: "تواصل مع واتساب مُهدين الرسمي — بمساعدة الموظفين والبوت الذكي.",
        btn: "محادثة واتساب الرسمية",
      },
    },
  },
} as const;
