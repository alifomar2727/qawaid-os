// qawaid-explorer/api/tetapan-teks.js
// Vercel Serverless Function: FASA 3 - Pengurusan Tetapan Teks Web (Mini CMS)
// Menyokong GET (ambil tetapan) & POST / PUT (simpan tetapan)

import fs from 'fs';
import path from 'path';

const DEFAULT_TETAPAN = {
  teksPengumuman: '✨ Selamat Datang ke Qawaid OS — Sistem Ulang Kaji Pintar Berteraskan Kitab al-Qawaid al-Fiqhiyyah wa Tatbiqatuha fi al-Madhahib al-Arbaah',
  subtajukApp: 'Sistem Ulang Kaji Qawaid Fiqhiyyah',
  subtajukCabaran: 'Uji kefahaman teori dan aplikasi penyelesaian isu semasa melalui dua mod di bawah:',
  tarikh_kemaskini: new Date().toISOString(),
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // JIKA POST / PUT: Simpan tetapan teks baru
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const { teksPengumuman, subtajukApp, subtajukCabaran } = req.body || {};

      const payload = {
        teksPengumuman: typeof teksPengumuman === 'string' ? teksPengumuman.trim() : '',
        subtajukApp: typeof subtajukApp === 'string' ? subtajukApp.trim() : '',
        subtajukCabaran: typeof subtajukCabaran === 'string' ? subtajukCabaran.trim() : '',
        tarikh_kemaskini: new Date().toISOString(),
      };

      // 1. Simpan ke Firebase Realtime Database jika ada URL
      const fbUrl = process.env.FIREBASE_DATABASE_URL;
      if (fbUrl) {
        try {
          const endpoint = fbUrl.replace(/\/$/, '') + '/tetapan_teks.json';
          await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch (fbErr) {
          console.warn('Gagal menyimpan tetapan ke Firebase:', fbErr.message);
        }
      }

      // 2. Simpan ke fail sementara /tmp (untuk persistensi sementara pada Vercel container)
      try {
        const tmpPath = path.join('/tmp', 'tetapanTeksTerkini.json');
        fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf-8');
      } catch {}

      return res.status(200).json({
        success: true,
        message: 'Tetapan teks web berjaya disimpan.',
        data: payload,
      });
    } catch (err) {
      console.error('Ralat simpan tetapan teks:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // JIKA GET: Ambil tetapan teks terkini
  if (req.method === 'GET') {
    try {
      // 1. Cuba tarik dari Firebase Realtime Database
      const fbUrl = process.env.FIREBASE_DATABASE_URL;
      if (fbUrl) {
        try {
          const endpoint = fbUrl.replace(/\/$/, '') + '/tetapan_teks.json';
          const fbRes = await fetch(endpoint);
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            if (fbData && (fbData.teksPengumuman || fbData.subtajukApp || fbData.subtajukCabaran)) {
              return res.status(200).json({
                success: true,
                ...fbData,
                data: fbData,
              });
            }
          }
        } catch (fbErr) {
          console.warn('Gagal membaca tetapan dari Firebase, beralih ke cache /tmp:', fbErr.message);
        }
      }

      // 2. Cuba baca dari fail /tmp
      try {
        const tmpPath = path.join('/tmp', 'tetapanTeksTerkini.json');
        if (fs.existsSync(tmpPath)) {
          const content = fs.readFileSync(tmpPath, 'utf-8');
          const dataTmp = JSON.parse(content);
          if (dataTmp) {
            return res.status(200).json({
              success: true,
              ...dataTmp,
              data: dataTmp,
            });
          }
        }
      } catch {}

      // 3. Fallback nilai lalai
      return res.status(200).json({
        success: true,
        ...DEFAULT_TETAPAN,
        data: DEFAULT_TETAPAN,
      });
    } catch (err) {
      console.error('Ralat membaca tetapan teks:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Kaedah tidak disokong' });
}
