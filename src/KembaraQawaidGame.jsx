// qawaid-explorer/src/KembaraQawaidGame.jsx
// Permainan RPG Open-World 2D:
// Kembara Qawaid: "Penyelesai Masalah" — Menggunakan dataNotaLengkap sebagai Skill/Magis Hikmah

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { dataNotaLengkap } from './dataNota';
import ThreeWorldMap from './ThreeWorldMap';

// Enjin Bunyi Web Audio API bertema Pengembaraan / RPG Timur Tengah (FASA 3)
function createRpgSoundEngine(getIsMuted = () => false) {
  let ctx = null;
  const getCtx = () => {
    if (getIsMuted()) return null;
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
    // 1. Langkah Kaki (Organic Earthy Click / Step)
    playStep() {
      const audio = getCtx();
      if (!audio) return;
      const t = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const filter = audio.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(175, t);
      osc.frequency.exponentialRampToValueAtTime(75, t + 0.05);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      gain.gain.setValueAtTime(0.045, t);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.055);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audio.destination);

      osc.start(t);
      osc.stop(t + 0.055);
    },

    // 2. Sapaan NPC (Oud / Bell Arpeggio Timur Tengah: Bayati / Hijaz motif)
    playNpcGreet() {
      const audio = getCtx();
      if (!audio) return;
      const t = audio.currentTime;
      const notes = [293.66, 349.23, 440.0, 587.33];
      notes.forEach((freq, idx) => {
        const osc = audio.createOscillator();
        const osc2 = audio.createOscillator();
        const gain = audio.createGain();
        const start = t + idx * 0.055;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, start);

        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(audio.destination);

        osc.start(start);
        osc2.start(start);
        osc.stop(start + 0.22);
        osc2.stop(start + 0.22);
      });
    },

    // 3. Kemenangan Fatwa (Maqam Hijaz Triumph / Grand Ilmu Chord)
    playCastSuccess() {
      const audio = getCtx();
      if (!audio) return;
      const t = audio.currentTime;
      // Tangga nada Maqam Hijaz: D4, Eb4, F#4, G4, A4, D5
      const hijazScale = [293.66, 311.13, 369.99, 392.0, 440.0, 587.33];
      hijazScale.forEach((f, idx) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        const start = t + idx * 0.06;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, start);

        gain.gain.setValueAtTime(0.09, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(audio.destination);

        osc.start(start);
        osc.stop(start + 0.35);
      });

      // Akord penutup bercahaya (Harmonic Chord Pad at +0.38s)
      const chordNotes = [293.66, 369.99, 440.0, 587.33];
      chordNotes.forEach((f) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        const chordStart = t + 0.38;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, chordStart);

        gain.gain.setValueAtTime(0.07, chordStart);
        gain.gain.exponentialRampToValueAtTime(0.0005, chordStart + 0.65);

        osc.connect(gain);
        gain.connect(audio.destination);

        osc.start(chordStart);
        osc.stop(chordStart + 0.65);
      });
    },

    // 4. Penolakan Hujah (Low Dissonant Sanggahan / Thud)
    playCastReject() {
      const audio = getCtx();
      if (!audio) return;
      const t = audio.currentTime;
      [185.0, 155.56, 123.47].forEach((f, idx) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        const filter = audio.createBiquadFilter();
        const start = t + idx * 0.07;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, start);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, start);

        gain.gain.setValueAtTime(0.09, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audio.destination);

        osc.start(start);
        osc.stop(start + 0.22);
      });
    },

    // 5. Pemulihan Oasis (Cascading Soothing Water Drops)
    playOasis() {
      const audio = getCtx();
      if (!audio) return;
      const t = audio.currentTime;
      const dropFreqs = [880.0, 1174.66, 1396.91, 1760.0];
      dropFreqs.forEach((freq, idx) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        const start = t + idx * 0.075;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 0.8, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.3, start + 0.04);
        osc.frequency.exponentialRampToValueAtTime(freq, start + 0.18);

        gain.gain.setValueAtTime(0.065, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

        osc.connect(gain);
        gain.connect(audio.destination);

        osc.start(start);
        osc.stop(start + 0.2);
      });
    },

    // 6. Portal Magis (Ethereal Cosmic Whistle & Warp)
    playPortal() {
      const audio = getCtx();
      if (!audio) return;
      const t = audio.currentTime;

      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const filter = audio.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.35);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(440, t);
      filter.frequency.exponentialRampToValueAtTime(1200, t + 0.35);
      filter.Q.value = 3.0;

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audio.destination);

      osc.start(t);
      osc.stop(t + 0.42);

      // Sparkling chime burst at portal exit
      [659.25, 880.0, 1046.5, 1318.51].forEach((f, idx) => {
        const chimeOsc = audio.createOscillator();
        const chimeGain = audio.createGain();
        const chimeStart = t + 0.28 + idx * 0.04;

        chimeOsc.type = 'triangle';
        chimeOsc.frequency.setValueAtTime(f, chimeStart);

        chimeGain.gain.setValueAtTime(0.06, chimeStart);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, chimeStart + 0.25);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(audio.destination);

        chimeOsc.start(chimeStart);
        chimeOsc.stop(chimeStart + 0.25);
      });
    },

    // 7. FASA 4: Tiupan Nafiri Kemenangan Boss & Pengurniaan Mohor Sanad
    playBossFanfare() {
      const audio = getCtx();
      if (!audio) return;
      const t = audio.currentTime;
      // Motif Diraja: C4, G4, C5, E5, G5
      const fanfareNotes = [261.63, 392.0, 523.25, 659.25, 783.99];
      fanfareNotes.forEach((freq, idx) => {
        const osc = audio.createOscillator();
        const osc2 = audio.createOscillator();
        const gain = audio.createGain();
        const start = t + idx * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(audio.destination);

        osc.start(start);
        osc2.start(start);
        osc.stop(start + 0.35);
        osc2.stop(start + 0.35);
      });

      // Akord kemuncak agung pada +0.58 saat
      const grandChord = [523.25, 659.25, 783.99, 1046.5];
      grandChord.forEach((f) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        const chordStart = t + 0.58;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, chordStart);

        gain.gain.setValueAtTime(0.09, chordStart);
        gain.gain.exponentialRampToValueAtTime(0.0005, chordStart + 1.2);

        osc.connect(gain);
        gain.connect(audio.destination);

        osc.start(chordStart);
        osc.stop(chordStart + 1.2);
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
  {
    id: 'FPQS',
    nama: 'Lembah Ilmu FPQS (USIM)',
    gelaran: 'Wilayah 6 • Fakulti Pengajian Quran & Sunnah (USIM)',
    era: 'Era Kontemporari Kampus Barakah',
    temaKaedah: 'Integrasi Naqli & Aqli dalam Qawaid Fiqhiyyah Kontemporari',
    warnaUtama: '#22c55e',
    warnaLatar: 'rgba(34, 197, 94, 0.14)',
    ikonWilayah: '🎓',
    deskripsi:
      'Lembah keilmuan kontemporari di USIM Nilai. Menyepadukan turath qawaid fiqhiyyah dengan kemajuan penyelidikan di Makmal Tarannum, Makmal Hadis, Makmal Braille, dan Pejabat Dekanat FPQS.',
    npcs: [
      {
        npcId: 'NPC-FPQS-1',
        nama: 'Dr Anwar Hussein & PM Dr Khairul Amri',
        peranan: 'Makmal Tarannum & Qiraat',
        ikon: '🎙️',
        jenis: 'MAKMAL',
        makmalType: 'TARANNUM',
        notaId: 'KP-15',
        dialogMasalah:
          '“Ahlan! Suara yang merdu itu anugerah, tetapi hukum tetap hukum. Ada seorang qari sedang berlatih tarannum dengan suara yang sangat kuat di dalam masjid pada pukul 3 pagi, sehingga mengganggu orang awam dan jemaah yang sedang iktikaf dan solat sunat. Apakah kaedah fiqh yang paling tepat untuk menegur situasi ini?”',
        dialogBerjaya:
          '“Tepat sekali! Menghapuskan kemudaratan dan gangguan terhadap jemaah lain yang sedang beribadah adalah wajib, walau seindah mana pun alunan tarannum tersebut!”',
        dialogTolak:
          '“Hujah kaedah anda belum tepat untuk menegur situasi gangguan ibadah di masjid ini. Sila semak semula rujukan kitab!”',
      },
      {
        npcId: 'NPC-FPQS-2',
        nama: 'Dr Helmy Arif & Dr Shamsudin Yani',
        peranan: 'Makmal Hadis & Pelayan Digital',
        ikon: '📚',
        jenis: 'MAKMAL',
        makmalType: 'HADIS',
        notaId: 'KP-18',
        dialogMasalah:
          '“Zaman sekarang maklumat di hujung jari. Seseorang terjumpa satu hadis tentang fadhilat beramal yang sangat dahsyat di WhatsApp. Dia tidak pasti status hadis itu palsu atau tidak, tetapi dia mahu terus sebarkan dengan alasan \'untuk mengajak orang buat baik\' (Jalbul Masalih). Apakah kaedah fiqh yang sepatutnya menjadi penghalang tindakannya?”',
        dialogBerjaya:
          '“Muntaz! Tepat sekali. Mencegah kerosakan (mafsadah) menyebarkan hadis palsu dan berdusta atas nama Nabi SAW jauh lebih utama daripada mengejar manfaat (maslahah) mengajak orang beramal!”',
        dialogTolak:
          '“Jawapan ini belum tepat. Ingat prinsip pertembungan antara menolak kerosakan dan meraih kemaslahatan!”',
      },
      {
        npcId: 'NPC-FPQS-3',
        nama: 'Prof Noor Najihah & Dr Noor Atirah',
        peranan: 'Makmal Braille & Aksesibiliti Quran',
        ikon: '⠃',
        jenis: 'MAKMAL',
        makmalType: 'BRAILLE',
        notaId: 'KP-16',
        dialogMasalah:
          '“Golongan OKU penglihatan juga mahu mendalami ilmu. Seorang pelajar buta di negara luar terpaksa menggunakan khidmat \'Anjing Pandu Arah\' (Guide Dog) untuk membantunya berjalan masuk ke perkarangan dewan kuliah kerana tiada sesiapa yang boleh menuntunnya, dan laluan di situ berbahaya. Apakah kaedah cabang yang membenarkan situasi ini?”',
        dialogBerjaya:
          '“Subhanallah, tepat sekali! Kaedah cabang «الضرورات تبيح المحظورات» membenarkan perkara yang asalnya dilarang kerana darurat menjaga keselamatan nyawa dan akses ilmu bagi golongan OKU penglihatan.”',
        dialogTolak:
          '“Pilihan kaedah anda belum menepati kaedah cabang yang membenarkan perkara yang asalnya dilarang demi menjaga keselamatan. Cuba lagi!”',
      },
      {
        npcId: 'NPC-FPQS-4',
        nama: 'Prof Madya Dr Zuhdi Ameen',
        peranan: 'Dekan FPQS (Pejabat Dekan & Foyer)',
        ikon: '🏛️',
        jenis: 'BOSS',
        makmalType: 'DEKAN',
        notaId: 'KP-20',
        dialogMasalah:
          '“Untuk menyiapkan tesis yang sangat penting menjelang tarikh tutup (due date) esok, seorang pelajar telah menggodam dan memuat turun artikel-artikel jurnal Turath berbayar (langganan ratusan ringgit) secara haram menggunakan sistem AI dan bot. Dia mendakwa dia berada dalam keadaan \'terdesak\' untuk menyebarkan ilmu Islam dan mahu cepat bergraduasi demi keluarganya, lantas menghalalkan tindakan godaman tersebut. Mengapa alasan \'keterdesakan\' pelajar ini tertolak di sisi Qawaid Fiqhiyyah?”',
        dialogBerjaya:
          '“Muntaz! Penguasaan anda terhadap kaedah «الحاجة تنزل منزلة الضرورة» sungguh mendalam! Hajah mestilah bersifat umum atau darurat muktabar yang tidak melanggar hak orang lain, bukannya keterdesakan individu yang membenarkan jenayah godaman harta intelek.”',
        dialogTolak:
          '“Kefahaman anda belum tepat tentang batas dan syarat pemakaian kaedah keterdesakan (Hajah & Darurat) dalam isu hak harta intelek ini. Sila teliti semula!”',
      },
      {
        npcId: 'NPC-FPQS-5',
        nama: 'Ebadullah & Ali Shahril',
        peranan: 'Bilik Nadi PMFPQS (Bilik Rahsia Pelajar)',
        ikon: '⭐',
        jenis: 'EASTER_EGG',
        makmalType: 'BILIK_NADI',
        notaId: 'KP-05',
        dialogMasalah:
          '“Assalamualaikum! Singgah Bilik Nadi rupanya. Dah ready nak hadap Dekan kejap lagi? Relaks je, baca soalan tu betul-betul. Ingat balik apa yang kita bincang masa study group haritu.”',
        dialogBerjaya:
          '“Terima kasih singgah di Bilik Nadi PMFPQS! Semoga ukhuwah dan semangat persatuan ini memulihkan tenaga anda!”',
        dialogTolak:
          '“Semoga berjaya melengkapkan kembara di Lembah Ilmu FPQS!”',
      },
    ],
  },
];

