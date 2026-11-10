// qawaid-explorer/src/utils/shamelaKitabUtama.js
// Modul Pengesahan & Padanan Tepat Halaman Shamela.ws bagi Kitab:
// "القواعد الفقهية وتطبيقاتها في المذاهب الأربعة" — Syeikh Prof. Dr. Muhammad Mustafa al-Zuhaili (Book ID: 21786)

import fs from 'fs';
import path from 'path';
import { dataNotaLengkap } from '../dataNota.js';
import { dataKuiz50 } from '../dataKuiz.js';

export const KITAB_UTAMA = 'القواعد الفقهية وتطبيقاتها في المذاهب الأربعة';
export const SHAMELA_BOOK_ID = 21786;

// Peta Halaman Cetakan <-> URL Shamela.ws yang telah DISAHKAN 100% dalam kitab 21786
export const PETA_HALAMAN_SAH_21786 = {
  28: {
    halaman: 28,
    jilidHalaman: 'Jil. 1, hlm. 28',
    urlShamela: 'https://shamela.ws/book/21786/24',
    bab: 'مقدمة الكتاب، تعريف القواعد الفقهية، تاريخها، والقواعد الكلية',
  },
  62: {
    halaman: 62,
    jilidHalaman: 'Jil. 1, hlm. 62',
    urlShamela: 'https://shamela.ws/book/21786/56',
    bab: 'القاعدة الأولى الكبرى: الأمور بمقاصدها (معناها، تأصيلها، وحكم النية في المذاهب الأربعة)',
  },
  63: {
    halaman: 63,
    jilidHalaman: 'Jil. 1, hlm. 63',
    urlShamela: 'https://shamela.ws/book/21786/57',
    bab: 'القواعد المندرجة تحت الأمور بمقاصدها: الأعمال بالنيات، العبرة في العقود للمقاصد والمعاني',
  },
  96: {
    halaman: 96,
    jilidHalaman: 'Jil. 1, hlm. 96',
    urlShamela: 'https://shamela.ws/book/21786/90',
    bab: 'القاعدة الثانية الكبرى: اليقين لا يزول بالشك (والثابت باليقين لا ينتقض إلا بيقين مثله)',
  },
  111: {
    halaman: 111,
    jilidHalaman: 'Jil. 1, hlm. 111',
    urlShamela: 'https://shamela.ws/book/21786/105',
    bab: 'القواعد المتفرعة عن اليقين لا يزول بالشك: الأصل بقاء ما كان على ما كان، الأصل براءة الذمة',
  },
  210: {
    halaman: 210,
    jilidHalaman: 'Jil. 1, hlm. 210',
    urlShamela: 'https://shamela.ws/book/21786/204',
    bab: 'قاعدة الضرر يزال (لا ضرر ولا ضرار، الضرر يدفع بقدر الإمكان، الضرر لا يكون قديماً)',
  },
  219: {
    halaman: 219,
    jilidHalaman: 'Jil. 1, hlm. 219',
    urlShamela: 'https://shamela.ws/book/21786/213',
    bab: 'القواعد المتفرعة عن الضرر يزال: الضرر الأشد يزال بالضرر الأخف، الضرر لا يزال بمثله، درء المفاسد',
  },
  273: {
    halaman: 273,
    jilidHalaman: 'Jil. 1, hlm. 273',
    urlShamela: 'https://shamela.ws/book/21786/267',
    bab: 'قاعدة المشقة تجلب التيسير (إذا ضاق الأمر اتسع، الضرورة تقدر بقدرها، الميسور لا يسقط بالمعسور)',
  },
  276: {
    halaman: 276,
    jilidHalaman: 'Jil. 1, hlm. 276',
    urlShamela: 'https://shamela.ws/book/21786/270',
    bab: 'القواعد المتفرعة عن المشقة تجلب التيسير: الضرورات تبيح المحظورات، الحاجة تنزل منزلة الضرورة',
  },
  321: {
    halaman: 321,
    jilidHalaman: 'Jil. 1, hlm. 321',
    urlShamela: 'https://shamela.ws/book/21786/315',
    bab: 'القاعدة الخامسة الكبرى: العادة محكمة (استعمال الناس حجة يجب العمل بها، الكتاب كالخطاب)',
  },
  323: {
    halaman: 323,
    jilidHalaman: 'Jil. 1, hlm. 323',
    urlShamela: 'https://shamela.ws/book/21786/317',
    bab: 'القواعد المتفرعة عن العادة محكمة: إنما تعتبر العادة إذا اطردت أو غلبت، لا ينكر تغير الأحكام، المعروف عرفاً',
  },
  656: {
    halaman: 656,
    jilidHalaman: 'Jil. 1, hlm. 656',
    urlShamela: 'https://shamela.ws/book/21786/646',
    bab: 'قاعدة الإطلاق محمول على العادة والتطبيقات الفقهية',
  },
};

