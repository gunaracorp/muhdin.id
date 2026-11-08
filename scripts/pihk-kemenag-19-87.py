#!/usr/bin/env python3
"""
pihk-kemenag-19-87.py — baris 19-87 dokumen resmi "Daftar Penyelenggara Ibadah
Haji Khusus (PIHK)" Kemenag RI (Ditjen PHU, Jl. Lapangan Banteng Barat 3-4
Jakarta Pusat) — salinan publik di id.scribd.com/document/693210692.
Transkrip persis dari sumber (typo sumber dipertahankan); tidak ada data dikarang.
Baris 1-18 sudah diimpor di Task 22 (anggota-resmi.csv).
Keluaran: download/data-resmi/pihk-kemenag-19-87.csv
"""
import csv
import pathlib
import re

OUT = pathlib.Path("/home/z/my-project/download/data-resmi/pihk-kemenag-19-87.csv")

# (nama, izin_kma, alamat, telp, email) — baris 19-87 dokumen
BARIS = [
    ("PT. ANNATAMA PURNA", "KMA Nomor 452 Tahun 2020", "Gedung MTH Square Lt. 1/21 Jl. Otista No. 390 Kel. Bidara Cina, Kec. Jatinegara, Jakarta Timur", "(021) 29575290, 29575291, Fax. (021) 29575289", "annatamatravel@gmail.com"),
    ("PT. ANNUR MAKNAH WISATA", "KMA Nomor 697 Tahun 2020", "Jl. Kyai Haji Abdullah Syafei No. 50 F Kelurahan Bukit Duri Kecamatan Tebet Jakarta Selatan Provinsi DKI Jakarta", "021-22839442", "umroh.anamta@gmail.com"),
    ("PT. ARFINA MARGI WISATA", "KMA Nomor 297 Tahun 2017", "Komp. Mesjid Agung Al-Azhar, Jl. Sisingamangaraja No. 12 RT. 002/001, Kel. Selong, Kec. Kebayoran Baru, Kota Administrasi Jakarta Selatan, DKI Jakarta", "(021) 72787647/648, 72799758, Fax. (021) 72799759", "alazhar_arfina@yahoo.com"),
    ("PT. ARIL BUANA WISATA", "KMA Nomor 204 Tahun 2017", "Aril Building 1 Jl. Letjen R. Suprapto No. 22 C-D RT/RW. 004/006, Kel Cempaka Putih Barat, Kec. Cempaka Putih, Kota Administrasi Jakarta Pusat", "(021) 4203342, 4203333, Fax. (021) 4205939", "anatatour@yahoo.com"),
    ("PT. ARMADA SAFARI SUCI", "KMA Nomor 173 Tahun 2018", "Jl. Taman Citarum 11 Kel. Citarum, Kec. Bandung Wetan, Kota Bandung", "(022) 5205133, Fax. (022) 4202546", "info@safarisuci.co.id"),
    ("PT. ARMINAREKA PERDANA", "KMA Nomor 158 Tahun 2018", "Gedung Menara Salemba Lt. 5, Jl. Salemba Raya, Kel. Paseban, Kec. Senen, Jakarta Pusat", "(021) 39842982, 39842964, Fax. (021) 39843014", "adm@arminarekaperdana.com"),
    ("PT. ARNUSSAID TOURS & TRAVEL", "KMA Nomor 397 Tahun 2018", "Jl. Bendungan Hilir IV/18 Kel. Bendungan Hilir, Kec. Tanah Abang, Jakarta Selatan 10210", "(021) 5735505, Fax. (021) 5708329", "arnussatour@yahoo.com"),
    ("PT. AROFAH SATYA PRAKASA", "KMA Nomor 504 Tahun 2017", "Jl. Radio Dalam Raya No. F3 Kel. Gandaria Utara, Kec. Kebayoran Baru, Jakarta Selatan 12140", "(021) 7228976, 72795883-84, Fax. (021) 7228977", "arofahtour@yahoo.co.id"),
    ("PT. ARRAYYAN UTAMA", "KMA Nomor 828 Tahun 2017", "Wisma BSG Lobby Lantai 1, Jl. Abdul Muis No. 40, Kel. Petojo, Kec. Gambir, Kota Administrasi Jakarta Pusat, DKI Jakarta", "(021) 3514802, 3514803, 3505000 ext. 1005, Fax. (021) 3500424", "arrayyantour@yahoo.co.id"),
    ("PT. ARREHLAH WISATA", "KMA Nomor 802 Tahun 2017", "Jl. Gamelan No. 2 RT. 34 Kel. Dadi Mulya, Kec. Samarinda Ulu, Kota Samarinda", "(0541) 749186, 749187, Fax. (0541) 749204", "arrehlahwisata@yahoo.co.id"),
    ("PT. BIRO PERJALANAN WISATA ARUNA TRAVEL", "KMA Nomor 346 Tahun 2020", "Gedung Mampang Square Tower A.3 lantai 5, Jl. Mampang Prapatan Raya No. 88, Kelurahan Tegal Parang, Kecamatan Mampang Prapatan, Kota ADM Jakarta Selatan, Provinsi DKI Jakarta", "(021) 79184294", "aruna.umrahhaji1@gmail.com"),
    ("PT. ATTAQWA GARUDA INSANI", "KMA Nomor 300 Tahun 2018", "Wijaya Grand Center Blok E No. 5, Jl. Wijaya II, Kel. Pulo, Kec. Kebayoran Baru, Jakarta Selatan 12610, DKI Jakarta", "(021) 7393963, 7201215, 7225489, Fax. (021) 7243927", "attaqwa_garuda_insani@yahoo.com"),
    ("PT. BALDA CITRA MANDIRI", "KMA Nomor 476 Tahun 2018", "Gedung 4848 Perkantoran Lantai 4, Jl. Prajurit KKO Usman dan Harun No. 30 F, RT/RW. 001/005, Kel. Senen, Kec. Senen, Kota Adm. Jakarta Selatan", "(021) 72791209, 72797801, Fax. (021) 7221345", "care@baldacitra.com"),
    ("PT. BARFO SIS ALKHAIRAAT", "KMA Nomor 154 Tahun 2020", "Gedung Mampang Square Tower A.3 lantai 4, Jl. Mampang Prapatan Raya No. 88, Kelurahan Tegal Parang, Kecamatan Mampang Prapatan, Kota ADM Jakarta Selatan, Provinsi DKI Jakarta", "(021) 7947660", "bsa_travel@yahoo.com"),
    ("PT. BATEMURI TOURS", "KMA Nomor 447 Tahun 2018", "Menara Hijau Lt. 3, Jl. MT Haryono Kav. 33, RT/RW. 003/002, Kel. Cikoko, Kec. Pancoran, Kota Adm. Jakarta Selatan, DKI Jakarta", "(021) 7985920, Fax. (021) 7985861, 7985864", "batemuri@cbn.net.id"),
    ("PT. BHUANA ETAM LESTARI", "KMA Nomor 906 Tahun 2019", "Jl. Gunung Sari Ujung No. 26B RT. 013 RW. 001, Kel. Teluk Dalam, Kec. Banjarmasin Tengah, Kota Banjarmasin, Kalimantan Selatan", "(0511) 4425227", "bel_tour@yahoo.com"),
    ("PT. BINAKREASI PESONA SELARAS", "KMA Nomor 301 Tahun 2018", "Jl. Palbatu Raya 6, RT. 001 RW. 004, Kel. Menteng Dalam, Kec. Tebet, Jakarta Selatan, DKI Jakarta", "(021) 8353811, 8353812, Fax. (021) 8280738", "binawisata@yahoo.com"),
    ("PT. BUNDA ASNI PRIMA", "KMA Nomor 201 Tahun 2017", "Jl. Bumi Jaya RT.004 LK. II, Kelurahan Labuhan Dalam, Kecamatan Tanjung Senang, Bandar Lampung", "(0721) 704545", "bunda.asni@gmail.com"),
    ("PT. CARAKA WISATA TOUR AND TRAVEL", "KMA Nomor 235 Tahun 2019", "Jl. Jati Baru Raya No. 56 A, Kel. Cideng, Kec. Gambir, Kota Administrasi Jakarta Pusat", "(021) 3451476, 3456252, Fax. (021) 3808334, 3807532", "caraka.wisata@yahoo.co.id"),
    ("PT. CITRA WISATA DUNIA", "KMA Nomor 12 Tahun 2018", "Jl. Ipda Tut Harsono No. 3 RT/RW. 027/009, Kel. Muja Muji, Kec. Umbul Harjo, Kota Yogyakarta", "(0274) 582777, Fax. (0274) 552246", "hasuna_hajiumrah@yahoo.co.id"),
    ("PT. CITRA CERIA USAHA KHALIFAH", "KMA Nomor 93 Tahun 2020", "Jl. Brigjen Katamso No. 11 RT. 03 RW. 10, Kelurahan Cihaur Geulis, Kecamatan Cibeunying Kaler, Kota Bandung, Provinsi Jawa Barat", "(022) 88885617, 87240443, Fak. 7203795", "khalifahtour@yahoo.com"),
    ("PT. BIRO PERJALANAN WISATA CORDOVA ABILA", "KMA Nomor 796 Tahun 2017", "Jl. Kemang Timur Raya No. 48 RT/RW. 009/004, Kel. Bangka, Kec. Mampang Prapatan, Kota Adm. Jakarta Selatan", "(021) 7194808, Fax. (021) 7182544", "mailbox@cordova-travel.com"),
    ("PT. DEWISERASI INDAH WISATA", "KMA Nomor 143 Tahun 2019", "Jl. Tebet Raya No. 25 C RT/RW. 001/02, Kel. Tebet Timur, Kec. Tebet, Kota Adm. Jakarta Selatan, DKI Jakarta", "(021) 83787733, 83787755, Fax. (021) 83709233", "umrohhaji@indah-wisata.com"),
    ("PT. DIAN NUSA INSANI", "KMA Nomor 345 Tahun 2020", "Jl. Mampang Prapatan Raya No. 69, Kel. Tegal Parang, Kec. Mampang Prapatan, Jakarta Selatan", "(021) 79195808, Fax. (021) 79195789", "insani_travel@yahoo.co.id"),
    ("PT. DIAN SALTRA PERDANA", "KMA Nomor 278 Tahun 2017", "Duta Mas Fatmawati Blok D1/1, Jl. RS Fatmawati No. 39, Kel. Cipete Utara, Kec. Kebayoran Baru, Jakarta Selatan", "(021) 72797052, Fax. (021) 72797053", "diansaltratravel@yahoo.com"),
    ("PT. DINA SETYA RAHMA", "KMA Nomor 696 Tahun 2020", "Jl. Pemuda 72-73A Rawamangun RT.001 RW.008, Kel. Jati, Kec. Pulogadung, Kota Administrasi Jakarta Timur 13220", "(021) 47861015, 4714746, Fax. (021) 4712777, 4890196", "dinasetyarahma@yahoo.co.id"),
    ("PT. DIYO SIBA", "KMA Nomor 550 Tahun 2018", "Jl. Pacuan Kuda Raya No. 04 RT. 011/011, Kel. Kayu Putih, Kec. Pulogadung, Jakarta Timur 13210", "(021) 47863319, 47863321, 47863323, Fax. (021) 4706413", "diyo_siba@yahoo.com"),
    ("PT. DUA RIBU WISATA", "KMA Nomor 507 Tahun 2017", "Jl. Dewi Sartika No. 69 A RT.001 RW.002, Kel. Cawang, Kec. Kramat Jati, Jakarta Timur, DKI Jakarta", "(021) 80882000, 80880577, 8010121, Fax. (021) 80878204", "duaribuwisata@yahoo.co.id"),
    ("PT. DUTA FARAS", "KMA Nomor 524 Tahun 2017", "Graha Duta Faras Lt. 3, Jl. Duren Tiga Raya No. 100, RT/RW. 006/006, Kel. Duren Tiga, Kec. Pancoran, Kota Administrasi Jakarta Selatan", "(021) 21279000, 21279009, Fax. (021) 22792776", "info@dutafaras.com"),
    ("PT. EBAD AL RAHMAN WISATA", "KMA Nomor 582 Tahun 2019", "Komp. Perkantoran Juanda Business Centre (JBC) Blok A 8-9, Jl. Raya Juanda No. 1, Kel. Sawatratap, Kec. Gadinganggan, Sidoarjo, Jawa Timur 61254", "(031) 8533666, Fax. (031) 8538619", "ebadwisata@yahoo.com"),
    ("PT. FAJRUL IKHSAN WISATA", "KMA Nomor 78 Tahun 2020", "Gedung Menara 165 Lt. Dasar (GF) Lobby Office, Jl. TB. Simatupang Kav. 1 RT/RW. 008/003, Kel. Cilandak Timur, Kec. Pasar Minggu, Kota Adm. Jakarta Selatan, DKI Jakarta", "(021) 29406350, 30030321", "fajrulikhsanwisata@yahoo.com"),
    ("PT. FARAH FAZA ASTATAMA", "KMA Nomor 772 Tahun 2019", "Jl. Kramat II No. 59 RT. 008 RW. 004, Kel. Kwitang, Kec. Senen, Kota Administrasi Jakarta Pusat", "(021) 3142209, Fax. (021) 3142209", "farfaza_jkt@yahoo.co.id"),
    ("PT. FATH INDAH TRAVEL SERVICE", "KMA Nomor 255 Tahun 2018", "Jl. Progo 5 RT. 02 RW. III, Kel. Darmo, Kec. Wonokromo, Surabaya, Jawa Timur", "(031) 5460685, Fax. (031) 5460685", "fathindah@yahoo.com"),
    ("PT. FAZARY WISATA", "KMA Nomor 508 Tahun 2020", "Ruko Prima Bintaro Sektor III Blok D No. 56/56 RT. 002/005, Jl. WR. Supratman, Kel. Pondok Karya, Kec. Pondok Aren, Kota Tangerang Selatan, Provinsi Banten", "(021) 7371095, 73780001, 7377727, Fax. (021) 7371190", "info@fazarywisata.co.id"),
    ("PT. FEMMY TOUR AND TRAVEL", "KMA Nomor 150 Tahun 2019", "D'Arcici Dasar C'One Hotel & Plaza, Jl. Letjen Soeprapto No. 62 RT/RW. 008/03, Kel. Cempaka Putih, Kec. Cempaka Putih, Kota Adm. Jakarta Pusat", "(021) 42881159, Fax. (021) 42881159", "femmy.tour@yahoo.com"),
    ("PT. GADIKA EXPRESINDO TOUR", "KMA Nomor 447 Tahun 2017", "Jl. Bulak Rantai No. 1 C, RT. 001 RW. 008, Kel. Tengah, Kec. Kramat Jati, Jakarta Timur, DKI Jakarta", "(021) 80888682, 80888942, Fax. (021) 80888379", "gadika.travel@yahoo.com"),
    ("PT. GALATAMA NUANSA TOUR", "KMA Nomor 802 Tahun 2019", "Jl. Pandanaran No. 58, Kel. Pekunden, Kec. Semarang Tengah, Semarang, Jawa Tengah", "(024) 8411414, Fax. (024) 8447989", "galatamatour@yahoo.com"),
    ("PT. GAMAL HIKMAH PUSAKA", "KMA Nomor 256 Tahun 2018", "Jl. Kramat Raya No. 27 D, Kel. Kramat, Kec. Senen, Jakarta Pusat", "(021) 22393400, 22393403, 22393405", "gamalhikmah20@gmail.com"),
    ("PT. GATRA CITRA KENCANA", "KMA Nomor 257 Tahun 2018", "Warung Jati Timur Raya No. 26 RT/RW. 007/04, Kel. Kalibata, Kec. Pancoran, Kota Adm. Jakarta Selatan", "(021) 79191851, Fax. (021) 7997405 - 7991096", "gatra_umrahhaji@yahoo.com"),
    ("PT. GEMA SHAFA MARWA", "KMA Nomor 295 Tahun 2018", "Ruko Mutiara Faza, Jl. Condet Raya No. 27/RC 2 RT. 007 RW. 001, Kel. Gedong, Kec. Pasar Rebo, Jakarta Timur, DKI Jakarta", "(021) 87782122, Fax. (021) 8412967", "gsmhajiplus@yahoo.co.id"),
    ("PT. GOENAWAN ERAWISATA TOUR AND TRAVEL", "KMA Nomor 160 Tahun 2018", "Bisnis Park Tangerang City Blok B No. 25, Kel. Babakan, Kec. Tangerang, Kota Tangerang", "(021) 55781225, Fax. (021) 55781226", "goenawan_hajiumroh@yahoo.com"),
    ("PT. BIRO PERJALANAN WISATA HELUTRANS ALHAADII ZIARAH", "KMA Nomor 37 Tahun 2019", "Ruko Puri Sentra Niaga Blok A-5, Jl. Seulawah Raya Kalimalang, Kel. Cipinang Melayu, Kec. Makasar, Kota Adm. Jakarta Timur", "(021) 86601315, 86601316, Fax. (021) 8626441", "info@haztour.com"),
    ("PT. HIJAZ TOUR & TRAVEL", "KMA Nomor 91 Tahun 2019", "Pertokoan Waru, Jl. Jatinegara Barat Raya No. 12 RT/RW. 06/01, Kelurahan Kampung Melayu, Kecamatan Jatinegara, Kota ADM Jakarta Timur", "(021) 85902634, 32230143", "info@hijaztour.com"),
    ("PT. HAPPY PRIMA WISATA", "KMA Nomor 522 Tahun 2019", "Gedung TWINK Lt. 5, Jl. Kapten Tendean No. 82, Kel. Mampang Prapatan, Kec. Mampang Prapatan, Kota Adm. Jakarta Selatan, DKI Jakarta", "(021) 7900225, Fax. (021) 7900219", "admin@primasaidah.com"),
    ("PT. BIRO PERJALANAN WISATA HUDAYA SAFARI", "KMA Nomor 303 Tahun 2018", "Gedung Menara Dakwah, Jl. Kramat Raya No. 45, Kel. Kramat, Kec. Senen, Jakarta Pusat 10450", "(021) 31900306, 31900309, Fax. (021) 3161961", "hudayasafari@gmail.com"),
    ("PT. BIRO PERJALANAN WISATA IDAH ROES", "KMA Nomor 236 Tahun 2019", "Jl. Ahmad Yani KM. 4.700 No. 407 B RT. 031 RW. 002, Kelurahan Kebun Bunga, Kecamatan Banjarmasin Timur, Provinsi Kalimantan Selatan", "(0511) 3272976, Fax. (0511) 3265018", "idah_roes2000@yahoo.co.id"),
    ("PT. INDAH PERMATA PERMAI", "KMA Nomor 598 Tahun 2018", "Jl. Pemuda No. 9A, RT/RW. 011/014, Kel. Rawamangun, Kec. Pulogadung, Kota Adm. Jakarta Timur, DKI Jakarta", "(021) 47863319", "indahpermata.permai@yahoo.co.id"),
    ("PT. INTANKENCANA TRAVELINDO", "KMA Nomor 797 Tahun 2019", "Jl. KH. Abdullah Syafi'ie No. 3 D RT. 003 RW. 009, Kel. Bukit Duri, Kec. Tebet, Jakarta Selatan", "(021) 99220930, Fax. (021) 83795607", "pt.intankencana.travelindo@gmail.com"),
    ("PT. INTAN SALSABILA", "KMA Nomor 174 Tahun 2018", "Jl. Tebet Barat Dalam Raya No. 55 C, RT. 006/RW. 004, Kel. Tebet Barat, Kec. Tebet, Kota Adm. Jakarta Selatan", "(021) 83705341, Fax. (021) 83705342", "intansalsabila.travel@gmail.com"),
    ("PT. JAMILA ANTARNUSA WISATA", "KMA Nomor 448 Tahun 2018", "Ruko Lt. 2, Jl. Ragunan Raya No. 19, RT/RW. 002/007, Kel. Jati Padang, Kec. Pasar Minggu, Kota Adm. Jakarta Selatan, DKI Jakarta", "(021) 22783228/3308", "jamilabr2007@yahoo.com"),
    ("PT. JASA WISATA NUSANTARA", "KMA Nomor 144 Tahun 2019", "Jl. Cipinang Besar Selatan No. 6 RT. 008/06, Kel. Cipinang Besar Selatan, Kec. Jatinegara, Kota Administrasi Jakarta Timur", "(021) 8197234, 8516784, Fax. (021) 85903820", "jawaratour@yahoo.com"),
    ("PT. KAFILAH MAGHFIRAH WISATA", "KMA Nomor 557 Tahun 2019", "Jl. Matraman Raya No. 148, Rukan Mitra Matraman A1/25, Kel. Kebon Manggis, Kec. Matraman, Jakarta Timur", "(021) 8517172, 8519711, 8519742, Fax. (021) 85918135", "travel@maghfirah.com"),
    ("PT. KALTRABU INDAH", "KMA Nomor 226 Tahun 2019", "Jl. A. Yani KM. 3,5 Komplek Pertokoan Tunjung Maya Blok B No. 10 D, Kel. Karang Mekar, Kec. Banjarmasin Timur, Banjarmasin 70234", "(0511) 3262501, 3262502, Fax. (0511) 3264206", "kaltrabu@gmail.com"),
    ("PT. KAMILAH WISATA MUSLIM", "KMA Nomor 601 Tahun 2018", "Jl. Menteri Empat No. 77 RT/RW. 40/14, Kel. Keraton, Kec. Martapura, Kab. Banjar, Kalimantan Selatan", "(0511) 4723222, Fax. (0511) 4722232", "kamilah_wm@yahoo.com"),
    ("PT. KANOMAS ARCI WISATA", "KMA Nomor 556 Tahun 2019", "Jl. Salemba Tengah 12 H, Kel. Paseban, Kec. Senen, Kota Administrasi Jakarta Pusat 10440", "(021) 3928115, 3928119, 3144648, Fax. (021) 3927904", "kanomas_umrohajj@yahoo.com"),
    ("PT. KARTIKA UTAMA", "KMA Nomor 651 Tahun 2018", "Ruko Cibubur Country Blok RBOD No. 6 RT. 002 RW. 018, Kel. Cikeas Udik, Kec. Gunung Putri, Kab. Bogor", "(021) 29099858, Fax. (021) 29099868", "haramain@kartikautama.com"),
    ("PT. KEMANG NUSANTARA TRAVEL", "KMA Nomor 686 Tahun 2020", "Ruko Victorian, Jalan Bintaro Utama Sektor 3A Blok B2 Bintaro Jaya RT.3 RW.4, Kelurahan Pondok Karya, Kecamatan Pondok Aren, Tangerang Selatan, Provinsi Banten", "(021) 7365999, Fax. (021) 7365999", "kemtravel17@yahoo.com"),
    ("PT. KHADIM PERMATA TOUR", "KMA Nomor 239 Tahun 2019", "Jl. Lawanggintung No. 25 RT. 01 RW. 02, Kel. Batutulis, Kec. Bogor Selatan, Kota Bogor, Jawa Barat", "(0251) 8380789, Fax. (0251) 8323230", "khadim_wisata@yahoo.com"),
    ("PT. KHARISSA PERMAI HOLIDAY", "KMA Nomor 653 Tahun 2018", "Jl. Cilosari No. 24B, Kel. Cikini, Kec. Menteng, Kota Adm. Jakarta Pusat", "(021) 3153954, 3916370, Fax. (021) 3925101", "kharissatours@yahoo.com"),
    ("PT. KINDAI TOURS & TRAVEL", "KMA Nomor 341 Tahun 2020", "Jl. Taman Bendungan Jatiluhur VII No. 3 RT. 012 RW. 002, Kel. Bendungan Hilir, Kec. Tanah Abang, Kota Administrasi Jakarta Pusat, DKI Jakarta", "(021) 5704843, Fax. (021) 5735365", "kindaitours@gmail.com"),
    ("PT. KOTA PIRING KENCANA", "KMA Nomor 714 Tahun 2020", "Ruko Graha Mas Pemuda, Jl. Pemuda Blok AA 19, RT/RW. 003/09, Kel. Jati, Kec. Pulogadung, Kota Adm. Jakarta Timur, DKI Jakarta", "(021) 63854002, 63853978, Fax. (021) 63853992", "kpktour@cbn.net.id"),
    ("PT. KERINGAT BERSAMA", "KMA Nomor 829 Tahun 2017", "Jl. Ariawiratanudatar No. 119, Kel. Bojong, Kec. Karangtengah, Kabupaten Cianjur, Jawa Barat", "(0263) 266062, 267171, Fax. (0263) 261649", "krismatravel@yahoo.com"),
    ("PT. KUBAH WISATA NUSANTARA", "KMA Nomor 652 Tahun 2017", "IKA Building Ruang 203 Lt. 2, Komp. Duta Merlin Blok B31-32, Jl. Gajah Mada No. 3-5, Kel. Petojo Utara, Kec. Gambir, Kota Administrasi Jakarta Pusat", "(021) 6305144, Fax. (021) 6305144", "kubahwisata97@yahoo.com"),
    ("PT. LINTAS ZIARAH SAHARA", "KMA Nomor 683 Tahun 2020", "Jl. E Ujung No. 108 RT. 02 RW. 03, Kelurahan Kelapa Dua, Kecamatan Kebon Jeruk, Kota ADM Jakarta Barat, Provinsi DKI Jakarta", "(021) 53651891, 5302716", "pt_lizahra@yahoo.co.id"),
    ("PT. MADANI BINA BERSAMA", "KMA Nomor 750 Tahun 2018", "Ged. Selmis, Jl. Asem Baris Raya No. 52 Blok II Unit No. 12 Lt. III RT/RW. 001/005, Kel. Kebon Baru, Kec. Tebet, Kota Adm. Jakarta Selatan", "(021) 8295850, 8307865, Fax. (021) 831 6051", "madani_tourstravel@yahoo.co.id"),
    ("PT. MADINAH IMAN WISATA", "KMA Nomor 304 Tahun 2018", "Jl. Merpati Raya Ruko Harves No. 26 RT/RW. 005/001, Kel. Sawah, Kec. Ciputat, Kota Tangerang Selatan, Banten", "(021) 7422555", "info@madinahiman.co.id"),
    ("PT. MAGNA DWI ANITA", "KMA Nomor 148 Tahun 2020", "Jl. Bekasi Timur IV No. 3 RT. 001 RW. 08, Kel. Cipinang Besar Utara, Kec. Jatinegara, Jakarta Timur 13410", "(021) 8516461-8512195, Fax. (021) 8516461", "madina_tour@hotmail.com"),
    ("PT. BIRO PERJALANAN WISATA MAQBULAH", "KMA Nomor 79 Tahun 2020", "Gedung Ganeca Blok 7 Lantai 2, Jl. Raya Pasar Minggu, RT.007/RW.003, Kel. Duren Tiga, Kec. Pasar Minggu, Jakarta Selatan", "(021) 7982305/3018, Fax. (021) 7941286", "maqbulah@yahoo.com"),
    ("PT. MAKASSAR TORAJA TOUR & TRAVEL", "KMA Nomor 800 Tahun 2017", "Jl. Otista Raya No. 80 A, Kel. Bidara Cina, Kec. Jatinegara, Kota Administratif Jakarta Timur 13330", "(021) 85911039, 85911310, 85911311, Fax. (021) 85900460", "infomaktour@gmail.com"),
]

