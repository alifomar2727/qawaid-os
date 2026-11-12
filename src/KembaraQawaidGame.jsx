// qawaid-explorer/src/KembaraQawaidGame.jsx
// Permainan RPG Open-World 2D:
// Kembara Qawaid: "Penyelesai Masalah" — Menggunakan dataNotaLengkap sebagai Skill/Magis Hikmah

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { dataNotaLengkap } from './dataNota';
import ThreeWorldMap from './ThreeWorldMap';

// Enjin Bunyi Web Audio API bertema Pengembaraan / RPG Timur Tengah
function createRpgSoundEngine() {
  let ctx = null;
  const getCtx = () => {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  };

  return {
    playStep() {
      const audio = getCtx();
      if (!audio) return;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(165, audio.currentTime);
      osc.frequency.exponentialRampToValueAtTime(95, audio.currentTime + 0.045);
      gain.gain.setValueAtTime(0.04, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + 0.05);
    },
    playNpcGreet() {
      const audio = getCtx();
      if (!audio) return;
      [392, 493.88, 587.33].forEach((f, idx) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'sine';
        const start = audio.currentTime + idx * 0.055;
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.07, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(start);
        osc.stop(start + 0.14);
      });
    },
    playCastSuccess() {
      const audio = getCtx();
      if (!audio) return;
      // Tangga nada Hijaz / Kemenangan Hikmah
      [440, 554.37, 659.25, 880, 1108.73].forEach((f, idx) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'triangle';
        const start = audio.currentTime + idx * 0.065;
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.11, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.26);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(start);
        osc.stop(start + 0.26);
      });
    },
    playCastReject() {
      const audio = getCtx();
      if (!audio) return;
      [220, 185, 146.83].forEach((f, idx) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'sawtooth';
        const start = audio.currentTime + idx * 0.07;
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });
    },
  };
}

