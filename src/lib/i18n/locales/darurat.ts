/**
 * namespace "darurat" — dikelola oleh agent Task 5-c (DaruratView, route #/darurat).
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik di ketiganya.
 */
export const daruratDict = {
  id: {
    darurat: {
      hero: {
        eyebrow: "Posko 24 Jam · Tanah Suci",
        title: "Posko Darurat Jamaah",
        subtitle:
          "Langkah pertama saat keadaan darurat — nomor resmi, perwakilan RI, posko wilayah, dan prosedur cepat yang benar.",
      },
      numbers: {
        title: "Nomor Darurat Arab Saudi",
        desc: "Tekan langsung kartu untuk menelepon. Simpan halaman ini di ponsel Anda sebelum berangkat.",
        freeNote: "Panggilan darurat gratis dari semua jaringan seluler.",
        items: {
          n911: {
            t: "Panggilan Darurat Terpadu",
            d: "Satu nomor untuk semua keadaan darurat — polisi, ambulans, dan pemadam.",
          },
          n999: {
            t: "Polisi",
            d: "Kepolisian Arab Saudi untuk keadaan darurat dan laporan keamanan.",
          },
          n997: {
            t: "Ambulans",
            d: "Panggilan ambulans medis darurat ke seluruh wilayah.",
          },
          n998: {
            t: "Pemadam Kebakaran & Pertolongan",
            d: "Pemadam kebakaran dan tim pertolongan darurat.",
          },
          n937: {
            t: "Layanan Kesehatan 24 Jam",
            d: "Konsultasi kesehatan Kemenkes Saudi — melayani 24 jam.",
          },
        },
      },
      rep: {
        title: "Perwakilan Republik Indonesia",
        desc: "Pengayoman WNI di Arab Saudi dilayani oleh perwakilan RI berikut.",
        items: {
          kbri: {
            t: "KBRI Riyadh",
            d: "Melayani WNI di wilayah bagian tengah & utara Arab Saudi.",
          },
          kjri: {
            t: "KJRI Jeddah",
            d: "Melayani Makkah, Madinah, dan Jeddah — jantung jamaah Indonesia.",
          },
        },
        yordam: {
          t: "Portal Yordam Kemlu",
          d: "Layanan pengayoman online Kementerian Luar Negeri RI untuk WNI di luar negeri.",
          cta: "Buka Portal Yordam",
        },
        hotlineNote:
          "Nomor hotline resmi perwakilan selalu yang dipublikasikan Kemlu — jangan mengandalkan nomor dari pihak tidak resmi.",
      },
      posko: {
        title: "Posko MUHDIN",
        desc: "Sekretariat MUHDIN mendampingi koordinasi darurat jamaah anggota — dari pelaporan awal hingga koordinasi dengan perwakilan RI dan PPIU.",
        cta: "Hubungi Sekretariat",
        fabNote:
          "Tombol WhatsApp melayang (FAB) tersedia di semua halaman. Sertakan kode rombongan/PPIU Anda saat melapor agar kami dapat merespons lebih cepat.",
      },
      network: {
        title: "Jaringan Posko Wilayah (BKD/BKC)",
        desc: "Kontak posko kepengurusan daerah MUHDIN terdekat.",
        picLabel: "Penanggung jawab",
        telCta: "Telepon",
        waCta: "WhatsApp",
        empty: "Jaringan posko sedang diperbarui — hubungi sekretariat.",
        error: "Gagal memuat jaringan posko.",
        retry: "Coba lagi",
        countLabel: "{n} posko wilayah terdaftar",
      },
      procedure: {
        title: "Prosedur Cepat Keadaan Darurat",
        desc: "Lima keadaan paling umum dan langkah pertama yang benar.",
        cta: "Ajukan Pengaduan (Lapor MUHDIN)",
        items: {
          passport: {
            t: "Paspor Hilang",
            d: "Lapor ke polisi terdekat (laporan gugurnya dokumen), hubungi KJRI/KBRI untuk paspor darurat (Laissez-Passer), lalu informasikan Tour Leader & sekretariat PPIU.",
          },
          separated: {
            t: "Tertinggal / Terpisah dari Rombongan",
            d: "TETAP di titik bertemu terakhir, hubungi Tour Leader (nomor tercantum di kartu rombongan), dan aktifkan lokasi di aplikasi Nusuk.",
          },
          sick: {
            t: "Sakit / Kecelakaan",
            d: "Panggil 997 (ambulans) atau konsultasi via 937. Klinik rujukan: Klinik Kesehatan Haji Indonesia (KKH). Tuntaskan klaim asuransi perjalanan — dokumen polis dari PPIU.",
          },
          deceased: {
            t: "Meninggal Dunia",
            d: "Keluarga menghubungi KJRI (pengurusan jenasah & repatriasi) bersama PPIU. MUHDIN mendampingi administrasi pengaduan.",
          },
          transport: {
            t: "Insiden Transportasi / Akomodasi",
            d: "Foto kondisi, catat nama vendor, laporkan ke Tour Leader, dan gunakan portal Lapor MUHDIN agar masuk mekanisme penyelesaian sengketa.",
          },
        },
      },
      apps: {
        title: "Aplikasi Resmi Pendukung",
        desc: "Tiga aplikasi resmi yang sebaiknya tersedia di ponsel jamaah.",
        downloadNote:
          "Unduh selalu dari app store resmi (App Store / Google Play) dan waspadai aplikasi tiruan.",
        items: {
          nusuk: {
            t: "Nusuk",
            d: "Platform resmi pemerintah Arab Saudi untuk layanan haji & umrah.",
          },
          tawakkalna: {
            t: "Tawakkalna",
            d: "Aplikasi resmi kesehatan & keadaan darurat di Arab Saudi.",
          },
          sihat: {
            t: "SiHatalhajj",
            d: "Layanan kesehatan jamaah haji Indonesia — rekam medis & pemantauan.",
          },
        },
      },
      fraud: {
        title: "Waspada penipuan",
        text: "TIDAK ADA biaya darurat yang sah ditagih via transfer ke rekening pribadi. Semua pembayaran resmi hanya melalui PPIU terdaftar — cek dulu di kanal Verifikasi MUHDIN.",
        cta: "Verifikasi PPIU",
      },
    },
  },
  en: {
    darurat: {
      hero: {
        eyebrow: "24-Hour Post · The Holy Land",
        title: "Pilgrim Emergency Post",
        subtitle:
          "The first step in an emergency — official numbers, Indonesian missions, regional posts, and the right rapid procedures.",
      },
      numbers: {
        title: "Emergency Numbers in Saudi Arabia",
        desc: "Tap a card to call directly. Save this page on your phone before departure.",
        freeNote: "Emergency calls are free from all mobile networks.",
        items: {
          n911: {
            t: "Unified Emergency Call",
            d: "One number for every emergency — police, ambulance, and fire brigade.",
          },
          n999: {
            t: "Police",
            d: "Saudi police for emergencies and security reports.",
          },
          n997: {
            t: "Ambulance",
            d: "Emergency medical ambulance dispatch to all regions.",
          },
          n998: {
            t: "Fire & Rescue",
            d: "Fire brigade and emergency rescue teams.",
          },
          n937: {
            t: "24-Hour Health Service",
            d: "Saudi Ministry of Health consultation — available 24 hours.",
          },
        },
      },
      rep: {
        title: "Republic of Indonesia Missions",
        desc: "Consular protection for Indonesian citizens in Saudi Arabia is provided by the following missions.",
        items: {
          kbri: {
            t: "Embassy of Indonesia, Riyadh",
            d: "Serving citizens in the central & northern regions of Saudi Arabia.",
          },
          kjri: {
            t: "Consulate General, Jeddah",
            d: "Serving Makkah, Madinah, and Jeddah — the heart of Indonesian pilgrims.",
          },
        },
        yordam: {
          t: "Yordam Portal — Ministry of Foreign Affairs",
          d: "Online consular protection service of the Indonesian Ministry of Foreign Affairs for citizens abroad.",
          cta: "Open the Yordam Portal",
        },
        hotlineNote:
          "Official mission hotlines are always those published by the Ministry of Foreign Affairs — never rely on numbers from unofficial parties.",
      },
      posko: {
        title: "MUHDIN Post",
        desc: "The MUHDIN secretariat accompanies emergency coordination for member pilgrims — from the initial report to coordination with Indonesian missions and PPIU.",
        cta: "Contact the Secretariat",
        fabNote:
          "The floating WhatsApp button (FAB) is available on every page. Include your group/PPIU code when reporting so we can respond faster.",
      },
      network: {
        title: "Regional Post Network (BKD/BKC)",
        desc: "Contacts of the nearest MUHDIN regional posts.",
        picLabel: "Person in charge",
        telCta: "Call",
        waCta: "WhatsApp",
        empty: "The post network is being updated — please contact the secretariat.",
        error: "Failed to load the post network.",
        retry: "Try again",
        countLabel: "{n} regional posts listed",
      },
      procedure: {
        title: "Quick Emergency Procedures",
        desc: "The five most common situations and the correct first steps.",
        cta: "File a Report (MUHDIN Report)",
        items: {
          passport: {
            t: "Lost Passport",
            d: "Report to the nearest police (document loss report), contact KJRI/KBRI for an emergency passport (Laissez-Passer), then inform your Tour Leader & PPIU secretariat.",
          },
          separated: {
            t: "Left Behind / Separated from the Group",
            d: "STAY at the last meeting point, contact your Tour Leader (the number is on the group card), and enable location sharing in the Nusuk app.",
          },
          sick: {
            t: "Illness / Accident",
            d: "Call 997 (ambulance) or consult via 937. Referral clinic: the Indonesian Hajj Health Clinic (KKH). Settle your travel insurance claim — policy documents are from your PPIU.",
          },
          deceased: {
            t: "Passing Away",
            d: "The family contacts KJRI (funeral & repatriation arrangements) together with the PPIU. MUHDIN assists with the reporting administration.",
          },
          transport: {
            t: "Transport / Accommodation Incident",
            d: "Photograph the condition, note the vendor's name, report to your Tour Leader, and use the MUHDIN Report portal so the case enters the dispute resolution mechanism.",
          },
        },
      },
      apps: {
        title: "Official Supporting Apps",
        desc: "Three official apps that pilgrims should have on their phones.",
        downloadNote:
          "Always download from official app stores (App Store / Google Play) and beware of imitation apps.",
        items: {
          nusuk: {
            t: "Nusuk",
            d: "The official Saudi government platform for hajj & umrah services.",
          },
          tawakkalna: {
            t: "Tawakkalna",
            d: "The official health & emergency app in Saudi Arabia.",
          },
          sihat: {
            t: "SiHatalhajj",
            d: "Health service for Indonesian hajj pilgrims — medical records & monitoring.",
          },
        },
      },
      fraud: {
        title: "Beware of fraud",
        text: "There is NO legitimate emergency fee requested via transfer to a personal account. All official payments go only through registered PPIU — check first on the MUHDIN Verification channel.",
        cta: "Verify a PPIU",
      },
    },
  },
  ar: {
    darurat: {
      hero: {
        eyebrow: "نقطة إغاثة · 24 ساعة · الأرض المقدسة",
        title: "نقطة إغاثة الحجاج والمعتمرين",
        subtitle:
          "خطوتك الأولى عند الطوارئ — الأرقام الرسمية، ممثليات جمهورية إندونيسيا، نقاط الإغاثة الإقليمية، والإجراءات الصحيحة السريعة.",
      },
      numbers: {
        title: "أرقام الطوارئ في المملكة العربية السعودية",
        desc: "اضغط البطاقة للاتصال مباشرة. احفظ هذه الصفحة في هاتفك قبل السفر.",
        freeNote: "مكالمات الطوارئ مجانية من جميع شبكات الاتصال.",
        items: {
          n911: {
            t: "الاستغاثة الطارئة الموحدة",
            d: "رقم واحد لكل الحالات الطارئة — الشرطة والإسعاف والدفاع المدني.",
          },
          n999: {
            t: "الشرطة",
            d: "شرطة المملكة العربية السعودية للطوارئ وبلاغات الأمن.",
          },
          n997: {
            t: "الإسعاف",
            d: "طلب إسعاف طبي طارئ في جميع المناطق.",
          },
          n998: {
            t: "الدفاع المدني والإطفاء",
            d: "فرق الإطفاء والإنقاذ الطارئة.",
          },
          n937: {
            t: "الخدمة الصحية 24 ساعة",
            d: "استشارة صحية من وزارة الصحة السعودية — على مدار الساعة.",
          },
        },
      },
      rep: {
        title: "ممثليات جمهورية إندونيسيا",
        desc: "الحماية القنصلية للمواطنين الإندونيسيين في السعودية تقدَّم عبر الممثليات التالية.",
        items: {
          kbri: {
            t: "سفارة جمهورية إندونيسيا في الرياض",
            d: "تخدم المواطنين في وسط وشمال المملكة العربية السعودية.",
          },
          kjri: {
            t: "القنصلية العامة في جدة",
            d: "تخدم مكة والمدينة المنورة وجدة — قلب الحجاج الإندونيسيين.",
          },
        },
        yordam: {
          t: "بوابة يُردام — وزارة الخارجية",
          d: "خدمة الحماية القنصلية الإلكترونية لوزارة الخارجية الإندونيسية للمواطنين في الخارج.",
          cta: "افتح بوابة يُردام",
        },
        hotlineNote:
          "أرقام الخط الساخن الرسمية للممثليات هي حصرًا ما تنشره وزارة الخارجية — لا تعتمد على أرقام من جهات غير رسمية.",
      },
      posko: {
        title: "نقطة إغاثة مهدين",
        desc: "ترافق أمانة مهديين تنسيق الطوارئ لحجاج الأعضاء — من البلاغ الأول حتى التنسيق مع الممثليات وشركات السفر.",
        cta: "اتصل بالأمانة",
        fabNote:
          "زر واتساب العائم متاح في جميع الصفحات. أدرج رمز المجموعة أو شركة السفر عند البلاغ لنتجاوب أسرع.",
      },
      network: {
        title: "شبكة نقاط الإغاثة الإقليمية (الفروع)",
        desc: "جهات اتصال نقاط الإغاثة الإقليمية القريبة منك.",
        picLabel: "المسؤول",
        telCta: "اتصال",
        waCta: "واتساب",
        empty: "شبكة نقاط الإغاثة قيد التحديث — تواصل مع الأمانة.",
        error: "فشل تحميل شبكة نقاط الإغاثة.",
        retry: "أعد المحاولة",
        countLabel: "{n} نقطة إغاثة إقليمية مسجلة",
      },
      procedure: {
        title: "إجراءات سريعة عند الطوارئ",
        desc: "خمس حالات شائعة والخطوة الأولى الصحيحة لكل منها.",
        cta: "قدّم بلاغًا (بوابة البلاغات في مهدين)",
        items: {
          passport: {
            t: "فقدان جواز السفر",
            d: "أبلغ أقرب مركز شرطة (محضر فقدان وثيقة)، ثم تواصل مع القنصلية/السفارة لجواز طارئ (Laissez-Passer)، وأخبر قائد الرحلة وأمانة شركة السفر.",
          },
          separated: {
            t: "التباعد عن المجموعة",
            d: "ابقَ في آخر نقطة التقاء، تواصل مع قائد الرحلة (الرقم مدوَّن في بطاقة المجموعة)، وفعّل مشاركة الموقع في تطبيق نُسُك.",
          },
          sick: {
            t: "المرض أو الحادث",
            d: "اطلب 997 (إسعاف) أو استشر عبر 937. العيادة المُحيلة: العيادة الإندونيسية لصحة الحج (KKH). أتم مطالبة تأمين السفر — وثيقة البوليصة من شركة السفر.",
          },
          deceased: {
            t: "الوفاة",
            d: "تواصل الأهل مع القنصلية العامة (إجراءات الجثمان والإعادة إلى الوطن) مع شركة السفر، وترافق مهديين الإجراءات الإدارية للبلاغ.",
          },
          transport: {
            t: "حوادث النقل أو الإقامة",
            d: "صوّر الحالة، دوّن اسم مزود الخدمة، أبلغ قائد الرحلة، واستخدم بوابة البلاغات في مهدين ليدخل النزاع آلية التسوية.",
          },
        },
      },
      apps: {
        title: "التطبيقات الرسمية الداعمة",
        desc: "ثلاثة تطبيقات رسمية يُستحسن أن تكون على هاتف الحاج.",
        downloadNote:
          "حمّل التطبيقات دائمًا من المتاجر الرسمية (App Store / Google Play) واحذر التطبيقات المقلدة.",
        items: {
          nusuk: {
            t: "نُسُك",
            d: "المنصة الرسمية للحكومة السعودية لخدمات الحج والعمرة.",
          },
          tawakkalna: {
            t: "توكلنا",
            d: "التطبيق الرسمي للصحة والطوارئ في السعودية.",
          },
          sihat: {
            t: "صحة الحج",
            d: "خدمة صحة حجاج إندونيسيا — السجل الطبي والمتابعة.",
          },
        },
      },
      fraud: {
        title: "احذر الاحتيال",
        text: "لا توجد أي رسوم طوارئ مشروعة تُطالب بها عبر التحويل إلى حساب شخصي. جميع المدفوعات الرسمية عبر شركات السفر المرخصة فقط — تحقق أولًا عبر قناة التحقق في مهدين.",
        cta: "التحقق من شركة السفر",
      },
    },
  },
} as const;