// Konfigurasi Ganjaran Mohor Sanad 5 Wilayah Tamadun (FASA 4)
const MOHOR_SANAD_INFO = {
  BAGHDAD: {
    id: 'BAGHDAD',
    namaMohor: 'Mohor Sanad Darul Salam (Baghdad)',
    wilayahNama: 'Kota Baghdad',
    gelaranSanad: 'Sanad Al-Umur Bi Maqasidiha & Ijtihad Tamadun',
    tokohPemberi: 'Peniaga Sutera Basrah (Hakim Muamalat)',
    kaedahUtama: 'الأمور بمقاصدها (Segala Perkara Mengikut Niat & Tujuannya)',
    kaedahArab: 'الأمور بمقاصدها',
    kaedahBm: 'Segala Perkara Mengikut Tujuannya',
    huraian:
      'Ijazah Sanad keilmuan yang memperakui kefahaman mendalam terhadap motif akad, niat ibadah serta muamalat, dan maqasid syariah di kota tamadun Baghdad.',
    ikon: '📜',
    warna: '#f59e0b',
    borderWarna: 'rgba(245, 158, 11, 0.7)',
    cahayaWarna: 'rgba(245, 158, 11, 0.25)',
    bgGradient: 'linear-gradient(135deg, rgba(180, 83, 9, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)',
    mohorSimbol: '⚖️',
    motto: '« نِيَّةُ الْمُؤْمِنِ خَيْرٌ مِنْ عَمَلِهِ »',
  },
  DAMSYIK: {
    id: 'DAMSYIK',
    namaMohor: 'Mohor Sanad Al-Syam (Damsyik)',
    wilayahNama: 'Kota Damsyik',
    gelaranSanad: 'Sanad Al-Yaqin La Yazulu Bi Al-Syakk & Bayyinah Mahkamah',
    tokohPemberi: 'Hakim Al-Maqdisi (Qadi Mahkamah Mazalim)',
    kaedahUtama: 'اليقين لا يزول بالشك (Keyakinan Tidak Dihilangkan Oleh Keraguan)',
    kaedahArab: 'اليقين لا يزول بالشك',
    kaedahBm: 'Keyakinan Tidak Dihilangkan Oleh Keraguan',
    huraian:
      'Ijazah Sanad kehakiman yang membuktikan kemahiran memelihara hak asal (Istishab), beban pembuktian syarak, serta menolak keraguan dalam pertikaian hukum.',
    ikon: '🏛️',
    warna: '#38bdf8',
    borderWarna: 'rgba(56, 189, 248, 0.7)',
    cahayaWarna: 'rgba(56, 189, 248, 0.25)',
    bgGradient: 'linear-gradient(135deg, rgba(14, 116, 144, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)',
    mohorSimbol: '🛡️',
    motto: '« الْبَيِّنَةُ عَلَى الْمُدَّعِي وَالْيَمِينُ عَلَى مَنْ أَنْكَرَ »',
  },
  HIJAZ: {
    id: 'HIJAZ',
    namaMohor: 'Mohor Sanad Al-Haramain (Hijaz)',
    wilayahNama: 'Laluan Hijaz & Sinai',
    gelaranSanad: 'Sanad Al-Masyaqqah Tajlibu Al-Taysir & Fiqh Rukhsoh',
    tokohPemberi: 'Saudagar Khemah Badwi (Ketua Kafilah Gurun)',
    kaedahUtama: 'المشقة تجلب التيسير (Kesukaran Menarik Kemudahan)',
    kaedahArab: 'المشقة تجلب التيسير',
    kaedahBm: 'Kesukaran Membawa Kemudahan',
    huraian:
      'Ijazah Sanad musafir yang mengesahkan penguasaan fiqh rukhsoh, darurat musafir, dan had kelonggaran syariat di padang pasir tandus.',
    ikon: '⛺',
    warna: '#fb923c',
    borderWarna: 'rgba(251, 146, 60, 0.7)',
    cahayaWarna: 'rgba(251, 146, 60, 0.25)',
    bgGradient: 'linear-gradient(135deg, rgba(194, 65, 12, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)',
    mohorSimbol: '☀️',
    motto: '« إِنَّ الدِّينَ يُسْرٌ »',
  },
  KAHERAH: {
    id: 'KAHERAH',
    namaMohor: 'Mohor Sanad Al-Azhar (Kaherah)',
    wilayahNama: 'Bimaristan Kaherah',
    gelaranSanad: 'Sanad Al-Dharar Yuzal & Perlindungan Maslahat Awam',
    tokohPemberi: 'Wazir Perbendaharaan Mesir (Penguasa Hisbah)',
    kaedahUtama: 'الضرر يزال (Kemudaratan Hendaklah Dihilangkan)',
    kaedahArab: 'الضرر يزال',
    kaedahBm: 'Kemudaratan Hendaklah Dihapuskan',
    huraian:
      'Ijazah Sanad hisbah dan kebajikan awam yang membuktikan kepakaran menghapuskan mudarat perubatan, pasaran, monopoli, serta membendung kerosakan komuniti.',
    ikon: '🏥',
    warna: '#10b981',
    borderWarna: 'rgba(16, 185, 129, 0.7)',
    cahayaWarna: 'rgba(16, 185, 129, 0.25)',
    bgGradient: 'linear-gradient(135deg, rgba(4, 120, 87, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)',
    mohorSimbol: '🌿',
    motto: '« لَا ضَرَرَ وَلَا ضِرَارَ »',
  },
  ANDALUSIA: {
    id: 'ANDALUSIA',
    namaMohor: 'Mohor Sanad Qurtubah & Granada (Andalusia)',
    wilayahNama: 'Pelabuhan Andalusia',
    gelaranSanad: 'Sanad Al-Adah Muhakkamah & Fiqh Maritim Antarabangsa',
    tokohPemberi: 'Hakim Mahkamah Maritim (Qadi Pelabuhan)',
    kaedahUtama: 'العادة محكمة (Adat Kebiasaan Dijadikan Rujukan Hukum)',
    kaedahArab: 'العادة محكمة',
    kaedahBm: 'Adat Menjadi Hukum',
    huraian:
      'Ijazah Sanad perniagaan merentas samudera yang mengiktiraf kepakaran mentafsirkan uruf tempatan, syarat tersirat pedagang antarabangsa, dan perubahan fatwa zaman.',
    ikon: '⚓',
    warna: '#c084fc',
    borderWarna: 'rgba(192, 132, 252, 0.7)',
    cahayaWarna: 'rgba(192, 132, 252, 0.25)',
    bgGradient: 'linear-gradient(135deg, rgba(126, 34, 206, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)',
    mohorSimbol: '👑',
    motto: '« الْمَعْرُوفُ عُرْفًا كَالْمَشْرُوطِ شَرْطًا »',
  },
  FPQS: {
    id: 'FPQS',
    namaMohor: 'Mohor Sanad Lembah Ilmu FPQS (USIM)',
    wilayahNama: 'Lembah Ilmu FPQS (USIM)',
    gelaranSanad: 'Sanad Integrasi Naqli & Aqli FPQS',
    tokohPemberi: 'Prof Madya Dr Zuhdi Ameen (Dekan FPQS)',
    kaedahUtama: 'العلم يرفع بيتا لا عماد له (Integrasi Naqli & Aqli)',
    kaedahArab: 'العِلْمُ يَرْفَعُ بَيْتًا لَا عِمَادَ لَهُ',
    kaedahBm: 'Puncak Integrasi Wahyu dan Sains Kemanusiaan',
    huraian:
      'Ijazah Sanad keilmuan agung yang mengiktiraf penguasaan integrasi ilmu Naqli dan Aqli serta pengamalan qawaid fiqhiyyah dalam penyelidikan moden USIM.',
    ikon: '🎓',
    warna: '#22c55e',
    borderWarna: 'rgba(34, 197, 94, 0.75)',
    cahayaWarna: 'rgba(34, 197, 94, 0.28)',
    bgGradient: 'linear-gradient(135deg, rgba(21, 128, 61, 0.28) 0%, rgba(15, 23, 42, 0.95) 100%)',
    mohorSimbol: '🌟',
    motto: '« بِسْمِ اللهِ، تَوَكَّلْتُ عَلَى اللهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ »',
  },
};

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
  FPQS: {
    id: 'FPQS',
    className: 'biome-fpqs',
    nama: 'Lembah Ilmu FPQS',
    gelaran: 'Jubin Foyer & Rumput Kampus USIM',
    warnaAksen: '#22c55e',
  },
};

// Saiz Grid Peta 2D Open-World
const GRID_COLS = 12;
const GRID_ROWS = 8;