export const SENARAI_URL_SAH_21786 = new Set(
  Object.values(PETA_HALAMAN_SAH_21786).map((v) => v.urlShamela)
);

// Senarai kata henti (stopwords) Bahasa Melayu supaya tidak mengganggu pemarkahan topik fiqh
const STOPWORDS_MELAYU = new Set([
  'apakah', 'apa', 'bagaimana', 'bagaimanakah', 'mengapa', 'kenapa', 'bila', 'bilakah',
  'siapa', 'siapakah', 'mana', 'manakah', 'beza', 'perbezaan', 'persamaan', 'syarat',
  'hukum', 'kaedah', 'fiqh', 'fiqhiyyah', 'qawaid', 'mazhab', 'empat', 'antara',
  'dalam', 'bawah', 'atas', 'untuk', 'kepada', 'daripada', 'dengan', 'yang', 'dan',
  'atau', 'jika', 'apabila', 'kerana', 'sebab', 'contoh', 'huraikan', 'jelaskan',
  'nyatakan', 'berikan', 'maksud', 'erti', 'takrif', 'definisi', 'mengikut', 'menurut',
  'kitab', 'syeikh', 'zuhaili', 'tentang', 'berkaitan', 'adalah', 'ialah', 'boleh',
  'tidak', 'ada', 'tiada', 'satu', 'dua', 'tiga', 'itu', 'ini', 'tersebut', 'bagi',
  'pada', 'oleh', 'secara', 'serta', 'سؤال', 'ما', 'هي', 'هو', 'في', 'من', 'على', 'إلى', 'عن',
]);

