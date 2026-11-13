// qawaid-explorer/src/QawaidSwipeGame.jsx
// Permainan Kuiz Pantas Gaya Tinder / Kad Leret (Refleks & Keputusan Segera)
// "QAWAID SWIPE" (Fiqh Swipe) — Berdasarkan القواعد الفقهية وتطبيقاتها في المذاhب الأربعة

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { dataKuiz50 } from './dataKuiz';
import ThreeArcadeSwipe from './ThreeArcadeSwipe';
import { createArcadeAudio } from './arcadeAudio';

// Koleksi Isu Semasa & Padanan Kaedah Fiqh Pantas
const SWIPE_POOL = [
  // --- KAEDAH 1: الضرر يزال (Kemudaratan Dihilangkan) ---
  {
    id: 'SW-01',
    isu: 'Pembedahan plastik rekonstruktif bagi membaiki kecacatan muka akibat kemalangan jalan raya yang parah.',
    kategoriIsu: '🏥 Kesihatan & Perubatan',
    kaedahBenarAr: 'الضَّرَرُ يُزَالُ',
    kaedahBenarBm: 'Kemudaratan hendaklah dihilangkan',
    kaedahSalahAr: 'العَادَةُ مُحَكَّمَةٌ',
    kaedahSalahBm: 'Adat dijadikan sandaran hukum',
    huraian: 'Pembedahan merawat kecacatan dan kesakitan diharuskan kerana bertujuan menghilangkan mudarat kemalangan (الضرر يزال).'
  },
  {
    id: 'SW-02',
    isu: 'Pembedahan plastik kosmetik memancungkan hidung dan menyuntik filler semata-mata kecantikan tanpa sebarang keuzuran atau cacat cela.',
    kategoriIsu: '💄 Kosmetik & Kecantikan',
    kaedahBenarAr: 'الضَّرَرُ لَا يُزَالُ بِمِثْلِهِ',
    kaedahBenarBm: 'Kemudaratan tidak boleh dihilangkan dengan kemudaratan seumpamanya',
    kaedahSalahAr: 'الضَّرَرُ يُزَالُ',
    kaedahSalahBm: 'Kemudaratan hendaklah dihilangkan',
    huraian: 'Pembedahan semata-mata kosmetik tanpa rawatan adalah dilarang kerana tiada mudarat asal yang membolehkannya di bawah kaedah الضرر يزال.'
  },
  {
    id: 'SW-03',
    isu: 'Penguatkuasa menutup serta-merta kilang yang melepaskan sisa bahan kimia beracun ke dalam sungai bekalan air awam.',
    kategoriIsu: '🌱 Alam Sekitar & Awam',
    kaedahBenarAr: 'الضَّرَرُ يُزَالُ',
    kaedahBenarBm: 'Kemudaratan hendaklah dihilangkan',
    kaedahSalahAr: 'الأُمُورُ بِمَقَاصِدِهَا',
    kaedahSalahBm: 'Setiap perkara dinilai berdasarkan niat dan tujuan',
    huraian: 'Tindakan menutup punca pencemaran beracun adalah kewajipan syarak di bawah kaedah الضرر يزال dan menolak kerosakan awam.'
  },
  {
    id: 'SW-04',
    isu: 'Seorang mangsa yang tersesat di hutan terpaksa memakan daging bangkai haiwan untuk menyelamatkan nyawanya daripada kebuluran.',
    kategoriIsu: '⛺ Keadaan Darurat',
    kaedahBenarAr: 'الضَّرُورَاتُ تُبِيحُ المَحْظُورَاتِ',
    kaedahBenarBm: 'Keadaan darurat mengharuskan perkara yang dilarang',
    kaedahSalahAr: 'اليَقِينُ لَا يَزُولُ بِالشَّكِّ',
    kaedahSalahBm: 'Keyakinan tidak hilang dengan keraguan',
    huraian: 'Kelonggaran ini merupakan cabang kaedah darurat demi menjaga nyawa (hifz al-nafs).'
  },
  {
    id: 'SW-05',
    isu: 'Perintah kuarantin mandatori di rumah atau hospital ke atas pesakit yang dijangkiti wabak virus berbahaya.',
    kategoriIsu: '🦠 Kesihatan Awam',
    kaedahBenarAr: 'يُتَحَمَّلُ الضَّرَرُ الخَاصُّ لِدَفْعِ ضَرَرٍ عَامٍّ',
    kaedahBenarBm: 'Mudarat khusus ditanggung demi menolak mudarat umum yang lebih besar',
    kaedahSalahAr: 'العَادَةُ مُحَكَّمَةٌ',
    kaedahSalahBm: 'Adat dijadikan sandaran hukum',
    huraian: 'Pengehadan kebebasan pesakit (mudarat khusus) ditanggung demi menyelamatkan masyarakat daripada wabak (mudarat umum).'
  },
  {
    id: 'SW-06',
    isu: 'Peniaga menaikkan harga beras dan minyak masak 300% semasa musim banjir kerana mengambil kesempatan atas kesempitan mangsa.',
    kategoriIsu: '🛒 Muamalat & Pasaran',
    kaedahBenarAr: 'لَا ضَرَرَ وَلَا ضِرَارَ',
    kaedahBenarBm: 'Tidak boleh memudaratkan dan tidak boleh membalas mudarat',
    kaedahSalahAr: 'المَشَقَّةُ تَجْلِبُ التَّيْسِيرَ',
    kaedahSalahBm: 'Kesukaran membawa kepada kemudahan',
    huraian: 'Tindakan memeras dan menzalimi mangsa dilarang keras kerana mendatangkan kemudaratan zalim kepada pengguna.'
  },

  // --- KAEDAH 2: الأمور بمقاصدها (Niat, Akad & Tujuan) ---
  {
    id: 'SW-07',
    isu: 'Seorang majikan menyerahkan wang saguhati RM5,000 kepada pegawai perolehan kerajaan sebelum keputusan tender rasmi diumumkan.',
    kategoriIsu: '⚖️ Integriti & Kontrak',
    kaedahBenarAr: 'الأُمُورُ بِمَقَاصِدِهَا',
    kaedahBenarBm: 'Setiap perkara dinilai berdasarkan niat dan tujuan',
    kaedahSalahAr: 'اليَقِينُ لَا يَزُولُ بِالشَّكِّ',
    kaedahSalahBm: 'Keyakinan tidak hilang dengan keraguan',
    huraian: 'Walaupun dinamakan "hadiah" atau "saguhati", hakikat tujuannya ialah suapan rasuah yang dinilai mengikut maksud sebenar.'
  },
  {
    id: 'SW-08',
    isu: 'Seseorang berkata: "Saya hibahkan motosikal ini kepada awak dengan syarat awak bayar RM4,000 kepada saya secara ansuran."',
    kategoriIsu: '🤝 Akad & Transaksi',
    kaedahBenarAr: 'العِبْرَةُ فِي العُقُودِ لِلمَقَاصِدِ وَالمَعَانِي لَا لِلأَلْفَاظِ وَالمَبَانِي',
    kaedahBenarBm: 'Pertimbangan dalam akad diberikan kepada maksud dan makna, bukan lafaz zahir semata-mata',
    kaedahSalahAr: 'المَشَقَّةُ تَجْلِبُ التَّيْسِيرَ',
    kaedahSalahBm: 'Kesukaran membawa kepada kemudahan',
    huraian: 'Walaupun menggunakan lafaz hibah (hadiah), kewujudan balasan bayaran menjadikannya akad jual beli (bai\').'
  },
  {
    id: 'SW-09',
    isu: 'Pengguna memindahkan wang RM100 melalui DuitNow tanpa catatan transaksi: antara hadiah, bayaran hutang atau sedekah.',
    kategoriIsu: '📱 Kewangan Digital',
    kaedahBenarAr: 'الأَعْمَالُ بِالنِّيَّاتِ',
    kaedahBenarBm: 'Amalan dinilai berdasarkan niat',
    kaedahSalahAr: 'العَادَةُ مُحَكَّمَةٌ',
    kaedahSalahBm: 'Adat dijadikan sandaran hukum',
    huraian: 'Niat pengirim menentukan sama ada pemindahan wang itu melunaskan hutang atau merupakan hibah percuma.'
  },
  {
    id: 'SW-10',
    isu: 'Seseorang terjun ke sungai untuk menyejukkan badan pada hari panas terik tanpa sebarang lintasan niat mengangkat hadas wuduk.',
    kategoriIsu: '🕌 Ibadah & Taharah',
    kaedahBenarAr: 'لَا ثَوَابَ إِلَّا بِنِيَّةٍ',
    kaedahBenarBm: 'Tiada ganjaran pahala dan sah ibadah melainkan dengan niat',
    kaedahSalahAr: 'الضَّرَرُ يُزَالُ',
    kaedahSalahBm: 'Kemudaratan hendaklah dihilangkan',
    huraian: 'Mandian adat tanpa niat ibadah tidak mengangkat hadas menurut jumhur fuqaha kerana niat membezakan adat daripada ibadah.'
  },
  {
    id: 'SW-11',
    isu: 'Peminjam menandatangani akad jual beli rumah dengan janji membeli semula pada harga lebih tinggi semata-mata untuk mengelak riba pinjaman.',
    kategoriIsu: '💳 Perbankan Islam',
    kaedahBenarAr: 'الأُمُورُ بِمَقَاصِدِهَا',
    kaedahBenarBm: 'Setiap perkara dinilai berdasarkan niat dan tujuan',
    kaedahSalahAr: 'اليَقِينُ لَا يَزُولُ بِالشَّكِّ',
    kaedahSalahBm: 'Keyakinan tidak hilang dengan keraguan',
    huraian: 'Hilah (helah) yang bertujuan menghalalkan riba dinilai haram mengikut maksud dan niat hakiki transaksi (bai\' al-\'inah).'
  },

  // --- KAEDAH 3: اليقين لا يزول بالشك (Keyakinan & Kepastian) ---
  {
    id: 'SW-12',
    isu: 'Seorang jemaah yakin telah berwuduk di rumah, tetapi sebaik tiba di masjid timbul rasa ragu-ragu sama ada wuduknya sudah batal atau belum.',
    kategoriIsu: '🕌 Ibadah & Solat',
    kaedahBenarAr: 'اليَقِينُ لَا يَزُولُ بِالشَّكِّ',
    kaedahBenarBm: 'Keyakinan tidak hilang dengan keraguan',
    kaedahSalahAr: 'المَشَقَّةُ تَجْلِبُ التَّيْسِيرَ',
    kaedahSalahBm: 'Kesukaran membawa kepada kemudahan',
    huraian: 'Status kesucian wuduk yang yakin tidak terbatal semata-mata dengan syak atau waswas yang melintas.'
  },
  {
    id: 'SW-13',
    isu: 'Peminjam mendakwa dia rasa sudah membayar hutang RM500 kepada pemiutang, tetapi pemiutang menafikan dan tiada resit bayaran.',
    kategoriIsu: '💰 Hutang & Muamalat',
    kaedahBenarAr: 'الأَصْلُ بَقَاءُ مَا كَانَ عَلَى مَا كَانَ',
    kaedahBenarBm: 'Asal sesuatu perkara ialah kekal mengikut keadaan asalnya',
    kaedahSalahAr: 'العَادَةُ مُحَكَّمَةٌ',
    kaedahSalahBm: 'Adat dijadikan sandaran hukum',
    huraian: 'Asal tanggungan hutang kekal wujud sehingga ada bukti bayaran yang pasti, bukan sekadar syak atau sangkaan.'
  },
  {
    id: 'SW-14',
    isu: 'Seorang tertuduh di mahkamah jenayah diisytiharkan tidak bersalah kerana pihak pendakwaan gagal membawa saksi dan bukti kukuh.',
    kategoriIsu: '⚖️ Kehakiman & Undang-Undang',
    kaedahBenarAr: 'الأَصْلُ بَرَاءَةُ الذِّمَّةِ',
    kaedahBenarBm: 'Asal seseorang itu bebas daripada sebarang tanggungan dan kesalahan',
    kaedahSalahAr: 'الضَّرَرُ يُزَالُ',
    kaedahSalahBm: 'Kemudaratan hendaklah dihilangkan',
    huraian: 'Prinsip asasi kehakiman menetapkan seseorang tidak boleh dihukum atas sangkaan semata-mata tanpa bukti sabitan.'
  },
  {
    id: 'SW-15',
    isu: 'Pakaian terkena percikan cecair jernih di jalan raya berturap: tiada bau, warna atau tanda najis yang kelihatan.',
    kategoriIsu: '🧼 Kebersihan & Taharah',
    kaedahBenarAr: 'الأَصْلُ فِي الأَشْيَاءِ الطَّهَارَةُ',
    kaedahBenarBm: 'Asal sesuatu benda ialah suci sehinggalah terbukti najis',
    kaedahSalahAr: 'الأُمُورُ بِمَقَاصِدِهَا',
    kaedahSalahBm: 'Setiap perkara dinilai berdasarkan niat dan tujuan',
    huraian: 'Pakaian tersebut dihukum kekal suci kerana asal cecair tanpa bukti najis adalah suci.'
  },
  {
    id: 'SW-16',
    isu: 'Seorang makmum ragu-ragu sama ada dia sedang berada pada rakaat kedua atau ketiga dalam solat Asar.',
    kategoriIsu: '🕌 Solat & Waswas',
    kaedahBenarAr: 'اليَقِينُ لَا يَزُولُ بِالشَّكِّ',
    kaedahBenarBm: 'Keyakinan tidak hilang dengan keraguan',
    kaedahSalahAr: 'العَادَةُ مُحَكَّمَةٌ',
    kaedahSalahBm: 'Adat dijadikan sandaran hukum',
    huraian: 'Wajib membina rakaat atas bilangan yang yakin (rakaat minimum iaitu rakaat ke-2) dan menambah sujud sahwi.'
  },

  // --- KAEDAH 4: المشقة تجلب التيسير (Kesukaran & Rukhsah) ---
  {
    id: 'SW-17',
    isu: 'Pesakit patah tangan yang dibalut simen (jubairah) diberikan kelonggaran menyapu air di atas balutan dan bertayamum.',
    kategoriIsu: '🏥 Rawatan Perubatan',
    kaedahBenarAr: 'المَشَقَّةُ تَجْلِبُ التَّيْسِيرَ',
    kaedahBenarBm: 'Kesukaran membawa kepada kemudahan',
    kaedahSalahAr: 'العَادَةُ مُحَكَّمَةٌ',
    kaedahSalahBm: 'Adat dijadikan sandaran hukum',
    huraian: 'Balutan simen yang tidak boleh terkena air diberi rukhsah keringanan demi mengelakkan kesukaran dan kemudaratan luka.'
  },
  {
    id: 'SW-18',
    isu: 'Kelonggaran menunaikan solat secara jamak dan qasar bagi musafir yang menaiki penerbangan antarabangsa sejauh 8,000 km.',
    kategoriIsu: '✈️ Musafir & Perjalanan',
    kaedahBenarAr: 'المَشَقَّةُ تَجْلِبُ التَّيْسِيرَ',
    kaedahBenarBm: 'Kesukaran membawa kepada kemudahan',
    kaedahSalahAr: 'اليَقِينُ لَا يَزُولُ بِالشَّكِّ',
    kaedahSalahBm: 'Keyakinan tidak hilang dengan keraguan',
    huraian: 'Perjalanan melebihi dua marhalah merupakan sebab syar\'i yang mendatangkan kemudahan rukhsah jamak dan qasar.'
  },
  {
    id: 'SW-19',
    isu: 'Wanita hamil yang disahkan doktor berisiko mengalami komplikasi serius jika berpuasa dibenarkan berbuka dan menggantikannya kelak.',
    kategoriIsu: '🤰 Kesihatan Ibu & Anak',
    kaedahBenarAr: 'إِذَا ضَاقَ الأَمْرُ اتَّسَعَ',
    kaedahBenarBm: 'Apabila sesuatu urusan menjadi sempit, ia menjadi lapang',
    kaedahSalahAr: 'الأُمُورُ بِمَقَاصِدِهَا',
    kaedahSalahBm: 'Setiap perkara dinilai berdasarkan niat dan tujuan',
    huraian: 'Kesempitan dan risiko kesihatan membuka ruang kelonggaran syarak untuk tidak berpuasa pada hari tersebut.'
  },
  {
    id: 'SW-20',
    isu: 'Doktor pakar bedah terpaksa menjamakkan solat Zohor ke dalam waktu Asar kerana sedang melakukan pembedahan jantung terbuka yang kritikal.',
    kategoriIsu: '🩺 Pembedahan Kecemasan',
    kaedahBenarAr: 'المَشَقَّةُ تَجْلِبُ التَّيْسِيرَ',
    kaedahBenarBm: 'Kesukaran membawa kepada kemudahan',
    kaedahSalahAr: 'العَادَةُ مُحَكَّمَةٌ',
    kaedahSalahBm: 'Adat dijadikan sandaran hukum',
    huraian: 'Keperluan menyelamatkan nyawa pesakit di meja bedah merupakan masyaqqah syadidah yang mengharuskan jamak.'
  },
  {
    id: 'SW-21',
    isu: 'Kelonggaran solat secara duduk atau berbaring bagi warga emas yang uzur dan tidak mampu berdiri tegak.',
    kategoriIsu: '🧓 Keuzuran Fizikal',
    kaedahBenarAr: 'المَيْسُورُ لَا يَسْقُطُ بِالمَعْسُورِ',
    kaedahBenarBm: 'Perkara yang mudah dilakukan tidak gugur disebabkan perkara yang sukar',
    kaedahSalahAr: 'الضَّرَرُ يُزَالُ',
    kaedahSalahBm: 'Kemudaratan hendaklah dihilangkan',
    huraian: 'Ketiadaan upaya untuk berdiri tidak menggugurkan kewajipan solat sepenuhnya; dia wajib solat mengikut kemampuannya.'
  },

  // --- KAEDAH 5: العادة محكمة (Adat, Uruf & Piawaian) ---
  {
    id: 'SW-22',
    isu: 'Penetapan tempoh jaminan (warranty) selama 1 tahun bagi barangan komputer mengikut kelaziman pasaran elektronik.',
    kategoriIsu: '💻 Teknologi & Pasaran',
    kaedahBenarAr: 'العَادَةُ مُحَكَّمَةٌ',
    kaedahBenarBm: 'Adat dijadikan sandaran hukum',
    kaedahSalahAr: 'اليَقِينُ لَا يَزُولُ بِالشَّكِّ',
    kaedahSalahBm: 'Keyakinan tidak hilang dengan keraguan',
    huraian: 'Uruf perdagangan dan piawaian industri menjadi penentu hak jaminan pembeli walaupun tidak disebut secara terperinci.'
  },
  {
    id: 'SW-23',
    isu: 'Pengesahan penerimaan bungkusan barangan secara digital melalui nombor OTP atau imbasan kod QR dalam perkhidmatan kurier.',
    kategoriIsu: '📦 Kurier & E-Dagang',
    kaedahBenarAr: 'المَعْرُوفُ عُرْفًا كَالمَشْرُوطِ شَرْطًا',
    kaedahBenarBm: 'Perkara yang makruf pada uruf seperti perkara yang disyaratkan secara bertulis',
    kaedahSalahAr: 'المَشَقَّةُ تَجْلِبُ التَّيْسِيرَ',
    kaedahSalahBm: 'Kesukaran membawa kepada kemudahan',
    huraian: 'Pengesahan OTP diiktiraf sebagai qabadh hukmi (penerimaan rasmi) mengikut uruf transaksi moden.'
  },
  {
    id: 'SW-24',
    isu: 'Kadar mas kahwin atau hantaran yang tidak disebut dalam akad perkahwinan ditetapkan mengikut kadar mas kahwin keluarga pengantin perempuan.',
    kategoriIsu: '💍 Perkahwinan & Munakahat',
    kaedahBenarAr: 'العَادَةُ مُحَكَّمَةٌ',
    kaedahBenarBm: 'Adat dijadikan sandaran hukum',
    kaedahSalahAr: 'الضَّرَرُ يُزَالُ',
    kaedahSalahBm: 'Kemudaratan hendaklah dihilangkan',
    huraian: 'Mahar mithil (kadar mahar seumpamanya) ditentukan berpandukan uruf dan kelaziman keluarga pengantin.'
  },
  {
    id: 'SW-25',
    isu: 'Pembeli memulangkan pakaian yang dibeli kerana terdapat kecacatan jahitan yang dianggap aib menurut pandangan peniaga tekstil.',
    kategoriIsu: '👗 Khiyar Aib & Jual Beli',
    kaedahBenarAr: 'العِبْرَةُ لِلعُرْفِ الشَّائِعِ لَا النَّادِرِ',
    kaedahBenarBm: 'Pertimbangan diberikan kepada uruf yang meluas, bukan perkara yang janggal',
    kaedahSalahAr: 'الأُمُورُ بِمَقَاصِدِهَا',
    kaedahSalahBm: 'Setiap perkara dinilai berdasarkan niat dan tujuan',
    huraian: 'Penentuan sesuatu kecacatan sebagai "aib yang membolehkan pemulangan" ditentukan oleh uruf ahli perniagaan bidang tersebut.'
  },
  {
    id: 'SW-26',
    isu: 'Kefahaman perkataan "daging" dalam nazar seorang Muslim di Malaysia secara uruf tidak merangkumi ikan dan makanan laut.',
    kategoriIsu: '🗣️ Bahasa & Uruf Tempatan',
    kaedahBenarAr: 'إِنَّمَا تُعْتَبَرُ العَادَةُ إِذَا اطَّرَدَتْ أَوْ غَلَبَتْ',
    kaedahBenarBm: 'Adat hanya diambil kira apabila ia berterusan atau diamalkan oleh majoriti',
    kaedahSalahAr: 'المَشَقَّةُ تَجْلِبُ التَّيْسِيرَ',
    kaedahSalahBm: 'Kesukaran membawa kepada kemudahan',
    huraian: 'Uruf pertuturan masyarakat setempat menjadi penafsir kepada maksud lafaz nazar dan sumpah.'
  },
];

