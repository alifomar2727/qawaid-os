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

  const {
    tajuk,
    nota,
    fileData,
    filesData,
    questionCount = 20,
    bilingual = true,
    skipSave = false,
    batchInstruction = '',
  } = req.body || {};

  // Sokong kedua-dua format: 1 fail (fileData) atau sehingga 4 fail (filesData)
  const rawFilesList = Array.isArray(filesData)
    ? filesData.slice(0, 4)
    : fileData
    ? [fileData]
    : [];
  const hasAnyFile = rawFilesList.some((f) => f && (f.base64 || f.textContent));

  if (!tajuk || typeof tajuk !== 'string' || !tajuk.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Ruangan "tajuk" kuiz diperlukan.',
    });
  }

  if (!nota?.trim() && !hasAnyFile) {
    return res.status(400).json({
      success: false,
      error: 'Sila sertakan sama ada teks "nota" atau muat naik fail slaid (PDF / Teks).',
    });
  }

  const targetCount = Math.min(Math.max(parseInt(questionCount, 10) || 20, 5), 40);
  const isBilingual = bilingual !== false;

  const rawKey = process.env.GEMINI_API_KEY || '';
  const apiKey = rawKey.trim().replace(/^['"]|['"]$/g, '');

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'GEMINI_API_KEY belum dikonfigurasikan di Environment Variables. Sila semak tetapan Vercel / fail .env.',
    });
  }

  try {
    const fileNamesSummary = rawFilesList
      .map((f, idx) => `${idx + 1}. ${f?.name || `Slaid ${idx + 1}`}`)
      .join(', ');

    // 1. Prompt Rasmi (Sokong Multi-Slaid sehingga 4 fail & Dwi-Bahasa Arab + Melayu)
    const arahanPrompt = isBilingual
      ? `Anda adalah pakar fiqh dan usul fiqh. Berdasarkan ${rawFilesList.length > 1 ? `kesemua ${rawFilesList.length} slaid/dokumen yang dilampirkan (${fileNamesSummary}) serta ` : ''}nota ini, hasilkan tepat ${targetCount} soalan objektif (A, B, C, D) dalam DWI-BAHASA (Bahasa Arab DAN Bahasa Melayu).
${rawFilesList.length > 1 ? 'PENTING: Pastikan soalan dibahagikan secara seimbang merangkumi isi penting daripada kesemua slaid yang dilampirkan untuk ulang kaji peperiksaan.\n' : ''}
Output mestilah HANYA dalam format array JSON tulen (tanpa teks tambahan di luar JSON) dengan struktur setiap objek mengandungi key tepat berikut:
- "soalan_ar": Soalan lengkap dan jelas dalam Bahasa Arab (sertakan baris/tashkeel pada kaedah fiqh atau istilah penting).
- "soalan": Terjemahan tepat bagi soalan tersebut dalam Bahasa Melayu.
- "pilihan_ar": Array mengandungi TEPAT 4 pilihan jawapan dalam Bahasa Arab.
- "pilihan": Array mengandungi TEPAT 4 pilihan jawapan dalam Bahasa Melayu yang sepadan 1-dengan-1 mengikut susunan indeks (0, 1, 2, 3) dengan "pilihan_ar".
- "jawapan_betul_index": Nombor bulat (integer) 0, 1, 2, atau 3 yang menunjukkan indeks jawapan betul.
- "jawapan_betul": Teks tepat daripada "pilihan[jawapan_betul_index]".
- "huraian_ar": Huraian sangat ringkas (1 ayat) sebab jawapan tepat dalam Bahasa Arab.
- "huraian": Huraian ringkas dan padat (1-2 ayat) pengukuhan konsep dalam Bahasa Melayu.
JANGAN gunakan simbol dollar ($) atau kod LaTeX.
${batchInstruction ? `\nArahan Kumpulan Soalan: ${String(batchInstruction).trim()}\n` : ''}
Tajuk Kuiz: ${tajuk.trim()}
${nota?.trim() ? `\nTeks Slaid / Nota Kuliah Tambahan:\n${nota.trim()}` : ''}`
      : `Anda adalah pakar fiqh. Berdasarkan ${rawFilesList.length > 1 ? `kesemua ${rawFilesList.length} slaid/dokumen yang dilampirkan (${fileNamesSummary}) serta ` : ''}nota ini, hasilkan tepat ${targetCount} soalan objektif (A, B, C, D) dalam bahasa Melayu. Output mestilah HANYA dalam format array JSON tulen dengan key: 'soalan', 'pilihan' (array 4 pilihan), 'jawapan_betul_index' (0-3), 'jawapan_betul', dan 'huraian' (1-2 ayat padat). Jangan beri penerangan lain.
${batchInstruction ? `\nArahan Kumpulan Soalan: ${String(batchInstruction).trim()}\n` : ''}
Tajuk Kuiz: ${tajuk.trim()}
${nota?.trim() ? `\nTeks Slaid / Nota Kuliah:\n${nota.trim()}` : ''}`;

    // 2. Bina bahagian kandungan (parts) termasuk sehingga 4 dokumen PDF/Teks
    const parts = [];

    rawFilesList.forEach((f, idx) => {
      if (!f) return;
      if (f.base64) {
        parts.push({
          inlineData: {
            mimeType: f.type || 'application/pdf',
            data: f.base64,
          },
        });
      } else if (f.textContent) {
        parts.push({
          text: `\n--- [Kandungan Fail ${idx + 1}: ${f.name || 'Nota'}] ---\n${f.textContent}`,
        });
      }
    });

    parts.push({ text: arahanPrompt });

    // 3. Senarai model Google Gemini AKTIF (Utamakan model yang kurang sesak & kuota berbeza)
    const modelsToTry = [
      'gemini-3.6-flash',
      'gemini-2.0-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.7-flash',
      'gemini-3.8-flash',
    ];

    let rawOutputText = '';
    let successModel = '';
    const errorLogs = [];
    const startedAt = Date.now();

    const callGeminiModel = async (model, useMinimalThinking, signal) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const generationConfig = {
        temperature: 0.2,
        topP: 0.95,
        maxOutputTokens: 12288,
        responseMimeType: 'application/json',
      };
      if (useMinimalThinking && model.startsWith('gemini-3')) {
        generationConfig.thinkingConfig = { thinkingLevel: 'MINIMAL' };
      }

      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig,
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      });
    };

    const tryModelList = async (list, timeoutMs) => {
      for (const model of list) {
        // Berhenti awal jika baki masa pelayan Vercel < 8 saat supaya tidak kena 504
        const remainingMs = 54000 - (Date.now() - startedAt);
        if (remainingMs < 8000) break;

        const effectiveTimeout = Math.min(timeoutMs, remainingMs);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

        try {
          let response = await callGeminiModel(model, true, controller.signal);

          // Jika model tidak menyokong thinkingConfig, cuba semula tanpa thinkingConfig
          if (!response.ok && response.status === 400) {
            response = await callGeminiModel(model, false, controller.signal);
          }

          clearTimeout(timeoutId);

          if (response.ok) {
            const resJson = await response.json();
            const candidate = resJson?.candidates?.[0];
            rawOutputText = (candidate?.content?.parts || [])
              .filter((p) => !p.thought)
              .map((p) => p.text || '')
              .join('')
              .trim();
            if (rawOutputText) {
              successModel = model;
              return true;
            }
            errorLogs.push(`${model}: respons kosong (${candidate?.finishReason || 'UNKNOWN'})`);
          } else {
            const errText = await response.text();
            let parsedErr = errText;
            try {
              parsedErr = JSON.parse(errText)?.error?.message || errText;
            } catch {}
            errorLogs.push(`${model} (${response.status}): ${parsedErr}`);

            // Jika server Google 503 (sesak), beri jeda ringkas sebelum model seterusnya
            if (response.status === 503) {
              await new Promise((r) => setTimeout(r, 350));
            }
          }
        } catch (err) {
          clearTimeout(timeoutId);
          errorLogs.push(`${model}: ${err.message}`);
        }
      }
      return false;
    };

    // Pusingan 1: Beri had 38 saat supaya model aktif (cth: gemini-3.6-flash) sempat selesai menjana JSON penuh
    await tryModelList(modelsToTry, 38000);

    // Pusingan 2: Hanya jika masih banyak masa berbaki dan ada 503 (bukan 429 kuota habis)
    if (!rawOutputText && Date.now() - startedAt < 32000 && errorLogs.some((e) => e.includes('(503)'))) {
      await new Promise((r) => setTimeout(r, 1500));
      await tryModelList(['gemini-3.6-flash', 'gemini-2.0-flash-lite', 'gemini-3.5-flash-lite'], 22000);
    }

    if (!rawOutputText) {
      // Utamakan ralat yang bukan 404 (model tamat) supaya punca sebenar kelihatan
      const ralatPenting = errorLogs.filter((e) => !e.includes('(404)'));
      const ringkasan = (ralatPenting.length ? ralatPenting : errorLogs).slice(0, 3).join(' | ');
      const isAllBusy = errorLogs.length > 0 && errorLogs.some((e) => e.includes('(503)'));
      return res.status(isAllBusy ? 503 : 500).json({
        success: false,
        error: `Semua model Gemini sedang sibuk / gagal menjana kuiz. Butiran: ${ringkasan}`,
      });
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
      dwi_bahasa: isBilingual,
      soalan_objektif: soalanObjektif,
      model_penjana: successModel,
    };

    // 5. Simpan automatik ke Cloud (Firebase) dan Storan Tempatan (melainkan skipSave untuk mod batch)
    if (!skipSave) {
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
    }

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

    let pilihanAr = Array.isArray(item.pilihan_ar)
      ? item.pilihan_ar.map((p) => String(p).trim())
      : [];
    if (pilihanAr.length > 4) {
      pilihanAr = pilihanAr.slice(0, 4);
    } else if (pilihanAr.length > 0 && pilihanAr.length < 4) {
      while (pilihanAr.length < 4) {
        pilihanAr.push('');
      }
    }

    // Normalisasi jawapan betul (utamakan jawapan_betul_index jika sah untuk dwi-bahasa)
    let jawapanBetul = '';
    const idxNum = Number(item.jawapan_betul_index);
    if (Number.isInteger(idxNum) && idxNum >= 0 && idxNum < 4 && pilihan[idxNum]) {
      jawapanBetul = pilihan[idxNum];
    } else {
      jawapanBetul = String(item.jawapan_betul || pilihan[0]).trim();

      // Jika jawapan betul hanya huruf "A", "B", "C", "D"
      const matchLetter = jawapanBetul.match(/^([A-D])\b/i);
      if (matchLetter && !pilihan.includes(jawapanBetul)) {
        const letterIndex = { A: 0, B: 1, C: 2, D: 3 }[matchLetter[1].toUpperCase()];
        if (letterIndex !== undefined && pilihan[letterIndex]) {
          jawapanBetul = pilihan[letterIndex];
        }
      } else if (!pilihan.includes(jawapanBetul)) {
        // Semak jika jawapan_betul dipulangkan dalam bahasa Arab (padan dengan pilihan_ar)
        const arMatchIdx = pilihanAr.findIndex(
          (arOpt) =>
            arOpt &&
            (arOpt === jawapanBetul ||
              arOpt.includes(jawapanBetul) ||
              jawapanBetul.includes(arOpt))
        );
        if (arMatchIdx !== -1 && pilihan[arMatchIdx]) {
          jawapanBetul = pilihan[arMatchIdx];
        } else {
          // Cari pilihan Melayu yang sepadan sebahagian
          const matched = pilihan.find(
            (p) =>
              p.toLowerCase().includes(jawapanBetul.toLowerCase()) ||
              jawapanBetul.toLowerCase().includes(p.toLowerCase())
          );
          jawapanBetul = matched || pilihan[0];
        }
      }
    }

    return {
      id: idx + 1,
      soalan: String(item.soalan || `Soalan ${idx + 1}`).trim(),
      ...(item.soalan_ar ? { soalan_ar: String(item.soalan_ar).trim() } : {}),
      pilihan: pilihan,
      ...(pilihanAr.length === 4 && pilihanAr.some(Boolean) ? { pilihan_ar: pilihanAr } : {}),
      jawapan_betul: jawapanBetul,
      huraian: String(item.huraian || 'Tiada huraian tambahan dibekalkan.').trim(),
      ...(item.huraian_ar ? { huraian_ar: String(item.huraian_ar).trim() } : {}),
    };
  });
}
