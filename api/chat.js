// qawaid-explorer/api/chat.js
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

  const { soalan, stream = true } = req.body || {};
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

    // Fungsi normalisasi teks Arab & Melayu untuk padanan pintar
    const stripDiacritics = (str = '') =>
      str
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // buang harakat/tashkeel
        .replace(/[أإآء]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .toLowerCase()
        .trim();

    const qClean = stripDiacritics(qNorm);
    const perkataan = qClean.split(/\s+/).filter((w) => w.length > 2);

    // 1. Carian Konteks Tempatan pantas daripada 52+ Nota Lengkap Kitab (<1ms)
    const konteksRelevan = [];
    const sumberPilihan = [];

    dataNotaLengkap.forEach((nota) => {
      let skor = 0;
      const tajukAr = stripDiacritics(nota.tajukArab || nota.tajuk || '');
      const carianAr = stripDiacritics(nota.teksArabCarian || '');
      const tajukBm = (nota.tajukBm || '').toLowerCase();
      const huraian = (nota.huraian || '').toLowerCase();
      const aplikasi = (nota.aplikasi || nota.tatbiqat || '').toLowerCase();
      const dalil = (nota.dalil || '').toLowerCase();

      // Padanan kata kunci pintar (Arab & Rumi)
      perkataan.forEach((w) => {
        if (tajukAr.includes(w)) skor += 14;
        if (carianAr.includes(w)) skor += 12;
        if (tajukBm.includes(w)) skor += 8;
        if (aplikasi.includes(w)) skor += 5;
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
      if (n.aplikasi || n.tatbiqat) konteksTeks += `Tatbiqat Empat Mazhab: ${n.aplikasi || n.tatbiqat}\n`;
      const cetakan = n.jilidHalaman || `Jil. ${n.jilid || 1}, m/s ${n.halaman || ''}`;
      konteksTeks += `Rujukan Cetakan: ${cetakan}\n`;
      if (n.urlShamela) {
        konteksTeks += `Pautan Sah Shamela: ${n.urlShamela}\n`;
        sumberPilihan.push({
          kitab: 'القواعد الفقهية وتطبيقاتها في المذاهب الأربعة',
          tajuk: n.tajukArab || n.tajukBm || 'Rujukan Kaedah',
          jilidHalaman: cetakan,
          urlShamela: n.urlShamela,
          teks: n.aplikasi || n.huraian || n.tatbiqat || n.tajukBm || n.tajukArab || '',
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
2. Setiap kali menyebut sesuatu kaedah fiqh, berikan lafaz Arab berbaris lengkap berserta maksud terjemahannya secara teks biasa atau tebal (**...**).
3. DILARANG SAMA SEKALI menggunakan simbol dollar ($ atau $$) atau sintaks kod LaTeX matematik seperti \\text{...}, \\mathbf{...}, atau $$...$$. Tulis teks Arab dan Rumi dalam bentuk teks biasa.
4. Nyatakan aplikasi perbandingan antara mazhab (Hanafi, Maliki, Syafie, Hanbali) mengikut huraian pengarang.
5. Di akhir jawapan, sertakan rujukan nombor Jilid & Halaman serta formatkan pautan Shamela.ws secara markdown link yang kemas seperti:
   [Baca Halaman Rujukan di Shamela.ws](https://shamela.ws/book/21786/xx)
6. Jangan mereka-reka maklumat di luar manhaj kitab ini.

Konteks Rujukan Kitab:
${konteksTeks || 'Kitab al-Qawaid al-Fiqhiyyah wa Tatbiqatuha fi al-Madhahib al-Arbaah karya Syeikh Muhammad Mustafa al-Zuhaili.'}`;

    const promptPenuh = `${systemPrompt}\n\nSoalan Pengguna:\n${soalan}`;

    // Senarai model aktif rasmi Google Gemini (mengikut cadangan API terkini Google)
    const modelsToTry = [
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-flash-latest',
    ];

    const logRalat = [];

    // Fungsi pembantu untuk membuat panggilan ke Gemini API
    const callGemini = async (modelName, isStreaming = true) => {
      const endpoint = isStreaming ? ':streamGenerateContent?alt=sse&' : ':generateContent?';
      const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}${endpoint}key=${encodeURIComponent(apiKey)}`;

      const genConfig = {
        temperature: 0.3,
        topP: 0.95,
        maxOutputTokens: 3500,
      };

      // Tetapan keselamatan untuk mengelakkan teks fiqh (taharah, mandi hadas, aurat dsb) daripada disekat
      const safetySettings = [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ];

      return fetch(genUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptPenuh }] }],
          generationConfig: genConfig,
          safetySettings,
        }),
      });
    };

    // Aliran Penstriman (Streaming Mode / SSE)
    if (stream) {
      for (const m of modelsToTry) {
        try {
          const resGen = await callGemini(m, true);

          if (resGen.ok && resGen.body) {
            // Berjaya bersambung ke model! Hantar header SSE ke klien
            res.writeHead(200, {
              'Content-Type': 'text/event-stream; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive',
              'X-Accel-Buffering': 'no',
            });

            if (typeof res.flushHeaders === 'function') {
              res.flushHeaders();
            }

            const reader = resGen.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let totalJawapan = '';

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // simpan baki pecahan baris

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed || !trimmed.startsWith('data:')) continue;
                  const jsonStr = trimmed.replace(/^data:\s*/, '');
                  if (!jsonStr || jsonStr === '[DONE]') continue;

                  try {
                    const parsed = JSON.parse(jsonStr);
                    const parts = parsed?.candidates?.[0]?.content?.parts || [];
                    let chunk = '';
                    for (const p of parts) {
                      if (!p.thought && p.text) {
                        chunk += p.text;
                      }
                    }
                    if (chunk) {
                      totalJawapan += chunk;
                      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
                      if (typeof res.flush === 'function') {
                        res.flush();
                      }
                    }
                  } catch (e) {}
                }
              }

              // Flush baki buffer terakhir
              if (buffer && buffer.trim().startsWith('data:')) {
                try {
                  const parsed = JSON.parse(buffer.trim().replace(/^data:\s*/, ''));
                  const parts = parsed?.candidates?.[0]?.content?.parts || [];
                  let chunk = '';
                  for (const p of parts) {
                    if (!p.thought && p.text) {
                      chunk += p.text;
                    }
                  }
                  if (chunk) {
                    totalJawapan += chunk;
                    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
                  }
                } catch (e) {}
              }

              if (totalJawapan.length > 50) {
                // Selesai penstriman jawapan
                res.write(
                  `data: ${JSON.stringify({
                    done: true,
                    sumber: sumberPilihan.slice(0, 3),
                    model: m,
                  })}\n\n`
                );
                if (typeof res.flush === 'function') {
                  res.flush();
                }
                res.end();
                return; // Tamat dengan jayanya!
              }
            } catch (streamErr) {
              logRalat.push(`${m} stream cut: ${streamErr.message}`);
              res.write(
                `data: ${JSON.stringify({
                  error: `Terputus semasa menjana jawapan: ${streamErr.message}`,
                })}\n\n`
              );
              res.end();
              return;
            }
          } else {
            const errGenText = await resGen.text();
            let msgGen = errGenText;
            try {
              msgGen = JSON.parse(errGenText)?.error?.message || errGenText;
            } catch {}
            logRalat.push(`${m} (${resGen.status}): ${msgGen}`);
          }
        } catch (eGen) {
          logRalat.push(`${m}: ${eGen.message}`);
        }
      }

      // Jika kesemua model gagal sebelum streaming bermula
      return res.status(502).json({
        error: `Pelayan Google Gemini sibuk: ${logRalat.join(' | ')}`,
      });
    }

    // Mod Tradisional Bukan Penstriman (Non-streaming fallback)
    for (const m of modelsToTry) {
      try {
        const resGen = await callGemini(m, false);

        if (resGen.ok) {
          const dataGen = await resGen.json();
          const parts = dataGen?.candidates?.[0]?.content?.parts || [];
          let jawapanText = '';
          for (const p of parts) {
            if (!p.thought && p.text) jawapanText += p.text;
          }
          if (jawapanText) {
            return res.status(200).json({
              jawapan: jawapanText,
              model: m,
              sumber: sumberPilihan.slice(0, 3),
            });
          }
        } else {
          const errGenText = await resGen.text();
          let msgGen = errGenText;
          try {
            msgGen = JSON.parse(errGenText)?.error?.message || errGenText;
          } catch {}
          logRalat.push(`${m} (${resGen.status}): ${msgGen}`);
        }
      } catch (eGen) {
        logRalat.push(`${m}: ${eGen.message}`);
      }
    }

    return res.status(502).json({
      error: `Pelayan Google Gemini sibuk: ${logRalat.join(' | ')}`,
    });
  } catch (error) {
    console.error('Ralat dalam handler chat:', error);
    return res.status(500).json({
      error: `Ralat pelayan: ${error.message}`,
    });
  }
}
