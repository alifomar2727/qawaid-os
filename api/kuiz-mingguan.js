// api/kuiz-mingguan.js
// Vercel Serverless Function: FASA 4 - Panggilan Data Kuiz Mingguan Terkini (GET /api/kuiz-mingguan)

import fs from 'fs';
import path from 'path';
import defaultKuiz from '../src/data/kuizMingguanTerkini.json';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: Ambil kuiz mingguan terkini
  if (req.method === 'GET') {
    try {
      // 1. Cuba ambil dari Firebase jika ada
      const fbUrl = process.env.FIREBASE_DATABASE_URL;
      if (fbUrl) {
        try {
          const endpoint = fbUrl.replace(/\/$/, '') + '/kuiz_mingguan.json';
          const fbRes = await fetch(endpoint);
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            if (fbData && fbData.tajuk_mingguan && Array.isArray(fbData.soalan_objektif)) {
              return res.status(200).json({
                success: true,
                ...fbData,
                data: fbData,
              });
            }
          }
        } catch (fbErr) {
          console.warn('Gagal membaca dari Firebase:', fbErr.message);
        }
      }

      // 2. Baca dari memori /tmp jika ada
      try {
        const tmpPath = path.join('/tmp', 'kuizMingguanTerkini.json');
        if (fs.existsSync(tmpPath)) {
          const content = fs.readFileSync(tmpPath, 'utf-8');
          const dataTmp = JSON.parse(content);
          if (dataTmp && dataTmp.tajuk_mingguan) {
            return res.status(200).json({
              success: true,
              ...dataTmp,
              data: dataTmp,
            });
          }
        }
      } catch {}

      // 3. Fallback ke fail lalai projek
      return res.status(200).json({
        success: true,
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