// Helper penjana soalan swipe secara rawak
function generateSwipeDeck() {
  // Gabungkan SWIPE_POOL dengan soalan daripada dataKuiz50
  const combined = [...SWIPE_POOL];
  
  dataKuiz50.slice(0, 30).forEach((item, idx) => {
    // Cari kaedah yang berbeza sebagai pilihan salah
    const other = dataKuiz50[(idx + 13) % dataKuiz50.length];
    combined.push({
      id: `KZ-${item.id}`,
      isu: item.isu_kontemporari,
      kategoriIsu: item.kategori,
      kaedahBenarAr: item.kaedah_ranting_ar,
      kaedahBenarBm: item.kaedah_ranting_bm,
      kaedahSalahAr: other.kaedah_ranting_ar,
      kaedahSalahBm: other.kaedah_ranting_bm,
      huraian: item.huraian_jawapan,
    });
  });

  // Shuffle pool
  const shuffled = [...combined].sort(() => 0.5 - Math.random());

  // Untuk setiap kad, tentukan secara rawak sama ada dipadankan dengan KAEDAH BENAR (Betul = Kanan)
  // atau KAEDAH SALAH (Salah = Kiri), nisbah ~50%
  return shuffled.map((item, index) => {
    const isMatching = Math.random() < 0.5;
    return {
      deckId: `${item.id}-${index}-${Date.now()}`,
      isu: item.isu,
      kategoriIsu: item.kategoriIsu,
      targetKaedahAr: isMatching ? item.kaedahBenarAr : item.kaedahSalahAr,
      targetKaedahBm: isMatching ? item.kaedahBenarBm : item.kaedahSalahBm,
      isRelevant: isMatching, // true = Leret Kanan (Sesuai), false = Leret Kiri (Tidak Relevan)
      kaedahAsalAr: item.kaedahBenarAr,
      kaedahAsalBm: item.kaedahBenarBm,
      huraian: item.huraian,
    };
  });
}

