import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pinecone } from './qawaid-backend/node_modules/@pinecone-database/pinecone/dist/index.js';
import pdf from './qawaid-backend/node_modules/pdf-extraction/index.js';
import {
  KITAB_UTAMA,
  PETA_HALAMAN_SAH_21786,
  binaUrlHalamanShamela,
  binaUrlCarianMatanShamela,
  cariRujukanKitabUtamaTempatan,
  perkayaRujukanDenganShamelaLive,
  sahkanUrlShamelaDalamJawapan,
} from './src/utils/shamelaKitabUtama.js';

// Baca konfigurasi .env daripada folder qawaid-backend
function muatEnvBackend() {
  const envPath = path.resolve(process.cwd(), 'qawaid-backend/.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (m) {
        env[m[1]] = (m[2] || '').replace(/^['"]|['"]$/g, '').trim();
      }
    }
  }
  return {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || env.GEMINI_API_KEY,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY || env.PINECONE_API_KEY,
    PINECONE_INDEX: process.env.PINECONE_INDEX || env.PINECONE_INDEX,
  };
}

function janaIdKitabUnik(namaKitab) {
  return crypto.createHash('md5').update(namaKitab.trim()).digest('hex').slice(0, 10);
}

async function dapatkanSenaraiModelFlash(apiKey) {
  let senaraiModel = [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
  ];
  try {
    const resModels = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (resModels.ok) {
      const dataModels = await resModels.json();
      const modelTersedia = (dataModels.models || [])
        .filter(
          (m) =>
            (m.supportedGenerationMethods || []).includes('generateContent') &&
            !m.name.includes('tts') &&
            !m.name.includes('image') &&
            !m.name.includes('embedding') &&
            !m.name.includes('robotics') &&
            !m.name.includes('computer-use')
        )
        .map((m) => m.name.replace(/^models\//, ''));

      const modelFlash = modelTersedia.filter((n) => n.includes('flash'));
      const gabungan = [...new Set([...modelFlash, ...senaraiModel, ...modelTersedia])];
      if (gabungan.length > 0) senaraiModel = gabungan.slice(0, 8);
    }
  } catch {
    // Abaikan jika gagal senaraikan model
  }
  return senaraiModel;
}

async function dapatkanVektor768(teks, apiKey, cubaan = 3) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;
  for (let c = 0; c < cubaan; c++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text: teks }] },
          outputDimensionality: 768,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Ralat Embedding');
      return data.embedding.values;
    } catch (err) {
      if (c === cubaan - 1) throw err;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

// Ekstrak PDF Imbasan (Scanned PDF sehingga 50MB / 1000 halaman) menggunakan Gemini Files API + Multi-Model Fallback
async function ekstrakPdfImbasanDenganGemini(dataBuffer, namaKitab, apiKey) {
  const saizMB = dataBuffer.length / (1024 * 1024);
  if (saizMB > 50) {
    throw new Error(`Saiz fail PDF (${saizMB.toFixed(1)} MB) melebihi had 50 MB Gemini Files API.`);
  }

  // 1. Muat naik PDF ke Gemini Files API (menyokong sehingga 50MB & 1000 muka surat)
  let fileUri = null;
  let fileNameResource = null;
  try {
    const startRes = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': String(dataBuffer.length),
          'X-Goog-Upload-Header-Content-Type': 'application/pdf',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: { display_name: namaKitab.slice(0, 60) } }),
      }
    );

    const uploadUrl = startRes.headers.get('x-goog-upload-url');
    if (uploadUrl) {
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Length': String(dataBuffer.length),
          'X-Goog-Upload-Offset': '0',
          'X-Goog-Upload-Command': 'upload, finalize',
        },
        body: dataBuffer,
      });
      const fileInfo = await uploadRes.json();
      if (uploadRes.ok && fileInfo?.file?.uri) {
        fileUri = fileInfo.file.uri;
        fileNameResource = fileInfo.file.name;

        // Tunggu sehingga status fail ACTIVE
        for (let w = 0; w < 15; w++) {
          const checkRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${fileNameResource}?key=${apiKey}`
          );
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.state === 'ACTIVE') break;
            if (checkData.state === 'FAILED') {
              throw new Error('Pemprosesan fail PDF di pelayan Gemini gagal.');
            }
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Gagal muat naik ke Files API, cuba inlineData:', e.message);
  }

  const senaraiModel = await dapatkanSenaraiModelFlash(apiKey);
  let ralatTerakhir = '';

  const promptOcr = `Dokumen PDF ini ialah kitab "${namaKitab}".
Sila ekstrak kandungan ilmiah utama, takrif, kaedah fiqhiyyah, pecahan kaedah (dawabit/furu'), syarat-syarat, contoh permasalahan, serta petikan matan Arab yang penting daripada kitab ini secara terperinci dan panjang lebar (sekurang-kurangnya 25–40 perenggan lengkap dalam bahasa Arab beserta ringkasan topiknya) supaya ia boleh diindeks ke dalam pangkalan data RAG.`;

  for (const namaModel of senaraiModel) {
    try {
      const partDokumen = fileUri
        ? { fileData: { mimeType: 'application/pdf', fileUri } }
        : { inlineData: { mimeType: 'application/pdf', data: dataBuffer.toString('base64') } };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${namaModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [partDokumen, { text: promptOcr }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        const msg = data.error?.message || `HTTP ${response.status}`;
        if (!ralatTerakhir || response.status !== 404) {
          ralatTerakhir = `[${namaModel} - ${response.status}] ${msg}`;
        }
        continue;
      }

      const parts = data.candidates?.[0]?.content?.parts || [];
      const teks = parts.map((p) => p.text || '').join('').trim();
      if (teks.length > 50) {
        return teks;
      }
    } catch (err) {
      ralatTerakhir = `[${namaModel}] ${err.message}`;
    }
  }

  throw new Error(
    `Kitab ini ialah PDF Imbasan (Scanned Image tanpa teks digital), dan percubaan OCR Gemini gagal: ${ralatTerakhir || 'Tiada model aktif'}`
  );
}

async function janaJawapanGemini(promptPenuh, senaraiSumber, apiKey) {
  const senaraiModel = await dapatkanSenaraiModelFlash(apiKey);
  let ralatTerakhir = '';

  for (const namaModel of senaraiModel) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${namaModel}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptPenuh }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
          },
        }),
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        const msg = data.error?.message || `HTTP ${response.status}`;
        if (!ralatTerakhir || response.status !== 404) {
          ralatTerakhir = `[${namaModel} - ${response.status}] ${msg}`;
        }
        continue;
      }

      const parts = data.candidates?.[0]?.content?.parts || [];
      const teksJawapan = parts.map((p) => p.text || '').join('').trim();

      if (teksJawapan) {
        return teksJawapan;
      } else {
        ralatTerakhir = `[${namaModel}] Respons kosong (${data.candidates?.[0]?.finishReason || 'UNKNOWN'})`;
      }
    } catch (err) {
      clearTimeout(timeoutId);
      ralatTerakhir = `[${namaModel}] ${err.message}`;
    }
  }

  let ringkasanFallback = `⚠️ **[Makluman: Pelayan AI sedang sibuk. Berikut adalah petikan terus dari kitab ${KITAB_UTAMA}]**\n\n`;
  senaraiSumber.forEach((s, idx) => {
    ringkasanFallback += `### Rujukan ${idx + 1}: ${s.kitab} (${s.jilidHalaman || 'Jil. 1'})\n> «${s.teks.trim()}»\n🔗 [Buka Muka Surat di Shamela.ws](${s.urlShamela})\n\n`;
  });
  return ringkasanFallback;
}

function bacaBodyJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function qawaidBackendPlugin() {
  return {
    name: 'qawaid-backend-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        res.setHeader('Content-Type', 'application/json');

        try {
          const env = muatEnvBackend();
          const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY });
          const index = pc.index(env.PINECONE_INDEX);

          if (req.method === 'POST' && req.url.startsWith('/api/chat')) {
            const body = await bacaBodyJson(req);
            const teksSoalan = body.soalan || body.question || body.message;
            if (!teksSoalan) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Sila masukkan soalan.' }));
            }

            // 1. Cari rujukan halaman tepat daripada indeks kitab القواعد الفقهية وتطبيقاتها في المذاهب الأربعة + sahkan dengan Shamela Live
            const rujukanTempatan = await perkayaRujukanDenganShamelaLive(
              cariRujukanKitabUtamaTempatan(teksSoalan)
            );
            const senaraiSumber = [];
            let konteksKitab = '';

            rujukanTempatan.forEach((r, idx) => {
              const labelKitab = `${KITAB_UTAMA} (${r.jilidHalaman})`;
              konteksKitab += `\n--- [Rujukan ${idx + 1} | Kitab: ${KITAB_UTAMA} | Halaman: ${r.jilidHalaman} | Link Shamela Sah: ${r.urlShamela}] ---\n${r.teks}\n`;
              senaraiSumber.push({
                kitab: labelKitab,
                jilidHalaman: r.jilidHalaman,
                matanArab: r.matanArab,
                teks: r.teks,
                skor: 0.95 - idx * 0.03,
                urlShamela: r.urlShamela,
                urlCarianShamela: r.urlCarianShamela,
              });
            });

            // 2. Cari juga petikan matan daripada Pinecone tetapi HADKAN EKSKLUSIF kepada kitab القواعد الفقهية وتطبيقاتها في المذاهب الأربعة sahaja
            try {
              const vektorSoalan = await dapatkanVektor768(teksSoalan, env.GEMINI_API_KEY);
              const hasilCarian = await index.query({
                vector: vektorSoalan,
                topK: 15,
                includeMetadata: true,
              });

              const matchesKitabUtama = (hasilCarian.matches || []).filter((m) => {
                const namaSumber = String(m.metadata?.sumber || '');
                return (
                  namaSumber.includes('القواعد الفقهية وتطبيقاتها') ||
                  namaSumber.includes('الزحيلي') ||
                  namaSumber.includes('المذاهب الأربعة')
                );
              });

              matchesKitabUtama.slice(0, 2).forEach((match) => {
                const teks = match.metadata?.teks || '';
                const kesanHlmEksplisit = Number(teks.match(/ص\s*:\s*(\d+)/)?.[1] || 0);
                const infoSah = PETA_HALAMAN_SAH_21786[kesanHlmEksplisit];
                const jilidHlm = infoSah
                  ? infoSah.jilidHalaman
                  : rujukanTempatan[0]?.jilidHalaman || 'Jil. 1, hlm. 62';
                const pautanHalaman = infoSah
                  ? infoSah.urlShamela
                  : rujukanTempatan[0]?.urlShamela || binaUrlHalamanShamela(62);
                const labelKitab = `${KITAB_UTAMA} (${jilidHlm})`;

                konteksKitab += `\n--- [Petikan Matan Pinecone | Kitab: ${KITAB_UTAMA} | Halaman: ${jilidHlm} | Link Shamela Sah: ${pautanHalaman}] ---\n${teks}\n`;
                senaraiSumber.push({
                  kitab: labelKitab,
                  jilidHalaman: jilidHlm,
                  matanArab: rujukanTempatan[0]?.matanArab || KITAB_UTAMA,
                  teks,
                  skor: match.score,
                  urlShamela: pautanHalaman,
                  urlCarianShamela:
                    rujukanTempatan[0]?.urlCarianShamela || binaUrlCarianMatanShamela(KITAB_UTAMA),
                });
              });
            } catch {
              // Teruskan dengan rujukan tempatan jika carian vektor gagal
            }

            const rujukanUtama = senaraiSumber[0] || {
              jilidHalaman: 'Jil. 1, hlm. 62',
              urlShamela: 'https://shamela.ws/book/21786/56',
            };

            const prompt = `Anda ialah Penyelidik AI Qawaid OS yang DIKHUSUSKAN EKSKLUSIF kepada sebuah kitab sahaja iaitu:
"${KITAB_UTAMA}" (Karya Syeikh Prof. Dr. Muhammad Mustafa al-Zuhaili, terbitan Dar al-Fikr).

PERATURAN WAJIB:
1. Jawab soalan pengguna HANYA berdasarkan kitab "${KITAB_UTAMA}" dan petikan rujukan yang disertakan di bawah. JANGAN rujuk atau petik nama kitab lain.
2. Huraikan dengan jelas, tersusun dan ilmiah dalam Bahasa Melayu merangkumi:
   - Lafaz Matan Kaedah dalam Bahasa Arab (berbaris) & terjemahannya.
   - Syarah, syarat/pengecualian, serta aplikasi dalam المذاهب الأربعة (Hanafi, Maliki, Syafie, Hanbali) mengikut kitab ini.
3. PENTING — PAUTAN SHAMELA.WS:
   - JANGAN sesekali mereka-reka nombor URL Shamela sendiri!
   - Anda HANYA dibenarkan menggunakan pautan Shamela yang tertulis secara rasmi dalam blok [Rujukan 1] di bawah iaitu:
     [${KITAB_UTAMA} - ${rujukanUtama.jilidHalaman}](${rujukanUtama.urlShamela})

RUJUKAN KITAB (${KITAB_UTAMA}):
${konteksKitab}

SOALAN PENGGUNA:
${teksSoalan}`;

            const jawapanMentah = await janaJawapanGemini(
              prompt,
              senaraiSumber,
              env.GEMINI_API_KEY
            );
            const jawapanAkhir = sahkanUrlShamelaDalamJawapan(jawapanMentah, senaraiSumber);

            res.statusCode = 200;
            return res.end(
              JSON.stringify({
                jawapan: jawapanAkhir,
                answer: jawapanAkhir,
                sumber: senaraiSumber,
              })
            );
          }

          if (req.method === 'POST' && req.url.startsWith('/api/upload-pdf')) {
            const body = await bacaBodyJson(req);
            const { fileName, fileBase64, maxBlocks = 60 } = body || {};

            if (!fileName || !fileBase64) {
              res.statusCode = 400;
              return res.end(
                JSON.stringify({ error: 'Sila pilih fail PDF atau teks untuk dimuat naik.' })
              );
            }

            const bersihBase64 = fileBase64.replace(/^data:.*;base64,/, '');
            const dataBuffer = Buffer.from(bersihBase64, 'base64');
            const namaFailSelamat = fileName.replace(/[<>:"/\\|?*]/g, '_');
            const namaKitab = namaFailSelamat.replace(/\.(pdf|html?|txt)$/i, '');
            const kodKitab = janaIdKitabUnik(namaKitab);

            try {
              fs.writeFileSync(
                path.resolve(process.cwd(), 'qawaid-backend', namaFailSelamat),
                dataBuffer
              );
            } catch {
              // Abaikan jika gagal simpan salinan tempatan
            }

            let teksMentah = '';
            let kaedah = 'Teks Digital PDF';

            if (namaFailSelamat.toLowerCase().endsWith('.pdf')) {
              try {
                const dataPdf = await pdf(dataBuffer);
                teksMentah = dataPdf.text || '';
              } catch {
                teksMentah = '';
              }

              if (teksMentah.replace(/\s+/g, '').length < 100) {
                kaedah = 'OCR Pintar Gemini Files API (PDF Imbasan 265+ Halaman)';
                teksMentah = await ekstrakPdfImbasanDenganGemini(
                  dataBuffer,
                  namaKitab,
                  env.GEMINI_API_KEY
                );
              }
            } else {
              kaedah = 'Teks / HTML';
              teksMentah = dataBuffer
                .toString('utf-8')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<[^>]*>?/gm, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&#8204;/g, '');
            }

            const teksBersih = teksMentah.replace(/\s+/g, ' ').trim();
            const senaraiPerenggan = teksBersih.match(/.{1,1200}(\s|$)/g) || [];
            const perenggan = senaraiPerenggan
              .map((p) => p.trim())
              .filter((p) => p.length > 30);

            if (perenggan.length === 0) {
              res.statusCode = 422;
              return res.end(
                JSON.stringify({
                  error:
                    'Tiada teks yang dapat diekstrak daripada fail ini.',
                })
              );
            }

            const had = Math.min(Number(maxBlocks) || 60, perenggan.length);
            for (let i = 0; i < had; i++) {
              const teks = perenggan[i];
              const vektor = await dapatkanVektor768(teks, env.GEMINI_API_KEY);
              const rekodData = [
                {
                  id: `kitab-${kodKitab}-blok${i}`,
                  values: vektor,
                  metadata: { teks, sumber: namaKitab },
                },
              ];
              try {
                await index.upsert(rekodData);
              } catch {
                await index.upsert({ records: rekodData });
              }
              await new Promise((r) => setTimeout(r, 250));
            }

            res.statusCode = 200;
            return res.end(
              JSON.stringify({
                berjaya: true,
                namaKitab,
                kodKitab: `kitab-${kodKitab}`,
                jumlahBlok: had,
                jumlahKeseluruhanBlok: perenggan.length,
                kaedah,
              })
            );
          }

          return next();
        } catch (err) {
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), qawaidBackendPlugin()],
});