// 5 Wilayah Tamadun Islam dalam Open-World 2D
const SENARAI_WILAYAH = [
  {
    id: 'BAGHDAD',
    nama: 'Kota Baghdad (Zaman Abbasiyyah)',
    gelaran: 'Wilayah 1 • Souq Al-Warraqin & Baitul Hikmah',
    era: 'Abad ke-3 Hijrah',
    temaKaedah: 'الأمور بمقاصدها (Niat, Akad & Transaksi)',
    warnaUtama: '#f59e0b',
    warnaLatar: 'rgba(245, 158, 11, 0.12)',
    ikonWilayah: '🕌',
    deskripsi:
      'Pusat perdagangan dan keilmuan dunia. Para pedagang pasar dan penuntut ilmu sedang berhadapan dengan pertikaian niat serta lafaz akad.',
    npcs: [
      {
        npcId: 'NPC-BGD-1',
        nama: 'Saudagar Abu Mansur',
        peranan: 'Pedagang Pasar Karakh',
        ikon: '👳🏽‍♂️',
        notaId: 'KP-05',
        dialogMasalah:
          '“Wahai Pengembara! Seorang pelanggan berkata kepadaku: «Aku hibahkan kuda Arab ini kepadamu dengan syarat engkau membayarku 20,000 dirham». Sekarang kuda itu cacat sedikit, lalu dia mendakwa aku tak boleh memulangkannya kerana kononnya ia akad Hibah, bukan Jual Beli! Gunakan ilmu Qawaid-mu untuk menyelesaikan pertikaian kami!”',
        dialogBerjaya:
          '“Demi Allah, sungguh bernas! Walaupun mulutnya menyebut lafaz Hibah, hakikat niat dan syarat bayaran itu menjadikannya akad Jual Beli (العبرة في العقود للمقاصد والمعاني). Kini aku berhak menuntut khiyar aib!”',
        dialogTolak:
          '“Hmm, kaedah yang engkau bacakan itu tidak kena dengan pertikaian lafaz akad hibah bersyarat bayaran ini! Pelanggan itu mentertawakan hujahmu.”',
      },
      {
        npcId: 'NPC-BGD-2',
        nama: 'Tuan Qadi Al-Karkhi',
        peranan: 'Hakim Balai Hisbah',
        ikon: '⚖️',
        notaId: 'KP-04B',
        dialogMasalah:
          '“Assalamu’alaikum wahai penuntut hikmah. Dua sahabat bertelagah di mahkamahku: Zaid menyerahkan kantung dinar kepada Umar tanpa kontrak bertulis. Zaid mendakwa ia pinjaman (qard), manakala Umar menyangka ia hadiah (hibah). Apakah jampi kaedah asas yang menentukan status perbuatan dan transaksi mereka?”',
        dialogBerjaya:
          '“Tepat sekali! Dengan kaedah «الأعمال بالنيات», setiap tindakan muamalat dan ibadah dinilai mengikut niat serta qarinah keadaan semasa penyerahan itu berlaku!”',
        dialogTolak:
          '“Wahai anak muda, bukan kaedah itu yang menjadi paksi pembeza antara adat, hibah dan pinjaman melalui niat! Semak kembali Kitab Hikmahmu.”',
      },
      {
        npcId: 'NPC-BGD-3',
        nama: 'Syeikhul Madrasah Nizamiyyah',
        peranan: 'Guru Fiqh Empat Mazhab',
        ikon: '📜',
        notaId: 'KP-04',
        dialogMasalah:
          '“Murid-muridku sedang keliru tentang seorang lelaki yang terjun ke sungai untuk menyejukkan badan tanpa berniat wuduk, serta beza pandangan Hanafi dan Syafie mengenainya. Apakah Kaedah Kubra pertama yang menaungi seluruh perbahasan niat ini?”',
        dialogBerjaya:
          '“Ahsanta! Kaedah Kubra «الأمور بمقاصدها» menjelaskan mengapa Jumhur mewajibkan niat wuduk sebagai ibadah mahdah manakala Hanafi menganggapnya wasilah kebersihan!”',
        dialogTolak:
          '“Kurang tepat wahai musafir. Murid-murid memerlukan Kaedah Induk yang pertama berkaitan tujuan dan niat setiap perbuatan!”',
      },
      {
        npcId: 'NPC-BGD-4',
        nama: 'Peniaga Sutera Basrah',
        peranan: 'Usahawan Kafilah Dagang',
        ikon: '🐪',
        notaId: 'KP-05B',
        dialogMasalah:
          '“Seorang pembekal memberikan bungkusan hadiah mewah kepada pegawai gudangku sebelum kontrak dimeterai. Dia mendakwa itu sekadar hadiah adat, bukan suapan berkaitan urus niaga. Kaedah ranting manakah yang menilai maksud dan kepercayaan dalam tindakan serta adat seperti ini?”',
        dialogBerjaya:
          '“Benar! «المقاصد والاعتقادات معتبرة في التصرفات والعادات» — maksud dan konteks urus niaga wajib diteliti bagi membezakan hadiah ikhlas dengan manfaat kontrak yang terlarang!”',
        dialogTolak:
          '“Pegawai gudangku tidak yakin dengan kaedah tersebut kerana ia tidak menyentuh soal kepercayaan dan maksud dalam tindakan adat.”',
      },
    ],
  },
  {
    id: 'DAMSYIK',
    nama: 'Kota Damsyik & Lembah Syam',
    gelaran: 'Wilayah 2 • Masjid Umawi & Dewan Kehakiman',
    era: 'Abad ke-6 Hijrah',
    temaKaedah: 'اليقين لا يزول بالشك (Keyakinan, Bukti & Istishab)',
    warnaUtama: '#38bdf8',
    warnaLatar: 'rgba(56, 189, 248, 0.12)',
    ikonWilayah: '🏛️',
    deskripsi:
      'Kota ilmu yang dikelilingi sungai Barada. Penduduknya berdepan dengan kemelut keraguan (syak), tuduhan hutang tanpa bukti, dan pengesahan ibadah.',
    npcs: [
      {
        npcId: 'NPC-DMS-1',
        nama: 'Imam Masjid Umawi',
        peranan: 'Imam & Mufti Syam',
        ikon: '📿',
        notaId: 'KP-06',
        dialogMasalah:
          '“Wahai Pengembara! Seorang jemaah telah mengambil wuduk dengan sempurna di tempat wuduk, tetapi sebaik melangkah masuk ke dewan solat, hatinya berbisik ragu-ragu sama ada wuduknya telah terbatal atau belum tanpa sebarang bukti pasti. Pancarkan Kaedah Kubra yang menyelamatkannya daripada waswas!”',
        dialogBerjaya:
          '“Subhanallah! «اليقين لا يزول بالشك» — keyakinan suci yang telah sabit secara pasti tidak sesekali tergugat oleh datangnya syak semata-mata!”',
        dialogTolak:
          '“Jemaah itu masih bingung kerana kaedah yang engkau gunakan tidak membahaskan pertembungan antara Yakin dan Syak!”',
      },
      {
        npcId: 'NPC-DMS-2',
        nama: 'Khatib Al-Dimasyqi',
        peranan: 'Penjaga Wakaf Manuskrip',
        ikon: '📚',
        notaId: 'KP-07',
        dialogMasalah:
          '“Seorang peminjam wang mendakwa dia rasanya sudah membayar hutang 500 dinar kepadaku minggu lalu, tetapi tiada saksi dan tiada resit, malah dia sendiri syak. Apakah kaedah Istishab yang menetapkan keadaan asal sesuatu perkara kekal seperti sebelumnya?”',
        dialogBerjaya:
          '“Tepat! «الأصل بقاء ما كان على ما كان» — hutang yang telah yakin wujud di atas tanggungannya kekal sehinggalah ada bukti yakin ia telah dilunaskan!”',
        dialogTolak:
          '“Bukan kaedah itu wahai sahabat! Kita perlukan kaedah Istishab tentang kekalnya keadaan asal sebagaimana sebelumnya.”',
      },
      {
        npcId: 'NPC-DMS-3',
        nama: 'Ahmad Al-Saqqa',
        peranan: 'Tukang Air Pasar Hamidiyyah',
        ikon: '🏺',
        notaId: 'KP-08',
        dialogMasalah:
          '“Tolong aku! Seorang bangsawan tiba-tiba menuduhku merosakkan peti barangnya dan menuntut ganti rugi 1,000 dirham tanpa sebarang saksi atau bukti! Apakah kaedah yang melindungi orang yang didakwa tanpa bukti?”',
        dialogBerjaya:
          '“Alhamdulillah, aku lega! «الأصل براءة الذمة» membuktikan bahawa tanggungan asal setiap manusia adalah bebas daripada tuntutan sehinggalah pendakwa membawa bukti yang sah!”',
        dialogTolak:
          '“Aduh, bangsawan itu menolak hujahmu! Carilah kaedah yang menyebut tentang bebasnya tanggungan asal (Bara’ah al-Zimmah).”',
      },
      {
        npcId: 'NPC-DMS-4',
        nama: 'Hakim Al-Maqdisi',
        peranan: 'Pemeriksa Sijil Dagangan',
        ikon: '📜',
        notaId: 'KP-09',
        dialogMasalah:
          '“Kami mempunyai geran tanah wakaf yang telah disahkan secara yakin sejak puluhan tahun. Kini timbul khabar angin samar-samar yang cuba membatalkannya. Kaedah manakah menegaskan bahawa perkara yang sabit dengan yakin hanya boleh dibatalkan oleh keyakinan setara?”',
        dialogBerjaya:
          '“Sungguh jitu! «الثابت باليقين لا ينتقض إلا بيقين مثله» menutup pintu spekulasi daripada meruntuhkan bukti yang telah qat’i!”',
        dialogTolak:
          '“Kurang tepat! Aku memerlukan kaedah ranting yang menyebut secara khusus tentang «الثابت باليقين».”',
      },
    ],
  },
  {
    id: 'HIJAZ',
    nama: 'Laluan Kafilah Hijaz & Sinai',
    gelaran: 'Wilayah 3 • Oasis Musafir & Padang Pasir',
    era: 'Zaman Kembara Ilmiah',
    temaKaedah: 'المشقة تجلب التيسير (Kesukaran, Rukhsah & Darurat)',
    warnaUtama: '#10b981',
    warnaLatar: 'rgba(16, 185, 129, 0.12)',
    ikonWilayah: '⛺',
    deskripsi:
      'Merentasi gurun yang mencabar. Para musafir, jemaah haji, dan perantau menghadapi badai pasir, ketiadaan air, dan keadaan darurat.',
    npcs: [
      {
        npcId: 'NPC-HJZ-1',
        nama: 'Ketua Kafilah Tariq',
        peranan: 'Pemandu Kafilah Gurun',
        ikon: '🐪',
        notaId: 'KP-11',
        dialogMasalah:
          '“Ribut pasir telah melanda kafilah kami! Bekalan air hanya cukup untuk minum dan anggota rombongan amat keletihan dalam perjalanan jauh ini. Apakah Kaedah Kubra yang menjadi asas kepada rukhsah tayamum, qasar dan jamak solat?”',
        dialogBerjaya:
          '“Allahu Akbar! «المشقة تجلب التيسير» — kesukaran luar biasa dalam permusafiran dan uzur sememangnya membuka pintu kemudahan dan rukhsah syarak!”',
        dialogTolak:
          '“Anggota kafilah masih resah. Pilihlah Kaedah Kubra induk tentang kesukaran membawa kemudahan!”',
      },
      {
        npcId: 'NPC-HJZ-2',
        nama: 'Musafir Salim',
        peranan: 'Perantau yang Terkandas',
        ikon: '🧭',
        notaId: 'KP-13',
        dialogMasalah:
          '“Wahai Pengembara, aku tersesat di lembah kering ini selama tiga hari sehingga hampir pengsan kebuluran, dan aku hanya menemui bangkai haiwan. Kaedah manakah yang mengharuskan perkara terlarang demi menyelamatkan nyawa ketika darurat?”',
        dialogBerjaya:
          '“Terima kasih! Dengan kaedah «الضرورات تبيح المحظورات», memelihara nyawa diutamakan ketika darurat yang benar-benar diyakini!”',
        dialogTolak:
          '“Bukan itu kaedahnya! Aku sedang berdepan dengan soal darurat yang mengharuskan perkara mahzurat (dilarang).”',
      },
      {
        npcId: 'NPC-HJZ-3',
        nama: 'Tabib Kafilah Zayd',
        peranan: 'Perawat Luka Perjalanan',
        ikon: '🩹',
        notaId: 'KP-14',
        dialogMasalah:
          '“Seorang musafir yang kelaparan tadi mahu makan bangkai tersebut sehingga kenyang berlebihan dan membawa balik bakinya walaupun sudah ada kurma sedikit! Kaedah manakah yang menghadkan darurat sekadar kadar keperluan sahaja?”',
        dialogBerjaya:
          '“Tepat sekali! «الضرورة تقدر بقدرها» — apa yang diharuskan kerana darurat wajib dihadkan sekadar menolak bahaya kematian sahaja, tidak boleh melampaui batas!”',
        dialogTolak:
          '“Hujah itu belum menjawab soal had dan kadar darurat (تقدر بقدرها)!”',
      },
      {
        npcId: 'NPC-HJZ-4',
        nama: 'Saudagar Khemah Badwi',
        peranan: 'Pembuat Pelana & Khemah',
        ikon: '⛺',
        notaId: 'KP-14B',
        dialogMasalah:
          '“Masyarakat di oasis ini sangat memerlukan kontrak tempahan khemah (Istisna’) dan jual beli Salam walaupun barangnya belum wujud semasa akad. Kaedah manakah meletakkan keperluan mendesak (Hajah) setaraf dengan Darurat?”',
        dialogBerjaya:
          '“Sungguh jelas! «الحاجة تنزل منزلة الضرورة عامة كانت أو خاصة» membolehkan akad Istisna’ dan Ijarah demi memenuhi keperluan masyarakat!”',
        dialogTolak:
          '“Kurang tepat! Carilah kaedah yang membicarakan kedudukan Al-Hajah (keperluan) berbanding Al-Darurah.”',
      },
    ],
  },
  {
    id: 'KAHERAH',
    nama: 'Bimaristan Qalawun, Kaherah',
    gelaran: 'Wilayah 4 • Kompleks Perubatan & Maslahat Awam',
    era: 'Abad ke-7 Hijrah',
    temaKaedah: 'الضرر يزال (Menghilangkan Kemudaratan & Mafsadah)',
    warnaUtama: '#f43f5e',
    warnaLatar: 'rgba(244, 63, 94, 0.12)',
    ikonWilayah: '🏥',
    deskripsi:
      'Hospital agung tamadun Islam di Mesir. Para tabib dan pentadbir kota sedang menangani wabak, pembedahan berisiko, dan pencemaran sungai Nil.',
    npcs: [
      {
        npcId: 'NPC-CAI-1',
        nama: 'Ketua Tabib Ibn Nafis',
        peranan: 'Pakar Bedah Bimaristan',
        ikon: '🩺',
        notaId: 'KP-17',
        dialogMasalah:
          '“Wahai Pengembara! Seorang pesakit mengalami gangren teruk pada jarinya. Jika tidak dipotong segera, racunnya akan merebak dan meragut nyawanya! Kaedah manakah mewajibkan kita memilih mudarat yang lebih ringan bagi mengelakkan mudarat yang lebih berat?”',
        dialogBerjaya:
          '“Subhanallah, tepat! «الضرر الأشد يزال بالضرر الأخف» — kehilangan satu jari adalah mudarat yang jauh lebih ringan berbanding kehilangan nyawa!”',
        dialogTolak:
          '“Wahai sahabat, masa semakin suntuk! Pilih kaedah yang membandingkan antara dua tahap mudarat (الأشد والأخف).”',
      },
      {
        npcId: 'NPC-CAI-2',
        nama: 'Muhtasib Kota Kaherah',
        peranan: 'Penguatkuasa Keselamatan Awam',
        ikon: '🛡️',
        notaId: 'KP-18',
        dialogMasalah:
          '“Seorang peniaga gandum memonopoli bekalan makanan ketika musim kemarau, dan seorang tabib palsu yang jahil merawat pesakit sehingga membahayakan penduduk kota. Kaedah manakah membenarkan kami menyekat hak khusus individu demi menolak mudarat awam?”',
        dialogBerjaya:
          '“Benar sekali! «يتحمل الضرر الخاص لمنع الضرر العام» mengharuskan al-hajr (sekatan) dan penetapan harga siling demi melindungi keselamatan seluruh masyarakat!”',
        dialogTolak:
          '“Peniaga monopoli itu membantah kerana kaedah yang engkau sebut tidak menyentuh pertembungan mudarat khusus dan mudarat umum!”',
      },
      {
        npcId: 'NPC-CAI-3',
        nama: 'Qadi Sungai Nil',
        peranan: 'Hakim Pertikaian Jiran',
        ikon: '🌊',
        notaId: 'KP-15B',
        dialogMasalah:
          '“Seorang pemilik kebun telah dirosakkan tanamannya oleh ternakan jirannya. Kerana marah, dia mahu meracuni pula telaga air jirannya sebagai membalas dendam! Lancarkan kaedah hadis nabawi yang mengharamkan perbuatan memulakan mudarat dan membalas mudarat!”',
        dialogBerjaya:
          '“Sungguh tepat! «لا ضرر ولا ضرار» mengharamkan pencerobohan awal mahupun tindakan membalas dendam yang merosakkan harta orang lain; dia wajib menuntut ganti rugi secara sah di mahkamah!”',
        dialogTolak:
          '“Bukan itu! Kita perlukan kaedah yang melarang kedua-dua «ضرر» dan «ضرار».”',
      },
      {
        npcId: 'NPC-CAI-4',
        nama: 'Wazir Perbendaharaan Mesir',
        peranan: 'Penasihat Polisi Negara',
        ikon: '👑',
        notaId: 'KP-19',
        dialogMasalah:
          '“Ada pihak mencadangkan supaya dibuka rumah perjudian di pelabuhan kerana ia boleh memberi cukai yang lumayan kepada perbendaharaan, sedangkan ia membawa keruntuhan keluarga dan jenayah. Kaedah manakah mendahulukan penolakan kerosakan berbanding meraih manfaat?”',
        dialogBerjaya:
          '“Ahsanta! «درء المفاسد مقدم على جلب المصالح» — apabila bertembung antara manfaat kewangan dengan mafsadah sosial yang besar, menolak mafsadah wajib diutamakan!”',
        dialogTolak:
          '“Wazir menggelengkan kepala. Carilah kaedah yang menggandingkan «درء المفاسد» dengan «جلب المصالح».”',
      },
    ],
  },
  {
    id: 'ANDALUSIA',
    nama: 'Pelabuhan Andalusia & Nusantara',
    gelaran: 'Wilayah 5 • Dermaga Maritim & Dewan Uruf',
    era: 'Zaman Pelayaran & Perdagangan Antarabangsa',
    temaKaedah: 'العادة محكمة (Adat, Uruf & Kaedah Kulliyyah)',
    warnaUtama: '#a855f7',
    warnaLatar: 'rgba(168, 85, 247, 0.12)',
    ikonWilayah: '⛵',
    deskripsi:
      'Pelabuhan pertemuan pedagang dari Cordoba hingga ke Selat Melaka. Segala kontrak perkapalan, mata wang, dan amalan masyarakat bergantung kepada Uruf.',
    npcs: [
      {
        npcId: 'NPC-AND-1',
        nama: 'Nakhoda Ibn Majid',
        peranan: 'Kapten Kapal Dagang',
        ikon: '⚓',
        notaId: 'KP-21',
        dialogMasalah:
          '“Selamat datang ke dermaga! Dalam pelayaran kami, banyak terma perkapalan dan upah kelasi tidak diperincikan satu persatu dalam surat kontrak, sebaliknya mengikut kebiasaan pelaut yang telah lama diamalkan. Apakah Kaedah Kubra kelima yang mengiktiraf adat sebagai penentu hukum?”',
        dialogBerjaya:
          '“Tepat! «العادة محكمة» mengangkat uruf dan adat yang sahih sebagai rujukan hukum apabila tiada nas atau syarat khusus yang menyanggahinya!”',
        dialogTolak:
          '“Para kelasi memerlukan Kaedah Kubra kelima tentang kedudukan Adat sebagai penentu hukum!”',
      },
      {
        npcId: 'NPC-AND-2',
        nama: 'Syahbandar Pelabuhan',
        peranan: 'Ketua Kastam & Perdagangan',
        ikon: '🧭',
        notaId: 'KP-22',
        dialogMasalah:
          '“Seorang saudagar asing menuntut agar adat terpencil dari kampung halamannya diguna pakai di pelabuhan ini, sedangkan 95% pedagang di sini mengamalkan polisi timbangan standard yang berbeza. Apakah syarat utama supaya sesuatu adat itu diambil kira dalam hukum?”',
        dialogBerjaya:
          '“Sungguh jelas! «إنما تعتبر العادة إذا اطردت أو غلبت» — adat hanya menjadi hujah apabila ia diamalkan secara konsisten (muttarid) atau dominan oleh majoriti (ghalib)!”',
        dialogTolak:
          '“Syahbandar menolak hujah itu kerana ia tidak menyebut syarat konsisten (اطردت) atau dominan (غلبت).”',
      },
      {
        npcId: 'NPC-AND-3',
        nama: 'Saudagar Rempah Melaka',
        peranan: 'Pedagang Antarabangsa',
        ikon: '📦',
        notaId: 'KP-23',
        dialogMasalah:
          '“Kontrak penghantaran rempah kami hanya menyebut «bayaran 500 dinar dalam tempoh 3 hari bekerja» secara umum (mutlak) tanpa menyebut jenis mata wang tempatan atau waktu operasi. Kaedah manakah yang menafsirkan lafaz mutlak mengikut uruf?”',
        dialogBerjaya:
          '“Terbaik! «الإطلاق محمول على العادة» menetapkan bahawa lafaz mutlak dalam akad dibawa kepada maksud kebiasaan uruf setempat!”',
        dialogTolak:
          '“Bukan kaedah itu! Kita sedang membincangkan lafaz yang disebut secara mutlak (الإطلاق).”',
      },
      {
        npcId: 'NPC-AND-4',
        nama: 'Hakim Mahkamah Maritim',
        peranan: 'Qadi Agung Pelabuhan',
        ikon: '🏛️',
        notaId: 'KP-24',
        dialogMasalah:
          '“Dahulu pengesahan identiti pedagang hanya dibuat melalui saksi lisan, tetapi kini pelabuhan menggunakan cap mohor rasmi dan dokumen daftar kapal mengikut keperluan zaman baharu. Kaedah manakah yang mengiktiraf perubahan hukum ijtihadi mengikut perubahan zaman?”',
        dialogBerjaya:
          '“Bijaksana sekali! «لا ينكر تغير الأحكام بتغير الأزمان» membuktikan keluasan syariat Islam dalam meraikan perubahan uruf dan maslahat zaman!”',
        dialogTolak:
          '“Hakim menggeleng. Pilihlah kaedah yang menyentuh perubahan hukum disebabkan perubahan zaman (تغير الأزمان).”',
      },
    ],
  },
];

