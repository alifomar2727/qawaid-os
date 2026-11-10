// api/chat.js
// Vercel Serverless Function untuk AI Chatbox Qawaid OS
// Berasaskan: "القواعد الفقهية وتطبيقاتها في المذاهب الأربعة" — Syeikh Prof. Dr. Muhammad Mustafa al-Zuhaili

import { dataNotaLengkap } from '../src/dataNota.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Kaedah HTTP tidak dibenarkan. Sila gunakan POST.' });
  }

  const { soalan } = req.body || {};
  if (!soalan || typeof soalan !== 'string' || !soalan.trim()) {
    return res.status(400).json({ error: 'Soalan diperlukan.' });
  }

  const rawKey = process.env.GEMINI_API_KEY || '';
  const apiKey = rawKey.trim().replace(/^['"]|['"]$/g, '');

  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY belum dikonfigurasikan di Environment Variables Vercel. Sila semak di Settings > Environment Variables.',
    });
  }

  try {
    const qNorm = soalan.toLowerCase().trim();

    // 1. Carian Konteks Tempatan daripada 52+ Nota Lengkap Kitab
    const konteksRelevan = [];
    const sumberPilihan = [];

    dataNotaLengkap.forEach((nota) => {
      let skor = 0;
      const tajukAr = (nota.tajukArab || '').toLowerCase();
      const tajukBm = (nota.tajukBm || nota.tajuk || '').toLowerCase();
      const huraian = (nota.huraian || '').toLowerCase();
      const dalil = (nota.dalil || '').toLowerCase();
      const tatbiqat = (nota.tatbiqat || '').toLowerCase();

      // Padanan kata kunci
      const perkataan = qNorm.split(/\s+/).filter((w) => w.length > 2);
      perkataan.forEach((w) => {
        if (tajukAr.includes(w)) skor += 10;
        if (tajukBm.includes(w)) skor += 8;
        if (tatbiqat.includes(w)) skor += 4;
        if (huraian.includes(w)) skor += 3;
        if (dalil.includes(w)) skor += 2;
      });

      if (skor > 0) {
        konteksRelevan.push({ nota, skor });
      }
    });

    // Susun mengikut markah tertinggi
    konteksRelevan.sort((a, b) => b.skor - a.skor);
    const topNotas = konteksRelevan.slice(0, 4).map((k) => k.nota);

    let konteksTeks = '';
    topNotas.forEach((n, idx) => {
      konteksTeks += `\n--- [Konteks Rujukan ${idx + 1}: ${n.tajukArab || n.tajukBm}] ---\n`;
      if (n.tajukArab) konteksTeks += `Kaedah Arab: ${n.tajukArab}\n`;
      if (n.tajukBm) konteksTeks += `Maksud: ${n.tajukBm}\n`;
      if (n.huraian) konteksTeks += `Takrif & Huraian: ${n.huraian}\n`;
      if (n.dalil) konteksTeks += `Dalil Al-Quran & Sunnah: ${n.dalil}\n`;
      if (n.tatbiqat) konteksTeks += `Tatbiqat Empat Mazhab: ${n.tatbiqat}\n`;
      if (n.jilidHalaman) konteksTeks += `Rujukan Cetakan: ${n.jilidHalaman}\n`;
      if (n.urlShamela) {
        konteksTeks += `Pautan Sah Shamela: ${n.urlShamela}\n`;
        sumberPilihan.push({
          kitab: 'القواعد الفقهية وتطبيقاتها في المذاهب الأربعة',
          tajuk: n.tajukArab || n.tajukBm || 'Rujukan Kaedah',
          jilidHalaman: n.jilidHalaman || 'Jil. 1',
          urlShamela: n.urlShamela,
          teks: n.huraian || n.tatbiqat || n.tajukBm || n.tajukArab || '',
          skor: 0.95,
        });
      }
    });

    // 2. Bina Prompt Penyelidik AI Qawaid OS
    const systemPrompt = `Anda ialah Penyelidik AI Qawaid OS yang DIHADKAN SECARA EKSKLUSIF kepada sebuah kitab fiqh berwibawa:
«القواعد الفقهية وتطبيقاتها في المذاهب الأربعة»
karya Syeikh Prof. Dr. Muhammad Mustafa al-Zuhaili (ID Shamela: 21786).

PANDUAN JAWAPAN KETAT:
1. Jawab soalan pengguna dengan terperinci, ilmiah, bersopan dan tersusun dalam Bahasa Melayu.
2. Setiap kali menyebut sesuatu kaedah fiqh, berikan lafaz Arab berbaris lengkap berserta maksud terjemahannya.
3. Nyatakan aplikasi perbandingan antara mazhab (Hanafi, Maliki, Syafie, Hanbali) mengikut huraian pengarang.
4. Di akhir jawapan, sertakan rujukan nombor Jilid & Halaman serta formatkan pautan Shamela.ws secara markdown link yang kemas seperti:
   [Baca Halaman Rujukan di Shamela.ws](https://shamela.ws/book/21786/xx)
5. Jangan mereka-reka maklumat di luar manhaj kitab ini.

Konteks Rujukan Kitab:
${konteksTeks || 'Kitab al-Qawaid al-Fiqhiyyah wa Tatbiqatuha fi al-Madhahib al-Arbaah karya Syeikh Muhammad Mustafa al-Zuhaili.'}`;

    const promptPenuh = `${systemPrompt}\n\nSoalan Pengguna:\n${soalan}`;

    let jawapanText = '';
    let successModel = '';
    const logRalat = [];

    // Senarai model aktif Google Gemini (disusun mengikut kelajuan tanpa kesesakan)
    const modelsToTry = [
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.6-flash',
      'gemini-flash-latest',
    ];

    for (const m of modelsToTry) {
      try {
        const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const resGen = await fetch(genUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: promptPenuh }] }],
            generationConfig: {
              temperature: 0.25,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        });

        if (resGen.ok) {
          const dataGen = await resGen.json();
          jawapanText = dataGen?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (jawapanText) {
            successModel = m;
            break;
          }
        } else {
          const errGenText = await resGen.text();
          let msgGen = errGenText;
          try {
            msgGen = JSON.parse(errGenText)?.error?.message || errGenText;
          } catch {}
          logRalat.push(`${m} (${resGen.status}): ${msgGen}`);

          if (resGen.status === 503) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
        }
      } catch (eGen) {
        logRalat.push(`${m}: ${eGen.message}`);
      }
    }

    if (!jawapanText) {
      return res.status(502).json({
        error: `Pelayan Google Gemini sibuk: ${logRalat.join(' | ')}`,
      });
    }

    return res.status(200).json({
      jawapan: jawapanText,
      model: successModel,
      sumber: sumberPilihan.slice(0, 3),
    });
  } catch (error) {
    console.error('Ralat dalam handler chat:', error);
    return res.status(500).json({
      error: `Ralat pelayan: ${error.message}`,
    });
  }
}