KOTA_KE_PROVINSI = {
    "Jakarta Selatan": "DKI Jakarta", "Jakarta Pusat": "DKI Jakarta",
    "Jakarta Timur": "DKI Jakarta", "Jakarta Barat": "DKI Jakarta", "Jakarta Utara": "DKI Jakarta",
    "Jakarta": "DKI Jakarta", "Bandung": "Jawa Barat", "Cianjur": "Jawa Barat",
    "Bogor": "Jawa Barat", "Bogor Selatan": "Jawa Barat", "Tangerang Selatan": "Banten",
    "Tangerang": "Banten", "Surabaya": "Jawa Timur", "Sidoarjo": "Jawa Timur",
    "Samarinda": "Kalimantan Timur", "Banjarmasin": "Kalimantan Selatan",
    "Banjarbaru": "Kalimantan Selatan", "Banjarmasin Timur": "Kalimantan Selatan",
    "Martapura": "Kalimantan Selatan", "Yogyakarta": "DI Yogyakarta",
    "Semarang": "Jawa Tengah", "Bandar Lampung": "Lampung", "Bekasi": "Jawa Barat",
}

PROVINSI = {"DKI Jakarta", "Jawa Barat", "Jawa Tengah", "Jawa Timur", "Banten",
            "DI Yogyakarta", "Kalimantan Selatan", "Kalimantan Timur", "Lampung",
            "Sumatera Utara", "Sumatera Selatan", "Riau", "Bali", "Sulawesi Selatan",
            "Sulawesi Tengah", "Sulawesi Utara", "Sulawesi Tenggara", "Sulawesi Barat",
            "Gorontalo", "Maluku", "Maluku Utara", "Papua", "Papua Barat", "Bengkulu",
            "Jambi", "Nanggroe Aceh Darussalam", "Kepulauan Riau"}