// Konfigurasi Tema Dynamic Biome (Tekstur Bumi & Tebing 3D Mengikut 5 Wilayah & Peta Rawak)
const BIOME_THEMES = {
  BAGHDAD: {
    id: 'BAGHDAD',
    className: 'biome-baghdad',
    nama: 'Kota Baghdad',
    gelaran: 'Mozek Zamrud & Garisan Emas',
    warnaAksen: '#f59e0b',
  },
  DAMSYIK: {
    id: 'DAMSYIK',
    className: 'biome-damsyik',
    nama: 'Kota Damsyik',
    gelaran: 'Batu Marmar Zaitun & Aksen Perak',
    warnaAksen: '#38bdf8',
  },
  HIJAZ: {
    id: 'HIJAZ',
    className: 'biome-hijaz',
    nama: 'Laluan Hijaz & Sinai',
    gelaran: 'Pasir Gurun Hangat & Batu Pasir',
    warnaAksen: '#f59e0b',
  },
  KAHERAH: {
    id: 'KAHERAH',
    className: 'biome-kaherah',
    nama: 'Bimaristan Kaherah',
    gelaran: 'Batu Kapur Mesir & Lentera Hangat',
    warnaAksen: '#fb923c',
  },
  ANDALUSIA: {
    id: 'ANDALUSIA',
    className: 'biome-andalusia',
    nama: 'Pelabuhan Andalusia',
    gelaran: 'Biru Firus Laut & Buih Bercahaya',
    warnaAksen: '#38bdf8',
  },
  COSMIC: {
    id: 'COSMIC',
    className: 'biome-cosmic',
    nama: 'Peta Kosmik Rawak',
    gelaran: 'Kaca Kosmik Indigo & Ungu Neon',
    warnaAksen: '#c084fc',
  },
};

