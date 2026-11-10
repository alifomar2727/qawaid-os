// api/chat.js
import { dataNotaLengkap } from '../src/dataNota.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
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
      error: 'GEMINI_API_KEY belum dikonfigurasikan di Environment Variables Vercel.',
    });
  }

  try {
    const qNorm = soalan.toLowerCase().trim();
    const konteksRelevan = [];
    const sumberPilihan = [];

    dataNotaLengkap.forEach((nota) => {
      let skor = 0;
      const tajukAr = (nota.tajukArab || '').toLowerCase();
      const tajukBm = (nota.tajukBm || nota.tajuk || '').toLowerCase();
      const huraian = (nota.huraian || '').toLowerCase();
      const tatbiqat = (nota.tatbiqat || '').toLowerCase();

      const perkataan = qNorm.split(/\s+/).filter((w) => w.length > 2);
      perkataan.forEach((w) => {
        if (tajukAr.includes(w)) skor += 10;
        if (tajukBm.includes(w)) skor += 8;
        if (tatbiqat.includes(w)) skor += 4;
        if (huraian.includes(w)) skor += 3;
      });

      if (skor > 0) konteksRelevan.push({ nota, skor });
    });

    konteksRelevan.sort((a, b) => b.skor - a.skor);
    const topNotas = konteksRelevan.slice(0, 4).map((k) => k.nota);

    let konteksTeks = '';
    topNotas.forEach((n, idx) => {
      konteksTeks += `\n--- [Konteks ${idx + 1}: ${n.tajukArab || n.tajukBm}] ---\n`;
      if (n.tajukArab) konteksTeks += `Kaedah: ${n.tajukArab}\n`;
      if (n.tajukBm) konteksTeks += `Maksud: ${n.tajukBm}\n`;
      if (n.huraian) konteksTeks += `Huraian: ${n.huraian}\n`;
      if (n.tatbiqat) konteksTeks += `Tatbiqat 4 Mazhab: ${n.tatbiqat}\n`;
      if (n.jilidHalaman) konteksTeks += `Halaman: ${n.jilidHalaman}\n`;
      if (n.urlShamela) {
        sumberPilihan.push({
          tajuk: n.tajukArab || n.tajukBm,
          jilidHalaman: n.jilidHalaman || 'Jil. 1',
          urlShamela: n.urlShamela,
        });
      }
    });

    const systemPrompt = `Anda ialah Penyelidik AI Qawaid OS bagi kitab «القواعد الفقهية وتطبيقاتها في المذاهب الأربعة» karya Syeikh Prof. Dr. Muhammad Mustafa al-Zuhaili.
Jawab soalan dengan terperinci, ilmiah, bersopan dan tersusun dalam Bahasa Melayu. Berikan lafaz Arab kaedah berbaris, maksud, dan perbandingan 4 mazhab. Di akhir jawapan, sertakan rujukan nombor Jilid & Halaman serta pautan Shamela.ws.

Konteks Rujukan Kitab:
${konteksTeks || 'Kitab al-Qawaid al-Fiqhiyyah wa Tatbiqatuha fi al-Madhahib al-Arbaah karya Syeikh Muhammad Mustafa al-Zuhaili.'}`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
    let jawapanText = '';
    let successModel = '';
    let lastError = '';

    for (const model of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = {
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nSoalan: ${soalan}` }] }],
          generationConfig: { temperature: 0.25, maxOutputTokens: 2048 },
        };

        const resGemini = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(payload),
        });

        if (resGemini.ok) {
          const geminiData = await resGemini.json();
          jawapanText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (jawapanText) {
            successModel = model;
            break;
          }
        } else {
          const errText = await resGemini.text();
          let detail = errText;
          try {
            const parsed = JSON.parse(errText);
            detail = parsed.error?.message || errText;
          } catch {}
          lastError = `${model} (HTTP ${resGemini.status}): ${detail}`;
        }
      } catch (errModel) {
        lastError = `${model}: ${errModel.message}`;
      }
    }

    if (!jawapanText) {
      return res.status(502).json({
        error: `Ralat Google Gemini API: ${lastError}`,
      });
    }

    return res.status(200).json({
      jawapan: jawapanText,
      model: successModel,
      sumber: sumberPilihan.slice(0, 3),
    });
  } catch (error) {
    return res.status(500).json({ error: `Ralat pelayan: ${error.message}` });
  }
}
