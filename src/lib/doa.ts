/**
 * doa.ts — R-016 v14.1 «AKADEMI & MITRA» — Panduan Doa & Dzikir Audio.
 *
 * Kumpulan doa perangkat ibadah umrah & haji: teks Arab, latin, terjemahan
 * dua bahasa (id/en), dan sumber riwayat yang jujur. Audio TIDAK diunduh —
 * portal memutar lafal via speech synthesis perangkat (Web Speech API),
 * sehingga tetap bekerja tanpa aset eksternal & tanpa kuota jaringan.
 *
 * Seluruh naskah adalah doa-doa masyhur yang shahih/masyhur; sumber dicantumkan.
 */

export type DoaKategori = "PERJALANAN" | "IHRAM" | "TAWAF" | "SAI" | "WUKUF" | "PELENGKAP";

export interface DoaItem {
  id: string;
  kategori: DoaKategori;
  title: string; // Indonesia
  titleEn: string;
  arabic: string;
  latin: string;
  translationId: string;
  translationEn: string;
  source: string; // riwayat / dalil — jujur dicantumkan
}

export const DOA_KATEGORI: { key: DoaKategori; labelId: string; labelEn: string }[] = [
  { key: "PERJALANAN", labelId: "Perjalanan", labelEn: "Journey" },
  { key: "IHRAM", labelId: "Ihram & Miqat", labelEn: "Ihram & Miqat" },
  { key: "TAWAF", labelId: "Tawaf", labelEn: "Tawaf" },
  { key: "SAI", labelId: "Sa'i", labelEn: "Sa'i" },
  { key: "WUKUF", labelId: "Wukuf & Mabit", labelEn: "Wuquf & Mabit" },
  { key: "PELENGKAP", labelId: "Pelengkap Ibadah", labelEn: "Companion" },
];