// Saiz Grid Peta 2D Open-World
const GRID_COLS = 12;
const GRID_ROWS = 8;

// Jana susun atur peta 2D secara prosedural/rawak mengikut Wilayah & seed
function generateOpenWorldMap(wilayah, seed = 1) {
  // Jenis Tile: 'FLOOR', 'WALL', 'WATER', 'OASIS', 'PORTAL', 'NPC'
  const grid = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => ({ type: 'FLOOR', npc: null, decor: null }))
  );

  // Random helper berasaskan seed
  let s = seed * 9301 + wilayah.id.charCodeAt(0) * 49297;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  // Letakkan sungai/laut atau dinding taman secara estetik tetapi pastikan laluan terbuka
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      // Jangan halang kawasan permulaan pemain (1,1) atau portal (GRID_ROWS-2, GRID_COLS-2)
      if ((r <= 2 && c <= 2) || (r >= GRID_ROWS - 2 && c >= GRID_COLS - 2)) continue;

      const roll = rand();
      if (roll < 0.11) {
        grid[r][c].type = 'WALL';
      } else if (roll < 0.18) {
        grid[r][c].type = 'WATER';
      } else if (roll < 0.24) {
        grid[r][c].decor = wilayah.id === 'HIJAZ' ? '🌴' : wilayah.id === 'ANDALUSIA' ? '⚓' : '🌿';
      }
    }
  }

  // Letakkan 2 Oasis / Madrasah Pemulihan Reputasi & Hikmah
  const oasisCoords = [
    { r: 1, c: GRID_COLS - 2 },
    { r: GRID_ROWS - 2, c: 2 },
  ];
  oasisCoords.forEach(({ r, c }) => {
    grid[r][c] = { type: 'OASIS', npc: null, decor: '⛲' };
  });

  // Letakkan Gerbang Portal ke Wilayah seterusnya di penjuru kanan bawah
  grid[GRID_ROWS - 2][GRID_COLS - 2] = { type: 'PORTAL', npc: null, decor: '🌀' };

  // Letakkan NPC di koordinat yang tersebar dan boleh dilalui
  const candidateSpots = [
    { r: 1, c: 5 },
    { r: 2, c: 9 },
    { r: 5, c: 3 },
    { r: 5, c: 8 },
    { r: 3, c: 6 },
    { r: 6, c: 6 },
  ];

  wilayah.npcs.forEach((npc, idx) => {
    // Cari koordinat mengikut seed
    const baseSpot = candidateSpots[(idx + seed) % candidateSpots.length];
    let r = baseSpot.r;
    let c = baseSpot.c;
    while (
      grid[r][c].type !== 'FLOOR' ||
      grid[r][c].npc ||
      (r === 1 && c === 1)
    ) {
      r = Math.floor(rand() * (GRID_ROWS - 2)) + 1;
      c = Math.floor(rand() * (GRID_COLS - 2)) + 1;
    }
    grid[r][c] = { type: 'NPC', npc, decor: null };
    // Pastikan sekurang-kurangnya satu petak bersebelahan NPC adalah FLOOR supaya boleh dihampiri
    if (r > 0 && grid[r - 1][c].type !== 'NPC') grid[r - 1][c].type = 'FLOOR';
    if (c > 0 && grid[r][c - 1].type !== 'NPC') grid[r][c - 1].type = 'FLOOR';
  });

  return grid;
}