// Jana susun atur peta 2D secara prosedural/rawak mengikut Wilayah & seed
function generateOpenWorldMap(wilayah, seed = 1) {
  // Tata Letak Khusus Kampus FPQS USIM (Wilayah 6)
  if (wilayah.id === 'FPQS') {
    const grid = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => ({ type: 'FLOOR', npc: null, decor: null }))
    );

    // Dinding sempadan perimeter & planter box taman kampus
    const wallCoords = [
      { r: 0, c: 3 }, { r: 0, c: 7 }, { r: 2, c: 4 }, { r: 2, c: 7 },
      { r: 3, c: 2 }, { r: 3, c: 5 }, { r: 5, c: 4 }, { r: 5, c: 8 },
      { r: 7, c: 2 }, { r: 7, c: 5 }, { r: 7, c: 8 }
    ];
    wallCoords.forEach(({ r, c }) => {
      if (grid[r]?.[c]) grid[r][c].type = 'WALL';
    });

    // Lanskap pokok kampus & bunga mekar
    const gardenCoords = [
      { r: 2, c: 3, decor: '🌳' }, { r: 2, c: 5, decor: '🌿' },
      { r: 3, c: 7, decor: '🌸' }, { r: 4, c: 8, decor: '🌳' },
      { r: 6, c: 4, decor: '🌿' }, { r: 7, c: 3, decor: '🌳' },
    ];
    gardenCoords.forEach(({ r, c, decor }) => {
      if (grid[r]?.[c]) grid[r][c].decor = decor;
    });

    // Kafe Didi (Oasis moden pemulih tenaga di sebelah koridor makmal)
    grid[3][10] = { type: 'OASIS', npc: null, decor: '☕' };

    // 4 Checkpoint Utama & 1 Bilik Rahsia (NPC Placement)
    // 1. Makmal Tarannum (Dr Anwar Hussein & PM Dr Khairul Amri)
    if (wilayah.npcs[0]) grid[1][5] = { type: 'NPC', npc: wilayah.npcs[0], decor: null };
    // 2. Makmal Hadis (Dr Helmy Arif & Dr Shamsudin Yani)
    if (wilayah.npcs[1]) grid[1][9] = { type: 'NPC', npc: wilayah.npcs[1], decor: null };
    // 3. Makmal Braille (Prof Noor Najihah & Dr Noor Atirah)
    if (wilayah.npcs[2]) grid[5][2] = { type: 'NPC', npc: wilayah.npcs[2], decor: null };
    // 4. Pejabat Dekan - BOSS (Prof Madya Dr Zuhdi Ameen)
    if (wilayah.npcs[3]) grid[6][6] = { type: 'NPC', npc: wilayah.npcs[3], decor: null };
    // 5. Bilik Nadi PMFPQS - EASTER EGG (Ebadullah & Ali Shahril)
    if (wilayah.npcs[4]) grid[6][1] = { type: 'NPC', npc: wilayah.npcs[4], decor: null };

    // Portal Gerbang Tamat Kampus
    grid[6][10] = { type: 'PORTAL', npc: null, decor: '🌀' };

    // Pastikan koridor dan jalan pejalan kaki (walkways) sentiasa berhubung lancar
    const walkwayCoords = [
      // Dari Lobi (1,1) ke Makmal Tarannum (1,5) & Hadis (1,9)
      [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9],
      // Dari Hadis ke Kafe Didi (3,10)
      [2, 9], [3, 9], [3, 10],
      // Dari Lobi (1,1) terus ke Bilik Nadi (6,1)
      [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],
      // Cabang ke Makmal Braille (5,2)
      [4, 2], [5, 2],
      // Koridor tengah ke Pejabat Dekan (6,6)
      [4, 3], [4, 4], [4, 5], [4, 6], [5, 6], [6, 6],
      // Dari Pejabat Dekan ke Portal (6,10)
      [6, 7], [6, 8], [6, 9], [6, 10],
    ];
    walkwayCoords.forEach(([r, c]) => {
      if (grid[r]?.[c] && grid[r][c].type !== 'NPC' && grid[r][c].type !== 'OASIS' && grid[r][c].type !== 'PORTAL') {
        grid[r][c].type = 'FLOOR';
        grid[r][c].decor = null;
      }
    });

    return grid;
  }

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
  const [autoWalkTarget, setAutoWalkTarget] = useState(null); // 3D RPG Auto-Walk Target

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

  // FASA 4: Koleksi Mohor Sanad 5 Wilayah Tamadun (Simpanan Tempatan)
  const [sanadSeals, setSanadSeals] = useState(() => {
    try {
      const saved = localStorage.getItem('qawaid_sanad_seals');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('qawaid_sanad_seals', JSON.stringify(sanadSeals));
    } catch {}
  }, [sanadSeals]);

  const [showSanadAwardModal, setShowSanadAwardModal] = useState(null); // id wilayah e.g. 'BAGHDAD'
  const [showSanadGalleryModal, setShowSanadGalleryModal] = useState(false);

  // Pertembungan / Dialog NPC Semasa
  const [activeNpc, setActiveNpc] = useState(null);
  const [skillOptions, setSkillOptions] = useState([]);
  const [hiddenSkillIds, setHiddenSkillIds] = useState([]);
  const [inspectSkillId, setInspectSkillId] = useState(null);
  const [encounterStatus, setEncounterStatus] = useState(null); // null | 'SUCCESS' | 'REJECTED'
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [nadiStep, setNadiStep] = useState(0); // FASA 4: Langkah dialog Bilik Nadi PMFPQS (0: Ali Shahril, 1: Ebadullah)

  // Modal Koleksi Grimoire / Kitab Skill (dataNotaLengkap)
  const [showSkillBook, setShowSkillBook] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Modal Cara Main & Petunjuk Ringkas (FASA 1 UX Naik Taraf)
  const [showGuideModal, setShowGuideModal] = useState(false);
  const mapContainerRef = useRef(null);

  // FASA 2: Animasi Teks Typewriter Sidang Fatwa
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const [isTypewriterDone, setIsTypewriterDone] = useState(false);

  useEffect(() => {
    if (!activeNpc) {
      setTypewriterIndex(0);
      setIsTypewriterDone(false);
      return;
    }
    setTypewriterIndex(0);
    setIsTypewriterDone(false);
    const fullText = activeNpc.dialogMasalah || '';
    if (!fullText) {
      setIsTypewriterDone(true);
      return;
    }
    const interval = setInterval(() => {
      setTypewriterIndex((prev) => {
        if (prev + 1 >= fullText.length) {
          clearInterval(interval);
          setIsTypewriterDone(true);
          return fullText.length;
        }
        return prev + 1;
      });
    }, 18);
    return () => clearInterval(interval);
  }, [activeNpc]);

  const handleSkipTypewriter = useCallback(() => {
    if (activeNpc && !isTypewriterDone) {
      setTypewriterIndex(activeNpc.dialogMasalah?.length || 0);
      setIsTypewriterDone(true);
    }
  }, [activeNpc, isTypewriterDone]);

  // FASA 3: Suis Kawalan Audio (Mute / Unmute & Simpanan Tempatan)
  const [isAudioMuted, setIsAudioMuted] = useState(() => {
    try {
      return localStorage.getItem('qawaid_audio_muted') === 'true';
    } catch {
      return false;
    }
  });

  const isAudioMutedRef = useRef(isAudioMuted);
  useEffect(() => {
    isAudioMutedRef.current = isAudioMuted;
  }, [isAudioMuted]);

  const toggleAudioMute = useCallback(() => {
    setIsAudioMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('qawaid_audio_muted', String(next));
      } catch {}
      return next;
    });
  }, []);

  const soundRef = useRef(null);
  if (!soundRef.current) {
    soundRef.current = createRpgSoundEngine(() => isAudioMutedRef.current);
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

  // FASA 4: Pengiraan Misi Boss (NPC Ke-4) & Kemajuan Wilayah
  const bossNpc = currentWilayah.npcs[3] || null;
  const earlierNpcs = useMemo(() => currentWilayah.npcs.slice(0, 3), [currentWilayah]);
  const earlierSolvedCount = useMemo(
    () => earlierNpcs.filter((n) => solvedNpcIds.includes(n.npcId)).length,
    [earlierNpcs, solvedNpcIds]
  );
  const isBossUnlocked = earlierSolvedCount === 3;
  const isBossSolved = bossNpc ? solvedNpcIds.includes(bossNpc.npcId) : false;

  const selesaiWilayahCount = useMemo(() => {
    return currentWilayah.npcs.filter((npc) => solvedNpcIds.includes(npc.npcId)).length;
  }, [currentWilayah, solvedNpcIds]);
  const totalWilayahNpc = currentWilayah.npcs.length;
  const isWilayahAllDone = selesaiWilayahCount >= totalWilayahNpc;

  // Mulakan dialog & susun Skill Qawaid dinamik daripada dataNotaLengkap (4 Pilihan: A, B, C, D)
  const openNpcEncounter = useCallback(
    (npc) => {
      // FASA 4: Sekat interaksi jika NPC ke-4 (Boss Wilayah / Pejabat Dekan) belum dibuka
      if (bossNpc && npc.npcId === bossNpc.npcId && !isBossUnlocked && !isBossSolved) {
        soundRef.current?.playCastReject();
        triggerToast(
          currentWilayah.id === 'FPQS'
            ? `🔒 Pejabat Dekan Terkunci! Selesaikan penyelidikan di ketiga-tiga Makmal (Tarannum, Hadis, Braille) dahulu (${earlierSolvedCount}/3).`
            : `🔒 Balai Tertutup! Selesaikan 3 permasalahan penduduk di ${currentWilayah.nama.split('(')[0].trim()} dahulu sebelum menghadap ${bossNpc.nama}!`,
          'crimson'
        );
        return;
      }

      // FASA 3: Haptik getaran interaksi NPC [30ms, 50ms henti, 30ms]
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([30, 50, 30]);
        } catch {}
      }
      soundRef.current?.playNpcGreet();

      // FASA 4: Mekanik Bilik Nadi PMFPQS (Easter Egg - Tiada kuiz dijana)
      if (npc.npcId === 'NPC-FPQS-5' || npc.makmalType === 'BILIK_NADI') {
        setActiveNpc(npc);
        setNadiStep(0);
        setSkillOptions([]);
        setHiddenSkillIds([]);
        setInspectSkillId(null);
        setEncounterStatus(null);
        setRejectionMessage('');
        return;
      }

      // FASA 3: Logik Soalan & Hubungan Database Dinamik (4 Pilihan: A, B, C, D)
      // JANGAN hardcode pilihan jawapan mahupun semakan jawapan.
      const targetNota = getNotaById(npc.notaId);
      const isFPQS = currentWilayah.id === 'FPQS';
      const distractorCount = 3; // 4 pilihan jawapan (A, B, C, D) untuk semua peta termasuk FPQS

      const distractors = dataNotaLengkap
        .filter((n) => {
          if (n.id === targetNota.id) return false;
          // Elakkan varian pecahan yang terlalu serupa bagi soalan FPQS agar pilihan jawapan kontras & jelas
          if (targetNota.id === 'KP-15' && n.id.startsWith('KP-15')) return false;
          if (targetNota.id === 'KP-16' && n.id.startsWith('KP-16')) return false;
          if (targetNota.id === 'KP-18' && n.id.startsWith('KP-18')) return false;
          if (targetNota.id === 'KP-20' && (n.id === 'KP-16' || n.id.startsWith('KP-16'))) return false;
          return Boolean(n.tajukArab) && (Boolean(n.matriksId) || Boolean(n.huraian));
        })
        .sort(() => 0.5 - Math.random())
        .slice(0, distractorCount);

      const shuffled = [...distractors, targetNota].sort(() => 0.5 - Math.random());
      const choices = shuffled.map((item, idx) => ({
        ...item,
        choiceLabel: ['A', 'B', 'C', 'D'][idx],
      }));

      setActiveNpc(npc);
      setSkillOptions(choices);
      setHiddenSkillIds([]);
      setInspectSkillId(null);
      setEncounterStatus(null);
      setRejectionMessage('');
    },
    [bossNpc, isBossUnlocked, isBossSolved, earlierSolvedCount, currentWilayah, triggerToast, getNotaById]
  );

  // FASA 1: Cari koordinat NPC dalam mapGrid untuk auto-move
  const findNpcCoord = useCallback(
    (targetNpcId) => {
      for (let r = 0; r < mapGrid.length; r++) {
        for (let c = 0; c < mapGrid[r].length; c++) {
          const tile = mapGrid[r][c];
          if (
            tile &&
            tile.type === 'NPC' &&
            tile.npc &&
            (tile.npc.npcId === targetNpcId || tile.npc.id === targetNpcId)
          ) {
            return { r, c };
          }
        }
      }
      return null;
    },
    [mapGrid]
  );

  // FASA 1 & FASA 4: Auto-walk watak 3D terus ke NPC & buka interaksi bila tiba
  const handleAutoMoveToNpc = useCallback(
    (npc) => {
      if (bossNpc && npc.npcId === bossNpc.npcId && !isBossUnlocked && !isBossSolved) {
        soundRef.current?.playCastReject();
        triggerToast(
          currentWilayah.id === 'FPQS'
            ? `🔒 Pejabat Dekan Terkunci! Selesaikan penyelidikan di ketiga-tiga Makmal (Tarannum, Hadis, Braille) dahulu (${earlierSolvedCount}/3).`
            : `🔒 Pintu balai masih berkunci! Selesaikan 3 kes warga di sekitar kota dahulu (${earlierSolvedCount}/3).`,
          'crimson'
        );
        return;
      }
      const coord = findNpcCoord(npc.npcId);
      if (coord) {
        soundRef.current?.playStep();
        setAutoWalkTarget({ npcId: npc.npcId, r: coord.r, c: coord.c, nonce: Date.now() });
        if (mapContainerRef.current) {
          mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
    [bossNpc, isBossUnlocked, isBossSolved, earlierSolvedCount, currentWilayah.id, triggerToast, findNpcCoord]
  );

  // Penyegerakan koordinat grid daripada enjin gerak bebas 3D (60fps decoupled)
  const handleThreePlayerMoveGrid = useCallback((r, c) => {
    setPlayerPos((prev) => (prev.r === r && prev.c === c ? prev : { r, c }));
  }, []);

  const handleThreeOasisVisit = useCallback(() => {
    soundRef.current?.playOasis();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([30, 50, 30]);
      } catch {}
    }
    setReputation((rep) => Math.min(100, rep + 15));
    setHikmahMana((m) => Math.min(5, m + 1));
    triggerToast(
      currentWilayah.id === 'FPQS'
        ? '☕ Kafe Didi: +15 Reputasi & +1 Tenaga Tilik!'
        : '⛲ Oasis Hikmah: +15 Reputasi & +1 Tenaga Tilik!',
      'emerald'
    );
  }, [currentWilayah.id, triggerToast]);

  const handleThreePortalVisit = useCallback(() => {
    const canPassPortal = currentWilayah.id === 'FPQS' ? isBossSolved : isWilayahAllDone;
    if (!canPassPortal) {
      soundRef.current?.playCastReject();
      triggerToast(
        currentWilayah.id === 'FPQS'
          ? `⚡ Gerbang Portal masih tertutup! Selesaikan cabaran Pejabat Dekan (${bossNpc?.nama}) untuk merebut Mohor Sanad FPQS & membuka portal.`
          : `⚡ Gerbang Portal masih tertutup! Kalahkan kes sukar Qadhi Utama (${bossNpc?.nama}) untuk merebut Mohor Sanad & membuka portal.`,
        'crimson'
      );
      return;
    }
    soundRef.current?.playPortal();
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
      triggerToast(`🌀 Berpindah ke ${SENARAI_WILAYAH[nextIdx].nama}!`, 'cyan');
    }, 120);
  }, [currentWilayah.id, isBossSolved, isWilayahAllDone, bossNpc, wilayahIdx, triggerToast]);

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
          soundRef.current?.playOasis();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate([30, 50, 30]);
            } catch {}
          }
          setReputation((rep) => Math.min(100, rep + 15));
          setHikmahMana((m) => Math.min(5, m + 1));
          triggerToast('⛲ Oasis Hikmah: +15 Reputasi & +1 Tenaga Tilik!', 'emerald');
        } else if (targetTile.type === 'PORTAL') {
          // FASA 4: Gerbang Portal HANYA boleh dilalui jika Misi Boss (atau semua NPC) telah diselesaikan!
          const canPassPortal = currentWilayah.id === 'FPQS' ? isBossSolved : isWilayahAllDone;
          if (!canPassPortal) {
            soundRef.current?.playCastReject();
            triggerToast(
              currentWilayah.id === 'FPQS'
                ? `⚡ Gerbang Portal masih tertutup! Selesaikan cabaran Pejabat Dekan (${bossNpc?.nama}) untuk merebut Mohor Sanad FPQS & membuka portal.`
                : `⚡ Gerbang Portal masih tertutup! Kalahkan kes sukar Qadhi Utama (${bossNpc?.nama}) untuk merebut Mohor Sanad & membuka portal.`,
              'crimson'
            );
            return prev;
          }

          soundRef.current?.playPortal();
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
          if (bossNpc && targetTile.npc.npcId === bossNpc.npcId && !isBossUnlocked && !isBossSolved) {
            soundRef.current?.playCastReject();
            triggerToast(
              currentWilayah.id === 'FPQS'
                ? `🔒 Pejabat Dekan Terkunci! Selesaikan penyelidikan di ketiga-tiga Makmal (Tarannum, Hadis, Braille) dahulu (${earlierSolvedCount}/3).`
                : `🔒 Balai Tertutup! Selesaikan 3 permasalahan penduduk dahulu sebelum menghadap ${bossNpc.nama}!`,
              'crimson'
            );
            return prev;
          }
          setTimeout(() => {
            openNpcEncounter(targetTile.npc);
          }, 80);
        }

        return { r: nr, c: nc };
      });
    },
    [activeNpc, showSkillBook, mapGrid, wilayahIdx, triggerToast, openNpcEncounter, isWilayahAllDone, bossNpc, isBossUnlocked, isBossSolved, earlierSolvedCount, currentWilayah.id]
  );

  // Kawalan Sentuh & Klik 3D (Raycasting pada Kanvas Three.js)
  const handleThreeTileClick = useCallback(
    (targetR, targetC) => {
      if (activeNpc || showSkillBook) return;

      const dr = targetR - playerPos.r;
      const dc = targetC - playerPos.c;

      if (dr === 0 && dc === 0) return;

      // Jika klik NPC yang bersebelahan atau jarak dekat untuk berinteraksi
      const targetTile = mapGrid[targetR]?.[targetC];
      if (targetTile?.type === 'NPC' && targetTile?.npc) {
        if (bossNpc && targetTile.npc.npcId === bossNpc.npcId && !isBossUnlocked && !isBossSolved) {
          soundRef.current?.playCastReject();
          triggerToast(
            currentWilayah.id === 'FPQS'
              ? `🔒 Pejabat Dekan Terkunci! Selesaikan penyelidikan di ketiga-tiga Makmal (Tarannum, Hadis, Braille) dahulu (${earlierSolvedCount}/3).`
              : `🔒 Balai Tertutup! Selesaikan 3 permasalahan penduduk dahulu sebelum menghadap ${bossNpc.nama}!`,
            'crimson'
          );
          return;
        }
        if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) {
          openNpcEncounter(targetTile.npc);
          return;
        }
      }

      // Jika klik petak bersebelahan terus (1 langkah)
      if (Math.abs(dr) + Math.abs(dc) === 1) {
        movePlayer(dr, dc);
        return;
      }

      // Melangkah 1 langkah ke arah petak sasaran
      const stepR = Math.abs(dr) >= Math.abs(dc) ? Math.sign(dr) : 0;
      const stepC = stepR === 0 ? Math.sign(dc) : 0;
      movePlayer(stepR, stepC);
    },
    [playerPos, activeNpc, showSkillBook, movePlayer, mapGrid, openNpcEncounter, bossNpc, isBossUnlocked, isBossSolved, earlierSolvedCount, currentWilayah.id, triggerToast]
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

  // Nota: Kawalan WASD / Arrow / Space ditangani terus oleh enjin kamera orang-ketiga ThreeWorldMap.jsx

  // Lancarkan Skill / Magis Kaedah (dataNotaLengkap) untuk menyelesaikan konflik NPC
  const handleCastSkill = (selectedNota) => {
    if (!activeNpc || encounterStatus === 'SUCCESS') return;
    const correctNota = getNotaById(activeNpc.notaId);

    if (selectedNota.id === correctNota.id) {
      setEncounterStatus('SUCCESS');
      setRejectionMessage('');
      setReputation((rep) => Math.min(100, rep + 10));

      const isBossFight = activeNpc.npcId === bossNpc?.npcId;
      setXp((x) => x + (isBossFight ? 300 : 150));

      if (!solvedNpcIds.includes(activeNpc.npcId)) {
        setSolvedNpcIds((prev) => [...prev, activeNpc.npcId]);
      }

      // FASA 4: Jika berjaya menyelesaikan NPC ke-4 (Boss Wilayah), kurniakan Mohor Sanad Wilayah!
      if (isBossFight) {
        soundRef.current?.playBossFanfare();
        if (!sanadSeals.includes(currentWilayah.id)) {
          setSanadSeals((prev) => [...prev, currentWilayah.id]);
        }
        setTimeout(() => {
          setShowSanadAwardModal(currentWilayah.id);
        }, 750);
        triggerToast(
          currentWilayah.id === 'FPQS'
            ? '🏆 TAHNIAH! Dekan FPQS telah mengurniakan Mohor Sanad Integrasi Naqli & Aqli FPQS!'
            : `👑 TAHNIAH! Anda memenangi Mohor Sanad ${currentWilayah.nama.split('(')[0].trim()}!`,
          'gold'
        );
      } else {
        soundRef.current?.playCastSuccess();
        triggerToast('✨ Hujah Kaedah Tepat! +150 XP & +10% Reputasi!', 'emerald');
      }
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

  // FASA 2: Bantuan Semak Kitab 50/50 (-1 Reputasi menggelapkan 1 atau 2 pilihan salah)
  const handleSemakKitab = useCallback(() => {
    if (!activeNpc || hiddenSkillIds.length > 0 || reputation <= 1) return;
    const correctNota = getNotaById(activeNpc.notaId);
    const hideCount = skillOptions.length === 3 ? 1 : 2;
    const wrongSkills = skillOptions
      .filter((s) => s.id !== correctNota.id)
      .slice(0, hideCount)
      .map((s) => s.id);
    setHiddenSkillIds(wrongSkills);
    setReputation((rep) => Math.max(1, rep - 1));
    triggerToast(
      hideCount === 1
        ? '📜 Anda menyemak kitab turath! 1 pilihan salah telah digelapkan (-1 Reputasi)'
        : '📜 Anda menyemak kitab turath! 2 hujah salah telah digelapkan (-1 Reputasi)',
      'gold'
    );
  }, [activeNpc, hiddenSkillIds, reputation, skillOptions, getNotaById, triggerToast]);

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

            {/* FASA 4: Butang Galeri Mohor Sanad */}
            <button
              type="button"
              onClick={() => setShowSanadGalleryModal(true)}
              className="lg-btn-glass"
              style={{
                padding: '8px 12px',
                fontSize: '0.76rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '12px',
                borderColor: sanadSeals.length > 0 ? 'rgba(245, 158, 11, 0.65)' : 'rgba(255, 255, 255, 0.2)',
                color: sanadSeals.length > 0 ? '#fbbf24' : 'var(--text-muted)',
                background: sanadSeals.length > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              }}
              title="Buka galeri koleksi Mohor Sanad 5 Wilayah Tamadun Islam"
            >
              <span>🏅 Mohor Sanad ({sanadSeals.length}/5)</span>
            </button>

            {/* FASA 3: Suis Butang Audio HUD */}
            <button
              type="button"
              onClick={toggleAudioMute}
              className="lg-btn-glass"
              style={{
                padding: '8px 12px',
                fontSize: '0.76rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '12px',
                borderColor: isAudioMuted ? 'rgba(239, 68, 68, 0.45)' : 'rgba(52, 211, 153, 0.45)',
                color: isAudioMuted ? '#f87171' : '#34d399',
                background: isAudioMuted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              }}
              title={isAudioMuted ? 'Buka Kesan Suara (Unmute Audio)' : 'Senyapkan Kesan Suara (Mute Audio)'}
            >
              <span>{isAudioMuted ? '🔇 Audio Bisu' : '🔊 Audio Hidup'}</span>
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
        {/* Peta Dunia 3D Interaktif (12x8) */}
        <div
          ref={mapContainerRef}
          className="glass-card"
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--r-xl)',
            gridColumn: 'span 1',
          }}
        >
          {/* Header Bar Peta & Butang Buka Panduan / Sapa */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="lg-node-chip" style={{ whiteSpace: 'normal', fontWeight: 800 }}>
                🗺️ {currentWilayah.nama.split('(')[0].trim()}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {selesaiWilayahCount}/{totalWilayahNpc} Selesai
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* FASA 3: Suis Butang Audio Peta */}
              <button
                type="button"
                onClick={toggleAudioMute}
                className="lg-btn-glass"
                style={{
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '20px',
                  borderColor: isAudioMuted ? 'rgba(239, 68, 68, 0.45)' : 'rgba(52, 211, 153, 0.45)',
                  color: isAudioMuted ? '#f87171' : '#34d399',
                  background: isAudioMuted ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                }}
                title={isAudioMuted ? 'Buka Suara (Unmute Audio)' : 'Senyapkan Suara (Mute Audio)'}
              >
                <span>{isAudioMuted ? '🔇 Bisu' : '🔊 Bunyi'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="lg-btn-glass"
                style={{
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '20px',
                  borderColor: 'rgba(251, 191, 36, 0.45)',
                  color: '#fbbf24',
                }}
                title="Buka panduan cara bermain dan petunjuk simbol 3D"
              >
                <span>❓ Cara Main & Petunjuk</span>
              </button>

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
          </div>

          {/* Bar Misi Dinamik (Smart Objective Banner) */}
          <div
            style={{
              marginBottom: '10px',
              padding: '8px 12px',
              borderRadius: '12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              transition: 'all 0.3s ease',
              ...(isWilayahAllDone
                ? {
                    background: 'linear-gradient(90deg, rgba(147, 51, 234, 0.25) 0%, rgba(79, 70, 229, 0.25) 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.55)',
                    color: '#e9d5ff',
                    boxShadow: '0 4px 16px rgba(147, 51, 234, 0.2)',
                  }
                : isBossUnlocked && !isBossSolved
                ? {
                    background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.25) 0%, rgba(147, 51, 234, 0.25) 100%)',
                    border: '1.5px solid rgba(234, 179, 8, 0.65)',
                    color: '#fef08a',
                    boxShadow: '0 4px 18px rgba(234, 179, 8, 0.25)',
                  }
                : nearbyNpc
                ? {
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.22) 100%)',
                    border: '1px solid rgba(52, 211, 153, 0.55)',
                    color: '#a7f3d0',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)',
                  }
                : {
                    background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    color: '#fef08a',
                  }),
            }}
          >
            <span>
              {isWilayahAllDone
                ? '🎉 Wilayah selesai & Mohor Sanad diraih! Masuk ke Gelung Portal Ungu untuk ke kota seterusnya.'
                : isBossUnlocked && !isBossSolved
                ? currentWilayah.id === 'FPQS'
                  ? `👑 PEJABAT DEKAN DIBUKA! Foyer Pejabat Dekan (${bossNpc?.nama}) kini sedia untuk diuji!`
                  : `👑 MISI BOSS DIBUKA! Menara ${bossNpc?.nama} kini sedia untuk disidangkan!`
                : nearbyNpc
                ? `✨ Anda tiba! Tekan butang hijau 'Sapa ${nearbyNpc.nama.split(' ')[0]}' di bawah untuk mula.`
                : currentWilayah.id === 'FPQS'
                ? `🎯 Misi: Selesaikan penyelidikan di 3 Makmal (Tarannum, Hadis, Braille) (${earlierSolvedCount}/3 Selesai)`
                : `🎯 Misi: Selesaikan 3 kes warga di sekitar kota (${earlierSolvedCount}/3 Selesai)`}
            </span>
            {nearbyNpc && (
              <button
                type="button"
                onClick={() => openNpcEncounter(nearbyNpc)}
                className="lg-btn-primary"
                style={{ padding: '3px 8px', fontSize: '0.72rem', flexShrink: 0 }}
              >
                Mula 💬
              </button>
            )}
          </div>

          {/* Enjin Dunia 3D Third-Person RPG (Three.js 60 FPS Mobile Engine) */}
          <ThreeWorldMap
            mapGrid={mapGrid}
            playerPos={playerPos}
            facing={facing}
            wilayahIdx={wilayahIdx}
            mapSeed={mapSeed}
            solvedNpcIds={solvedNpcIds}
            onTileClick={handleThreeTileClick}
            isEncounterActive={Boolean(activeNpc)}
            activeNpcId={activeNpc?.npcId || null}
            bossNpcId={bossNpc?.npcId}
            isBossUnlocked={isBossUnlocked}
            isWilayahCompleted={isWilayahAllDone}
            autoWalkTarget={autoWalkTarget}
            onPlayerMoveGrid={handleThreePlayerMoveGrid}
            onInteractNpc={openNpcEncounter}
            onOasisVisit={handleThreeOasisVisit}
            onPortalVisit={handleThreePortalVisit}
          />
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '0 0 8px',
                flexWrap: 'wrap',
                gap: '4px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  color: 'var(--text-strong)',
                }}
              >
                📋 Watak NPC di {currentWilayah.nama.split('(')[0].trim()}
              </h3>
              <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                💡 Sentuh kad untuk terus ke lokasi
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentWilayah.npcs.map((npc, idx) => {
                const isBoss = idx === 3;
                const isSolved = solvedNpcIds.includes(npc.npcId);
                const isNearby = nearbyNpc?.npcId === npc.npcId;
                const isLocked = isBoss && !isBossUnlocked && !isSolved;
                const nota = getNotaById(npc.notaId);
                return (
                  <div
                    key={npc.npcId}
                    onClick={() => {
                      if (!isLocked) handleAutoMoveToNpc(npc);
                      else {
                        soundRef.current?.playCastReject();
                        triggerToast(
                          currentWilayah.id === 'FPQS'
                            ? `🔒 Pejabat Dekan Terkunci! Selesaikan penyelidikan di ketiga-tiga Makmal (Tarannum, Hadis, Braille) dahulu (${earlierSolvedCount}/3).`
                            : `🔒 Balai Tertutup! Selesaikan 3 kes warga di sekitar kota dahulu (${earlierSolvedCount}/3).`,
                          'crimson'
                        );
                      }
                    }}
                    className="lg-inner-well"
                    style={{
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      borderLeft: isSolved
                        ? '4px solid #10b981'
                        : isLocked
                        ? '4px solid #ef4444'
                        : isBoss
                        ? '4px solid #fbbf24'
                        : isNearby
                        ? '4px solid #38bdf8'
                        : npc.jenis === 'EASTER_EGG'
                        ? '4px solid #38bdf8'
                        : '4px solid #f59e0b',
                      background: isLocked
                        ? 'rgba(239, 68, 68, 0.05)'
                        : isBoss && !isSolved
                        ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)'
                        : isNearby
                        ? 'rgba(56, 189, 248, 0.08)'
                        : 'rgba(255, 255, 255, 0.02)',
                      opacity: isLocked ? 0.72 : 1,
                    }}
                    title={
                      isLocked
                        ? (currentWilayah.id === 'FPQS'
                            ? `Misi Dekan Terkunci: Selesaikan penyelidikan 3 Makmal dahulu (${earlierSolvedCount}/3)`
                            : `Misi Boss Terkunci: Selesaikan 3 permasalahan awal dahulu (${earlierSolvedCount}/3)`)
                        : 'Sentuh kad untuk melangkah terus ke Menara NPC ini'
                    }
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          color: 'var(--text-strong)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>{npc.ikon} {npc.nama}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          ({npc.peranan})
                        </span>
                        {isBoss && (
                          <span
                            className="lg-node-chip"
                            style={{
                              fontSize: '0.62rem',
                              padding: '1px 6px',
                              background: isLocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.2)',
                              borderColor: isLocked ? 'rgba(239, 68, 68, 0.4)' : 'rgba(251, 191, 36, 0.55)',
                              color: isLocked ? '#fca5a5' : '#fef08a',
                              fontWeight: 800,
                            }}
                          >
                            {isLocked ? (currentWilayah.id === 'FPQS' ? '🔒 DEKAN TERKUNCI' : '🔒 BOSS TERKUNCI') : '👑 TOKOH UTAMA'}
                          </span>
                        )}
                        {npc.jenis === 'EASTER_EGG' && (
                          <span
                            className="lg-node-chip"
                            style={{
                              fontSize: '0.62rem',
                              padding: '1px 6px',
                              background: 'rgba(56, 189, 248, 0.15)',
                              borderColor: 'rgba(56, 189, 248, 0.45)',
                              color: '#7dd3fc',
                              fontWeight: 800,
                            }}
                          >
                            ⭐ BILIK RAHSIA
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {isSolved ? (
                          <span style={{ color: '#34d399' }}>
                            {npc.jenis === 'EASTER_EGG'
                              ? '✅ Dilawati: Tip Rahsia & +10 Reputasi Dituntut'
                              : `✅ Selesai: ${nota.tajuk.split('(')[0].trim()} ${isBoss ? '• 🏅 Mohor Diperolehi' : ''}`}
                          </span>
                        ) : isLocked ? (
                          <span style={{ color: '#f87171' }}>
                            {currentWilayah.id === 'FPQS'
                              ? `🔒 Terkunci: Selesaikan 3 Makmal dahulu (${earlierSolvedCount}/3)`
                              : `🔒 Terkunci: Selesaikan 3 kes warga dahulu (${earlierSolvedCount}/3)`}
                          </span>
                        ) : isBoss ? (
                          <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                            👑 Pintu Balai Terbuka! Sedia untuk dicabar
                          </span>
                        ) : isNearby ? (
                          <span style={{ color: '#38bdf8' }}>✨ Bersebelahan! Sedia disapa</span>
                        ) : npc.jenis === 'EASTER_EGG' ? (
                          <span style={{ color: '#7dd3fc' }}>⭐ Sentuh untuk singgah ke Bilik Nadi</span>
                        ) : (
                          <span>🚀 Sentuh kad untuk terus ke Menara NPC</span>
                        )}
                      </div>
                    </div>

                    {isLocked ? (
                      <button
                        type="button"
                        disabled
                        className="lg-btn-glass"
                        style={{
                          flexShrink: 0,
                          fontSize: '0.70rem',
                          padding: '5px 8px',
                          color: '#f87171',
                          borderColor: 'rgba(239, 68, 68, 0.35)',
                          cursor: 'not-allowed',
                          opacity: 0.65,
                        }}
                      >
                        🔒 Terkunci
                      </button>
                    ) : isNearby ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openNpcEncounter(npc);
                        }}
                        className="lg-btn-primary"
                        style={{ fontSize: '0.74rem', padding: '6px 12px', flexShrink: 0 }}
                      >
                        <span>💬 Sapa</span>
                      </button>
                    ) : isSolved ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAutoMoveToNpc(npc);
                        }}
                        className="lg-node-chip"
                        style={{
                          flexShrink: 0,
                          fontSize: '0.72rem',
                          padding: '4px 8px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Ulang Kaji
                      </button>
                    ) : isBoss ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAutoMoveToNpc(npc);
                        }}
                        className="lg-btn-primary"
                        style={{
                          flexShrink: 0,
                          fontSize: '0.72rem',
                          padding: '5px 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <span>👑 Cabar Boss</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAutoMoveToNpc(npc);
                        }}
                        className="lg-btn-glass"
                        style={{
                          flexShrink: 0,
                          fontSize: '0.72rem',
                          padding: '5px 10px',
                          color: '#fbbf24',
                          borderColor: 'rgba(251, 191, 36, 0.45)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <span>🚀 Ke Sini</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODAL PANDUAN CARA BERMAIN & PETUNJUK SIMBOL 3D (FASA 1 UX)
         ==================================================================== */}
      {showGuideModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 95,
            background: 'rgba(2, 6, 23, 0.84)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '20px 22px',
              borderRadius: '24px',
              border: '1px solid rgba(251, 191, 36, 0.45)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15)',
              background: 'linear-gradient(180deg, #0b1329 0%, #030712 100%)',
              color: '#f8fafc',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>❓</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fbbf24' }}>
                    Cara Main & Petunjuk Simbol 3D
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                    Panduan pantas kembara ilmiah Qawaid Fiqhiyyah
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="lg-btn-glass"
                style={{ padding: '4px 10px', fontSize: '0.82rem', borderRadius: '50%' }}
              >
                ✕
              </button>
            </div>

            {/* Bahagian 1: 3 Langkah Mudah */}
            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>
                🚀 3 Langkah Mudah Bermain:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🗺️</span>
                  <div>
                    <strong style={{ fontSize: '0.8rem', color: '#f8fafc' }}>1. Terokai Kota & Wilayah:</strong>
                    <div style={{ fontSize: '0.73rem', color: 'rgba(255, 255, 255, 0.72)', marginTop: '2px' }}>
                      Mulakan dari Baghdad, terus ke Damsyik dan Hijaz. Kawal watak menggunakan Controller D-Pad, klik petak 3D di peta, atau tekan kad watak NPC di senarai untuk terus ke lokasi.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🕌</span>
                  <div>
                    <strong style={{ fontSize: '0.8rem', color: '#f8fafc' }}>2. Dekati Menara Kubah Emas:</strong>
                    <div style={{ fontSize: '0.73rem', color: 'rgba(255, 255, 255, 0.72)', marginTop: '2px' }}>
                      Setiap kubah didiami oleh tokoh ilmuwan/saudagar. Dekati mereka dan tekan butang hijau <strong>💬 Sapa</strong> untuk membuka sidang dilema hukum.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>📜</span>
                  <div>
                    <strong style={{ fontSize: '0.8rem', color: '#f8fafc' }}>3. Jawab 4 Kes Fiqh &amp; Kalahkan Boss:</strong>
                    <div style={{ fontSize: '0.73rem', color: 'rgba(255, 255, 255, 0.72)', marginTop: '2px' }}>
                      Pilih kaedah fiqh yang tepat. Selesaikan 3 kes warga untuk membuka kunci <strong>Misi Boss (NPC Ke-4)</strong>. Kalahkan Boss untuk menerima <strong>Mohor Sanad Wilayah</strong> &amp; mengaktifkan <strong>Gelung Portal Ungu</strong> ke kota seterusnya.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bahagian 2: Glosari Simbol 3D Sebenar */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 800, color: '#fbbf24' }}>
                🏷️ Petunjuk Objek & Simbol Peta 3D:
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '8px',
                }}
              >
                {/* 1. Figur Pengembara */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
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
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f8fafc' }}>Figur Pengembara (Anda)</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)' }}>Jubah mutiara, serban & gelang cyan</div>
                  </div>
                </div>

                {/* 2. Menara Kubah NPC */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <rect x="4" y="18.5" width="16" height="3" rx="0.8" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.6" />
                    <rect x="6.5" y="12.5" width="11" height="6" fill="#fefce8" stroke="#fde047" strokeWidth="0.6" />
                    <path d="M10.2 18.5V15.2A1.8 1.8 0 0 1 13.8 15.2V18.5H10.2Z" fill="#0f172a" />
                    <path d="M6.2 12.5A5.8 5.2 0 0 1 17.8 12.5H6.2Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.7" />
                    <polygon points="12,1.6 14.5,4.4 12,7.2 9.5,4.4" fill="#f59e0b" stroke="#fef08a" strokeWidth="0.7" />
                  </svg>
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f8fafc' }}>Menara Kubah (Misi NPC)</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)' }}>Bangunan putih, kubah & berlian emas</div>
                  </div>
                </div>

                {/* 3. Kristal Emas / Hijau */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <polygon points="8.2,2.5 13,9.2 8.2,16 3.4,9.2" fill="#fbbf24" stroke="#fef08a" strokeWidth="0.7" />
                    <polyline points="3.4,9.2 8.2,10.4 13,9.2" stroke="#b45309" strokeWidth="0.7" fill="none" />
                    <polygon points="16.2,6.5 20.6,12.8 16.2,19 11.8,12.8" fill="#10b981" stroke="#a7f3d0" strokeWidth="0.7" />
                    <polyline points="11.8,12.8 16.2,14 20.6,12.8" stroke="#047857" strokeWidth="0.7" fill="none" />
                  </svg>
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f8fafc' }}>Kristal Emas & Hijau</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)' }}>Penanda status misi NPC aktif/selesai</div>
                  </div>
                </div>

                {/* 4. Kolam Oasis Hikmah */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <polygon points="12,11 21,15.5 12,20 3,15.5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                    <polygon points="12,12.5 18,15.5 12,18.5 6,15.5" fill="#38bdf8" fillOpacity="0.45" />
                    <path d="M5.8 14.5Q5 9.8 6.8 6.5" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                    <path d="M6.8 6.5L4 7.3M6.8 6.5L5 4.3M6.8 6.5L9.2 4.8M6.8 6.5L9.5 7.2" stroke="#10b981" strokeWidth="1.3" strokeLinecap="round" />
                    <polygon points="13,5.2 15.4,8.5 13,11.8 10.6,8.5" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="0.7" />
                  </svg>
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f8fafc' }}>Kolam Oasis Hikmah</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)' }}>Kolam air tenang & kurma penawar</div>
                  </div>
                </div>

                {/* 5. Gelung Portal 3D */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <ellipse cx="12" cy="20.5" rx="6.5" ry="1.7" fill="#1e1b4b" stroke="#6366f1" strokeWidth="0.7" />
                    <circle cx="12" cy="11" r="7.2" stroke="#9333ea" strokeWidth="2.8" />
                    <circle cx="12" cy="11" r="7.2" stroke="#e9d5ff" strokeWidth="1" strokeDasharray="5 3" />
                    <circle cx="12" cy="11" r="3" fill="#c084fc" stroke="#ffffff" strokeWidth="0.7" />
                  </svg>
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f8fafc' }}>Gelung Portal 3D</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)' }}>Pintu magis ungu ke kota seterusnya</div>
                  </div>
                </div>

                {/* 6. Puncak Batu Low-Poly */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <polygon points="10.2,3.5 2.8,19.5 11.2,19.5" fill="#475569" stroke="#94a3b8" strokeWidth="0.6" strokeLinejoin="round" />
                    <polygon points="10.2,3.5 11.2,19.5 17.2,19.5" fill="#334155" stroke="#64748b" strokeWidth="0.6" strokeLinejoin="round" />
                    <polygon points="17.2,8.5 13.2,19.5 21.2,19.5" fill="#1e293b" stroke="#475569" strokeWidth="0.6" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f8fafc' }}>Puncak Batu Low-Poly</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)' }}>Tebing dan puncak gunung batu bergeometri</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Butang Sedia Mula */}
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="lg-btn-primary"
              style={{ width: '100%', marginTop: '20px', padding: '10px', justifyContent: 'center' }}
            >
              <span>Faham, Teruskan Kembara! 🚀</span>
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL PERTEMBUNGAN NPC: TETINGKAP "SIDANG FATWA & MUNAZARAH" (FASA 2 RPG)
         ==================================================================== */}
      {activeNpc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(2, 6, 23, 0.72)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={() => setActiveNpc(null)}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '820px',
              width: '100%',
              padding: '24px 26px',
              borderRadius: '26px',
              border: '2px solid rgba(251, 191, 36, 0.65)',
              background: 'linear-gradient(180deg, #091326 0%, #030712 100%)',
              boxShadow:
                '0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 36px rgba(245, 158, 11, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.18)',
              maxHeight: '92vh',
              overflowY: 'auto',
              color: '#f8fafc',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Dewan Sidang Fatwa & Lencana Status */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                paddingBottom: '14px',
                borderBottom: '1px solid rgba(251, 191, 36, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  className="lg-node-chip"
                  style={{
                    background: activeNpc.npcId === bossNpc?.npcId
                      ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.25) 0%, rgba(147, 51, 234, 0.25) 100%)'
                      : 'rgba(245, 158, 11, 0.15)',
                    borderColor: activeNpc.npcId === bossNpc?.npcId ? '#fbbf24' : 'rgba(251, 191, 36, 0.55)',
                    color: '#fbbf24',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                  }}
                >
                  {activeNpc.npcId === bossNpc?.npcId
                    ? `👑 SIDANG MUNAZARAH UTAMA: TOKOH QADHI • ${currentWilayah.nama.split('(')[0].trim().toUpperCase()}`
                    : `🏛️ SIDANG MUNAZARAH & FATWA • ${currentWilayah.nama.split('(')[0].trim().toUpperCase()}`}
                </span>
                <span
                  className="lg-node-chip"
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    borderColor: 'rgba(56, 189, 248, 0.35)',
                  }}
                >
                  ⭐ Reputasi: {reputation}%
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveNpc(null)}
                className="lg-btn-glass"
                style={{
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  borderRadius: '20px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Kembali ke Peta ✕</span>
              </button>
            </div>

            {/* Kad Profil Tokoh & Gelaran NPC */}
            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 16px',
                borderRadius: '16px',
                background: activeNpc.npcId === bossNpc?.npcId
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(147, 51, 234, 0.1) 100%)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: activeNpc.npcId === bossNpc?.npcId
                  ? '1.5px solid rgba(251, 191, 36, 0.6)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: currentWilayah.warnaLatar,
                  border: `2px solid #fbbf24`,
                  boxShadow: activeNpc.npcId === bossNpc?.npcId
                    ? '0 0 25px rgba(245, 158, 11, 0.55)'
                    : '0 0 18px rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  flexShrink: 0,
                }}
              >
                {activeNpc.ikon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: '#fbbf24',
                    }}
                  >
                    {activeNpc.nama}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      background: activeNpc.npcId === bossNpc?.npcId
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(56, 189, 248, 0.15)',
                      color: activeNpc.npcId === bossNpc?.npcId ? '#fef08a' : '#38bdf8',
                      border: activeNpc.npcId === bossNpc?.npcId
                        ? '1px solid rgba(251, 191, 36, 0.5)'
                        : '1px solid rgba(56, 189, 248, 0.35)',
                      fontWeight: 700,
                    }}
                  >
                    {activeNpc.npcId === bossNpc?.npcId ? '👑 TOKOH UTAMA • ' : ''}« {activeNpc.peranan} »
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.72)', marginTop: '4px' }}>
                  {activeNpc.npcId === 'NPC-FPQS-5' || activeNpc.makmalType === 'BILIK_NADI'
                    ? '⭐ Ruang perjumpaan santai persatuan mahasiswa, ukhuwah & tip rahsia menghadapi Dekan FPQS'
                    : activeNpc.npcId === bossNpc?.npcId
                    ? currentWilayah.id === 'FPQS'
                      ? '👑 Misi Tokoh Utama: Ujian kepimpinan keilmuan tertinggi di Foyer Pejabat Dekan FPQS!'
                      : `👑 Misi Tokoh Utama Wilayah: Selesaikan kes ini untuk dikurniakan Mohor Sanad ${currentWilayah.nama.split('(')[0].trim()} & mengaktifkan portal!`
                    : '📜 Memohon fatwa hujah syarak bagi menyelesaikan pertikaian uruf & muamalat'}
                </div>
              </div>
            </div>

            {/* FASA 4: Paparan Khas Dialog Bilik Nadi PMFPQS (Easter Egg - Tiada Kuiz) */}
            {(activeNpc.npcId === 'NPC-FPQS-5' || activeNpc.makmalType === 'BILIK_NADI') ? (
              <div style={{ marginTop: '16px' }}>
                <div
                  className="lg-inner-well"
                  style={{
                    padding: '20px',
                    borderRadius: '18px',
                    border: '1.5px solid rgba(56, 189, 248, 0.5)',
                    background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.85) 100%)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {/* Tab / Langkah Interaksi Bilik Nadi */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.3rem' }}>⭐</span>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fbbf24' }}>
                          Bilik Nadi PMFPQS • Perkongsian Rahsia
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                          {nadiStep === 0 ? 'Bahagian 1: Nasihat Persediaan' : 'Bahagian 2: Tip Penting Kuiz'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '10px',
                          fontSize: '0.70rem',
                          fontWeight: 700,
                          background: nadiStep === 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          color: nadiStep === 0 ? '#38bdf8' : 'rgba(255, 255, 255, 0.4)',
                          border: nadiStep === 0 ? '1px solid #38bdf8' : '1px solid transparent',
                        }}
                      >
                        1. Ali Shahril
                      </span>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '10px',
                          fontSize: '0.70rem',
                          fontWeight: 700,
                          background: nadiStep === 1 ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          color: nadiStep === 1 ? '#34d399' : 'rgba(255, 255, 255, 0.4)',
                          border: nadiStep === 1 ? '1px solid #34d399' : '1px solid transparent',
                        }}
                      >
                        2. Ebadullah
                      </span>
                    </div>
                  </div>

                  {nadiStep === 0 ? (
                    /* LANGKAH 1: ALI SHAHRIL */
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '14px',
                        }}
                      >
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
                            border: '2px solid #38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            flexShrink: 0,
                          }}
                        >
                          🧑‍💼
                        </div>
                        <div>
                          <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>
                            Ali Shahril
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '16px 18px',
                          borderRadius: '14px',
                          background: 'rgba(2, 132, 199, 0.12)',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          marginBottom: '18px',
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.96rem',
                            lineHeight: 1.8,
                            color: '#f8fafc',
                            fontStyle: 'italic',
                          }}
                        >
                          &ldquo;Assalamualaikum! Singgah Bilik Nadi rupanya. Dah ready nak hadap Dekan kejap lagi? Relaks je, baca soalan tu betul-betul. Ingat balik apa yang kita bincang masa study group haritu.&rdquo;
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            soundRef.current?.playStep();
                            setNadiStep(1);
                          }}
                          className="lg-btn-primary"
                          style={{
                            padding: '9px 20px',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            borderRadius: '12px',
                          }}
                        >
                          <span>Dengar Hint Seterusnya (Ebadullah) →</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* LANGKAH 2: EBADULLAH */
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '14px',
                        }}
                      >
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
                            border: '2px solid #34d399',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            flexShrink: 0,
                          }}
                        >
                          🧑‍🎓
                        </div>
                        <div>
                          <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>
                            Ebadullah
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '16px 18px',
                          borderRadius: '14px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(52, 211, 153, 0.35)',
                          marginBottom: '18px',
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.96rem',
                            lineHeight: 1.8,
                            color: '#f8fafc',
                            fontStyle: 'italic',
                          }}
                        >
                          &ldquo;Haa alang-alang dah sampai sini, nak payung hint sikit. Dr. Helmy kat Makmal Hadis tu suka test kefahaman tau. Jangan tertukar kaedah Niat dengan kaedah Darurat. All the best, geng!&rdquo;
                        </p>
                      </div>

                      {/* Ganjaran Ukhuwah Bilik Nadi */}
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.18) 0%, rgba(16, 185, 129, 0.10) 100%)',
                          border: '1px solid rgba(74, 222, 128, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '18px',
                        }}
                      >
                        <span style={{ fontSize: '1.4rem' }}>⚡</span>
                        <div style={{ fontSize: '0.80rem', color: '#bbf7d0', lineHeight: 1.5 }}>
                          <strong>Kelebihan Ukhuwah Bilik Nadi:</strong> Memulihkan <strong>+10 Reputasi &amp; Tenaga</strong> secara percuma untuk persediaan berdepan Dekan!
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            soundRef.current?.playStep();
                            setNadiStep(0);
                          }}
                          className="lg-btn-glass"
                          style={{
                            padding: '9px 16px',
                            fontSize: '0.82rem',
                            borderRadius: '12px',
                          }}
                        >
                          <span>← Ali Shahril</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!solvedNpcIds.includes(activeNpc.npcId)) {
                              setReputation((r) => Math.min(100, r + 10));
                              setHikmahMana((m) => Math.min(5, m + 1));
                              setSolvedNpcIds((prev) => [...prev, activeNpc.npcId]);
                              triggerToast('⚡ +10 Reputasi & Tenaga diperoleh daripada ukhuwah Bilik Nadi PMFPQS!', 'emerald');
                            } else {
                              triggerToast('✨ Ukhuwah Bilik Nadi sentiasa menyokong anda!', 'cyan');
                            }
                            soundRef.current?.playOasis();
                            setActiveNpc(null);
                          }}
                          className="lg-btn-primary"
                          style={{
                            padding: '9px 20px',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            borderColor: '#34d399',
                          }}
                        >
                          <span>Terima Kasih! (+10 Reputasi / Tenaga) ✨</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Paparan Normal: Soalan Senario & Pilihan Kaedah (A, B, C, D) */
              <>
                {/* Kotak Dialog Situasi Dilema Hukum (Typewriter Animation) */}
                <div
                  onClick={handleSkipTypewriter}
                  className="lg-inner-well"
                  style={{
                    marginTop: '14px',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    background: 'rgba(8, 14, 30, 0.85)',
                    border: '1.5px solid rgba(251, 191, 36, 0.4)',
                    boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
                    cursor: isTypewriterDone ? 'default' : 'pointer',
                  }}
                  title={!isTypewriterDone ? 'Klik untuk terus papar penuh' : undefined}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.73rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#fbbf24',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>⚖️ {currentWilayah.id === 'FPQS' ? 'SENARIO PENYELIDIKAN MAKMAL:' : 'KES & PERTIKAIAN HUKUM:'}</span>
                    </div>
                    {!isTypewriterDone ? (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.12)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                        }}
                      >
                        👆 Klik untuk terus papar penuh
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.68rem', color: '#10b981' }}>✓ Sedia untuk dijawab</span>
                    )}
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.96rem',
                      lineHeight: 1.8,
                      color: '#f8fafc',
                      minHeight: '48px',
                    }}
                  >
                    {activeNpc.dialogMasalah ? activeNpc.dialogMasalah.slice(0, typewriterIndex) : ''}
                    {!isTypewriterDone && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: '7px',
                          height: '15px',
                          backgroundColor: '#fbbf24',
                          marginLeft: '4px',
                          verticalAlign: 'middle',
                          animation: 'pulse 0.7s infinite',
                        }}
                      />
                    )}
                  </p>
                </div>

                {/* Maklum Balas Jika Salah Pilih Kaedah (NPC Menolak & Reputasi Menurun) */}
                {encounterStatus === 'REJECTED' && (
                  <div
                    className="lg-inner-well"
                    style={{
                      marginTop: '14px',
                      padding: '14px 18px',
                      borderRadius: '14px',
                      border: '1.5px solid rgba(248, 113, 113, 0.65)',
                      background: 'rgba(239, 68, 68, 0.14)',
                      boxShadow: '0 4px 18px rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#f87171', marginBottom: '4px', fontSize: '0.92rem' }}>
                      ❌ Hujah Ditolak oleh {activeNpc.nama}! (-15% Reputasi • Baki: {reputation}%)
                    </div>
                    <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.6, color: '#fee2e2' }}>
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
                      padding: '20px',
                      borderRadius: '16px',
                      border: '1.5px solid rgba(52, 211, 153, 0.65)',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.12) 100%)',
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        color: activeNpc.npcId === bossNpc?.npcId ? '#fbbf24' : '#34d399',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>
                        {activeNpc.npcId === bossNpc?.npcId
                          ? currentWilayah.id === 'FPQS'
                            ? `👑 KEMENANGAN ILMU DEKANAT! ${activeNpc.nama} Mengurniakan Mohor Sanad FPQS (+300 XP & +10% Reputasi)`
                            : `👑 KEMENANGAN FATWA UTAMA! ${activeNpc.nama} Mengurniakan Mohor Sanad Wilayah (+300 XP & +10% Reputasi)`
                          : `✨ Fatwa Diterima Penuh! ${activeNpc.nama} Berpuas Hati (+150 XP & +10% Reputasi)`}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '0 0 14px',
                        fontSize: '0.92rem',
                        lineHeight: 1.7,
                        color: '#f8fafc',
                      }}
                    >
                      {activeNpc.dialogBerjaya}
                    </p>

                    {(() => {
                      const notaBetul = getNotaById(activeNpc.notaId);
                      return (
                        <div
                          className="lg-inner-well"
                          style={{
                            padding: '14px 16px',
                            marginBottom: '16px',
                            borderRadius: '12px',
                            border: '1px solid rgba(251, 191, 36, 0.35)',
                            background: 'rgba(15, 23, 42, 0.7)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: '#fbbf24',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                            }}
                          >
                            DALIL &amp; KAEDAH FIQH YANG DIAMALKAN:
                          </div>
                          <div
                            dir="rtl"
                            style={{
                              fontFamily: '"Noto Naskh Arabic", serif',
                              fontSize: '1.35rem',
                              fontWeight: 700,
                              color: '#f8fafc',
                              margin: '8px 0',
                              lineHeight: 1.8,
                            }}
                          >
                            {notaBetul.tajukArab || notaBetul.tajuk}
                          </div>
                          {notaBetul.tajukBm && (
                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#38bdf8', marginBottom: '10px' }}>
                              &ldquo;{notaBetul.tajukBm}&rdquo;
                            </div>
                          )}
                          <p style={{ margin: '4px 0', fontSize: '0.84rem', lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.88)' }}>
                            <strong style={{ color: '#fbbf24' }}>Huraian:</strong> {notaBetul.huraian}
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '0.84rem', lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.88)' }}>
                            <strong style={{ color: '#fbbf24' }}>Syarat &amp; Pengecualian:</strong> {notaBetul.syarat}
                          </p>
                        </div>
                      );
                    })()}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                      {activeNpc.npcId === bossNpc?.npcId && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveNpc(null);
                            setShowSanadAwardModal(currentWilayah.id);
                          }}
                          className="lg-btn-glass"
                          style={{
                            padding: '8px 16px',
                            fontSize: '0.82rem',
                            borderColor: '#fbbf24',
                            color: '#fbbf24',
                            background: 'rgba(245, 158, 11, 0.15)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <span>🏅 Buka Sijil Mohor Sanad</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveNpc(null)}
                        className="lg-btn-primary"
                        style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                      >
                        <span>Teruskan Pengembaraan di Peta →</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Senarai Kad Hujah / Dalil (Pilihan Jawapan RPG Dinamik dari Database) */
                  <div style={{ marginTop: '18px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                        marginBottom: '12px',
                      }}
                    >
                      <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f8fafc' }}>
                        {currentWilayah.id === 'FPQS'
                          ? '⚖️ PILIH KAEDAH FIQH (A, B, C, D) DARI PANGKALAN DATA TURATH:'
                          : '⚖️ BENTANGKAN KAD HUJAH & KAEDAH FIQH:'}
                      </span>

                      {/* Butang Bantuan Semak Kitab (-1 Reputasi) */}
                      <button
                        type="button"
                        disabled={hiddenSkillIds.length > 0 || reputation <= 1}
                        onClick={handleSemakKitab}
                        className="lg-btn-glass"
                        style={{
                          fontSize: '0.74rem',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          borderColor: hiddenSkillIds.length > 0 ? 'rgba(52, 211, 153, 0.4)' : 'rgba(251, 191, 36, 0.5)',
                          color: hiddenSkillIds.length > 0 ? '#34d399' : '#fbbf24',
                          background: hiddenSkillIds.length > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                        title="Gunakan bantuan semakan kitab untuk menggelapkan 2 pilihan salah dengan kos 1 reputasi"
                      >
                        <span>
                          {hiddenSkillIds.length > 0
                            ? '✓ Kitab Disemak (50/50 Aktif)'
                            : '📜 Semak Kitab (-1 Reputasi)'}
                        </span>
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '12px',
                      }}
                    >
                      {skillOptions.map((skill, sIdx) => {
                        const isHidden = hiddenSkillIds.includes(skill.id);
                        const isInspecting = inspectSkillId === skill.id;
                        const choiceChar = skill.choiceLabel || ['A', 'B', 'C', 'D'][sIdx];

                        if (isHidden) {
                          return (
                            <div
                              key={skill.id}
                              className="lg-inner-well"
                              style={{
                                opacity: 0.32,
                                padding: '16px',
                                textAlign: 'center',
                                fontSize: '0.8rem',
                                borderRadius: '16px',
                                border: '1px dashed rgba(255, 255, 255, 0.2)',
                                background: 'rgba(15, 23, 42, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-muted)',
                              }}
                            >
                              🌫️ Pilihan {choiceChar} ditolak melalui semakan Kitab Turath
                            </div>
                          );
                        }

                        return (
                          <div
                            key={skill.id}
                            className="lg-inner-well"
                            style={{
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '12px',
                              borderRadius: '16px',
                              border: '1.5px solid rgba(251, 191, 36, 0.35)',
                              background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.75) 100%)',
                              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '8px',
                                }}
                              >
                                <span
                                  className="lg-node-chip"
                                  style={{
                                    background: 'rgba(251, 191, 36, 0.12)',
                                    borderColor: 'rgba(251, 191, 36, 0.35)',
                                    color: '#fbbf24',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                  }}
                                >
                                  PILIHAN {choiceChar} • {skill.kategori}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setInspectSkillId(isInspecting ? null : skill.id)
                                  }
                                  className="lg-btn-glass"
                                  style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '10px' }}
                                >
                                  <span>{isInspecting ? 'Tutup Nota' : '📖 Semak Huraian'}</span>
                                </button>
                              </div>

                              <div
                                dir="rtl"
                                style={{
                                  fontFamily: '"Noto Naskh Arabic", serif',
                                  fontSize: '1.25rem',
                                  fontWeight: 700,
                                  lineHeight: 1.8,
                                  color: '#f8fafc',
                                  textAlign: 'right',
                                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                                }}
                              >
                                {skill.tajukArab || skill.tajuk}
                              </div>

                              {skill.tajukBm && (
                                <div
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    color: '#38bdf8',
                                    marginTop: '4px',
                                    lineHeight: 1.45,
                                  }}
                                >
                                  &ldquo;{skill.tajukBm}&rdquo;
                                </div>
                              )}

                              {isInspecting && (
                                <div
                                  style={{
                                    marginTop: '10px',
                                    paddingTop: '10px',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                    fontSize: '0.78rem',
                                    lineHeight: 1.6,
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    background: 'rgba(0, 0, 0, 0.25)',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                  }}
                                >
                                  <div>
                                    <strong style={{ color: '#fbbf24' }}>Huraian:</strong> {skill.huraian}
                                  </div>
                                  {skill.syarat && (
                                    <div style={{ marginTop: '4px' }}>
                                      <strong style={{ color: '#fbbf24' }}>Syarat:</strong> {skill.syarat}
                                    </div>
                                  )}
                                  {skill.aplikasi && (
                                    <div style={{ marginTop: '4px' }}>
                                      <strong style={{ color: '#38bdf8' }}>Aplikasi:</strong> {skill.aplikasi}
                                    </div>
                                  )}
                                  {skill.rujukan && (
                                    <div style={{ marginTop: '4px', fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                      <em>Rujukan: {skill.rujukan} (Jilid {skill.jilid}, m/s {skill.halaman})</em>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCastSkill(skill)}
                              className="lg-btn-primary"
                              style={{
                                width: '100%',
                                justifyContent: 'center',
                                padding: '9px 12px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                borderRadius: '12px',
                              }}
                            >
                              <span>⚡ Pilih Jawapan {choiceChar}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL PENGURNIAAN MOHOR SANAD WILAYAH (FASA 4)
         ==================================================================== */}
      {showSanadAwardModal && (() => {
        const mohor = MOHOR_SANAD_INFO[showSanadAwardModal] || MOHOR_SANAD_INFO.BAGHDAD;
        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(2, 6, 23, 0.88)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              overflowY: 'auto',
            }}
            onClick={() => setShowSanadAwardModal(null)}
          >
            <div
              className="glass-card"
              style={{
                maxWidth: '620px',
                width: '100%',
                padding: '28px 24px',
                borderRadius: '28px',
                border: '2px solid rgba(251, 191, 36, 0.85)',
                background: 'linear-gradient(180deg, #101c38 0%, #070d1e 100%)',
                boxShadow:
                  '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 50px rgba(245, 158, 11, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                color: '#f8fafc',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background Glow */}
              <div
                style={{
                  position: 'absolute',
                  top: '-40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '260px',
                  height: '260px',
                  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Lencana Puncak */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span
                  className="lg-node-chip"
                  style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    borderColor: 'rgba(251, 191, 36, 0.7)',
                    color: '#fbbf24',
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    padding: '4px 14px',
                    fontSize: '0.78rem',
                  }}
                >
                  👑 TITAH RASMI IJAZAH SANAD WILAYAH
                </span>
              </div>

              {/* Cap Mohor Emas Berkilau (Wax Stamp Emblem) */}
              <div
                style={{
                  margin: '10px auto 16px',
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #fbbf24, #b45309)',
                  border: '4px solid #fef08a',
                  boxShadow: '0 0 30px rgba(245, 158, 11, 0.6), inset 0 2px 8px rgba(255, 255, 255, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.6rem',
                }}
              >
                {mohor.mohorSimbol}
              </div>

              <h2
                style={{
                  margin: '0 0 6px',
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  color: '#fbbf24',
                  textShadow: '0 2px 10px rgba(245, 158, 11, 0.5)',
                }}
              >
                {mohor.namaMohor}
              </h2>

              <div style={{ fontSize: '0.86rem', color: '#38bdf8', fontWeight: 700, marginBottom: '14px' }}>
                « {mohor.gelaranSanad} »
              </div>

              {/* Parchment Sijil Perutusan */}
              <div
                className="lg-inner-well"
                style={{
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: '1.5px solid rgba(251, 191, 36, 0.45)',
                  background: 'rgba(15, 23, 42, 0.75)',
                  textAlign: 'left',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase' }}>
                  DIKURNIAKAN OLEH: {mohor.tokohPemberi}
                </div>

                <div
                  dir="rtl"
                  style={{
                    fontFamily: '"Noto Naskh Arabic", serif',
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    color: '#f8fafc',
                    margin: '10px 0 4px',
                    textAlign: 'right',
                    lineHeight: 1.7,
                  }}
                >
                  {mohor.kaedahArab}
                </div>

                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
                  &ldquo;{mohor.kaedahBm}&rdquo;
                </div>

                <p style={{ margin: '0 0 8px', fontSize: '0.82rem', lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.88)' }}>
                  {mohor.huraian}
                </p>

                <div style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700, marginTop: '8px' }}>
                  🌀 Status Kota: Gelung Portal Ungu ke kota seterusnya kini telah diaktifkan sepenuhnya!
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowSanadAwardModal(null);
                    setShowSanadGalleryModal(true);
                  }}
                  className="lg-btn-glass"
                  style={{
                    padding: '10px 18px',
                    fontSize: '0.84rem',
                    borderRadius: '14px',
                    borderColor: 'rgba(251, 191, 36, 0.6)',
                    color: '#fbbf24',
                  }}
                >
                  <span>🏅 Lihat Galeri Mohor ({sanadSeals.length}/5)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSanadAwardModal(null)}
                  className="lg-btn-primary"
                  style={{
                    padding: '10px 22px',
                    fontSize: '0.84rem',
                    borderRadius: '14px',
                    fontWeight: 800,
                  }}
                >
                  <span>Teruskan Kembara →</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ====================================================================
          MODAL GALERI KOLEKSI MOHOR SANAD WILAYAH (FASA 4)
         ==================================================================== */}
      {showSanadGalleryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 95,
            background: 'rgba(2, 6, 23, 0.84)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={() => setShowSanadGalleryModal(false)}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '860px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px 26px',
              borderRadius: '26px',
              border: '2px solid rgba(251, 191, 36, 0.55)',
              background: 'linear-gradient(180deg, #0b1329 0%, #030712 100%)',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 35px rgba(245, 158, 11, 0.2)',
              color: '#f8fafc',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '14px',
                borderBottom: '1px solid rgba(251, 191, 36, 0.25)',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    className="lg-node-chip"
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      borderColor: 'rgba(251, 191, 36, 0.55)',
                      color: '#fbbf24',
                      fontWeight: 800,
                    }}
                  >
                    🏅 KOLEKSI MOHOR SANAD 5 WILAYAH
                  </span>
                  <span className="lg-node-chip" style={{ color: '#38bdf8' }}>
                    Terkumpul: {sanadSeals.length} / 5
                  </span>
                </div>
                <h3 style={{ margin: '6px 0 0', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-strong)' }}>
                  Sanad Keilmuan Kaedah Fiqh Tamadun Islam
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSanadGalleryModal(false)}
                className="lg-btn-glass"
                style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem' }}
              >
                <span>Tutup ✕</span>
              </button>
            </div>

            {/* Banner Kejayaan Penuh jika 5/5 Terkumpul */}
            {sanadSeals.length >= 5 && (
              <div
                className="lg-inner-well"
                style={{
                  padding: '14px 18px',
                  borderRadius: '16px',
                  background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.25) 0%, rgba(147, 51, 234, 0.25) 100%)',
                  border: '1.5px solid rgba(251, 191, 36, 0.7)',
                  boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25)',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div style={{ fontSize: '2.4rem' }}>👑</div>
                <div>
                  <div style={{ fontWeight: 900, color: '#fef08a', fontSize: '0.98rem' }}>
                    TAHNIAH! KHATAM SANAD AGUNG TAMADUN ISLAM
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#f8fafc', marginTop: '3px' }}>
                    Anda telah menguasai sepenuhnya kesemua 5 Kaedah Fiqh Asasi dan diperakui oleh para Qadhi agung di seluruh wilayah Baghdad, Damsyik, Hijaz, Kaherah, dan Andalusia!
                  </div>
                </div>
              </div>
            )}

            {/* Grid 5 Mohor Sanad */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '14px',
              }}
            >
              {Object.values(MOHOR_SANAD_INFO).map((mohor) => {
                const isOwned = sanadSeals.includes(mohor.id);
                return (
                  <div
                    key={mohor.id}
                    className="lg-inner-well"
                    style={{
                      padding: '18px 16px',
                      borderRadius: '18px',
                      border: isOwned ? `1.5px solid ${mohor.borderWarna}` : '1.5px dashed rgba(255, 255, 255, 0.15)',
                      background: isOwned ? mohor.bgGradient : 'rgba(15, 23, 42, 0.4)',
                      opacity: isOwned ? 1 : 0.6,
                      boxShadow: isOwned ? `0 8px 24px ${mohor.cahayaWarna}` : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      {/* Wax Stamp & Status Chip */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: isOwned
                              ? `radial-gradient(circle at 35% 35%, ${mohor.warna}, #78350f)`
                              : 'rgba(255, 255, 255, 0.08)',
                            border: isOwned ? '2px solid #fef08a' : '2px solid rgba(255, 255, 255, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.6rem',
                            boxShadow: isOwned ? '0 0 16px rgba(245, 158, 11, 0.4)' : 'none',
                          }}
                        >
                          {isOwned ? mohor.mohorSimbol : '🔒'}
                        </div>
                        <span
                          className="lg-node-chip"
                          style={{
                            fontSize: '0.68rem',
                            padding: '3px 8px',
                            background: isOwned ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                            color: isOwned ? '#34d399' : 'rgba(255, 255, 255, 0.5)',
                            borderColor: isOwned ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.12)',
                            fontWeight: 700,
                          }}
                        >
                          {isOwned ? '✓ Diperolehi' : '🔒 Belum Diraih'}
                        </span>
                      </div>

                      <h4
                        style={{
                          margin: '0 0 4px',
                          fontSize: '0.96rem',
                          fontWeight: 800,
                          color: isOwned ? '#fbbf24' : 'var(--text-muted)',
                        }}
                      >
                        {mohor.namaMohor}
                      </h4>

                      <div style={{ fontSize: '0.74rem', color: isOwned ? '#38bdf8' : 'rgba(255, 255, 255, 0.45)', marginBottom: '8px' }}>
                        « {mohor.gelaranSanad} »
                      </div>

                      {isOwned ? (
                        <>
                          <div
                            dir="rtl"
                            style={{
                              fontFamily: '"Noto Naskh Arabic", serif',
                              fontSize: '1.1rem',
                              fontWeight: 700,
                              color: '#f8fafc',
                              margin: '6px 0',
                            }}
                          >
                            {mohor.kaedahArab}
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', lineHeight: 1.55, color: 'rgba(255, 255, 255, 0.8)' }}>
                            {mohor.huraian}
                          </p>
                          <div style={{ fontSize: '0.70rem', color: '#fbbf24', marginTop: '6px', fontWeight: 600 }}>
                            Pemberi: {mohor.tokohPemberi}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.5 }}>
                          Kalahkan Misi Tokoh Utama di <strong>{mohor.wilayahNama}</strong> untuk memperolehi ijazah sanad ini.
                        </div>
                      )}
                    </div>

                    {isOwned && (
                      <div
                        style={{
                          paddingTop: '8px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                          fontSize: '0.68rem',
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontStyle: 'italic',
                        }}
                      >
                        {mohor.motto}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
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
