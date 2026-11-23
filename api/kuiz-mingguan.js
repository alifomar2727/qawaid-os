// qawaid-explorer/api/kuiz-mingguan.js
// Vercel Serverless Function: FASA 4 - Panggilan Data Kuiz Mingguan Terkini (GET /api/kuiz-mingguan)

import fs from 'fs';
import path from 'path';

function loadDefaultKuiz() {
  try {
    const fileUrl = new URL('../src/data/kuizMingguanTerkini.json', import.meta.url);
    return JSON.parse(fs.readFileSync(fileUrl, 'utf-8'));
  } catch {
    return {
      tajuk_mingguan: 'Ulang Kaji Mid-Term',
      tarikh_kemaskini: '',
      soalan_objektif: [],
    };
  }
}

function isBundleNewerThan(defaultKuiz, existing) {
  if (!defaultKuiz || !Array.isArray(defaultKuiz.soalan_objektif) || defaultKuiz.soalan_objektif.length === 0) {
    return false;
  }
  if (!existing || !Array.isArray(existing.soalan_objektif) || existing.soalan_objektif.length === 0) {
    return true;
  }
  const defVer = Number(defaultKuiz.bundle_version || 0);
  const extVer = Number(existing.bundle_version || 0);
  if (defVer > extVer) return true;
  if (extVer > defVer) return false;
  return Number(defaultKuiz.updated_at || 0) > Number(existing.updated_at || 0);
}

export default async function handler(req, res) {
  const defaultKuiz = loadDefaultKuiz();
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

  // Jika kaedah POST atau PUT: Simpan kuiz baru terus ke pangkalan data
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const payload = req.body;
      if (!payload || !payload.tajuk_mingguan || !Array.isArray(payload.soalan_objektif)) {
        return res.status(400).json({ success: false, error: 'Format data kuiz tidak sah.' });
      }

      const minVersion = Math.max(Number(payload.bundle_version || 0), Number(defaultKuiz.bundle_version || 0));
      const minUpdatedAt = Math.max(
        Date.now(),
        Number(payload.updated_at || 0),
        Number(defaultKuiz.updated_at || 0) + 1
      );

      const payloadToSave = {
        ...payload,
        bundle_version: minVersion,
        updated_at: minUpdatedAt,
      };

      // 1. Simpan ke Firebase Realtime Database jika ada URL
      let savedToFirebase = false;
      let firebaseError = null;
      const fbUrl = process.env.FIREBASE_DATABASE_URL;
      if (fbUrl) {
        try {
          const endpoint = fbUrl.replace(/\/$/, '') + '/kuiz_mingguan.json';
          const fbRes = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadToSave),
          });
          savedToFirebase = fbRes.ok;
          if (!fbRes.ok) {
            firebaseError = `Firebase HTTP ${fbRes.status}`;
          }
        } catch (fbErr) {
          firebaseError = fbErr.message;
        }
      }

      // 2. Simpan ke fail sementara /tmp
      try {
        const tmpPath = path.join('/tmp', 'kuizMingguanTerkini.json');
        fs.writeFileSync(tmpPath, JSON.stringify(payloadToSave, null, 2), 'utf-8');
      } catch {}

      return res.status(200).json({
        success: true,
        savedToFirebase,
        firebaseError,
        message: savedToFirebase
          ? 'Data kuiz berjaya disimpan ke awan (Firebase) untuk semua peranti.'
          : 'Data kuiz disimpan pada pelayan sementara (tetapkan FIREBASE_DATABASE_URL untuk sinkronisasi awan kekal).',
        data: payloadToSave,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Jika kaedah GET: Ambil kuiz mingguan terkini (elak cache pelayar mobile/CDN)
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
      // 1. Cuba tarik dari Firebase Realtime Database (Cloud Database)
      const fbUrl = process.env.FIREBASE_DATABASE_URL;
      if (fbUrl) {
        try {
          const endpoint = fbUrl.replace(/\/$/, '') + '/kuiz_mingguan.json';
          const fbRes = await fetch(endpoint, { cache: 'no-store' });
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            if (fbData && fbData.tajuk_mingguan && Array.isArray(fbData.soalan_objektif)) {
              // Jika fail projek yang baru dideploy lebih baharu (cth: bundle_version 2 / 30 soalan Mid-Term),
              // naik taraf Firebase secara automatik agar semua PC & telefon terus mendapat kuiz terkini!
              if (isBundleNewerThan(defaultKuiz, fbData)) {
                try {
                  await fetch(endpoint, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(defaultKuiz),
                  });
                } catch {}
                try {
                  const tmpPath = path.join('/tmp', 'kuizMingguanTerkini.json');
                  fs.writeFileSync(tmpPath, JSON.stringify(defaultKuiz, null, 2), 'utf-8');
                } catch {}
                return res.status(200).json({
                  success: true,
                  source: 'default-upgraded-firebase',
                  ...defaultKuiz,
                  data: defaultKuiz,
                });
              }

              return res.status(200).json({
                success: true,
                source: 'firebase',
                ...fbData,
                data: fbData,
              });
            }
          }
        } catch (fbErr) {
          console.warn('Gagal membaca dari Firebase, beralih ke sandaran fail:', fbErr.message);
        }
      }

      // 2. Cuba baca dari memori /tmp (jika baru dijana pada instans Vercel ini)
      try {
        const tmpPath = path.join('/tmp', 'kuizMingguanTerkini.json');
        if (fs.existsSync(tmpPath)) {
          const content = fs.readFileSync(tmpPath, 'utf-8');
          const dataTmp = JSON.parse(content);
          if (dataTmp && dataTmp.tajuk_mingguan && !isBundleNewerThan(defaultKuiz, dataTmp)) {
            return res.status(200).json({
              success: true,
              source: 'tmp',
              ...dataTmp,
              data: dataTmp,
            });
          }
        }
      } catch {}

      // 3. Fallback: Gunakan fail lalai projek
      return res.status(200).json({
        success: true,
        source: 'default',
        ...defaultKuiz,
        data: defaultKuiz,
      });
    } catch (error) {
      console.error('Ralat /api/kuiz-mingguan:', error);
      return res.status(200).json({
        success: true,
        ...defaultKuiz,
        data: defaultKuiz,
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Kaedah HTTP tidak dibenarkan.' });
}