export default function QawaidSwipeGame({ onBackToHub }) {
  // Game States: 'LOBBY' | 'PLAYING' | 'RESULT'
  const [gameState, setGameState] = useState(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search).get('swipeState');
      if (s) return s.toUpperCase();
    }
    return 'LOBBY';
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  // High score dari localStorage
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('qawaid_swipe_highscore') || 0);
    } catch {
      return 0;
    }
  });

  // Gameplay State
  const [deck, setDeck] = useState(() => generateSwipeDeck());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [history, setHistory] = useState([]);

  // Floating Popups (+100, COMBO x3, dsb)
  const [popups, setPopups] = useState([]);

  // Dragging & Swipe Physics
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flyDirection, setFlyDirection] = useState(null); // 'LEFT' | 'RIGHT' | null
  const [flashFeedback, setFlashFeedback] = useState(null); // 'CORRECT' | 'WRONG' | null

  const dragStartRef = useRef({ x: 0, y: 0 });
  const swipe3DControlRef = useRef(null);
  const soundRef = useRef(null);
  const timerRef = useRef(null);

  if (!soundRef.current) {
    soundRef.current = createArcadeAudio();
  }

  // Floating Popup Spawner
  const spawnPopup = useCallback((text, type = 'gold') => {
    const id = Date.now() + Math.random();
    setPopups((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 1100);
  }, []);

  // Mulakan Permainan
  const startGame = useCallback(() => {
    const newDeck = generateSwipeDeck();
    setDeck(newDeck);
    setCurrentIndex(0);
    setTimeLeft(60);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setWrongCount(0);
    setIsNewRecord(false);
    setHistory([]);
    setDragOffset({ x: 0, y: 0 });
    setFlyDirection(null);
    setFlashFeedback(null);
    setGameState('PLAYING');

    if (soundEnabled) soundRef.current?.playGoldenOverdrive?.();
  }, [soundEnabled]);

  // Timer 60 Saat
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Tamat Permainan
  const endGame = useCallback(() => {
    setGameState('RESULT');
    if (soundEnabled) soundRef.current?.playFinish();

    setScore((finalScore) => {
      if (finalScore > highScore) {
        setHighScore(finalScore);
        setIsNewRecord(true);
        try {
          localStorage.setItem('qawaid_swipe_highscore', String(finalScore));
        } catch {}
      }
      return finalScore;
    });
  }, [highScore, soundEnabled]);

  const currentCard = deck[currentIndex];
  const nextCard = deck[currentIndex + 1];

  // Mekanik Memproses Keputusan Leretan (LEFT vs RIGHT)
  const handleDecision = useCallback(
    (direction) => {
      if (gameState !== 'PLAYING' || !currentCard || flyDirection) return;

      const playerChoseRelevant = direction === 'RIGHT';
      const isCorrect = playerChoseRelevant === currentCard.isRelevant;

      // Trigger animasi 3D parabolic fling (betul) atau 1.5s 180-deg flip (salah)
      setFlyDirection(direction);
      swipe3DControlRef.current?.triggerDecision?.(direction, isCorrect);
      soundRef.current?.vibrateTap?.();
      if (soundEnabled) soundRef.current?.playSwipe();

      // Rekod sejarah
      setHistory((prev) => [
        ...prev,
        {
          ...currentCard,
          playerChoseRelevant,
          isCorrect,
        },
      ]);

      if (isCorrect) {
        const newCombo = combo + 1;
        const multiplier = Math.min(newCombo, 5);
        const pointsEarned = 100 * multiplier;

        setCombo(newCombo);
        setMaxCombo((m) => Math.max(m, newCombo));
        setScore((s) => s + pointsEarned);
        setCorrectCount((c) => c + 1);
        setFlashFeedback('CORRECT');

        soundRef.current?.vibrateSuccess?.();
        if (soundEnabled) {
          if (newCombo % 5 === 0) {
            soundRef.current?.playGoldenOverdrive?.();
          } else {
            soundRef.current?.playCorrect(newCombo);
          }
        }

        if (newCombo >= 2) {
          spawnPopup(`🔥 COMBO x${multiplier}! +${pointsEarned}`, 'gold');
        } else {
          spawnPopup(`+${pointsEarned}`, 'emerald');
        }
      } else {
        // Salah jawapan: Reset combo & pusing kad 3D 180° selama 1.5s
        setCombo(0);
        setWrongCount((w) => w + 1);
        setFlashFeedback('WRONG');
        soundRef.current?.vibrateError?.();
        if (soundEnabled) soundRef.current?.playWrong();
        spawnPopup('❌ Semak Kaedah Sebenar di Belakang Kad!', 'crimson');
      }

      setTimeout(() => {
        setFlashFeedback(null);
      }, isCorrect ? 320 : 1200);

      // Tahan kad selama 1.52s jika salah supaya pemain sempat baca belakang kad 3D
      const advanceDelay = isCorrect ? 310 : 1520;
      setTimeout(() => {
        setFlyDirection(null);
        setDragOffset({ x: 0, y: 0 });
        setCurrentIndex((i) => {
          if (i + 1 >= deck.length) {
            setDeck((old) => [...old, ...generateSwipeDeck()]);
          }
          return i + 1;
        });
      }, advanceDelay);
    },
    [gameState, currentCard, flyDirection, combo, soundEnabled, deck.length, spawnPopup]
  );

  // Keyboard navigation: ⬅️ (Kiri / Salah) & ➡️ (Kanan / Betul)
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleDecision('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleDecision('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleDecision]);

  // Touch / Pointer Drag Handler
  const handlePointerDown = (e) => {
    if (gameState !== 'PLAYING' || flyDirection) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || gameState !== 'PLAYING' || flyDirection) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {}

    const threshold = 85;
    if (dragOffset.x > threshold) {
      handleDecision('RIGHT');
    } else if (dragOffset.x < -threshold) {
      handleDecision('LEFT');
    } else {
      // Spring back to center
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Pengiraan Transform & Stamp Opacity semasa meleret
  const rotation = dragOffset.x * 0.08;
  const stampRightOpacity = Math.min(1, Math.max(0, (dragOffset.x - 20) / 75));
  const stampLeftOpacity = Math.min(1, Math.max(0, (-dragOffset.x - 20) / 75));

  // Penilaian Prestasi Pemain
  const performanceGrade = useMemo(() => {
    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    if (score >= 3500) {
      return {
        title: '👑 Mujtahid Kilat Ulung',
        desc: 'Refleks qawaid luar biasa! Anda mampu memadankan prinsip fiqh sepantas kilat dengan ketepatan tinggi.',
        badge: 'SUPERIOR REFLEX',
        color: '#fbbf24',
      };
    }
    if (score >= 2000) {
      return {
        title: '⚡ Faqih Pantas & Tangkas',
        desc: 'Keputusan segera anda sangat mantap! Teruskan momentum untuk mencipta rekod baharu.',
        badge: 'EXCELLENT',
        color: '#34d399',
      };
    }
    return {
      title: '🌱 Penuntut Hikmah Qawaid',
      desc: 'Permulaan yang baik! Teruskan latihan leretan untuk membina refleks spontan yang lebih jitu.',
      badge: 'TRAINEE',
      color: '#a78bfa',
    };
  }, [score, correctCount, wrongCount]);

  return (
    <div className="swipe-game-root">
      {/* Floating Popups */}
      <div className="swipe-popups-layer">
        {popups.map((p) => (
          <div key={p.id} className={`swipe-popup is-${p.type}`}>
            {p.text}
          </div>
        ))}
      </div>

      {/* Screen Flash Feedback Overlay */}
      {flashFeedback && (
        <div className={`swipe-flash-vignette is-${flashFeedback.toLowerCase()}`} />
      )}

      {/* ====================================================================
          STATE 1: LOBBY (PENERANGAN CARA BERMAIN & BUTANG MULA)
         ==================================================================== */}
      {gameState === 'LOBBY' && (
        <div className="swipe-lobby-card glass-card">
          <div className="swipe-lobby-badge">
            <span>🔥 RAPID-FIRE DECISION • 60 SAAT</span>
          </div>

          <h2 className="swipe-lobby-title">Qawaid Swipe</h2>
          <p className="swipe-lobby-subtitle">
            Kuiz Pantas Gaya Leret Kad (Tinder Style) Berdasarkan Kitab{' '}
            <em>القواعد الفقهية وتطبيقاتها في المذاهب الأربعة</em>
          </p>

          <div className="swipe-rules-grid">
            <div className="swipe-rule-box">
              <div className="swipe-rule-icon">📌</div>
              <div>
                <strong>Kaedah Di Atas Skrin</strong>
                <p>Setiap pusingan memaparkan satu Kaedah Fiqh rujukan di bahagian atas.</p>
              </div>
            </div>

            <div className="swipe-rule-box">
              <div className="swipe-rule-icon">🃏</div>
              <div>
                <strong>Kad Isu Semasa di Tengah</strong>
                <p>Baca isu semasa atau kes kontemporari yang dipaparkan pada kad.</p>
              </div>
            </div>

            <div className="swipe-rule-box">
              <div className="swipe-rule-icon">➡️</div>
              <div>
                <strong>Leret Kanan: Sesuai / Relevan</strong>
                <p>Jika isu semasa menepati dan terangkum di bawah kaedah di atas.</p>
              </div>
            </div>

            <div className="swipe-rule-box">
              <div className="swipe-rule-icon">⬅️</div>
              <div>
                <strong>Leret Kiri: Tidak Relevan</strong>
                <p>Jika isu semasa langsung tidak sesuai atau berada di bawah kaedah lain.</p>
              </div>
            </div>
          </div>

          <div className="swipe-mechanics-banner">
            <div className="swipe-mechanic-item">
              <span className="swipe-mech-num">60s</span>
              <span>Masa Terhad</span>
            </div>
            <div className="swipe-mechanic-item">
              <span className="swipe-mech-num">x5</span>
              <span>Combo Multiplier</span>
            </div>
            <div className="swipe-mechanic-item">
              <span className="swipe-mech-num">⌨️ ⬅️ ➡️</span>
              <span>Sokongan Butang / Arrow Keys</span>
            </div>
          </div>

          <div className="swipe-lobby-actions">
            <button
              type="button"
              onClick={startGame}
              className="lg-btn-action lg-btn-glow swipe-start-btn"
            >
              <span>🔥 Mula Qawaid Swipe Sekarang!</span>
            </button>

            <div className="swipe-lobby-meta">
              <span className="lg-node-chip">
                🏆 REKOD TERTINGGI: {highScore.toLocaleString()} MATA
              </span>
              <button
                type="button"
                onClick={() => setSoundEnabled((s) => !s)}
                className="lg-btn-glass"
              >
                <span>{soundEnabled ? '🔊 Bunyi: Aktif' : '🔇 Bunyi: Senyap'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          STATE 2: PLAYING (ARENA LERETAN RAPID-FIRE)
         ==================================================================== */}
      {gameState === 'PLAYING' && currentCard && (
        <div className="swipe-arena-container">
          {/* Top HUD: Timer, Score, Combo, Mute */}
          <div className="swipe-hud-bar glass-control">
            <div className="swipe-hud-left">
              <div
                className={`swipe-timer-badge ${
                  timeLeft <= 10 ? 'is-danger-pulse' : ''
                }`}
              >
                <span className="swipe-timer-icon">⏱️</span>
                <span className="swipe-timer-text">{timeLeft}s</span>
              </div>

              {combo >= 2 && (
                <div
                  className={`swipe-combo-badge ${
                    combo >= 5 ? 'is-max-combo' : ''
                  }`}
                >
                  <span>🔥 COMBO x{Math.min(combo, 5)}</span>
                </div>
              )}
            </div>

            <div className="swipe-hud-right">
              <div className="swipe-score-display">
                <span className="swipe-score-label">MATA</span>
                <span className="swipe-score-val">{score.toLocaleString()}</span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled((s) => !s)}
                className="lg-btn-glass swipe-hud-sound"
                title={soundEnabled ? 'Matikan Bunyi' : 'Hidupkan Bunyi'}
              >
                <span>{soundEnabled ? '🔊' : '🔇'}</span>
              </button>
            </div>
          </div>

          {/* Target Kaedah Fiqh Capsule (Di Atas Skrin — Berdenyut Apabila Kaedah Sasaran Bertukar) */}
          <div
            key={currentCard.targetKaedahAr}
            className="swipe-target-capsule glass-card sprint-slide-in"
            style={{
              boxShadow: '0 0 24px rgba(251, 191, 36, 0.22)',
              borderColor: 'rgba(251, 191, 36, 0.45)',
            }}
          >
            <div className="swipe-target-badge">
              <span>KAEDAH FIQH SASARAN (TENTUKAN KESESUAIAN)</span>
            </div>
            <div
              className="swipe-target-ar"
              dir="rtl"
              style={{ fontFamily: '"Noto Naskh Arabic", serif' }}
            >
              {currentCard.targetKaedahAr}
            </div>
            <div className="swipe-target-bm">
              &ldquo;{currentCard.targetKaedahBm}&rdquo;
            </div>
          </div>

          {/* 3D WebGL Sanctuary, Mizan Scale, Portals & Draggable Relic Card */}
          <div
            className="swipe-3d-stage"
            style={{
              position: 'relative',
              width: '100%',
              height: 'clamp(320px, 48vh, 435px)',
              borderRadius: '20px',
              overflow: 'hidden',
              marginBottom: '12px',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
            }}
          >
            <ThreeArcadeSwipe
              card={currentCard}
              cardKey={currentIndex}
              swipeControlRef={swipe3DControlRef}
              isLocked={Boolean(flyDirection)}
              onSwipeGesture={handleDecision}
            />
          </div>

          {/* Quick Decision Action Buttons & Keyboard Hints */}
          <div className="swipe-action-controls">
            <button
              type="button"
              onClick={() => handleDecision('LEFT')}
              disabled={Boolean(flyDirection)}
              className="swipe-btn-decision is-left"
              title="Leret Kiri atau tekan kekunci ⬅️ / A"
            >
              <span className="swipe-btn-icon">❌</span>
              <div className="swipe-btn-labels">
                <span className="swipe-btn-main">TIDAK RELEVAN</span>
                <span className="swipe-btn-shortcut">⬅️ Leret Kiri (Kekunci A)</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDecision('RIGHT')}
              disabled={Boolean(flyDirection)}
              className="swipe-btn-decision is-right"
              title="Leret Kanan atau tekan kekunci ➡️ / D"
            >
              <div className="swipe-btn-labels" style={{ textAlign: 'right' }}>
                <span className="swipe-btn-main">SESUAI / TEPAT</span>
                <span className="swipe-btn-shortcut">Leret Kanan (Kekunci D) ➡️</span>
              </div>
              <span className="swipe-btn-icon">✅</span>
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          STATE 3: RESULT (RINGKASAN SKOR, COMBO & SEMAKAN JAWAPAN)
         ==================================================================== */}
      {gameState === 'RESULT' && (
        <div className="swipe-result-card glass-card">
          {isNewRecord && (
            <div className="swipe-new-record-pill">
              <span>🎉 REKOD TERTINGGI BAHARU DICIPTA!</span>
            </div>
          )}

          <div
            className="swipe-result-badge"
            style={{ borderColor: performanceGrade.color }}
          >
            <span style={{ color: performanceGrade.color }}>
              {performanceGrade.badge}
            </span>
          </div>

          <h2 className="swipe-result-title">{performanceGrade.title}</h2>
          <p className="swipe-result-desc">{performanceGrade.desc}</p>

          {/* Stats Metrics Grid */}
          <div className="swipe-stats-grid">
            <div className="swipe-stat-box">
              <span className="swipe-stat-val" style={{ color: '#60a5fa' }}>
                {score.toLocaleString()}
              </span>
              <span className="swipe-stat-label">Jumlah Mata</span>
            </div>

            <div className="swipe-stat-box">
              <span className="swipe-stat-val" style={{ color: '#fbbf24' }}>
                x{maxCombo}
              </span>
              <span className="swipe-stat-label">Combo Tertinggi</span>
            </div>

            <div className="swipe-stat-box">
              <span className="swipe-stat-val" style={{ color: '#34d399' }}>
                {correctCount}
              </span>
              <span className="swipe-stat-label">Jawapan Tepat</span>
            </div>

            <div className="swipe-stat-box">
              <span className="swipe-stat-val" style={{ color: '#f87171' }}>
                {wrongCount}
              </span>
              <span className="swipe-stat-label">Kurang Tepat</span>
            </div>
          </div>

          {/* Semakan Ringkas Kad yang Telah Dileret */}
          {history.length > 0 && (
            <div className="swipe-review-section">
              <h3 className="swipe-review-heading">
                Semakan Keputusan Kad ({history.length} Kad Dinilai)
              </h3>
              <div className="swipe-review-list">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className={`swipe-review-item ${
                      h.isCorrect ? 'is-correct-border' : 'is-wrong-border'
                    }`}
                  >
                    <div className="swipe-review-top">
                      <span
                        className={`swipe-review-tag ${
                          h.isCorrect ? 'is-tag-green' : 'is-tag-red'
                        }`}
                      >
                        {h.isCorrect ? '✅ TEPAT' : '❌ KURANG TEPAT'}
                      </span>
                      <span className="swipe-review-choice">
                        Anda Leret:{' '}
                        <strong>
                          {h.playerChoseRelevant ? 'Kanan (Sesuai)' : 'Kiri (Tidak Relevan)'}
                        </strong>{' '}
                        • Jawapan Sebenar:{' '}
                        <strong>
                          {h.isRelevant ? 'Sesuai' : 'Tidak Relevan'}
                        </strong>
                      </span>
                    </div>

                    <p className="swipe-review-issue">&ldquo;{h.isu}&rdquo;</p>

                    <div className="swipe-review-kaedah-box">
                      <div className="swipe-rev-sub">
                        Kaedah Semasa Kad: <strong>{h.targetKaedahAr}</strong> (
                        {h.targetKaedahBm})
                      </div>
                      {!h.isRelevant && (
                        <div className="swipe-rev-asal">
                          Kaedah Sebenar Isu Ini:{' '}
                          <strong style={{ color: '#38bdf8' }}>
                            {h.kaedahAsalAr}
                          </strong>{' '}
                          ({h.kaedahAsalBm})
                        </div>
                      )}
                      <p className="swipe-rev-huraian">{h.huraian}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="swipe-result-actions">
            <button
              type="button"
              onClick={startGame}
              className="lg-btn-action lg-btn-glow swipe-replay-btn"
            >
              <span>🔄 Main Semula Qawaid Swipe</span>
            </button>

            {onBackToHub && (
              <button
                type="button"
                onClick={onBackToHub}
                className="lg-btn-glass"
              >
                <span>⬅️ Kembali ke Hab Permainan</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