export const DOA_LIST: DoaItem[] = [
  {
    id: "d01",
    kategori: "PERJALANAN",
    title: "Doa Naik Kendaraan",
    titleEn: "Boarding the Vehicle",
    arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنْقَلِبُونَ",
    latin: "Subḥānal-ladzī sakhkhara lanā hādzā wa mā kunnā lahū muqrinīn, wa innā ilā rabbina lamunqalibūn",
    translationId:
      "Maha suci Allah yang telah menundukkan (kendaraan) ini bagi kami, padahal kami tidak mampu menguasainya; dan sesungguhnya hanya kepada Tuhan kami kami akan kembali.",
    translationEn:
      "Glory to Him who subjected this to us, and we could never have accomplished it by ourselves; truly to our Lord we are returning.",
    source: "QS. Az-Zukhruf 43:13–14",
  },
  {
    id: "d02",
    kategori: "PERJALANAN",
    title: "Doa Safar (Keberangkatan)",
    titleEn: "Travel Invocation",
    arabic: "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَٰذَا الْبِرَّ وَالتَّقْوَىٰ وَمِنَ الْعَمَلِ مَا تَرْضَى",
    latin: "Allāhumma innā nas'aluka fī safarinā hādzal-birra wat-taqwā wa minal-'amali mā tarḍā",
    translationId:
      "Ya Allah, kami memohon kepada-Mu dalam perjalanan ini kebaikan dan ketakwaan, serta amal yang Engkau ridhai.",
    translationEn:
      "O Allah, we ask You on this journey for goodness and piety, and deeds that please You.",
    source: "HR. Muslim no. 1342",
  },
  {
    id: "d03",
    kategori: "IHRAM",
    title: "Talbiyah",
    titleEn: "Talbiyah",
    arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ لَا شَرِيكَ لَكَ",
    latin: "Labbaikallāhumma labbaik, labbaika lā syarīka laka labbaik, innal-ḥamda wan-ni'mata laka wal-mulka lā syarīka lak",
    translationId:
      "Aku penuhi panggilan-Mu ya Allah, aku penuhi panggilan-Mu; aku penuhi panggilan-Mu, tiada sekutu bagi-Mu; sesungguhnya segala pujian, nikmat, dan kerajaan adalah milik-Mu, tiada sekutu bagi-Mu.",
    translationEn:
      "Here I am at Your service, O Allah, here I am; You have no partner; surely all praise, bounty and sovereignty are Yours, You have no partner.",
    source: "HR. Bukhari no. 1549, Muslim no. 1184",
  },
  {
    id: "d04",
    kategori: "IHRAM",
    title: "Doa Memasuki Masjidil Haram",
    titleEn: "Entering the Grand Mosque",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ، أَعُوذُ بِاللَّهِ الْعَظِيمِ وَبِوَجْهِهِ الْكَرِيمِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
    latin: "Allāhummaftaḥ lī abwāba raḥmatik, a'ūdzu billāhil-'aẓīm wa biwajhihil-karīm minasy-syaiṭānir-rajīm",
    translationId:
      "Ya Allah, bukakan untukku pintu-pintu rahmat-Mu; aku berlindung kepada Allah Yang Mahaagung dan wajah-Nya Yang Mulia dari syaitan yang terkutuk.",
    translationEn:
      "O Allah, open for me the gates of Your mercy; I seek refuge in Allah the Almighty and His noble countenance from the accursed devil.",
    source: "HR. Abu Dawud no. 466 (naskah doa masuk masjid)",
  },
  {
    id: "d05",
    kategori: "TAWAF",
    title: "Doa antara Rukun Yamani & Hajar Aswad",
    titleEn: "Between Yamani Corner & Black Stone",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    latin: "Rabbanā ātinā fid-dunyā ḥasanah wa fil-ākhirati ḥasanah wa qinā 'adzāban-nār",
    translationId:
      "Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, dan lindungilah kami dari azab neraka.",
    translationEn:
      "Our Lord, give us good in this world and good in the hereafter, and protect us from the torment of the Fire.",
    source: "QS. Al-Baqarah 2:201 (doa masyhur antara dua rukun)",
  },
  {
    id: "d06",
    kategori: "TAWAF",
    title: "Doa di Maqam Ibrahim",
    titleEn: "At Station of Ibrahim",
    arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ",
    latin: "Rabbanā taqabbal minnā innaka antas-samī'ul-'alīm",
    translationId:
      "Ya Tuhan kami, terimalah (amal) dari kami; sesungguhnya Engkau Maha Mendengar lagi Maha Mengetahui.",
    translationEn:
      "Our Lord, accept from us; indeed You are the All-Hearing, the All-Knowing.",
    source: "QS. Al-Baqarah 2:127",
  },
  {
    id: "d07",
    kategori: "SAI",
    title: "Dzikir di Bukti Shafa & Marwah",
    titleEn: "Dhikr at Safa & Marwah",
    arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    latin: "Lā ilāha illallāhu waḥdahu lā syarīka lah, lahul-mulku wa lahul-ḥamdu wa huwa 'alā kulli syai'in qadīr",
    translationId:
      "Tiada tuhan selain Allah semata, tiada sekutu bagi-Nya; milik-Nya kerajaan dan pujian, dan Dia Maha Kuasa atas segala sesuatu.",
    translationEn:
      "There is no god but Allah alone, without partner; to Him belong sovereignty and praise, and He is over all things competent.",
    source: "HR. Bukhari no. 1577, Muslim no. 1218",
  },
  {
    id: "d08",
    kategori: "SAI",
    title: "Doa Umum di Antara Shafa-Marwah",
    titleEn: "General Supplication at Sa'i",
    arabic: "اللَّهُمَّ اغْفِرْ وَارْحَمْ وَأَنْتَ الْعَزِيزُ الْكَرِيمُ",
    latin: "Allāhummaghfir warḥam wa antal-'azīzul-karīm",
    translationId: "Ya Allah, ampunilah dan rahmatilah (kami), Engkau Maha Perkasa lagi Maha Mulia.",
    translationEn: "O Allah, forgive and have mercy, You are the Almighty, the Most Generous.",
    source: "HR. Abu Dawud no. 1894",
  },
  {
    id: "d09",
    kategori: "WUKUF",
    title: "Dzikir Wukuf di Arafah",
    titleEn: "Wuquf Dhikr at Arafah",
    arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    latin: "Lā ilāha illallāhu waḥdahu lā syarīka lah, lahul-mulku wa lahul-ḥamdu wa huwa 'alā kulli syai'in qadīr",
    translationId:
      "Tiada tuhan selain Allah semata, tiada sekutu bagi-Nya; milik-Nya kerajaan dan pujian, dan Dia Maha Kuasa atas segala sesuatu.",
    translationEn:
      "There is no god but Allah alone, without partner; to Him belong sovereignty and praise, and He is over all things competent.",
    source: "HR. Bukhari no. 3268 (dikumandangkan di Wukuf)",
  },
  {
    id: "d10",
    kategori: "WUKUF",
    title: "Doa Lapang Dada di Arafah",
    titleEn: "Heartfelt Supplication at Arafah",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ",
    latin: "Allāhumma innī a'ūdzu bika minal-hammi wal-ḥazan, wal-'ajzi wal-kasal, wal-bukhli wal-jubn, wa ḍala'id-dayn wa ghalabatir-rijāl",
    translationId:
      "Ya Allah, aku berlindung kepada-Mu dari kegelisahan dan kesedihan, dari kelemahan dan kemalasan, dari sifat kikir dan pengecut, serta dari beban utang dan tekanan manusia.",
    translationEn:
      "O Allah, I seek refuge in You from anxiety and grief, from weakness and laziness, from miserliness and cowardice, from the burden of debt and being overpowered by men.",
    source: "HR. Bukhari no. 6369",
  },
  {
    id: "d11",
    kategori: "WUKUF",
    title: "Doa Bermukim (Mabit)",
    titleEn: "Supplication for Dwelling",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَاقَةِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ",
    latin: "Allāhumma innī a'ūdzu bika minal-kufri wal-fāqah, wa a'ūdzu bika min 'adzābil-qabr",
    translationId:
      "Ya Allah, aku berlindung kepada-Mu dari kekufuran dan kefakiran, dan aku berlindung kepada-Mu dari azab kubur.",
    translationEn:
      "O Allah, I seek refuge in You from disbelief and poverty, and I seek refuge in You from the torment of the grave.",
    source: "HR. Abu Dawud no. 1552",
  },
  {
    id: "d12",
    kategori: "PELENGKAP",
    title: "Doa Minum Air Zamzam",
    titleEn: "Drinking Zamzam Water",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ",
    latin: "Allāhumma innī as'aluka 'ilman nāfi'an wa rizqan wāsi'an wa syifā'an min kulli dā'",
    translationId:
      "Ya Allah, aku memohon kepada-Mu ilmu yang bermanfaat, rezeki yang luas, dan kesembuhan dari segala penyakit.",
    translationEn:
      "O Allah, I ask You for beneficial knowledge, abundant provision, and healing from every disease.",
    source: "Doa masyhur ketika minum zamzam (HR. Ibnu Majah no. 3064 dgn bacaan lain)",
  },
  {
    id: "d13",
    kategori: "PELENGKAP",
    title: "Takbir Rami Jumrah",
    titleEn: "Takbir at Each Stoning",
    arabic: "اللَّهُ أَكْبَرُ",
    latin: "Allāhu akbar",
    translationId: "Allah Maha Besar — dibaca tiap melempar satu kerikil.",
    translationEn: "Allah is the Greatest — recited with every pebble thrown.",
    source: "HR. Bukhari no. 161, Muslim no. 1217",
  },
  {
    id: "d14",
    kategori: "PELENGKAP",
    title: "Doa Meninggalkan Masjid",
    titleEn: "Leaving the Mosque",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    latin: "Allāhumma innī as'aluka min faḍlik",
    translationId: "Ya Allah, aku memohon sebagian karunia-Mu.",
    translationEn: "O Allah, I ask You of Your bounty.",
    source: "HR. Muslim no. 713",
  },
  {
    id: "d15",
    kategori: "PELENGKAP",
    title: "Doa Ketakwaan di Setiap Keadaan",
    titleEn: "Guidance at Every Turn",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَىٰ وَالتُّقَىٰ وَالْعَفَافَ وَالْغِنَىٰ",
    latin: "Allāhumma innī as'alukal-hudā wat-tuqā wal-'afāfa wal-ghinā",
    translationId:
      "Ya Allah, aku memohon kepada-Mu petunjuk, ketakwaan, sifat pantang (dzina & keji), dan kekayaan hati.",
    translationEn:
      "O Allah, I ask You for guidance, piety, chastity, and self-sufficiency.",
    source: "HR. Muslim no. 2721",
  },
  {
    id: "d16",
    kategori: "PELENGKAP",
    title: "Tasbih, Tahmid, Takbir (Zikir Umrah)",
    titleEn: "Tasbih, Tahmid, Takbir",
    arabic: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَٰهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ",
    latin: "Subḥānallāh wal-ḥamdulillāh wa lā ilāha illallāh wallāhu akbar",
    translationId:
      "Maha suci Allah, segala puji bagi Allah, tiada tuhan selain Allah, Allah Maha Besar.",
    translationEn:
      "Glory be to Allah, all praise is for Allah, there is no god but Allah, Allah is the Greatest.",
    source: "Dzikir masyhur seusai tawaf & shalat (HR. Muslim no. 597)",
  },
];

/** Nomor urut tampilan (d01 → 01). */
export function doaNo(d: DoaItem): string {
  return d.id.slice(1).padStart(2, "0");
}
