/**
 * doa.ts — i18n R-016 v14.1 Panduan Doa & Dzikir Audio.
 * Digenerate terstruktur: doaDict = { id: { ns: {key} }, en: …, ar: … }.
 */
export const doaDict = {
  id: {
    doa: {
      eyebrow: "PERANGKAT IBADAH",
      title: "Panduan Doa & Dzikir Audio",
      subtitle: "Kumpulan doa perangkat ibadah umrah & haji: teks Arab, latin, dan terjemahan — dengan lafal audio dari perangkat Anda.",
      statTotal: "Jumlah Doa",
      statKategori: "Kategori",
      statAudio: "Audio",
      audioSiap: "suara Arab siap",
      audioTidakAda: "pakai suara bawaan",
      audioNote: "Audio diputar langsung oleh perangkat Anda (Web Speech API) — tanpa unduhan, tetap bekerja di jaringan lambat. Kualitas lafal bergantung suara Arab yang terpasang di perangkat.",
      semua: "Semua",
      putar: "Putar",
      stop: "Stop",
      kosong: "Tidak ada doa pada kategori ini.",
      adabTitle: "Adab membaca doa",
      adabBody: "Baca dengan penuh kehadiran hati, pahami maknanya, dan yakini bahwa Allah Maha Mendengar. Untuk masalah fiqh yang rinci, konsultasikan kepada ustadz/mentori rombongan Anda.",
    },
  },
  en: {
    doa: {
      eyebrow: "RITUAL COMPANION",
      title: "Prayer & Dhikr Audio Guide",
      subtitle: "A collection of umrah & hajj ritual supplications: Arabic text, transliteration and translation — with audio recitation from your device.",
      statTotal: "Supplications",
      statKategori: "Categories",
      statAudio: "Audio",
      audioSiap: "Arabic voice ready",
      audioTidakAda: "using default voice",
      audioNote: "Audio is rendered by your own device (Web Speech API) — no downloads needed, works on slow networks. Recitation quality depends on the Arabic voice installed on your device.",
      semua: "All",
      putar: "Play",
      stop: "Stop",
      kosong: "No supplications in this category.",
      adabTitle: "Etiquette of reciting supplications",
      adabBody: "Recite with full presence of heart, understand the meaning, and be certain that Allah hears all. For detailed fiqh matters, consult the scholars or mentors of your group.",
    },
  },
  ar: {
    doa: {
      eyebrow: "مستلزمات العبادة",
      title: "دليل الأدعية والأذكار الصوتي",
      subtitle: "مجموعة أدعية مناسك العمرة والحج: النص العربي والنقل الصوتي والترجمة — مع التلاوة الصوتية من جهازك.",
      statTotal: "عدد الأدعية",
      statKategori: "الفئات",
      statAudio: "الصوت",
      audioSiap: "الصوت العربي جاهز",
      audioTidakAda: "استخدام الصوت الافتراضي",
      audioNote: "يتم تشغيل الصوت بواسطة جهازك مباشرة — دون تحميل، ويعمل على الشبكات البطيئة. تعتمد جودة التلاوة على الصوت العربي المثبت في جهازك.",
      semua: "الكل",
      putar: "تشغيل",
      stop: "إيقاف",
      kosong: "لا توجد أدعية في هذه الفئة.",
      adabTitle: "أدب قراءة الدعاء",
      adabBody: "اقرأ بحضور القلب، وافهم المعنى، واثق أن الله يسمع كل شيء. وللمسائل الفقهية التفصيلية استشر علماء أو مرشدي رحلتك.",
    },
  },
} as const;
