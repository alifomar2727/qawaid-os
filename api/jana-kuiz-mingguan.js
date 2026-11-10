// qawaid-explorer/api/jana-kuiz-mingguan.js
// Vercel Serverless Function: FASA 3 - Penjanaan Kuiz Mingguan AI Menggunakan Google Gemini

export default async function handler(req, res) {
  // Konfigurasi CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Kaedah HTTP tidak dibenarkan. Sila gunakan POST.',
    });
  }

  const { tajuk, nota, fileData } = req.body || {};

  if (!tajuk || typeof tajuk !== 'string' || !tajuk.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Ruangan "tajuk" kuiz diperlukan.',
    });
  }

  if (!nota?.trim() && !fileData?.base64) {
    return res.status(400).json({
      success: false,
      error: 'Sila sertakan sama ada teks "nota" atau muat naik fail slaid (PDF).',
    });
  }

  const rawKey = process.env.GEMINI_API_KEY || '';
  const apiKey = rawKey.trim().replace(/^['"]|['"]$/g, '');

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'GEMINI_API_KEY belum dikonfigurasikan di Environment Variables. Sila semak tetapan Vercel / fail .env.',
    });
  }

  try {
    // 1. Prompt Rasmi Fasa 3 mengikut kehendak pengguna
    const arahanPrompt = `Anda adalah pakar fiqh. Berdasarkan nota ini, hasilkan 20 soalan objektif (A, B, C, D) dalam bahasa Melayu. Output mestilah HANYA dalam format array JSON tulen dengan key: 'soalan', 'pilihan' (array 4 pilihan), 'jawapan_betul', dan 'huraian'. Jangan beri penerangan lain.

Tajuk Kuiz: ${tajuk.trim()}

${fileData ? `[PENTING: Rujuk kandungan slaid PDF yang dilampirkan untuk membina 20 soalan ini]\n` : ''}
${nota?.trim() ? `Teks Slaid / Nota Kuliah:\n${nota.trim()}` : ''}`;

    // 2. Bina bahagian kandungan (parts) termasuk dokumen PDF jika ada
    const parts = [];

    if (fileData?.base64) {
      const mimeType = fileData.type || 'application/pdf';
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: fileData.base64,
        },
      });
    }

    parts.push({ text: arahanPrompt });

    // 3. Senarai model Google Gemini AKTIF (model lama 2.x / 1.5 telah ditamatkan oleh Google)
    //    Disusun: model terbaik untuk baca PDF dahulu, kemudian model ringan sebagai sandaran.
    const modelsToTry = [
      'gemini-3.8-flash',
      'gemini-3.6-flash',
      'gemini-flash-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
    ];

    let rawOutputText = '';
    let successModel = '';
    const errorLogs = [];

    for (const model of modelsToTry) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout (PDF besar perlukan masa)

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature: 0.25,
              topP: 0.95,
              // Model 3.x menggunakan token "thinking" yang turut dikira dalam had output,
              // jadi had dinaikkan supaya 20 soalan tidak terpotong di tengah jalan.
              maxOutputTokens: 32768,
              responseMimeType: 'application/json',
            },
          }),
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const resJson = await response.json();
          const candidate = resJson?.candidates?.[0];
          // Gabungkan semua bahagian teks (abaikan bahagian "thought" dalaman model)
          rawOutputText = (candidate?.content?.parts || [])
            .filter((p) => !p.thought)
            .map((p) => p.text || '')
            .join('')
            .trim();
          if (rawOutputText) {
            successModel = model;
            break;
          }
          errorLogs.push(`${model}: respons kosong (${candidate?.finishReason || 'UNKNOWN'})`);
        } else {
          const errText = await response.text();
          let parsedErr = errText;
          try {
            parsedErr = JSON.parse(errText)?.error?.message || errText;
          } catch {}
          errorLogs.push(`${model} (${response.status}): ${parsedErr}`);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        errorLogs.push(`${model}: ${err.message}`);
      }
    }

    if (!rawOutputText) {
      // Utamakan ralat yang bukan 404 (model tamat) supaya punca sebenar kelihatan
      const ralatPenting = errorLogs.filter((e) => !e.includes('(404)'));
      const ringkasan = (ralatPenting.length ? ralatPenting : errorLogs).slice(0, 3).join(' | ');
      throw new Error(`Semua model Gemini gagal menjana kuiz. Butiran: ${ringkasan}`);
    }

    // 4. Bersihkan dan parse JSON array soalan objektif
    const soalanObjektif = parseDanNormalisasiSoalan(rawOutputText);

    if (!soalanObjektif || soalanObjektif.length === 0) {
      throw new Error('Format jawapan AI tidak mengandungi senarai soalan yang sah.');
    }

    const payloadHasil = {
      tajuk_mingguan: tajuk.trim(),
      tarikh_kemaskini: new Date().toLocaleDateString('ms-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      soalan_objektif: soalanObjektif,
      model_penjana: successModel,
    };

    // 5. Simpan automatik ke Cloud (Firebase) dan Storan Tempatan
    const fbUrl = process.env.FIREBASE_DATABASE_URL;
    if (fbUrl) {
      try {
        const endpoint = fbUrl.replace(/\/$/, '') + '/kuiz_mingguan.json';
        await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadHasil),
        });
        console.log('âœ… Kuiz berjaya disimpan ke Firebase Realtime Database');
      } catch (fbErr) {
        console.warn('âš ï¸ Gagal menyimpan ke Firebase:', fbErr.message);
      }
    }

    try {
      const fsModule = await import('fs');
      const pathModule = await import('path');
      const tmpPath = pathModule.default.join('/tmp', 'kuizMingguanTerkini.json');
      fsModule.default.writeFileSync(tmpPath, JSON.stringify(payloadHasil, null, 2), 'utf-8');
    } catch {}

    return res.status(200).json({
      success: true,
      message: `Berjaya menjana ${soalanObjektif.length} soalan kuiz dengan ${successModel}.`,
      data: payloadHasil,
    });
  } catch (error) {
    console.error('Ralat /api/jana-kuiz-mingguan:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Ralat semasa memproses penjanaan kuiz AI.',
    });
  }
}