// Kamus Pemetaan Topik Fiqh Bahasa Melayu -> Matan Arab & Halaman Kitab 21786
const KAMUS_TOPIK_FIQH = [
  {
    kataMelayu: ['niat', 'wuduk', 'tayamum', 'mandi', 'junub', 'iktikaf', 'pahala', 'ikhlas', 'qasad', 'maqasid', 'tujuan', 'amalan'],
    frasaArab: ['الأمور بمقاصدها', 'الأعمال بالنيات'],
    halamanUtama: 62,
    urlShamela: 'https://shamela.ws/book/21786/56',
  },
  {
    kataMelayu: ['akad', 'kontrak', 'hibah', 'lafaz', 'makna', 'jual', 'beli', 'sewa', 'iwad'],
    frasaArab: ['العبرة في العقود للمقاصد والمعاني', 'الأمور بمقاصدها'],
    halamanUtama: 63,
    urlShamela: 'https://shamela.ws/book/21786/57',
  },
  {
    kataMelayu: ['sumpah', 'halif', 'tawriyah', 'mustahlif'],
    frasaArab: ['مقاصد اللافظ على نية الحالف', 'الأمور بمقاصدها'],
    halamanUtama: 63,
    urlShamela: 'https://shamela.ws/book/21786/57',
  },
  {
    kataMelayu: ['tayin', 'penentuan', 'tersalah', 'tersilap', 'zuhur', 'asar', 'makmum', 'imam'],
    frasaArab: ['ما يشترط فيه التعيين فالخطأ فيه يبطله', 'الأمور بمقاصدها'],
    halamanUtama: 62,
    urlShamela: 'https://shamela.ws/book/21786/56',
  },
  {
    kataMelayu: ['tergesa', 'waris', 'bunuh', 'membunuh', 'pusaka', 'wasiat', 'hirman'],
    frasaArab: ['من تعجل شيئا قبل أوانه عوقب بحرمانه', 'الأمور بمقاصدها'],
    halamanUtama: 63,
    urlShamela: 'https://shamela.ws/book/21786/57',
  },
  {
    kataMelayu: ['yakin', 'yaqin', 'syak', 'ragu', 'waswas', 'rakaat', 'hadas', 'batal'],
    frasaArab: ['اليقين لا يزول بالشك', 'الثابت باليقين لا ينتقض إلا بيقين مثله'],
    halamanUtama: 96,
    urlShamela: 'https://shamela.ws/book/21786/90',
  },
  {
    kataMelayu: ['istishab', 'kekal', 'asal', 'pending'],
    frasaArab: ['الأصل بقاء ما كان على ما كان', 'اليقين لا يزول بالشك'],
    halamanUtama: 111,
    urlShamela: 'https://shamela.ws/book/21786/105',
  },
  {
    kataMelayu: ['hutang', 'tanggungan', 'zimmah', 'dakwaan', 'bukti', 'pendakwa', 'invois', 'bebas'],
    frasaArab: ['الأصل براءة الذمة', 'اليقين لا يزول بالشك'],
    halamanUtama: 111,
    urlShamela: 'https://shamela.ws/book/21786/105',
  },
  {
    kataMelayu: ['mudharabah', 'mendatang', 'aridah', 'sifat'],
    frasaArab: ['الأصل في الصفات العارضة العدم', 'اليقين لا يزول بالشك'],
    halamanUtama: 111,
    urlShamela: 'https://shamela.ws/book/21786/105',
  },
  {
    kataMelayu: ['retak', 'terdekat', 'hadith', 'kejadian'],
    frasaArab: ['الأصل إضافة الحادث إلى أقرب أوقاته', 'اليقين لا يزول بالشك'],
    halamanUtama: 111,
    urlShamela: 'https://shamela.ws/book/21786/105',
  },
  {
    kataMelayu: ['ibahah', 'harus', 'ciptaan'],
    frasaArab: ['الأصل في الأشياء الإباحة', 'اليقين لا يزول بالشك'],
    halamanUtama: 111,
    urlShamela: 'https://shamela.ws/book/21786/105',
  },
  {
    kataMelayu: ['nikah', 'perkahwinan', 'kelamin', 'mahram', 'susuan', 'abdhac', 'faraj'],
    frasaArab: ['الأصل في الأبضاع التحريم', 'اليقين لا يزول بالشك'],
    halamanUtama: 111,
    urlShamela: 'https://shamela.ws/book/21786/105',
  },
  {
    kataMelayu: ['diam', 'sakit', 'setuju', 'bikr', 'dara'],
    frasaArab: ['لا ينسب إلى ساكت قول', 'اليقين لا يزول بالشك'],
    halamanUtama: 111,
    urlShamela: 'https://shamela.ws/book/21786/105',
  },
  {
    kataMelayu: ['tersirat', 'dalalah', 'tasrih', 'sarih'],
    frasaArab: ['لا عبرة بالدلالة في مقابلة التصريح', 'اليقين لا يزول بالشك'],
    halamanUtama: 111,
    urlShamela: 'https://shamela.ws/book/21786/105',
  },
  {
    kataMelayu: ['sangkaan', 'zhan', 'zan'],
    frasaArab: ['لا عبرة بالظن البين خطؤه', 'اليقين لا يزول بالشك'],
    halamanUtama: 111,
    urlShamela: 'https://shamela.ws/book/21786/105',
  },
  {
    kataMelayu: ['masyaqqah', 'kesukaran', 'sukar', 'keringanan', 'rukhsah', 'sempit', 'lapang', 'banjir', 'jamak', 'qasar', 'musafir', 'taysir'],
    frasaArab: ['المشقة تجلب التيسير', 'إذا ضاق الأمر اتسع', 'الضرورة تقدر بقدرها'],
    halamanUtama: 273,
    urlShamela: 'https://shamela.ws/book/21786/267',
  },
  {
    kataMelayu: ['darurat', 'terpaksa', 'mahzurat', 'haram', 'nyawa', 'ubat', 'babi', 'arak', 'kelaparan', 'kebuluran', 'hajah', 'istisna', 'salam'],
    frasaArab: ['الضرورات تبيح المحظورات', 'الحاجة تنزل منزلة الضرورة', 'الضرورة تقدر بقدرها'],
    halamanUtama: 276,
    urlShamela: 'https://shamela.ws/book/21786/270',
  },
  {
    kataMelayu: ['maysur', 'masur', 'balut', 'simen', 'maksiat', 'uzur', 'keuzuran'],
    frasaArab: ['الميسور لا يسقط بالمعسور', 'الرخص لا تناط بالمعاصي', 'ما جاز لعذر بطل بزواله'],
    halamanUtama: 273,
    urlShamela: 'https://shamela.ws/book/21786/267',
  },
  {
    kataMelayu: ['mudarat', 'darar', 'dirar', 'bahaya', 'doxxing', 'dendam', 'balas', 'cegah', 'vaksin', 'firewall', 'kilang', 'toksik', 'qadim'],
    frasaArab: ['الضرر يزال', 'لا ضرر ولا ضرار', 'الضرر يدفع بقدر الإمكان', 'الضرر لا يكون قديما'],
    halamanUtama: 210,
    urlShamela: 'https://shamela.ws/book/21786/204',
  },
  {
    kataMelayu: ['berat', 'ringan', 'asyad', 'akhaf', 'mafsadah', 'maslahah', 'kerosakan', 'kasino', 'bedah', 'beku'],
    frasaArab: ['الضرر الأشد يزال بالضرر الأخف', 'الضرر لا يزال بمثله', 'درء المفاسد أولى من جلب المصالح', 'درء المفاسد مقدم على جلب المصالح'],
    halamanUtama: 219,
    urlShamela: 'https://shamela.ws/book/21786/213',
  },
  {
    kataMelayu: ['khusus', 'awam', 'umum', 'siling', 'kuarantin', 'monopoli'],
    frasaArab: ['يتحمل الضرر الخاص لمنع الضرر العام', 'يتحمل الضرر الخاص لدفع الضرر العام'],
    halamanUtama: 28,
    urlShamela: 'https://shamela.ws/book/21786/24',
  },
  {
    kataMelayu: ['adat', 'uruf', 'kebiasaan', 'masyarakat', 'muatah', 'resit', 'tulisan', 'emel', 'mesej', 'khitab'],
    frasaArab: ['العادة محكمة', 'استعمال الناس حجة يجب العمل بها', 'الكتاب كالخطاب'],
    halamanUtama: 321,
    urlShamela: 'https://shamela.ws/book/21786/315',
  },
  {
    kataMelayu: ['konsisten', 'majoriti', 'muttarid', 'ghalib', 'waranti', 'zaman', 'berubah', 'perubahan', 'cctv', 'biometrik', 'hotel', 'masyrut', 'bengkel'],
    frasaArab: ['إنما تعتبر العادة إذا اطردت أو غلبت', 'لا ينكر تغير الأحكام بتغير الأزمان', 'المعروف عرفا كالمشروط شرطا', 'التعيين بالعرف كالتعيين بالنص'],
    halamanUtama: 323,
    urlShamela: 'https://shamela.ws/book/21786/317',
  },
  {
    kataMelayu: ['mutlak', 'itlaq', 'bekerja', 'mata wang'],
    frasaArab: ['الإطلاق محمول على العادة'],
    halamanUtama: 656,
    urlShamela: 'https://shamela.ws/book/21786/646',
  },
  {
    kataMelayu: ['ijtihad', 'nas', 'faraid', 'qati', 'kharaj', 'daman', 'risiko', 'khiyar', 'ghurm', 'ghunm', 'bomba', 'pemimpin', 'rakyat', 'raiyyah', 'tabi', 'lampiran', 'wasilah', 'sempadan'],
    frasaArab: [
      'لا مساغ للاجتهاد في مورد النص',
      'الاجتهاد لا ينقض بمثله',
      'الخراج بالضمان',
      'الغرم بالغنم',
      'الجواز الشرعي ينافي الضمان',
      'التصرف على الرعية منوط بالمصلحة',
      'التابع تابع',
      'ما لا يتم الواجب إلا به فهو واجب',
    ],
    halamanUtama: 28,
    urlShamela: 'https://shamela.ws/book/21786/24',
  },
];