export default function KembaraQawaidGame() {
  const [wilayahIdx, setWilayahIdx] = useState(0);
  const [mapSeed, setMapSeed] = useState(1);
  const [playerPos, setPlayerPos] = useState({ r: 1, c: 1 });
  const [facing, setFacing] = useState('RIGHT'); // 'LEFT' | 'RIGHT' | 'UP' | 'DOWN'
  const [recentPath, setRecentPath] = useState([]); // FASA 3: Jejak Langkah (3 koordinat terakhir)

  // Statistik RPG Pemain
  const [reputation, setReputation] = useState(100);
  const [xp, setXp] = useState(0);
  const [hikmahMana, setHikmahMana] = useState(3);
  const [solvedNpcIds, setSolvedNpcIds] = useState(() => {
    try {
      const saved = localStorage.getItem('qawaid_kembara_solved');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Pertembungan / Dialog NPC Semasa
  const [activeNpc, setActiveNpc] = useState(null);
  const [skillOptions, setSkillOptions] = useState([]);
  const [hiddenSkillIds, setHiddenSkillIds] = useState([]);
  const [inspectSkillId, setInspectSkillId] = useState(null);
  const [encounterStatus, setEncounterStatus] = useState(null); // null | 'SUCCESS' | 'REJECTED'
  const [rejectionMessage, setRejectionMessage] = useState('');

  // Modal Koleksi Grimoire / Kitab Skill (dataNotaLengkap)
  const [showSkillBook, setShowSkillBook] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const soundRef = useRef(null);
  if (!soundRef.current) {
    soundRef.current = createRpgSoundEngine();
  }

  const currentWilayah = SENARAI_WILAYAH[wilayahIdx] || SENARAI_WILAYAH[0];

  // Dynamic Biome: Peta Kosmik jika Peta Rawak (mapSeed > 1), atau Biome Tematik mengikut 5 Wilayah
  const currentBiome = useMemo(() => {
    if (mapSeed > 1) return BIOME_THEMES.COSMIC;
    return BIOME_THEMES[currentWilayah.id] || BIOME_THEMES.BAGHDAD;
  }, [mapSeed, currentWilayah.id]);

  const mapGrid = useMemo(
    () => generateOpenWorldMap(currentWilayah, mapSeed),
    [currentWilayah, mapSeed]
  );

  useEffect(() => {
    try {
      localStorage.setItem('qawaid_kembara_solved', JSON.stringify(solvedNpcIds));
    } catch {
      // Abaikan ralat storan
    }
  }, [solvedNpcIds]);

  const triggerToast = useCallback((text, tone = 'gold') => {
    setToastMsg({ text, tone });
    setTimeout(() => {
      setToastMsg(null);
    }, 2600);
  }, []);

  // Cari objek nota daripada dataNotaLengkap
  const getNotaById = useCallback((notaId) => {
    return (
      dataNotaLengkap.find((n) => n.id === notaId) ||
      dataNotaLengkap.find((n) => n.id === 'KP-04') ||
      dataNotaLengkap[0]
    );
  }, []);

  // Mulakan dialog & susun 4 Skill Qawaid daripada dataNotaLengkap
  const openNpcEncounter = useCallback(
    (npc) => {
      // FASA 3: Haptik getaran interaksi NPC [30ms, 50ms henti, 30ms]
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([30, 50, 30]);
        } catch {}
      }
      soundRef.current?.playNpcGreet();
      const targetNota = getNotaById(npc.notaId);
      const distractors = dataNotaLengkap
        .filter(
          (n) =>
            Boolean(n.matriksId) &&
            n.id !== targetNota.id
        )
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const choices = [...distractors, targetNota].sort(() => 0.5 - Math.random());
      setActiveNpc(npc);
      setSkillOptions(choices);
      setHiddenSkillIds([]);
      setInspectSkillId(null);
      setEncounterStatus(null);
      setRejectionMessage('');
    },
    [getNotaById]
  );

  // Pergerakan 1 langkah pada Peta 2D
  const movePlayer = useCallback(
    (dr, dc) => {
      if (activeNpc || showSkillBook) return;
      if (dc < 0) setFacing('LEFT');
      if (dc > 0) setFacing('RIGHT');
      if (dr < 0) setFacing('UP');
      if (dr > 0) setFacing('DOWN');

      setPlayerPos((prev) => {
        const nr = prev.r + dr;
        const nc = prev.c + dc;
        if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) return prev;

        const targetTile = mapGrid[nr][nc];
        if (targetTile.type === 'WALL' || targetTile.type === 'WATER') {
          triggerToast('⛰️ Laluan terhalang! Pilih laluan lain di peta.', 'crimson');
          return prev;
        }

        soundRef.current?.playStep();

        // FASA 3: Haptik Mobile melangkah (getaran pendek 12ms)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(12);
          } catch {}
        }

        // FASA 3: Jejak Langkah (Simpan 3 koordinat terakhir pemain)
        setRecentPath((rPrev) => [
          { r: prev.r, c: prev.c, id: Date.now() },
          ...rPrev,
        ].slice(0, 3));

        if (targetTile.type === 'OASIS') {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate([30, 50, 30]);
            } catch {}
          }
          setReputation((rep) => Math.min(100, rep + 15));
          setHikmahMana((m) => Math.min(5, m + 1));
          triggerToast('⛲ Oasis Hikmah: +15 Reputasi & +1 Tenaga Tilik!', 'emerald');
        } else if (targetTile.type === 'PORTAL') {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate([30, 40, 30]);
            } catch {}
          }
          const nextIdx = (wilayahIdx + 1) % SENARAI_WILAYAH.length;
          setTimeout(() => {
            setWilayahIdx(nextIdx);
            setMapSeed(1);
            setPlayerPos({ r: 1, c: 1 });
            setRecentPath([]);
            triggerToast(
              `🌀 Berpindah ke ${SENARAI_WILAYAH[nextIdx].nama}!`,
              'cyan'
            );
          }, 120);
        } else if (targetTile.type === 'NPC' && targetTile.npc) {
          setTimeout(() => {
            openNpcEncounter(targetTile.npc);
          }, 80);
        }

        return { r: nr, c: nc };
      });
    },
    [activeNpc, showSkillBook, mapGrid, wilayahIdx, triggerToast, openNpcEncounter]
  );

  // Kawalan Sentuh & Klik 3D (Raycasting pada Kanvas Three.js)
  const handleThreeTileClick = useCallback(
    (targetR, targetC) => {
      if (activeNpc || showSkillBook) return;

      const dr = targetR - playerPos.r;
      const dc = targetC - playerPos.c;

      if (dr === 0 && dc === 0) return;

      // Jika klik petak bersebelahan terus (1 langkah)
      if (Math.abs(dr) + Math.abs(dc) === 1) {
        movePlayer(dr, dc);
        return;
      }

      // Jika klik NPC yang bersebelahan atau jarak dekat untuk berinteraksi
      const targetTile = mapGrid[targetR]?.[targetC];
      if (targetTile?.type === 'NPC' && targetTile?.npc) {
        if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) {
          openNpcEncounter(targetTile.npc);
          return;
        }
      }

      // Melangkah 1 langkah ke arah petak sasaran
      const stepR = Math.abs(dr) >= Math.abs(dc) ? Math.sign(dr) : 0;
      const stepC = stepR === 0 ? Math.sign(dc) : 0;
      movePlayer(stepR, stepC);
    },
    [playerPos, activeNpc, showSkillBook, movePlayer, mapGrid, openNpcEncounter]
  );

  // Cari NPC berdekatan untuk butang "Sapa NPC"
  const nearbyNpc = useMemo(() => {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = playerPos.r + dr;
        const nc = playerPos.c + dc;
        if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
          if (mapGrid[nr][nc]?.npc) return mapGrid[nr][nc].npc;
        }
      }
    }
    return null;
  }, [playerPos, mapGrid]);

  // Kawalan Papan Kekunci (WASD / Arrow Keys untuk gerak, Space / Enter untuk sapa NPC berdekatan)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (activeNpc || showSkillBook) return;
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') {
        e.preventDefault();
        movePlayer(-1, 0);
      } else if (key === 's' || key === 'arrowdown') {
        e.preventDefault();
        movePlayer(1, 0);
      } else if (key === 'a' || key === 'arrowleft') {
        e.preventDefault();
        movePlayer(0, -1);
      } else if (key === 'd' || key === 'arrowright') {
        e.preventDefault();
        movePlayer(0, 1);
      } else if ((key === ' ' || key === 'enter') && nearbyNpc) {
        e.preventDefault();
        openNpcEncounter(nearbyNpc);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeNpc, showSkillBook, movePlayer, nearbyNpc, openNpcEncounter]);

  // Lancarkan Skill / Magis Kaedah (dataNotaLengkap) untuk menyelesaikan konflik NPC
  const handleCastSkill = (selectedNota) => {
    if (!activeNpc || encounterStatus === 'SUCCESS') return;
    const correctNota = getNotaById(activeNpc.notaId);

    if (selectedNota.id === correctNota.id) {
      soundRef.current?.playCastSuccess();
      setEncounterStatus('SUCCESS');
      setRejectionMessage('');
      setReputation((rep) => Math.min(100, rep + 10));
      setXp((x) => x + 150);

      if (!solvedNpcIds.includes(activeNpc.npcId)) {
        setSolvedNpcIds((prev) => [...prev, activeNpc.npcId]);
      }
      triggerToast('✨ Hujah Kaedah Tepat! +150 XP & +10% Reputasi!', 'emerald');
    } else {
      soundRef.current?.playCastReject();
      setEncounterStatus('REJECTED');
      setReputation((rep) => Math.max(0, rep - 15));
      setRejectionMessage(
        `${activeNpc.dialogTolak} (Anda memilih: «${selectedNota.tajuk}» — Reputasi menurun -15%)`
      );
      triggerToast('⚠️ NPC menolak kaedah tersebut! Reputasi -15%', 'crimson');
    }
  };

  // Bantuan Tilik Hikmah (50:50 buang 2 kaedah salah)
  const handleUseTilikHikmah = () => {
    if (!activeNpc || hikmahMana <= 0 || hiddenSkillIds.length > 0) return;
    const correctNota = getNotaById(activeNpc.notaId);
    const wrongSkills = skillOptions
      .filter((s) => s.id !== correctNota.id)
      .slice(0, 2)
      .map((s) => s.id);
    setHiddenSkillIds(wrongSkills);
    setHikmahMana((m) => m - 1);
    triggerToast('🔮 Tilik Hikmah mengaburkan 2 kaedah yang kurang tepat!', 'gold');
  };

  // Gelaran Pangkat Pengembara mengikut XP & Misi Selesai
  const playerRank = useMemo(() => {
    const count = solvedNpcIds.length;
    if (count >= 16) return '🌟 Mufti Agung Tamadun (Master Qawaid)';
    if (count >= 10) return '⚖️ Qadi Wilayah (Penyelesai Ulung)';
    if (count >= 5) return '📜 Musafir Faqih (Pengembara Mahir)';
    return '🧭 Thalib Pengembara (Perantis Hikmah)';
  }, [solvedNpcIds.length]);

  const totalQuests = useMemo(
    () => SENARAI_WILAYAH.reduce((acc, w) => acc + w.npcs.length, 0),
    []
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* ====================================================================
          BAR ATAS KOMPAK: HUD PENGEMBARA + PEMILIH WILAYAH
         ==================================================================== */}
      <div
        className="glass-card"
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--r-xl)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          border: `1px solid ${currentWilayah.warnaUtama}44`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span
                className="lg-node-chip"
                style={{
                  background: currentWilayah.warnaLatar,
                  color: currentWilayah.warnaUtama,
                  borderColor: `${currentWilayah.warnaUtama}55`,
                }}
              >
                {currentWilayah.ikonWilayah} {currentWilayah.gelaran}
              </span>
              <span className="lg-node-chip">{playerRank}</span>
            </div>
            <h2
              style={{
                margin: '4px 0 0',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--text-strong)',
              }}
            >
              Kembara Qawaid: {currentWilayah.nama}
            </h2>
          </div>

          {/* Stat Bars: Reputasi, Misi Selesai, XP & Buku Skill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div
              className="lg-inner-well"
              style={{ padding: '6px 12px', minWidth: '135px' }}
              title="Nilai Reputasi Pengembara. Jika memilih kaedah yang salah, NPC akan menolak dan reputasi menurun."
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  marginBottom: '3px',
                }}
              >
                <span>🛡️ REPUTASI</span>
                <span
                  style={{
                    color:
                      reputation >= 70
                        ? '#34d399'
                        : reputation >= 40
                        ? '#fbbf24'
                        : '#f87171',
                  }}
                >
                  {reputation}%
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  borderRadius: '999px',
                  background: 'rgba(148, 163, 184, 0.2)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${reputation}%`,
                    height: '100%',
                    background:
                      reputation >= 70
                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                        : reputation >= 40
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #ef4444, #f87171)',
                    transition: 'width 0.35s ease',
                  }}
                />
              </div>
            </div>

            <div className="lg-inner-well" style={{ padding: '6px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                MISI
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-strong)' }}>
                📜 {solvedNpcIds.length}/{totalQuests}
              </div>
            </div>

            <div className="lg-inner-well" style={{ padding: '6px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                XP
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fbbf24' }}>
                ✨ {xp.toLocaleString()}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSkillBook(true)}
              className="lg-btn-primary"
              style={{ padding: '8px 12px', fontSize: '0.76rem' }}
            >
              <span>📖 Kitab Skill ({dataNotaLengkap.length})</span>
            </button>
          </div>
        </div>

        {/* Pemilih Wilayah & Jana Peta Rawak dalam Bar Sama */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px',
            paddingTop: '8px',
            borderTop: '1px solid var(--card-divider)',
          }}
        >
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {SENARAI_WILAYAH.map((w, idx) => {
              const selesaiWilayah = w.npcs.filter((n) =>
                solvedNpcIds.includes(n.npcId)
              ).length;
              const isCurrent = idx === wilayahIdx;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setWilayahIdx(idx);
                    setMapSeed(1);
                    setPlayerPos({ r: 1, c: 1 });
                    setRecentPath([]);
                  }}
                  className={isCurrent ? 'lg-btn-primary' : 'lg-btn-glass'}
                  style={{ fontSize: '0.72rem', padding: '5px 10px' }}
                >
                  <span>
                    {w.ikonWilayah} {w.nama.split('(')[0].trim()} ({selesaiWilayah}/
                    {w.npcs.length})
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setMapSeed((s) => s + 1);
              setPlayerPos({ r: 1, c: 1 });
              setRecentPath([]);
              triggerToast('🗺️ Peta rawak baharu telah dijana!', 'cyan');
            }}
            className="lg-btn-glass"
            style={{ fontSize: '0.72rem', padding: '5px 10px' }}
          >
            <span>🎲 Peta Rawak</span>
          </button>
        </div>
      </div>

      {/* Toast Makluman Pengembaraan */}
      {toastMsg && (
        <div
          className="lg-inner-well"
          style={{
            padding: '8px 14px',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '0.82rem',
            border: '1px solid rgba(251, 191, 36, 0.45)',
            color: 'var(--text-strong)',
          }}
        >
          {toastMsg.text}
        </div>
      )}

      {/* ====================================================================
          ARENA UTAMA BERSEBELAHAN: PETA 2D (KIRI) & CONTROLLER DI ATAS (KANAN)
         ==================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '12px',
          alignItems: 'start',
        }}
      >
        {/* Peta Dunia 2D Interaktif (12x8) */}
        <div
          className="glass-card"
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--r-xl)',
            gridColumn: 'span 1',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <span className="lg-node-chip" style={{ whiteSpace: 'normal' }}>
              🗺️ PULAU DIORAMA 3D • SENTUH PETAK ATAU GUNA CONTROLLER
            </span>
            {nearbyNpc && (
              <button
                type="button"
                onClick={() => openNpcEncounter(nearbyNpc)}
                className="lg-btn-primary"
                style={{ padding: '4px 10px', fontSize: '0.72rem' }}
              >
                💬 Sapa {nearbyNpc.nama.split(' ')[0]}
              </button>
            )}
          </div>

          {/* Enjin Pulau 3D WebGL Sebenar (Three.js Low-Poly Diorama Island) */}
          <ThreeWorldMap
            mapGrid={mapGrid}
            playerPos={playerPos}
            facing={facing}
            wilayahIdx={wilayahIdx}
            mapSeed={mapSeed}
            solvedNpcIds={solvedNpcIds}
            onTileClick={handleThreeTileClick}
          />

          {/* Petunjuk Ikon Peta 3D (SVG Khusus Sepadan Objek 3D Sebenar) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px 14px',
              marginTop: '10px',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              alignItems: 'center',
            }}
          >
            {/* 1. Figur Pengembara: Serban Putih, Jubah Biru/Putih & Tongkat Emas */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                <ellipse cx="11" cy="21" rx="7" ry="1.8" stroke="#38bdf8" strokeWidth="1.4" />
                <path d="M6.2 20L8.6 11H13.4L15.8 20H6.2Z" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="0.6" />
                <path d="M9.4 20L10.1 11H11.9L12.6 20H9.4Z" fill="#f8fafc" />
                <ellipse cx="11" cy="11" rx="3" ry="1.1" fill="#fbbf24" />
                <circle cx="11" cy="7.8" r="2.2" fill="#f1c27d" />
                <ellipse cx="11" cy="6.1" rx="3.1" ry="1.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
                <path d="M8.2 6.4Q11 7.2 13.8 6.4" stroke="#fbbf24" strokeWidth="0.9" fill="none" />
                <line x1="17.5" y1="20" x2="18.5" y2="6.8" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
                <polygon points="18.5,3 20.6,5.4 18.5,7.8 16.4,5.4" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
              </svg>
              <span>Figur Pengembara</span>
            </span>

            {/* 2. Menara Kubah (Misi NPC): Bangunan Putih/Krem Berkubah Emas & Berlian */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                <rect x="4" y="18.5" width="16" height="3" rx="0.8" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.6" />
                <rect x="6.5" y="12.5" width="11" height="6" fill="#fefce8" stroke="#fde047" strokeWidth="0.6" />
                <path d="M10.2 18.5V15.2A1.8 1.8 0 0 1 13.8 15.2V18.5H10.2Z" fill="#0f172a" />
                <path d="M6.2 12.5A5.8 5.2 0 0 1 17.8 12.5H6.2Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.7" />
                <polygon points="12,1.6 14.5,4.4 12,7.2 9.5,4.4" fill="#f59e0b" stroke="#fef08a" strokeWidth="0.7" />
              </svg>
              <span>Menara Kubah (Misi NPC)</span>
            </span>

            {/* 3. Kristal Emas / Hijau: Octahedron Berlian Dua Tona Emas & Zamrud */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                <polygon points="8.2,2.5 13,9.2 8.2,16 3.4,9.2" fill="#fbbf24" stroke="#fef08a" strokeWidth="0.7" />
                <polyline points="3.4,9.2 8.2,10.4 13,9.2" stroke="#b45309" strokeWidth="0.7" fill="none" />
                <polygon points="16.2,6.5 20.6,12.8 16.2,19 11.8,12.8" fill="#10b981" stroke="#a7f3d0" strokeWidth="0.7" />
                <polyline points="11.8,12.8 16.2,14 20.6,12.8" stroke="#047857" strokeWidth="0.7" fill="none" />
              </svg>
              <span>Kristal Emas / Hijau</span>
            </span>

            {/* 4. Kolam Oasis Hikmah: Petak Air Biru Firus dengan Kristal Kecil di Tengah */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                <polygon points="12,11 21,15.5 12,20 3,15.5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                <polygon points="12,12.5 18,15.5 12,18.5 6,15.5" fill="#38bdf8" fillOpacity="0.45" />
                <path d="M5.8 14.5Q5 9.8 6.8 6.5" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                <path d="M6.8 6.5L4 7.3M6.8 6.5L5 4.3M6.8 6.5L9.2 4.8M6.8 6.5L9.5 7.2" stroke="#10b981" strokeWidth="1.3" strokeLinecap="round" />
                <polygon points="13,5.2 15.4,8.5 13,11.8 10.6,8.5" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="0.7" />
              </svg>
              <span>Kolam Oasis Hikmah</span>
            </span>

            {/* 5. Gelung Portal 3D: Cincin Torus Ungu Neon Berlapis */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                <ellipse cx="12" cy="20.5" rx="6.5" ry="1.7" fill="#1e1b4b" stroke="#6366f1" strokeWidth="0.7" />
                <circle cx="12" cy="11" r="7.2" stroke="#9333ea" strokeWidth="2.8" />
                <circle cx="12" cy="11" r="7.2" stroke="#e9d5ff" strokeWidth="1" strokeDasharray="5 3" />
                <circle cx="12" cy="11" r="3" fill="#c084fc" stroke="#ffffff" strokeWidth="0.7" />
              </svg>
              <span>Gelung Portal 3D</span>
            </span>

            {/* 6. Puncak Batu Low-Poly: Bongkah Batu Poligon Bersegi Kelabu Gelap (#334155) */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                <polygon points="10.2,3.5 2.8,19.5 11.2,19.5" fill="#475569" stroke="#94a3b8" strokeWidth="0.6" strokeLinejoin="round" />
                <polygon points="10.2,3.5 11.2,19.5 17.2,19.5" fill="#334155" stroke="#64748b" strokeWidth="0.6" strokeLinejoin="round" />
                <polygon points="17.2,8.5 13.2,19.5 21.2,19.5" fill="#1e293b" stroke="#475569" strokeWidth="0.6" strokeLinejoin="round" />
              </svg>
              <span>Puncak Batu Low-Poly</span>
            </span>
          </div>
        </div>

        {/* Panel Kawalan Navigasi & Senarai Misi NPC (Bersebelahan di Sebelah Kanan Atas) */}
        <div
          className="glass-card"
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--r-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Pad Navigasi D-Pad di Bahagian Paling Atas Panel Kanan */}
          <div
            className="lg-inner-well"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '10px 14px',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--text-strong)',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                🧭 Controller Pengembara
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Gunakan butang arah D-Pad ini atau kekunci <strong>WASD / Arrow</strong> untuk bergerak ke arah NPC.
              </div>
              {nearbyNpc && (
                <button
                  type="button"
                  onClick={() => openNpcEncounter(nearbyNpc)}
                  className="lg-btn-primary"
                  style={{ marginTop: '8px', fontSize: '0.74rem', padding: '6px 12px' }}
                >
                  <span>💬 Sapa {nearbyNpc.nama}</span>
                </button>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 40px)',
                gap: '5px',
                flexShrink: 0,
              }}
            >
              <div />
              <button
                type="button"
                onClick={() => movePlayer(-1, 0)}
                className="lg-btn-glass"
                style={{ justifyContent: 'center', height: '36px', padding: 0 }}
              >
                ▲
              </button>
              <div />
              <button
                type="button"
                onClick={() => movePlayer(0, -1)}
                className="lg-btn-glass"
                style={{ justifyContent: 'center', height: '36px', padding: 0 }}
              >
                ◀
              </button>
              <button
                type="button"
                disabled={!nearbyNpc}
                onClick={() => nearbyNpc && openNpcEncounter(nearbyNpc)}
                className={nearbyNpc ? 'lg-btn-primary' : 'lg-btn-glass'}
                style={{
                  justifyContent: 'center',
                  height: '36px',
                  padding: 0,
                  fontSize: '0.72rem',
                }}
                title="Berinteraksi dengan NPC bersebelahan"
              >
                💬
              </button>
              <button
                type="button"
                onClick={() => movePlayer(0, 1)}
                className="lg-btn-glass"
                style={{ justifyContent: 'center', height: '36px', padding: 0 }}
              >
                ▶
              </button>
              <div />
              <button
                type="button"
                onClick={() => movePlayer(1, 0)}
                className="lg-btn-glass"
                style={{ justifyContent: 'center', height: '36px', padding: 0 }}
              >
                ▼
              </button>
              <div />
            </div>
          </div>

          {/* Senarai Misi / NPC di Wilayah Semasa */}
          <div>
            <h3
              style={{
                margin: '0 0 8px',
                fontSize: '0.88rem',
                fontWeight: 800,
                color: 'var(--text-strong)',
              }}
            >
              📋 Watak NPC di {currentWilayah.nama.split('(')[0].trim()}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentWilayah.npcs.map((npc) => {
                const isSolved = solvedNpcIds.includes(npc.npcId);
                const isNearby = nearbyNpc?.npcId === npc.npcId;
                const nota = getNotaById(npc.notaId);
                return (
                  <div
                    key={npc.npcId}
                    className="lg-inner-well"
                    style={{
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px',
                      borderLeft: isSolved
                        ? '3px solid #10b981'
                        : '3px solid #f59e0b',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          color: 'var(--text-strong)',
                        }}
                      >
                        {npc.ikon} {npc.nama}{' '}
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          ({npc.peranan})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                        {isSolved
                          ? `✅ Selesai: ${nota.tajuk.split('(')[0].trim()}`
                          : '❗ Gerakkan watak menghampiri NPC ini di peta'}
                      </div>
                    </div>
                    {isNearby ? (
                      <button
                        type="button"
                        onClick={() => openNpcEncounter(npc)}
                        className="lg-btn-primary"
                        style={{ fontSize: '0.74rem', padding: '6px 10px', flexShrink: 0 }}
                      >
                        <span>💬 Sapa</span>
                      </button>
                    ) : (
                      <span
                        className="lg-node-chip"
                        style={{ flexShrink: 0, opacity: 0.8 }}
                      >
                        {isSolved ? '✓ Selesai' : '🧭 Guna Controller'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODAL PERTEMBUNGAN NPC: DIALOG DILEMA & SKILL/MAGIS dataNotaLengkap
         ==================================================================== */}
      {activeNpc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(2, 6, 23, 0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '780px',
              width: '100%',
              padding: '24px',
              borderRadius: 'var(--r-xl)',
              border: '1px solid rgba(251, 191, 36, 0.45)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Header Watak NPC */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--card-divider)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: currentWilayah.warnaLatar,
                    border: `1px solid ${currentWilayah.warnaUtama}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.85rem',
                  }}
                >
                  {activeNpc.ikon}
                </div>
                <div>
                  <span className="lg-node-chip">
                    {currentWilayah.nama} • MISI PENYELESAI MASALAH
                  </span>
                  <h3
                    style={{
                      margin: '4px 0 0',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: 'var(--text-strong)',
                    }}
                  >
                    {activeNpc.nama} — {activeNpc.peranan}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveNpc(null)}
                className="lg-btn-glass"
              >
                <span>Kembali ke Peta ✕</span>
              </button>
            </div>

            {/* Kotak Dialog Dilema Harian NPC */}
            <div
              className="lg-inner-well"
              style={{
                marginTop: '16px',
                padding: '16px 18px',
                borderLeft: `4px solid ${currentWilayah.warnaUtama}`,
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: currentWilayah.warnaUtama,
                  marginBottom: '6px',
                }}
              >
                🗣️ Keluhan &amp; Konflik {activeNpc.nama}:
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.94rem',
                  lineHeight: 1.7,
                  color: 'var(--text-strong)',
                }}
              >
                {activeNpc.dialogMasalah}
              </p>
            </div>

            {/* Maklum Balas Jika Salah Pilih Kaedah (NPC Menolak & Reputasi Menurun) */}
            {encounterStatus === 'REJECTED' && (
              <div
                className="lg-inner-well"
                style={{
                  marginTop: '14px',
                  padding: '14px 16px',
                  border: '1px solid rgba(248, 113, 113, 0.6)',
                  background: 'rgba(239, 68, 68, 0.14)',
                }}
              >
                <div style={{ fontWeight: 800, color: '#f87171', marginBottom: '4px' }}>
                  ❌ Penyelesaian Ditolak oleh {activeNpc.nama}! (Reputasi Semasa: {reputation}%)
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.6 }}>
                  {rejectionMessage}
                </p>
              </div>
            )}

            {/* Maklum Balas Jika Berjaya Selesaikan Konflik */}
            {encounterStatus === 'SUCCESS' ? (
              <div
                className="lg-inner-well"
                style={{
                  marginTop: '16px',
                  padding: '18px',
                  border: '1px solid rgba(52, 211, 153, 0.6)',
                  background: 'rgba(16, 185, 129, 0.14)',
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: '#34d399',
                    marginBottom: '6px',
                  }}
                >
                  ✨ Konflik Selesai! {activeNpc.nama} Menerima Penyelesaian Anda (+150 XP)
                </div>
                <p
                  style={{
                    margin: '0 0 12px',
                    fontSize: '0.9rem',
                    lineHeight: 1.65,
                    color: 'var(--text-strong)',
                  }}
                >
                  {activeNpc.dialogBerjaya}
                </p>

                {(() => {
                  const notaBetul = getNotaById(activeNpc.notaId);
                  return (
                    <div
                      className="lg-inner-well"
                      style={{ padding: '12px 14px', marginBottom: '14px' }}
                    >
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                        }}
                      >
                        SKILL KAEDAH FIQH YANG DIGUNAKAN:
                      </div>
                      <div
                        dir="rtl"
                        style={{
                          fontFamily: '"Noto Naskh Arabic", serif',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: 'var(--text-strong)',
                          margin: '4px 0',
                        }}
                      >
                        {notaBetul.tajukArab || notaBetul.tajuk}
                      </div>
                      {notaBetul.tajukBm && (
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
                          &ldquo;{notaBetul.tajukBm}&rdquo;
                        </div>
                      )}
                      <p style={{ margin: '4px 0', fontSize: '0.83rem' }}>
                        <strong>Huraian:</strong> {notaBetul.huraian}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '0.83rem' }}>
                        <strong>Syarat &amp; Pengecualian:</strong> {notaBetul.syarat}
                      </p>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveNpc(null)}
                    className="lg-btn-primary"
                  >
                    <span>Teruskan Pengembaraan di Peta →</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Senarai Pilihan Skill / Magis Qawaid (dataNotaLengkap) */
              <div style={{ marginTop: '18px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-strong)' }}>
                    ⚡ Pilih Skill / Magis Kaedah Fiqh (daripada Nota Lengkap):
                  </span>
                  <button
                    type="button"
                    disabled={hikmahMana <= 0 || hiddenSkillIds.length > 0}
                    onClick={handleUseTilikHikmah}
                    className="lg-btn-glass"
                    style={{ fontSize: '0.75rem' }}
                  >
                    <span>🔮 Tilik Hikmah 50:50 ({hikmahMana} Baki)</span>
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {skillOptions.map((skill) => {
                    const isHidden = hiddenSkillIds.includes(skill.id);
                    const isInspecting = inspectSkillId === skill.id;
                    if (isHidden) {
                      return (
                        <div
                          key={skill.id}
                          className="lg-inner-well"
                          style={{
                            opacity: 0.35,
                            padding: '14px',
                            textAlign: 'center',
                            fontSize: '0.8rem',
                          }}
                        >
                          🌫️ Kaedah ini telah disingkirkan oleh Tilik Hikmah
                        </div>
                      );
                    }

                    return (
                      <div
                        key={skill.id}
                        className="lg-inner-well"
                        style={{
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px',
                          border: '1px solid var(--card-divider)',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '6px',
                            }}
                          >
                            <span className="lg-node-chip">
                              ✨ {skill.kategori}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setInspectSkillId(isInspecting ? null : skill.id)
                              }
                              className="lg-btn-glass"
                              style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                            >
                              <span>{isInspecting ? 'Tutup Nota' : '📖 Nota Skill'}</span>
                            </button>
                          </div>

                          <div
                            dir="rtl"
                            style={{
                              fontFamily: '"Noto Naskh Arabic", serif',
                              fontSize: '1.15rem',
                              fontWeight: 700,
                              lineHeight: 1.75,
                              color: 'var(--text-strong)',
                            }}
                          >
                            {skill.tajuk}
                          </div>

                          {isInspecting && (
                            <div
                              style={{
                                marginTop: '8px',
                                paddingTop: '8px',
                                borderTop: '1px solid var(--card-divider)',
                                fontSize: '0.78rem',
                                lineHeight: 1.55,
                                color: 'var(--text-body)',
                              }}
                            >
                              <div>
                                <strong>Huraian:</strong> {skill.huraian}
                              </div>
                              <div style={{ marginTop: '4px' }}>
                                <strong>Syarat:</strong> {skill.syarat}
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCastSkill(skill)}
                          className="lg-btn-primary"
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          <span>⚡ Gunakan Skill Kaedah Ini</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL KITAB SKILL PENGEMBARA (Semua dataNotaLengkap)
         ==================================================================== */}
      {showSkillBook && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(2, 6, 23, 0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '840px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '22px',
              borderRadius: 'var(--r-xl)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--card-divider)',
                marginBottom: '14px',
              }}
            >
              <div>
                <span className="lg-node-chip">GRIMOIRE HIKMAH PENGEMBARA</span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.15rem', fontWeight: 800 }}>
                  📖 Kitab Skill Qawaid ({dataNotaLengkap.length} Nota Lengkap)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSkillBook(false)}
                className="lg-btn-glass"
              >
                <span>Tutup ✕</span>
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '12px',
              }}
            >
              {dataNotaLengkap.map((nota) => (
                <div key={nota.id} className="lg-inner-well" style={{ padding: '12px 14px' }}>
                  <span className="lg-node-chip" style={{ marginBottom: '6px' }}>
                    {nota.kategori}
                  </span>
                  <div
                    dir="rtl"
                    style={{
                      fontFamily: '"Noto Naskh Arabic", serif',
                      fontSize: '1.08rem',
                      fontWeight: 700,
                      color: 'var(--text-strong)',
                      marginBottom: '4px',
                    }}
                  >
                    {nota.tajukArab || nota.tajuk}
                  </div>
                  {nota.tajukBm && (
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
                      &ldquo;{nota.tajukBm}&rdquo;
                    </div>
                  )}
                  <p style={{ margin: '0 0 6px', fontSize: '0.78rem', lineHeight: 1.55 }}>
                    {nota.huraian}
                  </p>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <strong>Aplikasi:</strong> {nota.aplikasi}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