/**
 * Memastikan output JSON dari Gemini diproses dengan selamat dan mematuhi format App.jsx
 */
function parseDanNormalisasiSoalan(rawText) {
  let cleaned = String(rawText || '').trim();

  // Buang code blocks markdown jika ada
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Ekstrak bahagian array [ ... ]
  const firstIdx = cleaned.indexOf('[');
  const lastIdx = cleaned.lastIndexOf(']');
  if (firstIdx !== -1 && lastIdx !== -1 && lastIdx > firstIdx) {
    cleaned = cleaned.substring(firstIdx, lastIdx + 1);
  }

  let parsed = JSON.parse(cleaned);

  // Jika AI membalut dalam objek contoh { soalan: [...] } atau { kuiz: [...] }
  if (!Array.isArray(parsed) && typeof parsed === 'object') {
    const possibleArray = Object.values(parsed).find((val) => Array.isArray(val));
    if (possibleArray) parsed = possibleArray;
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Format output AI bukan array soalan JSON.');
  }

  return parsed.map((item, idx) => {
    let pilihan = Array.isArray(item.pilihan)
      ? item.pilihan.map((p) => String(p).trim())
      : [];

    // Pastikan tepat 4 pilihan
    if (pilihan.length < 4) {
      const defaultAbcd = ['A', 'B', 'C', 'D'];
      while (pilihan.length < 4) {
        pilihan.push(`Pilihan ${defaultAbcd[pilihan.length]}`);
      }
    } else if (pilihan.length > 4) {
      pilihan = pilihan.slice(0, 4);
    }

    // Normalisasi jawapan betul
    let jawapanBetul = String(item.jawapan_betul || pilihan[0]).trim();

    // Jika jawapan betul hanya huruf "A", "B", "C", "D"
    const matchLetter = jawapanBetul.match(/^([A-D])\b/i);
    if (matchLetter && !pilihan.includes(jawapanBetul)) {
      const letterIndex = { A: 0, B: 1, C: 2, D: 3 }[matchLetter[1].toUpperCase()];
      if (letterIndex !== undefined && pilihan[letterIndex]) {
        jawapanBetul = pilihan[letterIndex];
      }
    } else if (!pilihan.includes(jawapanBetul)) {
      // Cari pilihan yang sepadan sebahagian
      const matched = pilihan.find(
        (p) =>
          p.toLowerCase().includes(jawapanBetul.toLowerCase()) ||
          jawapanBetul.toLowerCase().includes(p.toLowerCase())
      );
      if (matched) {
        jawapanBetul = matched;
      } else {
        jawapanBetul = pilihan[0];
      }
    }

    return {
      id: idx + 1,
      soalan: String(item.soalan || `Soalan ${idx + 1}`).trim(),
      pilihan: pilihan,
      jawapan_betul: jawapanBetul,
      huraian: String(item.huraian || 'Tiada huraian tambahan dibekalkan.').trim(),
    };
  });
}