PROV_BESAR = {p.lower(): p for p in PROVINSI}
MAP_BESAR = {k.lower(): v for k, v in KOTA_KE_PROVINSI.items()}
JAKARTA_RE = re.compile(r"jakarta\s+(selatan|pusat|timur|barat|utara)", re.I)
KOTA_RE = re.compile(r"^(kota(?:\s+adm(?:in(?:istrasi|istratif))?)?\.?|kab(?:upaten)?\.?)\s+([A-Za-z'\.][A-Za-z'\. ]*?)(?:\s+\d{4,5})?$", re.I)

def bersih(p: str) -> str:
    p = re.sub(r"\s*\d{4,5}\s*$", "", p)  # buang kode pos nempel
    return p.strip(" .")

def parse_wilayah(alamat: str) -> tuple[str, str]:
    prov = ""
    m = re.search(r"Provinsi\s+([A-Za-z' ]+?)(?:\s*\d{4,5})?\s*$", alamat, re.I)
    if m and m.group(1).strip().lower() in PROV_BESAR:
        prov = PROV_BESAR[m.group(1).strip().lower()]
    jkt = JAKARTA_RE.search(alamat)
    if not prov and jkt:
        prov = "DKI Jakarta"
    parts = [bersih(p) for p in alamat.split(",") if bersih(p)]
    if not parts:
        return ("Jakarta " + jkt.group(1).capitalize()) if (jkt and not parts) else "", prov
    city = ""
    for p in reversed(parts):
        p0 = p
        km = KOTA_RE.match(p)
        if km:
            p0 = km.group(2).strip()
        else:
            for pref in ("Kota Adm. ", "Kota Administrasi ", "Kota Administratif ", "Kota ADM ", "Kota ", "Kab. ", "Kabupaten "):
                if p.startswith(pref):
                    p0 = p[len(pref):]
                    break
        pl = p0.lower()
        if pl in PROV_BESAR:            # bagian itu adalah nama provinsi
            if not prov:
                prov = PROV_BESAR[pl]
            continue
        if pl in MAP_BESAR:             # nama kota yang dikenal
            city = p0
            if not prov:
                prov = MAP_BESAR[pl]
            break
    if not city and len(parts) >= 2:
        city = bersih(parts[-2])
        for pref in ("Kota Adm. ", "Kota Administrasi ", "Kota Administratif ", "Kota ADM ", "Kota ", "Kab. ", "Kabupaten ", "Kec. ", "Kel. ", "Kelurahan ", "Kecamatan "):
            if city.startswith(pref):
                city = city[len(pref):]
    if not city and jkt and prov == "DKI Jakarta":
        city = "Jakarta " + jkt.group(1).capitalize()
    return city, prov

rows = []
for nama, izin, alamat, telp, email in BARIS:
    city, prov = parse_wilayah(alamat)
    desk = f"Izin PIHK resmi Kemenag RI ({izin}) · Alamat: {alamat} · Sumber data: Daftar PIHK resmi Kemenag RI (Ditjen PHU, salinan publik Scribd 693210692)"
    rows.append({"name": nama, "type": "PIHK", "city": city, "province": prov,
                 "licenseNo": izin, "phone": telp, "email": email, "website": "", "description": desk})

OUT.parent.mkdir(parents=True, exist_ok=True)
with OUT.open("w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=["name","type","city","province","licenseNo","phone","email","website","description"])
    w.writeheader(); w.writerows(rows)

print(f"CSV : {OUT} ({len(rows)} baris)")
tanpa_kota = [(r["name"], r["city"], r["province"]) for r in rows if not r["city"]]
tanpa_prov = [r["name"] for r in rows if not r["province"]]
print("Tanpa kota :", tanpa_kota or "tidak ada")
print("Tanpa prov :", tanpa_prov or "tidak ada")