export function normTeksCarian(s = '') {
  return String(s || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[.,?!:;'"()[\]{}«»\-_/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tukar nombor halaman cetakan (Jil. 1, hlm. X) kepada URL halaman yang DISAHKAN di Shamela.ws (book/21786/Y)
export function binaUrlHalamanShamela(halamanCetakan, urlTepat = '') {
  if (urlTepat && SENARAI_URL_SAH_21786.has(urlTepat.trim())) {
    return urlTepat.trim();
  }
  const hlm = Number(halamanCetakan);
  if (PETA_HALAMAN_SAH_21786[hlm]) {
    return PETA_HALAMAN_SAH_21786[hlm].urlShamela;
  }
  // Pemetaan julat bab dalam Jilid 1 kitab القواعد الفقهية وتطبيقاتها في المذاهب الأربعة
  if (!Number.isFinite(hlm) || hlm <= 0) return PETA_HALAMAN_SAH_21786[62].urlShamela;
  if (hlm < 55) return PETA_HALAMAN_SAH_21786[28].urlShamela;
  if (hlm <= 62) return PETA_HALAMAN_SAH_21786[62].urlShamela;
  if (hlm < 95) return PETA_HALAMAN_SAH_21786[63].urlShamela;
  if (hlm <= 105) return PETA_HALAMAN_SAH_21786[96].urlShamela;
  if (hlm < 200) return PETA_HALAMAN_SAH_21786[111].urlShamela;
  if (hlm <= 214) return PETA_HALAMAN_SAH_21786[210].urlShamela;
  if (hlm < 268) return PETA_HALAMAN_SAH_21786[219].urlShamela;
  if (hlm <= 274) return PETA_HALAMAN_SAH_21786[273].urlShamela;
  if (hlm < 315) return PETA_HALAMAN_SAH_21786[276].urlShamela;
  if (hlm <= 321) return PETA_HALAMAN_SAH_21786[321].urlShamela;
  if (hlm < 600) return PETA_HALAMAN_SAH_21786[323].urlShamela;
  return PETA_HALAMAN_SAH_21786[656].urlShamela;
}

export function binaUrlCarianMatanShamela(matanArab = '') {
  const bersih = String(matanArab || '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .trim();
  const kueri = bersih || KITAB_UTAMA;
  return `https://shamela.ws/search?q=${encodeURIComponent(kueri)}`;
}

// Cari rujukan paling relevan terus daripada indeks halaman kitab القواعد الفقهية وتطبيقاتها في المذاهب الأربعة
export function cariRujukanKitabUtamaTempatan(soalan) {
  const qNorm = normTeksCarian(soalan);

  // Asingkan perkataan Arab dan perkataan Melayu (tanpa stopwords)
  const semuaPerkataan = qNorm.split(/\s+/).filter((w) => w.length >= 2);
  const kataArab = semuaPerkataan.filter((w) => /[\u0600-\u06FF]/.test(w) && !STOPWORDS_MELAYU.has(w));
  const kataMelayu = semuaPerkataan.filter((w) => !/[\u0600-\u06FF]/.test(w) && w.length >= 3 && !STOPWORDS_MELAYU.has(w));
  const frasaArabSoalan = normTeksCarian((soalan.match(/[\u0600-\u06FF\s]{4,}/g) || []).join(' '));

  // Kesan topik fiqh daripada kamus sinonim Melayu -> Arab
  const frasaArabTambahan = [];
  const urlTopikKeutamaan = new Set();
  for (const entri of KAMUS_TOPIK_FIQH) {
    const adaKataMelayu = entri.kataMelayu.some((km) => qNorm.includes(normTeksCarian(km)));
    const adaFrasaArab = entri.frasaArab.some((fa) => qNorm.includes(normTeksCarian(fa)));
    if (adaKataMelayu || adaFrasaArab) {
      entri.frasaArab.forEach((fa) => frasaArabTambahan.push(normTeksCarian(fa)));
      urlTopikKeutamaan.add(entri.urlShamela);
    }
  }

  let matriks = [];
  try {
    const calonLaluan = [
      path.resolve(process.cwd(), 'src/data/Matriks_Qawaid_Fiqh.json'),
      path.resolve(process.cwd(), '../src/data/Matriks_Qawaid_Fiqh.json'),
      path.resolve(process.cwd(), 'qawaid-explorer/src/data/Matriks_Qawaid_Fiqh.json'),
    ];
    for (const p of calonLaluan) {
      if (fs.existsSync(p)) {
        matriks = JSON.parse(fs.readFileSync(p, 'utf-8')).data || [];
        break;
      }
    }
  } catch {
    matriks = [];
  }

  const semuaRekod = [];

  matriks.forEach((m) => {
    const mHlm = Number((m.jilid_halaman || '').match(/hlm\.\s*(\d+)/i)?.[1] || 63);
    const urlSah = binaUrlHalamanShamela(mHlm, m.url_sumber_ranting);
    const infoHlm = PETA_HALAMAN_SAH_21786[mHlm] || { jilidHalaman: m.jilid_halaman || `Jil. 1, hlm. ${mHlm}` };
    semuaRekod.push({
      tajuk: `${m.kaedah_ranting_ar} (${m.kaedah_ranting_bm})`,
      matanArab: m.kaedah_ranting_ar,
      kaedahInduk: m.kaedah_asasi_ar,
      teks: `القاعدة الكلية: ${m.kaedah_asasi_ar} — القاعدة الفرعية: ${m.kaedah_ranting_ar} (${m.kaedah_ranting_bm}). ${m.huraian_ringkas} التطبيق المعاصر: ${m.isu_kontemporari} الضابط: ${m.batas_semakan}`,
      jilidHalaman: infoHlm.jilidHalaman,
      halaman: mHlm,
      urlShamela: urlSah,
      urlCarianShamela: binaUrlCarianMatanShamela(m.kaedah_ranting_ar),
    });
  });

  (dataNotaLengkap || []).forEach((n) => {
    const hlm = Number(n.halaman || 62);
    const urlSah = binaUrlHalamanShamela(hlm, n.urlShamela);
    const matan = n.teksArabCarian || n.tajuk.split('(')[0].trim();
    semuaRekod.push({
      tajuk: n.tajuk,
      matanArab: matan,
      kaedahInduk: n.kategori || '',
      teks: `${n.tajuk} — النص العربي: «${matan}». الشرح في المذاهب الأربعة: ${n.huraian} التطبيقات: ${n.aplikasi} الشروط والاستثناءات: ${n.syarat}`,
      jilidHalaman: `Jil. ${n.jilid || 1}, hlm. ${hlm}`,
      halaman: hlm,
      urlShamela: urlSah,
      urlCarianShamela: binaUrlCarianMatanShamela(matan),
    });
  });

  (dataKuiz50 || []).forEach((q) => {
    const qHlm = Number((q.jilid_halaman || '').match(/hlm\.\s*(\d+)/i)?.[1] || 63);
    const urlSah = binaUrlHalamanShamela(qHlm, q.urlShamela);
    semuaRekod.push({
      tajuk: `${q.kaedah_ranting_ar} (${q.kaedah_ranting_bm})`,
      matanArab: q.kaedah_ranting_ar,
      kaedahInduk: q.kategori || '',
      teks: `القاعدة: ${q.kaedah_ranting_ar} (${q.kaedah_ranting_bm}). التطبيق في المذاهب الأربعة: ${q.huraian_jawapan} المسألة التطبيقية: ${q.isu_kontemporari}`,
      jilidHalaman: q.jilid_halaman || `Jil. 1, hlm. ${qHlm}`,
      halaman: qHlm,
      urlShamela: urlSah,
      urlCarianShamela: binaUrlCarianMatanShamela(q.kaedah_ranting_ar),
    });
  });

  // Kira skor padanan bagi setiap rekod kitab
  const dinilai = semuaRekod.map((r) => {
    const tajukNorm = normTeksCarian(r.tajuk);
    const indukNorm = normTeksCarian(r.kaedahInduk);
    const matanNorm = normTeksCarian(r.matanArab);
    const gabungan = normTeksCarian(`${r.tajuk} ${r.kaedahInduk} ${r.teks}`);
    let skor = 0;

    // 1. Padanan tepat frasa Arab dalam soalan
    if (frasaArabSoalan && frasaArabSoalan.length >= 4) {
      if (tajukNorm.includes(frasaArabSoalan) || matanNorm.includes(frasaArabSoalan)) {
        skor += 60;
      } else if (indukNorm.includes(frasaArabSoalan) || gabungan.includes(frasaArabSoalan)) {
        skor += 35;
      }
    }

    // 2. Padanan perkataan Arab individu
    for (const ka of kataArab) {
      if (tajukNorm.includes(ka) || matanNorm.includes(ka)) skor += 20;
      else if (indukNorm.includes(ka)) skor += 12;
      else if (gabungan.includes(ka)) skor += 8;
    }

    // 3. Padanan daripada Kamus Topik Fiqh (Melayu -> Arab)
    for (const fa of frasaArabTambahan) {
      if (tajukNorm.includes(fa) || matanNorm.includes(fa)) skor += 30;
      else if (indukNorm.includes(fa) || gabungan.includes(fa)) skor += 15;
    }
    if (urlTopikKeutamaan.has(r.urlShamela)) {
      skor += 12;
    }

    // 4. Padanan kata kunci Melayu (bukan stopwords)
    for (const km of kataMelayu) {
      if (tajukNorm.includes(km)) skor += 8;
      if (gabungan.includes(km)) skor += 4;
    }

    return { ...r, skorPadanan: skor };
  });

  dinilai.sort((a, b) => b.skorPadanan - a.skorPadanan);

  // Nyah-pendua mengikut tajuk/halaman dan ambil 4 rujukan terbaik
  const unik = [];
  const dilihat = new Set();
  for (const item of dinilai) {
    const kunci = `${item.urlShamela}-${normTeksCarian(item.matanArab).slice(0, 25)}`;
    if (!dilihat.has(kunci)) {
      dilihat.add(kunci);
      unik.push(item);
    }
    if (unik.length >= 4) break;
  }
  return unik;
}

// Cache memori bagi kandungan halaman sebenar Shamela.ws supaya pantas
const cacheHalamanShamela = new Map();

// Tarik petikan matan Arab sebenar terus daripada URL Shamela.ws yang disahkan (jika talian internet tersedia)
export async function perkayaRujukanDenganShamelaLive(senaraiRujukan = []) {
  if (!Array.isArray(senaraiRujukan) || senaraiRujukan.length === 0) return senaraiRujukan;
  const utama = senaraiRujukan[0];
  if (!utama?.urlShamela) return senaraiRujukan;

  if (cacheHalamanShamela.has(utama.urlShamela)) {
    const petikanCache = cacheHalamanShamela.get(utama.urlShamela);
    if (petikanCache) {
      utama.teks = `${utama.teks}\n[النص الأصلي من صفحة الشاملة (${utama.urlShamela})]: «${petikanCache}»`;
    }
    return senaraiRujukan;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(utama.urlShamela, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timer);
    if (res.ok) {
      const html = await res.text();
      const nassMatch = html.match(/<div[^>]*class=["'][^"']*nass[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      if (nassMatch && nassMatch[1]) {
        const teksArabBersih = nassMatch[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;|&quot;|&amp;|&#\d+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 900);
        if (teksArabBersih.length > 40) {
          cacheHalamanShamela.set(utama.urlShamela, teksArabBersih);
          utama.teks = `${utama.teks}\n[النص الأصلي من صفحة الشاملة (${utama.urlShamela})]: «${teksArabBersih}»`;
        }
      }
    }
  } catch {
    clearTimeout(timer);
  }
  return senaraiRujukan;
}

// Sahkan & betulkan semua URL Shamela dalam teks jawapan AI supaya 100% tally dengan rujukan sebenar
export function sahkanUrlShamelaDalamJawapan(teksJawapan = '', senaraiSumber = []) {
  if (!teksJawapan) return teksJawapan;
  const rujukanUtama = senaraiSumber[0] || {
    jilidHalaman: 'Jil. 1, hlm. 62',
    urlShamela: 'https://shamela.ws/book/21786/56',
  };

  // Senarai URL yang dibenarkan bagi jawapan ini (daripada senaraiSumber + PETA_HALAMAN_SAH_21786)
  const urlSumberSemasa = new Set(senaraiSumber.map((s) => s.urlShamela).filter(Boolean));

  // Gantikan sebarang URL https://shamela.ws/book/21786/XXX yang direka oleh AI atau tidak tally dengan rujukan semasa
  let bersih = teksJawapan.replace(
    /https:\/\/shamela\.ws\/book\/\d+\/(\d+)/g,
    (matchUrl) => {
      if (urlSumberSemasa.has(matchUrl)) {
        return matchUrl;
      }
      return rujukanUtama.urlShamela;
    }
  );

  // Jika AI menulis nombor halaman yang bercanggah dalam teks pautan Markdown [..hlm. X..](urlUtama), selaraskan
  bersih = bersih.replace(
    /\[([^\]]*?)\]\((https:\/\/shamela\.ws\/book\/21786\/\d+)\)/g,
    (fullMatch, label, url) => {
      const sumberPadan =
        senaraiSumber.find((s) => s.urlShamela === url) || rujukanUtama;
      if (/hlm\.\s*\d+/i.test(label) && sumberPadan?.jilidHalaman) {
        const labelSelaras = label.replace(
          /Jil\.\s*\d+\s*,\s*hlm\.\s*\d+|hlm\.\s*\d+/gi,
          sumberPadan.jilidHalaman
        );
        return `[${labelSelaras}](${sumberPadan.urlShamela})`;
      }
      return `[${label}](${sumberPadan.urlShamela})`;
    }
  );

  // Jika jawapan AI belum mengandungi pautan ke urlShamela utama, tambahkan di bahagian bawah jawapan
  if (!bersih.includes(rujukanUtama.urlShamela)) {
    bersih += `\n\n---\n📖 **Rujukan Tepat Kitab:** [${KITAB_UTAMA} - ${rujukanUtama.jilidHalaman}](${rujukanUtama.urlShamela})`;
  }

  return bersih;
}
