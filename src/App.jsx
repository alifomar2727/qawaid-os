import { dataNotaLengkap } from './dataNota';
import { dataKuiz50 } from './dataKuiz';
import SprintGame from './SprintGame';
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import qawaidData from './data/Matriks_Qawaid_Fiqh.json';
import kuizMingguanLalai from './data/kuizMingguanTerkini.json';

/* Crisp Lucide SVG Line Icons (Zero external runtime dependency) */
function LucideIcon({ name, size = 16, strokeWidth = 1.85, filled = false, color, style }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: filled ? 'currentColor' : 'none',
    stroke: color || 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
    style: { flexShrink: 0, ...style },
  };

  switch (name) {
    case 'dices':
      return (
        <svg {...props}>
          <rect width="12" height="12" x="2" y="10" rx="2" ry="2" />
          <path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3.16l-4.76-4.76a2.24 2.24 0 0 0-3.16 0L10 6.08" />
          <path d="M6 14h.01" />
          <path d="M10 18h.01" />
          <path d="M15 6h.01" />
          <path d="M18 9h.01" />
        </svg>
      );
    case 'dice-5':
      return (
        <svg {...props}>
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <path d="M16 8h.01" />
          <path d="M8 8h.01" />
          <path d="M8 16h.01" />
          <path d="M16 16h.01" />
          <path d="M12 12h.01" />
        </svg>
      );
    case 'scale':
      return (
        <svg {...props}>
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="M7 21h10" />
          <path d="M12 3v18" />
          <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...props}>
          <rect width="7" height="7" x="3" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="14" rx="1.5" />
          <rect width="7" height="7" x="3" y="14" rx="1.5" />
        </svg>
      );
    case 'brain':
      return (
        <svg {...props}>
          <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
          <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
          <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
        </svg>
      );
    case 'puzzle':
      return (
        <svg {...props}>
          <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.61a2.404 2.404 0 0 1 1.705-.707c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
        </svg>
      );
    case 'book-open':
      return (
        <svg {...props}>
          <path d="M12 7v14" />
          <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
        </svg>
      );
    case 'bookmark':
      return (
        <svg {...props}>
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...props}>
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          <path d="M20 3v4" />
          <path d="M22 5h-4" />
        </svg>
      );
    case 'search':
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      );
    case 'x':
      return (
        <svg {...props}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      );
    case 'star':
      return (
        <svg {...props}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...props}>
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      );
    case 'arrow-left':
      return (
        <svg {...props}>
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
      );
    case 'upload':
      return (
        <svg {...props}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
      );
    case 'send':
      return (
        <svg {...props}>
          <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
          <path d="m21.854 2.147-10.94 10.939" />
        </svg>
      );
    case 'external':
    case 'external-link':
      return (
        <svg {...props}>
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
      );
    case 'chevron-down':
      return (
        <svg {...props}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case 'chevron-up':
      return (
        <svg {...props}>
          <path d="m18 15-6-6-6 6" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...props}>
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      );
    case 'gamepad':
      return (
        <svg {...props}>
          <line x1="6" x2="10" y1="12" y2="12" />
          <line x1="8" x2="8" y1="10" y2="14" />
          <line x1="15" x2="15.01" y1="13" y2="13" />
          <line x1="18" x2="18.01" y1="11" y2="11" />
          <rect width="20" height="12" x="2" y="6" rx="2" />
        </svg>
      );
    case 'check':
      return (
        <svg {...props}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'zap':
      return (
        <svg {...props}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'refresh-cw':
      return (
        <svg {...props}>
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
      );
    case 'file-text':
      return (
        <svg {...props}>
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" x2="8" y1="13" y2="13" />
          <line x1="16" x2="8" y1="17" y2="17" />
          <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
      );
    default:
      return null;
  }
}

function renderInlineAiTokens(text = '') {
  const tokenRegex =
    /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/shamela\.ws\/[^\s)]+|\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`|«[^»]+»)/g;
  const parts = String(text).split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    const mdLink = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (mdLink) {
      return (
        <a
          key={idx}
          href={mdLink[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: '#60a5fa',
            fontWeight: 700,
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            wordBreak: 'break-word',
          }}
        >
          <span>{mdLink[1]}</span>
          <LucideIcon name="external" size={12} />
        </a>
      );
    }

    if (/^https?:\/\/shamela\.ws\/[^\s)]+$/.test(part)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: '#60a5fa',
            fontWeight: 700,
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
          }}
        >
          <span>{part}</span>
          <LucideIcon name="external" size={12} />
        </a>
      );
    }

    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={idx} style={{ color: 'var(--text-strong)', fontWeight: 700 }}>
          {renderInlineAiTokens(boldMatch[1])}
        </strong>
      );
    }

    const italicMatch = part.match(/^\*([^*\n]+)\*$/);
    if (italicMatch) {
      return <em key={idx}>{italicMatch[1]}</em>;
    }

    const codeMatch = part.match(/^`([^`\n]+)`$/);
    if (codeMatch) {
      return (
        <code
          key={idx}
          style={{
            padding: '1px 6px',
            borderRadius: '6px',
            background: 'rgba(148, 163, 184, 0.16)',
            fontSize: '0.84em',
          }}
        >
          {codeMatch[1]}
        </code>
      );
    }

    const arabQuoteMatch = part.match(/^«([^»]+)»$/);
    if (arabQuoteMatch) {
      return (
        <span
          key={idx}
          dir="rtl"
          style={{
            fontFamily: '"Noto Naskh Arabic", serif',
            fontSize: '1.18em',
            fontWeight: 700,
            color: 'var(--text-strong)',
            padding: '0 3px',
          }}
        >
          «{arabQuoteMatch[1]}»
        </span>
      );
    }

    return <span key={idx}>{part}</span>;
  });
}

function renderFormattedAiText(text = '') {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  const elements = [];

  lines.forEach((rawLine, i) => {
    const trimmed = rawLine.trim();

    // Baris kosong -> jarak kecil
    if (!trimmed) {
      elements.push(<div key={`sp-${i}`} style={{ height: '4px' }} />);
      return;
    }

    // Garis pemisah Markdown (--- atau ***)
    if (/^([-*_])\1{2,}$/.test(trimmed)) {
      elements.push(
        <hr
          key={`hr-${i}`}
          style={{
            border: 'none',
            borderTop: '1px solid var(--card-divider)',
            margin: '10px 0',
          }}
        />
      );
      return;
    }

    // Tajuk Markdown (#, ##, ###, ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2].replace(/^\*\*|\*\*$/g, '');
      elements.push(
        <div
          key={`h-${i}`}
          style={{
            fontSize: level <= 2 ? '1.04rem' : '0.96rem',
            fontWeight: 800,
            color: 'var(--text-strong)',
            marginTop: i === 0 ? '2px' : '12px',
            marginBottom: '4px',
            paddingBottom: '6px',
            borderBottom: '1px solid var(--card-divider)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {renderInlineAiTokens(content)}
        </div>
      );
      return;
    }

    // Petikan Blockquote (> ...)
    const quoteMatch = trimmed.match(/^>\s*(.+)$/);
    if (quoteMatch) {
      elements.push(
        <div
          key={`q-${i}`}
          style={{
            padding: '8px 12px',
            borderLeft: '3px solid #60a5fa',
            background: 'rgba(59, 130, 246, 0.08)',
            borderRadius: '0 8px 8px 0',
            margin: '4px 0',
          }}
        >
          {renderInlineAiTokens(quoteMatch[1])}
        </div>
      );
      return;
    }

    // Senarai Bullet (* atau - atau •) termasuk sub-bullet berlekuk
    const bulletMatch = rawLine.match(/^(\s*)([*\-•])\s+(.+)$/);
    if (bulletMatch) {
      const indentSpaces = bulletMatch[1].length;
      const isSubBullet = indentSpaces >= 2;
      const isiBullet = bulletMatch[3];
      // Jika item bermula dengan "Label: Huraian" tanpa **, tebalkan label secara automatik
      const labelColonMatch =
        !isiBullet.startsWith('**') &&
        !isiBullet.startsWith('[') &&
        isiBullet.match(/^([^:«»]{2,48}:)(\s*.*)$/);

      elements.push(
        <div
          key={`ul-${i}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            paddingLeft: isSubBullet ? '20px' : '4px',
            margin: '3px 0',
          }}
        >
          <span
            style={{
              color: isSubBullet ? 'var(--text-muted)' : '#60a5fa',
              fontWeight: 800,
              lineHeight: 1.65,
              userSelect: 'none',
            }}
          >
            {isSubBullet ? '◦' : '•'}
          </span>
          <div style={{ flex: 1, lineHeight: 1.68 }}>
            {labelColonMatch ? (
              <>
                <strong style={{ color: 'var(--text-strong)', fontWeight: 700 }}>
                  {renderInlineAiTokens(labelColonMatch[1])}
                </strong>
                {renderInlineAiTokens(labelColonMatch[2])}
              </>
            ) : (
              renderInlineAiTokens(isiBullet)
            )}
          </div>
        </div>
      );
      return;
    }

    // Senarai Bernombor (1. , 2. , dsb.)
    const numMatch = rawLine.match(/^(\s*)(\d+[.)])\s+(.+)$/);
    if (numMatch) {
      const indentSpaces = numMatch[1].length;
      elements.push(
        <div
          key={`ol-${i}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            paddingLeft: indentSpaces >= 2 ? '20px' : '4px',
            margin: '3px 0',
          }}
        >
          <span
            style={{
              fontWeight: 700,
              color: '#60a5fa',
              minWidth: '20px',
              lineHeight: 1.65,
            }}
          >
            {numMatch[2]}
          </span>
          <div style={{ flex: 1, lineHeight: 1.68 }}>
            {renderInlineAiTokens(numMatch[3])}
          </div>
        </div>
      );
      return;
    }

    // Perenggan biasa
    elements.push(
      <div key={`p-${i}`} style={{ lineHeight: 1.68, margin: '2px 0' }}>
        {renderInlineAiTokens(rawLine)}
      </div>
    );
  });

  return <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>{elements}</div>;
}

// =========================================================================
// =========================================================================
// FASA 2: KOMPONEN PORTAL ADMIN RAHSIA (FRONTEND) DENGAN UPLOAD SLIDES (PDF/TEKS)
// =========================================================================
function AdminDashboard({ onKemaskiniKuiz, onClose, kuizMingguan, tetapanWeb, onKemaskiniTetapan }) {
  const [tajuk, setTajuk] = useState('');
  const [nota, setNota] = useState('');
  const [fileData, setFileData] = useState(null); // { name, size, type, base64 }
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', text: '' }
  const fileInputRef = useRef(null);

  // State untuk Fasa 1: Tetapan Teks Web (Mini CMS)
  const [teksPengumuman, setTeksPengumuman] = useState(() => {
    if (tetapanWeb?.teksPengumuman) return tetapanWeb.teksPengumuman;
    try {
      const saved = localStorage.getItem('qawaid_tetapan_web');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.teksPengumuman) return parsed.teksPengumuman;
      }
    } catch {}
    return '✨ Selamat Datang ke Qawaid OS — Sistem Ulang Kaji Pintar Berteraskan Kitab al-Qawaid al-Fiqhiyyah wa Tatbiqatuha fi al-Madhahib al-Arbaah';
  });

  const [subtajukApp, setSubtajukApp] = useState(() => {
    if (tetapanWeb?.subtajukApp) return tetapanWeb.subtajukApp;
    try {
      const saved = localStorage.getItem('qawaid_tetapan_web');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.subtajukApp) return parsed.subtajukApp;
      }
    } catch {}
    return 'Sistem Ulang Kaji Qawaid Fiqhiyyah';
  });

  const [subtajukCabaran, setSubtajukCabaran] = useState(() => {
    if (tetapanWeb?.subtajukCabaran) return tetapanWeb.subtajukCabaran;
    try {
      const saved = localStorage.getItem('qawaid_tetapan_web');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.subtajukCabaran) return parsed.subtajukCabaran;
      }
    } catch {}
    return 'Uji kefahaman teori dan aplikasi penyelesaian isu semasa melalui dua mod di bawah:';
  });

  const [loadingTeks, setLoadingTeks] = useState(false);
  const [statusTeks, setStatusTeks] = useState(null); // { type: 'success' | 'error', text: '' }

  // Fungsi Fasa 1: Simpan Tetapan Teks Web (Mini CMS)
  const handleSimpanTetapan = async (e) => {
    e.preventDefault();
    setLoadingTeks(true);
    setStatusTeks(null);

    const payload = {
      teksPengumuman: teksPengumuman.trim(),
      subtajukApp: subtajukApp.trim(),
      subtajukCabaran: subtajukCabaran.trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Simpan ke storan peranti (localStorage) serta merta
      try {
        localStorage.setItem('qawaid_tetapan_web', JSON.stringify(payload));
      } catch (errLocal) {
        console.warn('Gagal menyimpan tetapan teks ke localStorage:', errLocal);
      }

      // 2. Kemas kini state induk jika fungsi callback disediakan
      if (onKemaskiniTetapan) {
        onKemaskiniTetapan(payload);
      }

      // 3. Hantar data ke endpoint backend (POST /api/tetapan-teks)
      const res = await fetch('/api/tetapan-teks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn('Backend /api/tetapan-teks memberi respons:', res.status);
      }

      setStatusTeks({
        type: 'success',
        text: '✓ Tetapan teks web berjaya disimpan & dikemas kini!',
      });
    } catch (err) {
      console.error('Ralat simpan tetapan teks:', err);
      setStatusTeks({
        type: 'success',
        text: '✓ Tetapan teks telah disimpan pada pelayar peranti anda (Backend /api/tetapan-teks akan dihubungkan pada Fasa 3).',
      });
    } finally {
      setLoadingTeks(false);
    }
  };

  // Fungsi muat turun kuiz aktif sebagai fail JSON untuk disimpan terus ke fail projek / GitHub
  const [copiedKuiz, setCopiedKuiz] = useState(false);
  const handleCopyKuizJson = () => {
    if (!kuizMingguan) return;
    try {
      navigator.clipboard?.writeText(JSON.stringify(kuizMingguan, null, 2));
      setCopiedKuiz(true);
      setTimeout(() => setCopiedKuiz(false), 2000);
    } catch {}
  };

  const handleDownloadKuizJson = () => {
    if (!kuizMingguan) return;
    const blob = new Blob([JSON.stringify(kuizMingguan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kuizMingguanTerkini.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Fungsi proses fail yang dimuat naik (PDF atau Teks)
  const processSelectedFile = (file) => {
    if (!file) return;

    // Had saiz fail: Vercel menghadkan saiz permintaan kepada 4.5 MB, dan Base64
    // membesarkan fail ~33%, jadi PDF maksimum yang selamat ialah ~3.3 MB.
    const isTextFile = file.type.startsWith('text/') || /\.(txt|md)$/i.test(file.name);
    const maxBytes = isTextFile ? 15 * 1024 * 1024 : 3.3 * 1024 * 1024;
    if (file.size > maxBytes) {
      setStatus({
        type: 'error',
        text: `Saiz fail (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi had ${isTextFile ? '15' : '3.3'} MB. Sila mampatkan PDF dahulu (contoh: ilovepdf.com/compress_pdf) atau salin teks slaid ke dalam kotak teks.`,
      });
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isText = file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.md');

    // Auto-cadang tajuk kuiz jika ruangan tajuk masih kosong
    if (!tajuk.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      if (cleanName) {
        setTajuk(cleanName);
      }
    }

    if (isText) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result || '';
        setNota(content);
        setFileData({
          name: file.name,
          size: file.size,
          type: 'text/plain',
          base64: null,
        });
        setStatus({
          type: 'success',
          text: `✓ Fail teks "${file.name}" berjaya dibaca dan dimasukkan ke ruangan teks nota.`,
        });
      };
      reader.readAsText(file);
    } else if (isPdf) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result || '';
        const base64Str = typeof dataUrl === 'string' && dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
        setFileData({
          name: file.name,
          size: file.size,
          type: 'application/pdf',
          base64: base64Str,
        });
        setStatus({
          type: 'success',
          text: `✓ Fail slaid PDF "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) berjaya dimuat naik & sedia diproses terus oleh AI!`,
        });
      };
      reader.readAsDataURL(file);
    } else {
      // Format dokumen lain
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result || '';
        const base64Str = typeof dataUrl === 'string' && dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
        setFileData({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          base64: base64Str,
        });
        setStatus({
          type: 'success',
          text: `✓ Fail "${file.name}" sedia untuk dihantar ke AI.`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveFile = () => {
    setFileData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setStatus(null);
  };

  const handleJanaKuiz = async (e) => {
    e.preventDefault();

    if (!tajuk.trim()) {
      setStatus({
        type: 'error',
        text: 'Sila masukkan "Tajuk Kuiz Minggu Ini".',
      });
      return;
    }

    if (!nota.trim() && !fileData) {
      setStatus({
        type: 'error',
        text: 'Sila muat naik fail slaid (PDF) ATAU masukkan teks slaid/nota kuliah.',
      });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api/jana-kuiz-mingguan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tajuk: tajuk.trim(),
          nota: nota.trim(),
          fileData: fileData
            ? {
                name: fileData.name,
                type: fileData.type,
                size: fileData.size,
                base64: fileData.base64,
              }
            : null,
        }),
      });

      if (response.status === 413) {
        throw new Error('Fail PDF terlalu besar untuk pelayan (had 4.5 MB). Sila mampatkan PDF atau tampal teks slaid');
      }

      const rawText = await response.text();
      let result;
      try {
        result = JSON.parse(rawText);
      } catch {
        throw new Error(
          response.status === 504
            ? 'Pelayan mengambil masa terlalu lama (timeout). Cuba PDF yang lebih kecil'
            : `Respons pelayan tidak sah (HTTP ${response.status})`
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Gagal menjana kuiz dari AI');
      }

      setStatus({
        type: 'success',
        text: `🎉 Berjaya! Kuiz "${tajuk}" dengan ${result.data?.soalan_objektif?.length || 20} soalan telah dijana dan dikemas kini.`,
      });

      // Kemas kini state kuiz di frontend & simpan ke storan peranti (localStorage)
      if (result.data) {
        try {
          localStorage.setItem('qawaid_kuiz_mingguan', JSON.stringify(result.data));
        } catch (e) {
          console.warn('Gagal menyimpan ke localStorage:', e);
        }
        if (onKemaskiniKuiz) {
          onKemaskiniKuiz(result.data);
        }
      }
    } catch (err) {
      console.error('Ralat Admin:', err);
      setStatus({
        type: 'error',
        text: `Ralat: ${err.message}. (Pastikan backend Fasa 3 telah sedia atau sambungan internet stabil).`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 7, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '28px 24px',
          borderRadius: 'var(--r-xl)',
          border: '1px solid rgba(16, 185, 129, 0.5)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.65), 0 0 30px rgba(16, 185, 129, 0.25)',
          background: 'linear-gradient(145deg, rgba(8, 20, 42, 0.96), rgba(4, 12, 28, 0.98))',
          margin: 'auto',
        }}
      >
        {/* Header Admin */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: 'rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  letterSpacing: '0.04em',
                }}
              >
                🔒 PORTAL PENTADBIR
              </span>
              <span className="lg-node-chip" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Mod Rahsia
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#ffffff' }}>
              Pusat Kawalan Kuiz Mingguan AI
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Muat naik slaid PDF atau tampal nota kuliah untuk menjana soalan objektif secara automatik.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lg-btn-glass"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderRadius: 'var(--r-pill)',
              cursor: 'pointer',
            }}
          >
            ✕ Tutup Portal
          </button>
        </div>

        {/* Status Semasa Kuiz */}
        <div
          className="lg-inner-well"
          style={{
            padding: '12px 16px',
            marginBottom: '18px',
            borderRadius: 'var(--r-md)',
            background: 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
              Kuiz Aktif di Laman Web Sekarang:
            </span>
            <strong style={{ fontSize: '0.86rem', color: '#6ee7b7' }}>
              {kuizMingguan?.tajuk_mingguan || 'Tiada kuiz'}
            </strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="lg-node-chip" style={{ fontSize: '0.74rem' }}>
              {kuizMingguan?.soalan_objektif?.length || 0} Soalan
            </span>
            {kuizMingguan?.soalan_objektif?.length > 0 && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleCopyKuizJson}
                  className="lg-btn-glass"
                  title="Salin data JSON kuiz ke papan keratan (clipboard)"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    borderRadius: 'var(--r-pill)',
                    cursor: 'pointer',
                    color: '#93c5fd',
                    borderColor: 'rgba(59, 130, 246, 0.4)',
                    background: 'rgba(59, 130, 246, 0.1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{copiedKuiz ? '✓ Disalin!' : '📋 Salin JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadKuizJson}
                  className="lg-btn-glass"
                  title="Muat turun fail kuizMingguanTerkini.json untuk disimpan ke dalam fail GitHub"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    borderRadius: 'var(--r-pill)',
                    cursor: 'pointer',
                    color: '#6ee7b7',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>📥 Muat Turun JSON</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Borang Input Admin */}
        <form onSubmit={handleJanaKuiz} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Ruangan Tajuk Kuiz */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-strong)',
                marginBottom: '6px',
              }}
            >
              📌 Tajuk Kuiz Minggu Ini:
            </label>
            <input
              type="text"
              value={tajuk}
              onChange={(e) => setTajuk(e.target.value)}
              placeholder="Contoh: Minggu 4 — Kaedah Al-Masyaqqah Tajlib at-Taysir"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--r-sm)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                background: 'rgba(6, 12, 28, 0.75)',
                color: '#ffffff',
                fontSize: '0.90rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* RUANGAN MUAT NAIK FAIL SLAID (PDF / TEKS) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-strong)',
                }}
              >
                📎 Muat Naik Slaid Kuliah (PDF / Dokumen):
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-glow, #34d399)' }}>
                ✨ Disyorkan untuk pensyarah
              </span>
            </div>

            {/* Input fail tersembunyi */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt,.md,application/pdf,text/plain"
              disabled={loading}
              style={{ display: 'none' }}
            />

            {!fileData ? (
              /* Kotak Seret & Lepas (Dropzone) */
              <div
                onClick={() => !loading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: isDragging
                    ? '2px dashed #10b981'
                    : '2px dashed rgba(255, 255, 255, 0.22)',
                  borderRadius: 'var(--r-md)',
                  padding: '22px 16px',
                  textAlign: 'center',
                  background: isDragging
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(255, 255, 255, 0.02)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399',
                  }}
                >
                  <LucideIcon name="upload" size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#ffffff', display: 'block' }}>
                    Klik untuk pilih fail slaid PDF atau seret ke sini
                  </strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Menyokong fail PDF slaid kuliah (.pdf, maks 3.3 MB), TXT, atau Markdown
                  </span>
                </div>
              </div>
            ) : (
              /* Kad Paparan Fail yang Dipilih */
              <div
                className="lg-inner-well"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--r-md)',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: fileData.type.includes('pdf')
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      letterSpacing: '0.05em',
                      flexShrink: 0,
                    }}
                  >
                    {fileData.type.includes('pdf') ? 'PDF' : 'DOC'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {fileData.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6ee7b7', marginTop: '2px' }}>
                      {(fileData.size / (1024 * 1024)).toFixed(2)} MB • Slaid sedia dianalisis terus oleh Gemini AI
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={loading}
                  className="lg-btn-glass"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 'var(--r-pill)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                  }}
                >
                  ✕ Buang Fail
                </button>
              </div>
            )}
          </div>

          {/* Ruangan Teks Slaid / Nota Kuliah (Pilihan jika guna PDF) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-strong)',
                }}
              >
                📄 Teks Slaid / Nota Kuliah:
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {fileData ? '(Pilihan: Boleh isi nota tambahan atau biarkan kosong)' : '(Wajib jika tiada fail PDF)'}
              </span>
            </div>
            <textarea
              rows={fileData ? 4 : 7}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder={
                fileData
                  ? 'Fail PDF sudah dipilih di atas! Anda boleh biarkan ruangan ini kosong, atau taip arahan khas (contoh: "Fokuskan soalan kepada pembahagian masyaqqah")...'
                  : 'Tampal (paste) teks slaid PowerPoint, nota kuliah, atau huraian bab fiqh di sini. AI akan menganalisis teks ini untuk mencipta 20 soalan objektif...'
              }
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--r-sm)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                background: 'rgba(6, 12, 28, 0.75)',
                color: '#ffffff',
                fontSize: '0.86rem',
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                transition: 'rows 0.2s ease',
              }}
            />
          </div>

          {/* Mesej Ralat / Kejayaan */}
          {status && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--r-sm)',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                background: status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: `1px solid ${status.type === 'success' ? '#10b981' : '#ef4444'}`,
                color: status.type === 'success' ? '#6ee7b7' : '#fca5a5',
              }}
            >
              {status.text}
            </div>
          )}

          {/* Butang Tindakan */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              type="submit"
              disabled={loading}
              className="lg-btn-primary"
              style={{
                flex: 1,
                justifyContent: 'center',
                padding: '14px',
                fontSize: '0.94rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
              }}
            >
              <LucideIcon name="sparkles" size={17} />
              <span>
                {loading
                  ? fileData?.type?.includes('pdf')
                    ? 'Sedang Membaca Slaid PDF & Menjana 20 Soalan...'
                    : 'Sedang Menjana Kuiz Pintar dengan AI...'
                  : 'Jana Kuiz & Kemas Kini Laman Web'}
              </span>
            </button>
          </div>
        </form>

        {/* ================================================================= */}
        {/* FASA 1: BAHAGIAN TETAPAN TEKS WEB (MINI CMS)                     */}
        {/* ================================================================= */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          {/* Header Mini CMS */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: 'rgba(59, 130, 246, 0.22)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  letterSpacing: '0.04em',
                }}
              >
                ⚙️ MINI CMS
              </span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                Tetapan Teks Web
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.80rem', color: 'var(--text-muted)' }}>
              Kemas kini teks tajuk, pengumuman, dan penerangan di muka depan aplikasi secara dinamik.
            </p>
          </div>

          <form onSubmit={handleSimpanTetapan} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 1. Teks Pengumuman Atas / Marquee */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-strong)',
                  marginBottom: '6px',
                }}
              >
                📢 Teks Pengumuman Atas (Marquee Bar):
              </label>
              <input
                type="text"
                value={teksPengumuman}
                onChange={(e) => setTeksPengumuman(e.target.value)}
                placeholder="Contoh: ✨ Selamat Datang ke Qawaid OS — Sistem Ulang Kaji Pintar..."
                disabled={loadingTeks}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  background: 'rgba(6, 12, 28, 0.75)',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Teks hebahan bergerak di bahagian paling atas skrin utama.
              </span>
            </div>

            {/* 2. Subtajuk Aplikasi */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-strong)',
                  marginBottom: '6px',
                }}
              >
                🏷️ Subtajuk Aplikasi (Bawah Logo Qawaid OS):
              </label>
              <input
                type="text"
                value={subtajukApp}
                onChange={(e) => setSubtajukApp(e.target.value)}
                placeholder="Contoh: Sistem Ulang Kaji Qawaid Fiqhiyyah"
                disabled={loadingTeks}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  background: 'rgba(6, 12, 28, 0.75)',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Teks penerangan kecil betul-betul di bawah jenama utama "Qawaid OS".
              </span>
            </div>

            {/* 3. Subtajuk Kad Cabaran Topikal Mingguan */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-strong)',
                  marginBottom: '6px',
                }}
              >
                🎯 Subtajuk Mod Penilaian & Kuiz:
              </label>
              <input
                type="text"
                value={subtajukCabaran}
                onChange={(e) => setSubtajukCabaran(e.target.value)}
                placeholder="Contoh: Uji kefahaman teori dan aplikasi penyelesaian isu semasa melalui dua mod di bawah:"
                disabled={loadingTeks}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  background: 'rgba(6, 12, 28, 0.75)',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Penerangan yang dipaparkan pada persimpangan pemilihan kuiz.
              </span>
            </div>

            {/* Mesej Status Simpan */}
            {statusTeks && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--r-sm)',
                  fontSize: '0.82rem',
                  lineHeight: 1.4,
                  background: statusTeks.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${statusTeks.type === 'success' ? '#10b981' : '#ef4444'}`,
                  color: statusTeks.type === 'success' ? '#6ee7b7' : '#fca5a5',
                }}
              >
                {statusTeks.text}
              </div>
            )}

            {/* Butang Simpan Tetapan Teks */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="submit"
                disabled={loadingTeks}
                className="lg-btn-glass"
                style={{
                  padding: '10px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  borderRadius: 'var(--r-pill)',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 255, 0.25))',
                  color: '#93c5fd',
                  cursor: loadingTeks ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{loadingTeks ? '⏳ Menyimpan...' : '💾 Simpan Tetapan Teks'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// MODAL KATA LALUAN PORTAL ADMIN (100% KALIS SEKATAN PELAYAR TELEFON)
// =========================================================================
function AdminPasswordModal({ isOpen, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.trim() === 'Admin') {
      onSuccess();
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10001,
        background: 'rgba(3, 7, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '24px 20px',
          borderRadius: 'var(--r-xl)',
          border: '1px solid rgba(239, 68, 68, 0.45)',
          background: 'linear-gradient(145deg, rgba(16, 10, 24, 0.98), rgba(8, 6, 16, 0.99))',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(239, 68, 68, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '999px',
              background: 'rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.45)',
            }}
          >
            🔒 MOD PENTADBIR
          </span>
          <button
            type="button"
            onClick={onClose}
            className="lg-btn-glass"
            style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: 'var(--r-pill)', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', color: '#ffffff', fontWeight: 800 }}>
          Akses Portal Rahsia
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Masukkan kata laluan pentadbir untuk membuka pusat kawalan kuiz mingguan AI:
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(false);
            }}
            placeholder="Masukkan kata laluan..."
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--r-sm)',
              border: error ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(6, 12, 28, 0.75)',
              color: '#ffffff',
              fontSize: '0.94rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <div style={{ color: '#f87171', fontSize: '0.80rem', fontWeight: 600 }}>
              ❌ Kata laluan salah! Akses dinafikan.
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              className="lg-btn-glass"
              style={{ flex: 1, justifyContent: 'center', padding: '11px', fontSize: '0.86rem', cursor: 'pointer' }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="lg-btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '11px', fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Buka Portal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// FASA 3: MODAL UJI MINDA RAWAK (80 SOALAN UMUM AL-ZUHAILI - LIQUID GLASS POPUP)
// =========================================================================
function ModalUjiMindaRawak({ rawakSoalan, onClose, onSoalanLain }) {
  const [pilihanUser, setPilihanUser] = useState(null);

  useEffect(() => {
    setPilihanUser(null);
  }, [rawakSoalan?.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!rawakSoalan) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10002,
        background: 'rgba(3, 7, 20, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="lg-panel glass-card"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 'var(--r-xl, 24px)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
          padding: '24px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              className="lg-node-chip"
              style={{
                background: 'rgba(37, 99, 235, 0.2)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                color: '#93c5fd',
                fontWeight: 700,
                fontSize: '0.78rem',
              }}
            >
              🎲 UJI MINDA RAWAK
            </span>
            {rawakSoalan.kategori && (
              <span className="lg-node-chip" style={{ fontSize: '0.74rem' }}>
                {rawakSoalan.kategori}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lg-icon-btn"
            title="Tutup Modal"
            aria-label="Tutup Modal"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-strong)',
            }}
          >
            <LucideIcon name="x" size={16} />
          </button>
        </div>

        {/* Soalan / Senario Kes */}
        <div>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#60a5fa',
              marginBottom: '8px',
            }}
          >
            Senario Isu Semasa:
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.94rem',
              lineHeight: 1.65,
              color: 'var(--text-strong, #ffffff)',
              fontWeight: 500,
            }}
          >
            {rawakSoalan.isu_kontemporari}
          </p>
        </div>

        {/* 4 Pilihan Jawapan */}
        <div>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: '10px',
            }}
          >
            Pilih Kaedah Fiqh Yang Tepat:
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '10px',
            }}
          >
            {rawakSoalan.options?.map((opt, oIdx) => {
              const isPicked = pilihanUser === opt.kaedah_ranting_ar;
              const isCorrect = opt.kaedah_ranting_ar === rawakSoalan.kaedah_ranting_ar;

              let borderCol = 'rgba(255, 255, 255, 0.12)';
              let bgCol = 'rgba(255, 255, 255, 0.04)';

              if (pilihanUser) {
                if (isCorrect) {
                  borderCol = '#10b981';
                  bgCol = 'rgba(16, 185, 129, 0.22)';
                } else if (isPicked) {
                  borderCol = '#ef4444';
                  bgCol = 'rgba(239, 68, 68, 0.22)';
                }
              }

              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => {
                    if (!pilihanUser) {
                      setPilihanUser(opt.kaedah_ranting_ar);
                    }
                  }}
                  className="lg-inner-well"
                  style={{
                    textAlign: 'left',
                    cursor: pilihanUser ? 'default' : 'pointer',
                    borderColor: borderCol,
                    background: bgCol,
                    padding: '12px 16px',
                    borderRadius: 'var(--r-md, 14px)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    dir="rtl"
                    style={{
                      fontFamily: '"Noto Naskh Arabic", "Amiri", serif',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      lineHeight: 1.6,
                      color: '#ffffff',
                      marginBottom: '4px',
                    }}
                  >
                    {opt.kaedah_ranting_ar}
                  </div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-body, #cbd5e1)',
                      lineHeight: 1.45,
                    }}
                  >
                    {opt.kaedah_ranting_bm}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Huraian & Rujukan Kitab jika pengguna sudah memilih */}
        {pilihanUser && (
          <div
            className="lg-inner-well"
            style={{
              borderColor: 'rgba(56, 189, 248, 0.45)',
              background: 'rgba(8, 25, 54, 0.65)',
              padding: '14px 16px',
              borderRadius: 'var(--r-md, 14px)',
            }}
          >
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#67e8f9',
                marginBottom: '6px',
              }}
            >
              📖 Huraian &amp; Rujukan Kitab ({rawakSoalan.jilid_halaman || 'Jil. 1'}):
            </div>
            <p
              style={{
                margin: '0 0 10px 0',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                color: 'var(--text-strong, #ffffff)',
              }}
            >
              {rawakSoalan.huraian_jawapan}
            </p>
            {rawakSoalan.urlShamela && (
              <a
                href={rawakSoalan.urlShamela}
                target="_blank"
                rel="noopener noreferrer"
                className="lg-btn-glass"
                style={{
                  fontSize: '0.74rem',
                  padding: '5px 12px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                }}
              >
                <LucideIcon name="external" size={13} />
                <span>Buka Shamela.ws</span>
              </a>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '14px',
            marginTop: '4px',
          }}
        >
          <button
            type="button"
            onClick={onSoalanLain}
            className="lg-btn-primary"
            style={{
              padding: '9px 18px',
              fontSize: '0.84rem',
            }}
          >
            <LucideIcon name="refresh-cw" size={14} />
            <span>Soalan Rawak Lain</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="lg-btn-glass"
            style={{ padding: '9px 20px', fontSize: '0.84rem' }}
          >
            <span>Tutup</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// FASA 2: PEMETAAN WARNA DINAMIK 5 KAEDAH INDUK (DYNAMIC COLOR CODING)
// =========================================================================
function getKaedahTheme(item) {
  const ar = item?.kaedah_asasi_ar || '';
  const bm = item?.kaedah_asasi_bm || '';
  const text = `${ar} ${bm}`.toLowerCase();

  // 1. Niat / Al-Umur Bi Maqasidiha -> Tema Emerald / Hijau (#10b981)
  if (ar.includes('مَقَاصِد') || text.includes('niat') || text.includes('tujuan') || text.includes('maqasid')) {
    return {
      label: '🌿 Niat & Tujuan',
      color: '#10b981',
      border: 'rgba(16, 185, 129, 0.30)',
      badgeBg: '#10b981',
      watermark: 'radial-gradient(circle at 100% 0%, rgba(16, 185, 129, 0.05) 0%, transparent 60%)',
    };
  }
  // 2. Yakin / Al-Yaqin -> Tema Biru (#3b82f6)
  if (ar.includes('يَقِين') || text.includes('yakin') || text.includes('yaqin') || ar.includes('شَّكّ')) {
    return {
      label: '💎 Keyakinan',
      color: '#3b82f6',
      border: 'rgba(59, 130, 246, 0.30)',
      badgeBg: '#3b82f6',
      watermark: 'radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.05) 0%, transparent 60%)',
    };
  }
  // 3. Kesukaran / Al-Masyaqqah -> Tema Oren/Emas (#f59e0b)
  if (ar.includes('مَشَقَّة') || text.includes('sukar') || text.includes('masyaqqah') || ar.includes('تَيْسِير')) {
    return {
      label: '⚖️ Keringanan',
      color: '#f59e0b',
      border: 'rgba(245, 158, 11, 0.30)',
      badgeBg: '#f59e0b',
      watermark: 'radial-gradient(circle at 100% 0%, rgba(245, 158, 11, 0.05) 0%, transparent 60%)',
    };
  }
  // 4. Mudarat / Ad-Dharar -> Tema Merah/Ros (#ef4444)
  if (ar.includes('ضَّرَر') || text.includes('mudarat') || text.includes('dharar') || text.includes('bahaya')) {
    return {
      label: '🛡️ Mudarat',
      color: '#ef4444',
      border: 'rgba(239, 68, 68, 0.30)',
      badgeBg: '#ef4444',
      watermark: 'radial-gradient(circle at 100% 0%, rgba(239, 68, 68, 0.05) 0%, transparent 60%)',
    };
  }
  // 5. Adat / Al-Adah -> Tema Ungu/Indigo (#8b5cf6)
  if (ar.includes('عَادَة') || text.includes('adat') || text.includes('adah') || ar.includes('مُحَكَّمَة')) {
    return {
      label: '🏛️ Adat',
      color: '#8b5cf6',
      border: 'rgba(139, 92, 246, 0.30)',
      badgeBg: '#8b5cf6',
      watermark: 'radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.05) 0%, transparent 60%)',
    };
  }
  // Cabang / Lain-lain -> Tema Putih / Kaca biasa (#ffffff)
  return {
    label: 'Kaedah Fiqh',
    color: '#ffffff',
    border: 'rgba(255, 255, 255, 0.30)',
    badgeBg: 'rgba(255, 255, 255, 0.20)',
    watermark: 'radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 60%)',
  };
}

export default function App() {
  const { data } = qawaidData;

  const [selectedAsasi, setSelectedAsasi] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p) return p.toUpperCase();
    }
    return 'EXPLORER';
  });
  const [isCondensed, setIsCondensed] = useState(false);

  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);

  // =========================================================================
  // FASA 1: KUIZ MINGGUAN DINAMIK & PERSIMPANGAN MOD KUIZ
  // =========================================================================
  const [quizSubMode, setQuizSubMode] = useState('SELECTION'); // 'SELECTION' | 'MINGGUAN' | 'KOMPREHENSIF'

  // =========================================================================
  // FASA 2: TETAPAN TEKS DINAMIK WEB (MINI CMS)
  // =========================================================================
  const DEFAULT_TETAPAN_WEB = {
    teksPengumuman: '✨ Selamat Datang ke Qawaid OS — Sistem Ulang Kaji Pintar Berteraskan Kitab al-Qawaid al-Fiqhiyyah wa Tatbiqatuha fi al-Madhahib al-Arbaah',
    subtajukApp: 'Sistem Ulang Kaji Qawaid Fiqhiyyah',
    subtajukCabaran: 'Uji kefahaman teori dan aplikasi penyelesaian isu semasa melalui dua mod di bawah:',
  };

  const [tetapanWeb, setTetapanWeb] = useState(() => {
    try {
      const saved = localStorage.getItem('qawaid_tetapan_web');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          teksPengumuman: parsed.teksPengumuman || DEFAULT_TETAPAN_WEB.teksPengumuman,
          subtajukApp: parsed.subtajukApp || DEFAULT_TETAPAN_WEB.subtajukApp,
          subtajukCabaran: parsed.subtajukCabaran || DEFAULT_TETAPAN_WEB.subtajukCabaran,
        };
      }
    } catch {}
    return DEFAULT_TETAPAN_WEB;
  });

  // Fetch tetapan teks terkini dari backend (GET /api/tetapan-teks) sebaik aplikasi dimuatkan
  useEffect(() => {
    let isMounted = true;
    const fetchTetapan = async () => {
      try {
        const res = await fetch('/api/tetapan-teks');
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          if (data && isMounted) {
            const merged = {
              teksPengumuman: data.teksPengumuman || DEFAULT_TETAPAN_WEB.teksPengumuman,
              subtajukApp: data.subtajukApp || DEFAULT_TETAPAN_WEB.subtajukApp,
              subtajukCabaran: data.subtajukCabaran || DEFAULT_TETAPAN_WEB.subtajukCabaran,
            };
            setTetapanWeb(merged);
            try {
              localStorage.setItem('qawaid_tetapan_web', JSON.stringify(merged));
            } catch {}
          }
        }
      } catch (err) {
        console.warn('Gagal memuat tetapan teks dari backend (menggunakan data peranti):', err);
      }
    };

    fetchTetapan();
    return () => {
      isMounted = false;
    };
  }, []);

  // =========================================================================
  // FASA 2: PORTAL ADMIN RAHSIA (LONG-PRESS 1.5S, SHORTCUT KEY & HASH)
  // =========================================================================
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const longPressTimerRef = useRef(null);
  const isLongPressRef = useRef(false);

  // Semak parameter URL ?admin=1 atau hash #admin jika admin mahu buka terus
  useEffect(() => {
    const checkAdminQuery = () => {
      if (typeof window !== 'undefined') {
        const p = new URLSearchParams(window.location.search);
        if (p.get('admin') === '1' || p.get('admin') === 'true' || window.location.hash.toLowerCase() === '#admin') {
          setShowPasswordModal(true);
        }
      }
    };
    checkAdminQuery();
    window.addEventListener('hashchange', checkAdminQuery);
    return () => window.removeEventListener('hashchange', checkAdminQuery);
  }, []);

  // Shortcut Papan Kekunci untuk PC: Ctrl + Shift + A atau Alt + A
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) ||
        (e.altKey && (e.key === 'A' || e.key === 'a'))
      ) {
        e.preventDefault();
        setShowPasswordModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handler Long-Press (Tekan & Tahan 1.5 saat pada logo)
  const handleLogoPointerDown = () => {
    isLongPressRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(60);
      }
      setShowPasswordModal(true);
    }, 1500);
  };

  const handleLogoPointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleLogoClick = () => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    // Sentiasa kembali ke Home Screen (Direktori)
    setViewMode('EXPLORER');
    setQuizSubMode('SELECTION');
    setSelectedAsasi('ALL');
    setSearchQuery('');
    setDetailModalItem(null);
    setAiQuestionModalItem(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Muat data kuiz mingguan daripada localStorage jika ada, agar tidak hilang selepas refresh/deploy
  const [kuizMingguan, setKuizMingguan] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('qawaid_kuiz_mingguan');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.tajuk_mingguan && Array.isArray(parsed.soalan_objektif)) {
            // PENTING: Jika kuiz fail projek (kuizMingguanLalai) mempunyai lebih banyak soalan (cth: 20 soalan)
            // berbanding cache peranti yang lama (2 soalan), gantikan cache peranti secara automatik!
            if (kuizMingguanLalai?.soalan_objektif?.length > parsed.soalan_objektif.length) {
              try {
                localStorage.setItem('qawaid_kuiz_mingguan', JSON.stringify(kuizMingguanLalai));
              } catch {}
              return kuizMingguanLalai;
            }
            if (parsed.soalan_objektif.length > 0) {
              return parsed;
            }
          }
        }
      } catch (e) {
        console.warn('Ralat membaca kuiz dari localStorage:', e);
      }
    }
    return kuizMingguanLalai;
  });

  const [weeklyQuizIndex, setWeeklyQuizIndex] = useState(0);
  const [weeklySelectedAnswer, setWeeklySelectedAnswer] = useState(null);
  const [weeklyScore, setWeeklyScore] = useState(0);

  // Fungsi muat semula kuiz daripada fail projek lalai & storan pelayan
  const handleResetKuizKeLalai = () => {
    try {
      localStorage.removeItem('qawaid_kuiz_mingguan');
    } catch {}
    setKuizMingguan(kuizMingguanLalai);
    try {
      localStorage.setItem('qawaid_kuiz_mingguan', JSON.stringify(kuizMingguanLalai));
    } catch {}
    fetch('/api/kuiz-mingguan')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const quiz = data?.data || data;
        if (quiz?.tajuk_mingguan && Array.isArray(quiz.soalan_objektif) && quiz.soalan_objektif.length > 0) {
          setKuizMingguan(quiz);
          try {
            localStorage.setItem('qawaid_kuiz_mingguan', JSON.stringify(quiz));
          } catch {}
        }
      })
      .catch(() => {});
  };

  // Tarik data kuiz mingguan terkini dari backend (Fasa 4) dengan perlindungan localStorage
  useEffect(() => {
    fetch('/api/kuiz-mingguan')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Gagal mengambil kuiz mingguan');
      })
      .then((data) => {
        const quiz = (data && data.data) ? data.data : data;
        if (quiz && quiz.tajuk_mingguan && Array.isArray(quiz.soalan_objektif) && quiz.soalan_objektif.length > 0) {
          setKuizMingguan((prev) => {
            // Jika dalam peranti sudah ada kuiz penuh yang dijana (cth: 20 soalan) tetapi server kembalikan 2 soalan (fallback), kekalkan kuiz 20 soalan!
            if (prev?.soalan_objektif?.length > quiz.soalan_objektif.length) {
              return prev;
            }
            try {
              localStorage.setItem('qawaid_kuiz_mingguan', JSON.stringify(quiz));
            } catch {}
            return quiz;
          });
        }
      })
      .catch((err) => {
        console.log('Menggunakan data kuiz mingguan sedia ada:', err.message);
      });
  }, []);

  const [matchScore, setMatchScore] = useState(0);
  const [matchIndex, setMatchIndex] = useState(0);
  const [matchStreak, setMatchStreak] = useState(0);
  const [matchSelectedId, setMatchSelectedId] = useState(null);
  const [matchFeedback, setMatchFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [matchMode, setMatchMode] = useState('AR_TO_BM'); // 'AR_TO_BM' | 'BM_TO_AR'
  const [bookmarks, setBookmarks] = useState([]);

  const [flashIndex, setFlashIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // =========================================================================
  // FASA 3: UJI MINDA RAWAK (80 SOALAN AL-ZUHAILI)
  // =========================================================================
  const [rawakSoalan, setRawakSoalan] = useState(null);

  const handleUjiMindaRawak = useCallback(() => {
    if (!dataKuiz50 || dataKuiz50.length === 0) return;
    const randomIndex = Math.floor(Math.random() * dataKuiz50.length);
    const item = dataKuiz50[randomIndex];

    // Cipta 4 pilihan jawapan unik: 1 jawapan tepat + 3 distraktor rawak
    const seen = new Set([item.kaedah_ranting_ar]);
    const distractors = [];
    const shuffled = [...dataKuiz50].sort(() => 0.5 - Math.random());
    for (const d of shuffled) {
      if (!seen.has(d.kaedah_ranting_ar)) {
        seen.add(d.kaedah_ranting_ar);
        distractors.push(d);
        if (distractors.length === 3) break;
      }
    }
    const options = [...distractors, item].sort(() => 0.5 - Math.random());

    setRawakSoalan({
      ...item,
      options,
    });
  }, []);

  const [chatInput, setChatInput] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'ai',
      text: "أهلاً وسهلاً! Saya ialah **Penyelidik AI Qawaid OS** yang dihadkan khusus kepada kitab **[القواعد الفقهية وتطبيقاتها في المذاهب الأربعة](https://shamela.ws/book/21786)** karya Syeikh Prof. Dr. Muhammad Mustafa al-Zuhaili.\n\nTanyakan apa-apa soalan kaedah fiqhiyyah atau permasalahan furu' dalam empat mazhab — setiap jawapan dirujuk **eksklusif daripada kitab ini** berserta **nombor jilid & muka surat** dan **pautan terus ke halaman jawapan di Shamela.ws**.",
      sumber: [],
    },
  ]);
  const chatEndRef = useRef(null);
  const [isSourceStripExpanded, setIsSourceStripExpanded] = useState(false);

  // Refs for sliding glass indicators & sticky header offset
  const headerWrapRef = useRef(null);
  const navContainerRef = useRef(null);
  const filterContainerRef = useRef(null);
  const [navPillStyle, setNavPillStyle] = useState({ width: 0, transform: 'translateX(0px)', opacity: 0 });
  const [filterPillStyle, setFilterPillStyle] = useState({ width: 0, transform: 'translateX(0px)', opacity: 0 });
  const [filterStickyTop, setFilterStickyTop] = useState(86);

  // Feature-detect Chromium SVG backdrop-filter refraction & sync color scheme
  useEffect(() => {
    if (
      typeof CSS !== 'undefined' &&
      CSS.supports &&
      CSS.supports('backdrop-filter', 'url(#lg-refract-filter)')
    ) {
      document.documentElement.classList.add('has-svg-refract');
    }
    document.documentElement.setAttribute('data-theme', 'dark');
    try {
      localStorage.removeItem('qawaid_theme');
    } catch {}
  }, []);

  // Condense header on scroll + keep sticky filter bar offset exact (no overlap)
  const updateStickyOffset = useCallback(() => {
    if (headerWrapRef.current) {
      const rect = headerWrapRef.current.getBoundingClientRect();
      setFilterStickyTop(Math.round(rect.bottom + 12));
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const isPast = window.scrollY > 24;
      setIsCondensed((prev) => (prev !== isPast ? isPast : prev));
      updateStickyOffset();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateStickyOffset);
    updateStickyOffset();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateStickyOffset);
    };
  }, [updateStickyOffset]);

  useEffect(() => {
    if (viewMode === 'AI_CHAT') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isLoadingAI, viewMode]);

  // Pointer-follow specular highlight (--mx, --my)
  const handleGlassPointerMove = useCallback((e) => {
    const target = e.target.closest?.('.glass-control, .glass-card');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const mx = `${Math.round(e.clientX - rect.left)}px`;
    const my = `${Math.round(e.clientY - rect.top)}px`;
    target.style.setProperty('--mx', mx);
    target.style.setProperty('--my', my);
  }, []);

  // Kaedah Asasi list WITH counts per chip
  const kaedahAsasiList = useMemo(() => {
    const map = new Map();
    data.forEach((item) => {
      if (!map.has(item.kaedah_asasi_ar)) {
        map.set(item.kaedah_asasi_ar, {
          ar: item.kaedah_asasi_ar,
          bm: item.kaedah_asasi_bm,
          count: 1,
        });
      } else {
        map.get(item.kaedah_asasi_ar).count += 1;
      }
    });
    return Array.from(map.values());
  }, [data]);

  // Fungsi normalisasi teks Arab (buang baris/harakat & seragamkan huruf Alif/Hamzah)
  const normArab = (teks = '') =>
    teks
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .trim();

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const qArab = normArab(searchQuery);
    return data.filter((item) => {
      const matchTab = selectedAsasi === 'ALL' || item.kaedah_asasi_ar === selectedAsasi;
      const matchSearch =
        item.id.toLowerCase().includes(q) ||
        item.kaedah_asasi_bm.toLowerCase().includes(q) ||
        item.kaedah_asasi_ar.includes(searchQuery) ||
        (qArab && normArab(item.kaedah_asasi_ar).includes(qArab)) ||
        item.kaedah_ranting_bm.toLowerCase().includes(q) ||
        item.kaedah_ranting_ar.includes(searchQuery) ||
        (qArab && normArab(item.kaedah_ranting_ar).includes(qArab)) ||
        item.isu_kontemporari.toLowerCase().includes(q) ||
        item.huraian_ringkas.toLowerCase().includes(q);

      return matchTab && matchSearch;
    });
  }, [data, selectedAsasi, searchQuery]);

  // Measure & position sliding glass capsule indicator in Header Nav
  const updateNavIndicator = useCallback((shouldScrollNav = false) => {
    if (!navContainerRef.current) return;
    const activeBtn = navContainerRef.current.querySelector('.lg-nav-btn.is-active');
    if (activeBtn) {
      setNavPillStyle({
        width: `${activeBtn.offsetWidth}px`,
        transform: `translateX(${activeBtn.offsetLeft}px)`,
        opacity: 1,
      });
      // Scroll secara horizontal SAHAJA di dalam bekas tab jika butang berada di luar pandangan.
      // DILARANG guna scrollIntoView kerana ia menarik tetingkap vertikal telefon secara mengejut!
      if (shouldScrollNav && typeof window !== 'undefined' && window.innerWidth <= 680) {
        const container = navContainerRef.current;
        const targetScrollLeft = activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2);
        container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
      }
    } else {
      setNavPillStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, []);

  useEffect(() => {
    updateNavIndicator(true);
  }, [viewMode, bookmarks.length, updateNavIndicator]);

  // Measure & position sliding glass capsule indicator in Filter Bar
  const updateFilterIndicator = useCallback(() => {
    if (!filterContainerRef.current) return;
    const activeChip = filterContainerRef.current.querySelector('.lg-filter-chip.is-active');
    if (activeChip) {
      setFilterPillStyle({
        width: `${activeChip.offsetWidth}px`,
        transform: `translateX(${activeChip.offsetLeft}px)`,
        opacity: 1,
      });
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      updateFilterIndicator();
      updateNavIndicator(false);
    };
    handleResize();
    document.fonts?.ready?.then(handleResize);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedAsasi, viewMode, updateFilterIndicator, updateNavIndicator]);

  const currentQuizItem = dataKuiz50[quizIndex % dataKuiz50.length];
  const quizOptions = useMemo(() => {
    const seen = new Set([currentQuizItem.kaedah_ranting_ar]);
    const pool = [];
    const shuffled = [...dataKuiz50].sort(() => 0.5 - Math.random());
    for (const item of shuffled) {
      if (!seen.has(item.kaedah_ranting_ar)) {
        seen.add(item.kaedah_ranting_ar);
        pool.push(item);
        if (pool.length === 3) break;
      }
    }
    return [...pool, currentQuizItem].sort(() => 0.5 - Math.random());
  }, [quizIndex, currentQuizItem]);

  const handleAnswerQuiz = (option) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option.kaedah_ranting_ar || option.id);
    if (option.kaedah_ranting_ar === currentQuizItem.kaedah_ranting_ar) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setQuizIndex((prev) => (prev + 1) % dataKuiz50.length);
  };

  const prevQuestion = () => {
    setSelectedAnswer(null);
    setQuizIndex((prev) => (prev === 0 ? dataKuiz50.length - 1 : prev - 1));
  };

  // Handlers untuk Cabaran Topikal Mingguan (Fasa 1)
  const currentWeeklyItem = useMemo(() => {
    const list = kuizMingguan?.soalan_objektif || [];
    if (list.length === 0) return null;
    return list[weeklyQuizIndex % list.length];
  }, [kuizMingguan, weeklyQuizIndex]);

  const handleAnswerWeeklyQuiz = (pilihan) => {
    if (weeklySelectedAnswer || !currentWeeklyItem) return;
    setWeeklySelectedAnswer(pilihan);
    if (pilihan === currentWeeklyItem.jawapan_betul) {
      setWeeklyScore((s) => s + 1);
    }
  };

  const nextWeeklyQuestion = () => {
    setWeeklySelectedAnswer(null);
    const total = kuizMingguan?.soalan_objektif?.length || 1;
    setWeeklyQuizIndex((prev) => (prev + 1) % total);
  };

  const prevWeeklyQuestion = () => {
    setWeeklySelectedAnswer(null);
    const total = kuizMingguan?.soalan_objektif?.length || 1;
    setWeeklyQuizIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  // =========================================================================
  // PADANAN KAEDAH (MATCH GAME) - 59 Kaedah Penuh & 4 Pilihan Pintar
  // =========================================================================
  const currentMatchItem = data[matchIndex % data.length];
  const matchOptions = useMemo(() => {
    const distractors = data
      .filter((d) => d.id !== currentMatchItem.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    return [...distractors, currentMatchItem].sort(() => 0.5 - Math.random());
  }, [matchIndex, currentMatchItem, data]);

  const handleAnswerMatch = (selectedOption) => {
    if (matchFeedback === 'correct') return;
    setMatchSelectedId(selectedOption.id);
    if (selectedOption.id === currentMatchItem.id) {
      setMatchFeedback('correct');
      setMatchScore((s) => s + 1);
      setMatchStreak((curr) => curr + 1);
      setTimeout(() => {
        setMatchFeedback(null);
        setMatchSelectedId(null);
        setMatchIndex((i) => (i + 1) % data.length);
      }, 950);
    } else {
      setMatchFeedback('wrong');
      setMatchStreak(0);
      setTimeout(() => {
        setMatchFeedback(null);
        setMatchSelectedId(null);
      }, 1500);
    }
  };

  const nextMatch = () => {
    setMatchFeedback(null);
    setMatchSelectedId(null);
    setMatchIndex((i) => (i + 1) % data.length);
  };

  const resetMatch = () => {
    setMatchFeedback(null);
    setMatchSelectedId(null);
    setMatchScore(0);
    setMatchStreak(0);
    setMatchIndex(0);
  };

  const toggleBookmark = (item) => {
    if (bookmarks.some((b) => b.id === item.id)) {
      setBookmarks(bookmarks.filter((b) => b.id !== item.id));
    } else {
      setBookmarks([...bookmarks, item]);
    }
  };

  // Fungsi pintar untuk membuka nota yang sepadan tepat dengan kad matriks
  const bukaNotaUntukKad = (item) => {
    if (!item) return;

    let foundIdx = dataNotaLengkap.findIndex((d) => d.matriksId === item.id);
    const rantingNorm = normArab(item.kaedah_ranting_ar || '');
    const asasiNorm = normArab(item.kaedah_asasi_ar || '');

    if (foundIdx === -1 && rantingNorm) {
      foundIdx = dataNotaLengkap.findIndex(
        (d) =>
          normArab(d.tajuk).includes(rantingNorm) ||
          normArab(d.teksArabCarian || '').includes(rantingNorm)
      );
    }

    if (foundIdx === -1 && rantingNorm) {
      const kataKunci =
        rantingNorm.split(/\s+/).find((w) => w.length >= 4) ||
        rantingNorm.split(/\s+/)[0];
      if (kataKunci) {
        foundIdx = dataNotaLengkap.findIndex(
          (d) =>
            normArab(d.tajuk).includes(kataKunci) ||
            normArab(d.teksArabCarian || '').includes(kataKunci)
        );
      }
    }

    if (foundIdx === -1 && asasiNorm) {
      foundIdx = dataNotaLengkap.findIndex((d) =>
        normArab(d.tajuk).includes(asasiNorm)
      );
    }

    setFlashIndex(foundIdx !== -1 ? foundIdx : 0);
    setIsFlipped(false);
    setViewMode('FLASHCARD');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const hantarSoalanAI = async (teksPilihan) => {
    const soalan = (teksPilihan || chatInput).trim();
    if (!soalan || isLoadingAI) return;

    setChatMessages((prev) => [...prev, { role: 'user', text: soalan }]);
    if (!teksPilihan) setChatInput('');
    setIsLoadingAI(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soalan }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Gagal mendapatkan jawapan daripada pelayan.');
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: resData.jawapan || resData.answer,
          sumber: resData.sumber || [],
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `❌ **Ralat Sambungan:** ${err.message}`,
          sumber: [],
        },
      ]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Top nav items (duplicate AI Turath removed from top nav since floating bottom-right AI Turath button is always reachable)
  const navItems = [
    { id: 'EXPLORER', label: 'Direktori', mobLabel: 'Direktori', icon: 'grid' },
    { id: 'QUIZ', label: 'Kuiz', mobLabel: 'Kuiz', icon: 'brain' },
    { id: 'GAMES', label: 'Games', mobLabel: 'Games', icon: 'gamepad' },
    { id: 'MATCH', label: 'Padanan', mobLabel: 'Padanan', icon: 'puzzle' },
    { id: 'FLASHCARD', label: 'Nota Lengkap', mobLabel: 'Nota', icon: 'book-open' },
    { id: 'NOTES', label: `Bookmark (${bookmarks.length})`, mobLabel: `⭐ ${bookmarks.length}`, icon: 'bookmark' },
  ];

  return (
    <div className="lg-app-root" onPointerMove={handleGlassPointerMove}>
      {/* ====================================================================
          FIXED WALLPAPER LAYER (z-index: -1)
          Deep emerald/indigo/midnight base + 5 blurred orbs + Girih SVG tile
          + Chromium SVG feTurbulence+feDisplacementMap refraction filter
         ==================================================================== */}
      <div className="lg-wallpaper" aria-hidden="true">
        <div className="lg-orb lg-orb--gold" />
        <div className="lg-orb lg-orb--teal" />
        <div className="lg-orb lg-orb--magenta" />
        <div className="lg-orb lg-orb--blue" />
        <div className="lg-orb lg-orb--emerald" />

        <svg className="lg-girih-pattern" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Traditional Islamic Girih 8-Point Star & Interlace Pattern (6-10% opacity) */}
            <pattern
              id="girih-tile"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              <g
                stroke="var(--girih-stroke)"
                strokeWidth="1.35"
                fill="none"
              >
                <path d="M60 0 L120 60 L60 120 L0 60 Z" />
                <path d="M22 22 L98 22 L98 98 L22 98 Z" />
                <path d="M60 0 L60 22 M60 98 L60 120 M0 60 L22 60 M98 60 L120 60" />
                <path d="M0 0 L22 22 M120 0 L98 22 M0 120 L22 98 M120 120 L98 98" />
                <circle cx="60" cy="60" r="26" />
                <polygon points="60,14 73,47 106,60 73,73 60,106 47,73 14,60 47,47" />
              </g>
            </pattern>

            {/* Chromium Optical Refraction Filter (feTurbulence + feDisplacementMap) */}
            <filter id="lg-refract-filter" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.018"
                numOctaves="2"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="6.5"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#girih-tile)" />
        </svg>
      </div>

      {/* ====================================================================
          CONTROL LAYER: ONE FLOATING LIQUID GLASS HEADER CAPSULE
          (Logo + Search + Sliding-Capsule Nav + Light/Dark Toggle)
         ==================================================================== */}
      <div className="lg-header-wrap" ref={headerWrapRef}>
        <header
          className={`lg-header glass-control glass-control--refract ${
            isCondensed ? 'is-condensed' : ''
          }`}
        >
          {/* Logo Qawaid OS (Klik untuk Direktori / Tekan & Tahan 1.5s untuk Admin) */}
          <div
            className="lg-brand"
            onClick={handleLogoClick}
            onPointerDown={handleLogoPointerDown}
            onPointerUp={handleLogoPointerUp}
            onPointerCancel={handleLogoPointerUp}
            onPointerLeave={handleLogoPointerUp}
            title="Qawaid OS (Klik ke Direktori / Tahan 1.5s untuk Admin)"
            style={{ cursor: 'pointer', userSelect: 'none', touchAction: 'manipulation' }}
          >
            <div className="lg-brand-icon">
              <LucideIcon name="scale" size={18} />
            </div>
            <div>
              <h1 className="lg-brand-title">Qawaid OS</h1>
              <p className="lg-brand-sub">{tetapanWeb?.subtajukApp || 'Sistem Ulang Kaji Qawaid Fiqhiyyah'}</p>
            </div>
          </div>

          {/* Compact Search Integrated Inside Capsule */}
          <div className="lg-search">
            <span className="lg-search-icon">
              <LucideIcon name="search" size={14} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (viewMode !== 'EXPLORER') setViewMode('EXPLORER');
              }}
              placeholder="Cari lafaz Arab, terjemahan, isu..."
              className="lg-search-input"
              aria-label="Cari kaedah fiqh"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="lg-search-clear"
                title="Kosongkan carian"
                aria-label="Kosongkan carian"
              >
                <LucideIcon name="x" size={12} />
              </button>
            )}
          </div>

          {/* Navigation with Sliding Neutral Glass Indicator */}
          <nav
            className="lg-nav"
            ref={navContainerRef}
            aria-label="Navigasi Utama"
          >
            <div className="lg-sliding-pill" style={navPillStyle} />
            {navItems.map((tab) => {
              const isActive = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setViewMode(tab.id);
                    if (tab.id === 'QUIZ') setQuizSubMode('SELECTION');
                    if (tab.id === 'FLASHCARD') setIsFlipped(false);
                    if (typeof window !== 'undefined') {
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }
                  }}
                  className={`lg-nav-btn ${isActive ? 'is-active' : ''}`}
                >
                  <LucideIcon name={tab.icon} size={15} />
                  <span className="lg-nav-text-desktop">{tab.label}</span>
                  <span className="lg-nav-text-mobile">{tab.mobLabel || tab.label}</span>
                </button>
              );
            })}
          </nav>
        </header>
      </div>

      {/* ====================================================================
          MAIN CONTENT AREA
         ==================================================================== */}
      <main className="lg-main">
        {viewMode === 'EXPLORER' && (
          <>
            {/* ================================================================
                HERO SECTION (MUKA DEPAN / HOME - MOBILE-FIRST LIQUID GLASS)
               ================================================================ */}
            <div id="hero-section" className="glass-card">
              <h2 className="hero-title-ar" dir="rtl">
                اَلْقَوَاعِدُ الْفِقْهِيَّةُ
              </h2>
              <p className="hero-subtitle">
                Platform Ulang Kaji &amp; Aplikasi Isu Semasa Anda
              </p>

              <div className="hero-btn-group">
                <button
                  type="button"
                  className="hero-btn-primary"
                  onClick={handleUjiMindaRawak}
                >
                  <LucideIcon name="dices" size={18} strokeWidth={2} />
                  <span>Uji Minda Rawak</span>
                </button>
                <button
                  type="button"
                  className="hero-btn-secondary"
                  onClick={() => {
                    const el = document.getElementById('direktori-kad');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <LucideIcon name="book-open" size={18} strokeWidth={2} />
                  <span>Selusuri Direktori</span>
                </button>
                <button
                  type="button"
                  className="hero-btn-tertiary"
                  onClick={() => {
                    setViewMode('AI_CHAT');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <LucideIcon name="sparkles" size={18} strokeWidth={2} color="#e0be7a" />
                  <span>Bincang Isu dengan AI</span>
                </button>
              </div>
            </div>

            {/* CONTROL LAYER: STICKY SEGMENTED GLASS FILTER BAR (With Gap, No Overlap) */}
            <div
              id="direktori-kad"
              className="lg-filter-sticky"
              style={{ top: `${filterStickyTop}px` }}
            >
              <div
                className="lg-filter-bar glass-control glass-control--refract"
                ref={filterContainerRef}
                role="tablist"
                aria-label="Penapis Kaedah Asasi"
              >
                <div className="lg-sliding-pill" style={filterPillStyle} />

                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedAsasi === 'ALL'}
                  onClick={() => setSelectedAsasi('ALL')}
                  className={`lg-filter-chip ${
                    selectedAsasi === 'ALL' ? 'is-active' : ''
                  }`}
                >
                  <span className="lg-filter-chip-text">Semua</span>
                  <span className="lg-chip-count">{data.length}</span>
                </button>

                {kaedahAsasiList.map((k, idx) => {
                  const active = selectedAsasi === k.ar;
                  return (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedAsasi(k.ar)}
                      className={`lg-filter-chip ${active ? 'is-active' : ''}`}
                    >
                      <span className="lg-filter-chip-ar">
                        {k.ar}
                      </span>
                      <span className="lg-chip-count">{k.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CONTENT LAYER: 15 EQUAL-HEIGHT LIQUID GLASS CARDS */}
            {filteredData.length === 0 ? (
              <div
                className="lg-panel glass-card"
                style={{ textAlign: 'center' }}
              >
                <p style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px' }}>
                  Tiada kaedah ditemui
                </p>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-body)',
                    margin: '0 0 18px',
                  }}
                >
                  Tiada padanan untuk &ldquo;{searchQuery}&rdquo;. Cuba kata kunci lain.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedAsasi('ALL');
                  }}
                  className="lg-btn-primary"
                >
                  <span>Reset Penapis</span>
                </button>
              </div>
            ) : (
              <div className="lg-grid">
                {filteredData.map((item, index) => {
                  const isBookmarked = bookmarks.some((b) => b.id === item.id);
                  const theme = getKaedahTheme(item);

                  return (
                    <article
                      key={item.id}
                      className="lg-card glass-card kad-kaedah"
                      style={{
                        animation: 'fadeInUp 0.6s ease-out forwards',
                        opacity: 0,
                        animationDelay: `${index * 0.1}s`,
                        borderColor: theme.border,
                        backgroundImage: theme.watermark,
                        '--theme-color': theme.color,
                      }}
                    >
                      <div>
                        {/* 1. Badge Nombor Kaedah (Color Coded) & Neutral Glass Bookmark Button */}
                        <div
                          className="lg-card-top"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                          }}
                        >
                          <span
                            className="lg-node-chip"
                            style={{
                              backgroundColor: theme.badgeBg,
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.74rem',
                              padding: '3px 10px',
                              borderRadius: 'var(--r-pill, 9999px)',
                              border: 'none',
                              boxShadow: `0 2px 8px ${theme.color}40`,
                              letterSpacing: '0.02em',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {theme.label}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleBookmark(item)}
                            className={`lg-icon-btn ${
                              isBookmarked ? 'is-bookmarked' : ''
                            }`}
                            title={
                              isBookmarked ? 'Buang Bookmark' : 'Simpan Bookmark'
                            }
                            aria-label={`Bookmark ${item.id}`}
                          >
                            <LucideIcon
                              name="star"
                              size={15}
                              filled={isBookmarked}
                            />
                          </button>
                        </div>

                        {/* 2. Arabic Block (Fixed min-height, line-height 1.9, Naskh font, full tashkeel) */}
                        <div
                          dir="rtl"
                          className="lg-arabic-block"
                          style={{
                            fontFamily: "'Amiri', 'Scheherazade New', 'Noto Naskh Arabic', serif",
                            fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                            textWrap: 'balance',
                            textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                          }}
                        >
                          {item.kaedah_ranting_ar}
                        </div>

                        {/* 3. Malay Gloss */}
                        <p className="lg-malay-gloss">
                          &ldquo;{item.kaedah_ranting_bm}&rdquo;
                        </p>

                        {/* 4. Description (>= 4.5:1 WCAG AA contrast) */}
                        <p className="lg-card-desc">{item.huraian_ringkas}</p>
                      </div>

                      {/* 5. Footer: Source Reference Left; Small Glass "Tanya AI" + Tinted Primary "Nota" */}
                      <footer className="lg-card-footer">
                        <span className="lg-source-ref">
                          <LucideIcon name="book-open" size={14} />
                          <span>{item.jilid_halaman}</span>
                        </span>

                        <div className="lg-card-actions">
                          <button
                            type="button"
                            onClick={() => {
                              setViewMode('AI_CHAT');
                              hantarSoalanAI(
                                `Jelaskan kaedah "${item.kaedah_ranting_ar}" (${item.kaedah_ranting_bm}) beserta syarat dan contoh tatbiqatnya dalam kitab القواعد الفقهية وتطبيقاتها في المذاهب الأربعة.`
                              );
                            }}
                            className="lg-btn-glass"
                            title="Tanya AI Chatbox"
                          >
                            <LucideIcon name="sparkles" size={14} />
                            <span>Tanya AI</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => bukaNotaUntukKad(item)}
                            className="lg-btn-nota"
                            title="Buka Nota Lengkap"
                          >
                            <span>Nota</span>
                            <LucideIcon name="arrow-right" size={14} className="lg-nota-arrow" />
                          </button>
                        </div>
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ====================================================================
            FASA 1: KUIZ VIEW — PERSIMPANGAN & DUA MOD PILIHAN
           ==================================================================== */}
        {viewMode === 'QUIZ' && (
          <>
            {/* SUB-MOD 1: SKRIN PERSIMPANGAN (Dua Kad Pilihan Utama) */}
            {quizSubMode === 'SELECTION' && (
              <div className="lg-panel glass-card" style={{ maxWidth: '880px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '28px', position: 'relative' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      className="lg-node-chip"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 16px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      <LucideIcon name="brain" size={15} />
                      <span>MOD PENILAIAN &amp; UJIAN</span>
                    </span>

                    <button
                      type="button"
                      onClick={handleResetKuizKeLalai}
                      className="lg-btn-glass"
                      title="Muat semula data kuiz terkini"
                      style={{
                        padding: '5px 12px',
                        fontSize: '0.74rem',
                        borderRadius: 'var(--r-pill)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#6ee7b7',
                        borderColor: 'rgba(16, 185, 129, 0.35)',
                        background: 'rgba(16, 185, 129, 0.08)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <LucideIcon name="refresh-cw" size={12} />
                      <span>Muat Semula</span>
                    </button>
                  </div>
                  <h2
                    style={{
                      margin: '0 0 8px',
                      fontSize: '1.65rem',
                      fontWeight: 800,
                      color: 'var(--text-strong)',
                    }}
                  >
                    Pilih Cabaran Kuiz Qawaid OS
                  </h2>
                  <p
                    style={{
                      margin: '0 auto',
                      maxWidth: '560px',
                      fontSize: '0.88rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.6,
                    }}
                  >
                    {tetapanWeb?.subtajukCabaran || 'Uji kefahaman teori dan aplikasi penyelesaian isu semasa melalui dua mod di bawah:'}
                  </p>
                </div>

                {/* Grid 2 Kad Persimpangan */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '18px',
                    marginBottom: '10px',
                  }}
                >
                  {/* KAD A: Cabaran Topikal Mingguan */}
                  <div
                    className="lg-inner-well"
                    style={{
                      padding: '24px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--r-lg)',
                      borderColor: 'rgba(16, 185, 129, 0.45)',
                      background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 18, 38, 0.6) 100%)',
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.18)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '14px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: 'rgba(16, 185, 129, 0.22)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            letterSpacing: '0.04em',
                          }}
                        >
                          TOPIKAL MINGGUAN
                        </span>
                      </div>

                      <h3
                        style={{
                          margin: '0 0 10px',
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          lineHeight: 1.4,
                        }}
                      >
                        🗓️ Cabaran Topikal Mingguan (Berdasarkan Slides)
                      </h3>

                      <p
                        style={{
                          margin: '0 0 16px',
                          fontSize: '0.90rem',
                          fontWeight: 600,
                          color: '#a7f3d0',
                          lineHeight: 1.5,
                        }}
                      >
                        {kuizMingguan.tajuk_mingguan}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <span className="lg-node-chip" style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                          📝 {kuizMingguan.soalan_objektif?.length || 0} Soalan
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setWeeklyQuizIndex(0);
                        setWeeklySelectedAnswer(null);
                        setWeeklyScore(0);
                        setQuizSubMode('MINGGUAN');
                      }}
                      className="lg-btn-primary"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        padding: '12px 18px',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <span>Mula Cabaran Mingguan</span>
                      <LucideIcon name="arrow-right" size={16} />
                    </button>
                  </div>

                  {/* KAD B: Ujian Komprehensif */}
                  <div
                    className="lg-inner-well"
                    style={{
                      padding: '24px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--r-lg)',
                      borderColor: 'rgba(56, 189, 248, 0.45)',
                      background: 'linear-gradient(145deg, rgba(56, 189, 248, 0.10) 0%, rgba(6, 18, 38, 0.6) 100%)',
                      boxShadow: '0 8px 24px rgba(56, 189, 248, 0.15)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: 'rgba(56, 189, 248, 0.22)',
                            color: '#7dd3fc',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            letterSpacing: '0.04em',
                          }}
                        >
                          KOMPREHENSIF
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          80 Soalan Penuh
                        </span>
                      </div>

                      <h3
                        style={{
                          margin: '0 0 10px',
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          lineHeight: 1.4,
                        }}
                      >
                        🏆 Ujian Komprehensif (Berdasarkan Kitab القواعد الفقهية وتطبيقاتها في المذاهب الأربعة)
                      </h3>

                      <p
                        style={{
                          margin: '0 0 16px',
                          fontSize: '0.88rem',
                          color: 'var(--text-body)',
                          lineHeight: 1.55,
                        }}
                      >
                        Ujian mendalam merangkumi 5 kaedah asasi dan puluhan kaedah ranting.
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <span className="lg-node-chip" style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                          📚 {dataKuiz50.length} Senario Kes
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setQuizIndex(0);
                        setSelectedAnswer(null);
                        setScore(0);
                        setQuizSubMode('KOMPREHENSIF');
                      }}
                      className="lg-btn-glass"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        padding: '12px 18px',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        borderColor: 'rgba(56, 189, 248, 0.5)',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#bae6fd',
                      }}
                    >
                      <span>Buka Ujian Komprehensif</span>
                      <LucideIcon name="arrow-right" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MOD 2: CABARAN TOPIKAL MINGGUAN (Berdasarkan Slaid / Nota) */}
            {quizSubMode === 'MINGGUAN' && currentWeeklyItem && (
              <div className="lg-panel glass-card">
                <div
                  className="lg-card-top"
                  style={{ marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setQuizSubMode('SELECTION')}
                      className="lg-btn-glass"
                      style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                    >
                      <LucideIcon name="arrow-left" size={14} />
                      <span>Mod Kuiz</span>
                    </button>
                    <span className="lg-node-chip" style={{ borderColor: '#10b981', color: '#6ee7b7' }}>
                      🗓️ TOPIKAL MINGGUAN
                    </span>
                    <span className="lg-node-chip">
                      SOALAN {weeklyQuizIndex + 1} / {kuizMingguan.soalan_objektif.length}
                    </span>
                  </div>
                  <span className="lg-node-chip">
                    SKOR: {weeklyScore} / {kuizMingguan.soalan_objektif.length}
                  </span>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700 }}>
                    {kuizMingguan.tajuk_mingguan}
                  </span>
                </div>

                <div className="lg-inner-well" style={{ marginBottom: '20px' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.96rem',
                      fontWeight: 600,
                      lineHeight: 1.6,
                      color: 'var(--text-strong)',
                    }}
                  >
                    {currentWeeklyItem.soalan}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '20px',
                  }}
                >
                  {currentWeeklyItem.pilihan?.map((pilihan, pIdx) => {
                    const isCorrect = pilihan === currentWeeklyItem.jawapan_betul;
                    const isPicked = weeklySelectedAnswer === pilihan;
                    let borderCol = undefined;
                    let bgCol = undefined;
                    if (weeklySelectedAnswer) {
                      if (isCorrect) {
                        borderCol = '#10b981';
                        bgCol = 'rgba(16, 185, 129, 0.22)';
                      } else if (isPicked) {
                        borderCol = '#ef4444';
                        bgCol = 'rgba(239, 68, 68, 0.22)';
                      }
                    }
                    const abcd = ['A', 'B', 'C', 'D'][pIdx] || `${pIdx + 1}`;
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleAnswerWeeklyQuiz(pilihan)}
                        className="lg-inner-well"
                        style={{
                          textAlign: 'left',
                          cursor: 'pointer',
                          borderColor: borderCol,
                          background: bgCol,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '14px 16px',
                          transition: 'transform 0.2s var(--spring)',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: isPicked ? (isCorrect ? '#10b981' : '#ef4444') : 'rgba(255, 255, 255, 0.1)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            flexShrink: 0,
                          }}
                        >
                          {abcd}
                        </span>
                        <span
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: 'var(--text-strong)',
                            lineHeight: 1.5,
                          }}
                        >
                          {pilihan}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {weeklySelectedAnswer && currentWeeklyItem.huraian && (
                  <div
                    className="lg-inner-well"
                    style={{
                      marginBottom: '18px',
                      borderColor: 'rgba(16, 185, 129, 0.45)',
                      background: 'rgba(6, 28, 20, 0.65)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: '#6ee7b7',
                        marginBottom: '6px',
                      }}
                    >
                      💡 Huraian Jawapan &amp; Pengukuhan Konsep:
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.86rem',
                        lineHeight: 1.6,
                        color: 'var(--text-strong)',
                      }}
                    >
                      {currentWeeklyItem.huraian}
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={prevWeeklyQuestion}
                    className="lg-btn-glass"
                    style={{ padding: '12px 18px', justifyContent: 'center' }}
                  >
                    <LucideIcon name="arrow-left" size={15} />
                    <span>Sebelum</span>
                  </button>
                  <button
                    type="button"
                    onClick={nextWeeklyQuestion}
                    className="lg-btn-primary"
                    style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                  >
                    <span>Soalan Seterusnya</span>
                    <LucideIcon name="arrow-right" size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* SUB-MOD 3: UJIAN KOMPREHENSIF (50 Soalan — Kitab Zuhaili) */}
            {quizSubMode === 'KOMPREHENSIF' && (
              <div className="lg-panel glass-card">
                <div
                  className="lg-card-top"
                  style={{ marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setQuizSubMode('SELECTION')}
                      className="lg-btn-glass"
                      style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                    >
                      <LucideIcon name="arrow-left" size={14} />
                      <span>Mod Kuiz</span>
                    </button>
                    <span className="lg-node-chip">
                      SOALAN {quizIndex + 1} / {dataKuiz50.length}
                    </span>
                    {currentQuizItem.kategori && (
                      <span className="lg-node-chip" dir="auto">
                        {currentQuizItem.kategori}
                      </span>
                    )}
                  </div>
                  <span className="lg-node-chip">
                    SKOR: {score} / {dataKuiz50.length}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                    margin: '0 0 8px',
                  }}
                >
                  Senario Kes &amp; Tatbiqat Mazhab:
                </p>
                <div className="lg-inner-well" style={{ marginBottom: '20px' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.94rem',
                      fontWeight: 600,
                      lineHeight: 1.6,
                      color: 'var(--text-strong)',
                    }}
                  >
                    {currentQuizItem.isu_kontemporari}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '20px',
                  }}
                >
                  {quizOptions.map((opt) => {
                    const isCorrect = opt.kaedah_ranting_ar === currentQuizItem.kaedah_ranting_ar;
                    const isPicked = selectedAnswer === opt.kaedah_ranting_ar;
                    let borderCol = undefined;
                    let bgCol = undefined;
                    if (selectedAnswer) {
                      if (isCorrect) {
                        borderCol = '#10b981';
                        bgCol = 'rgba(16, 185, 129, 0.22)';
                      } else if (isPicked) {
                        borderCol = '#ef4444';
                        bgCol = 'rgba(239, 68, 68, 0.22)';
                      }
                    }
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleAnswerQuiz(opt)}
                        className="lg-inner-well"
                        style={{
                          textAlign: 'left',
                          cursor: 'pointer',
                          borderColor: borderCol,
                          background: bgCol,
                          transition: 'transform 0.2s var(--spring)',
                        }}
                      >
                        <div
                          dir="rtl"
                          style={{
                            fontFamily: '"Noto Naskh Arabic", serif',
                            fontSize: '1.22rem',
                            fontWeight: 700,
                            lineHeight: 1.8,
                            color: 'var(--text-strong)',
                            marginBottom: '4px',
                          }}
                        >
                          {opt.kaedah_ranting_ar}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--text-body)',
                          }}
                        >
                          {opt.kaedah_ranting_bm}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedAnswer && currentQuizItem.huraian_jawapan && (
                  <div
                    className="lg-inner-well"
                    style={{
                      marginBottom: '18px',
                      borderColor: 'rgba(56, 189, 248, 0.45)',
                      background: 'rgba(8, 25, 54, 0.55)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--text-muted)',
                        marginBottom: '6px',
                      }}
                    >
                      Huraian &amp; Rujukan Kitab (القواعد الفقهية وتطبيقاتها في المذاهب الأربعة —{' '}
                      {currentQuizItem.jilid_halaman}):
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.86rem',
                        lineHeight: 1.6,
                        color: 'var(--text-strong)',
                      }}
                    >
                      {currentQuizItem.huraian_jawapan}
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={prevQuestion}
                    className="lg-btn-glass"
                    style={{ padding: '12px 18px', justifyContent: 'center' }}
                  >
                    <LucideIcon name="arrow-left" size={15} />
                    <span>Sebelum</span>
                  </button>
                  <button
                    type="button"
                    onClick={nextQuestion}
                    className="lg-btn-primary"
                    style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                  >
                    <span>Soalan Seterusnya</span>
                    <LucideIcon name="arrow-right" size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ====================================================================
            GAMES HUB VIEW (Sprint 60 Saat & Permainan Masa Hadapan)
           ==================================================================== */}
        {viewMode === 'GAMES' && <SprintGame />}

        {/* ====================================================================
            MATCH VIEW (Padanan Kaedah — 59 Kaedah Penuh & 4 Pilihan)
           ==================================================================== */}
        {viewMode === 'MATCH' && (
          <div className="lg-panel glass-card" style={{ maxWidth: '840px', margin: '0 auto' }}>
            {/* Bar Atas: Status Kemajuan, Penukar Mod, Skor & Streak */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '18px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--card-divider)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="lg-node-chip">
                  KAEDAH {matchIndex + 1} / {data.length}
                </span>
              </div>

              {/* Butang Tukar Mod: Arab -> BM / BM -> Arab */}
              <button
                type="button"
                onClick={() => {
                  setMatchMode((m) => (m === 'AR_TO_BM' ? 'BM_TO_AR' : 'AR_TO_BM'));
                  setMatchFeedback(null);
                  setMatchSelectedId(null);
                }}
                className="lg-btn-glass"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: '20px',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: 'var(--text-strong)',
                }}
                title="Tukar mod soalan padanan"
              >
                <LucideIcon name="refresh-cw" size={13} />
                <span>
                  {matchMode === 'AR_TO_BM' ? '🇸🇦 Lafaz Arab ➔ 🇲🇾 Maksud' : '🇲🇾 Maksud ➔ 🇸🇦 Lafaz Arab'}
                </span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="lg-node-chip" style={{ color: '#34d399' }}>
                  SKOR: {matchScore}
                </span>
                {matchStreak > 1 && (
                  <span
                    className="lg-node-chip"
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      borderColor: 'rgba(245, 158, 11, 0.4)',
                      color: '#fbbf24',
                    }}
                  >
                    🔥 {matchStreak} Streak!
                  </span>
                )}
              </div>
            </div>

            {/* Sub-header: Asasi & Arahan */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#60a5fa',
                  marginBottom: '4px',
                }}
              >
                {currentMatchItem.kaedah_asasi_ar} ({currentMatchItem.kaedah_asasi_bm})
              </div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  margin: '0 0 6px',
                  color: 'var(--text-strong)',
                }}
              >
                {matchMode === 'AR_TO_BM'
                  ? 'Pilih Terjemahan & Maksud Yang Tepat'
                  : 'Pilih Lafaz Kaedah Arab Yang Tepat'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Padankan kaedah ini dengan pilihan yang betul daripada 59 kaedah fiqhiyyah.
              </p>
            </div>

            {/* Prompt Kad Utama */}
            <div
              className="lg-inner-well"
              style={{
                padding: '24px 20px',
                marginBottom: '22px',
                textAlign: 'center',
                borderColor:
                  matchFeedback === 'correct'
                    ? 'rgba(16, 185, 129, 0.6)'
                    : matchFeedback === 'wrong'
                    ? 'rgba(239, 68, 68, 0.6)'
                    : 'rgba(56, 189, 248, 0.3)',
                background:
                  matchFeedback === 'correct'
                    ? 'rgba(16, 185, 129, 0.12)'
                    : matchFeedback === 'wrong'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(8, 25, 54, 0.6)',
                transition: 'all 0.3s ease',
              }}
            >
              {matchMode === 'AR_TO_BM' ? (
                <div
                  dir="rtl"
                  style={{
                    fontFamily: '"Noto Naskh Arabic", serif',
                    fontSize: '1.85rem',
                    fontWeight: 700,
                    lineHeight: 1.9,
                    color: 'var(--text-strong)',
                  }}
                >
                  {currentMatchItem.kaedah_ranting_ar}
                </div>
              ) : (
                <div
                  dir="ltr"
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    lineHeight: 1.6,
                    color: '#38bdf8',
                  }}
                >
                  "{currentMatchItem.kaedah_ranting_bm}"
                </div>
              )}

              {/* Status Respons Interaktif Tanpa Alert */}
              {matchFeedback === 'correct' && (
                <div
                  style={{
                    marginTop: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#34d399',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                  }}
                >
                  <LucideIcon name="check" size={18} />
                  <span>Tahniah! Padanan tepat (+1)</span>
                </div>
              )}
              {matchFeedback === 'wrong' && (
                <div
                  style={{
                    marginTop: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#f87171',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                  }}
                >
                  <LucideIcon name="x" size={18} />
                  <span>Kurang tepat! Cuba lagi atau klik kaedah seterusnya.</span>
                </div>
              )}
            </div>

            {/* Grid 4 Pilihan Jawapan */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '14px',
                marginBottom: '22px',
              }}
            >
              {matchOptions.map((opt) => {
                const isTarget = opt.id === currentMatchItem.id;
                const isSelected = matchSelectedId === opt.id;
                let borderStyle = 'rgba(56, 189, 248, 0.18)';
                let bgStyle = 'rgba(255, 255, 255, 0.03)';
                let glowStyle = 'none';

                if (matchFeedback && isSelected) {
                  if (isTarget) {
                    borderStyle = '#10b981';
                    bgStyle = 'rgba(16, 185, 129, 0.25)';
                    glowStyle = '0 0 20px rgba(16, 185, 129, 0.35)';
                  } else {
                    borderStyle = '#ef4444';
                    bgStyle = 'rgba(239, 68, 68, 0.25)';
                    glowStyle = '0 0 20px rgba(239, 68, 68, 0.35)';
                  }
                } else if (matchFeedback === 'correct' && isTarget) {
                  borderStyle = '#10b981';
                  bgStyle = 'rgba(16, 185, 129, 0.25)';
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleAnswerMatch(opt)}
                    className="lg-btn-glass"
                    disabled={matchFeedback === 'correct'}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--r-md)',
                      textAlign: matchMode === 'AR_TO_BM' ? 'left' : 'right',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      borderColor: borderStyle,
                      background: bgStyle,
                      boxShadow: glowStyle,
                      cursor: matchFeedback === 'correct' ? 'default' : 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      position: 'relative',
                    }}
                  >
                    {matchMode === 'AR_TO_BM' ? (
                      <>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            width: '100%',
                          }}
                        >
                          <span>{opt.jilid_halaman}</span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            lineHeight: 1.5,
                            color: 'var(--text-strong)',
                          }}
                        >
                          {opt.kaedah_ranting_bm}
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            width: '100%',
                            direction: 'ltr',
                          }}
                        >
                          <span>{opt.jilid_halaman}</span>
                        </div>
                        <div
                          dir="rtl"
                          style={{
                            fontFamily: '"Noto Naskh Arabic", serif',
                            fontSize: '1.28rem',
                            fontWeight: 700,
                            lineHeight: 1.8,
                            color: 'var(--text-strong)',
                            width: '100%',
                          }}
                        >
                          {opt.kaedah_ranting_ar}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Kawalan Bawah: Seterusnya, Buka Nota, Mula Semula */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                paddingTop: '12px',
                borderTop: '1px solid var(--card-divider)',
              }}
            >
              <button
                type="button"
                onClick={resetMatch}
                className="lg-btn-glass"
                style={{ padding: '10px 16px', fontSize: '0.82rem' }}
                title="Mula semula cabaran padanan dari kaedah pertama"
              >
                <LucideIcon name="refresh-cw" size={14} />
                <span>Mula Semula</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => bukaNotaUntukKad(currentMatchItem)}
                  className="lg-btn-glass"
                  style={{
                    padding: '10px 16px',
                    fontSize: '0.82rem',
                    color: '#38bdf8',
                    borderColor: 'rgba(56, 189, 248, 0.3)',
                  }}
                  title="Lihat nota penuh, dalil & tatbiqat empat mazhab bagi kaedah ini"
                >
                  <LucideIcon name="book-open" size={14} />
                  <span>Buka Nota Penuh</span>
                </button>

                <button
                  type="button"
                  onClick={nextMatch}
                  className="lg-btn-primary"
                  style={{ padding: '10px 20px', fontSize: '0.82rem' }}
                >
                  <span>Kaedah Seterusnya</span>
                  <LucideIcon name="arrow-right" size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            NOTA LENGKAP / FLASHCARD VIEW
           ==================================================================== */}
        {viewMode === 'FLASHCARD' && dataNotaLengkap && dataNotaLengkap.length > 0 && (
          <div style={{ maxWidth: '760px', margin: '24px auto 0' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '12px',
                padding: '0 8px',
              }}
            >
              <span className="lg-node-chip">
                NOTA {flashIndex + 1} / {dataNotaLengkap.length}
              </span>
            </div>

            <div
              className="lg-panel glass-card"
              style={{ margin: 0, minHeight: '440px', display: 'flex', flexDirection: 'column' }}
            >
              {!isFlipped ? (
                <div
                  onClick={() => setIsFlipped(true)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                    padding: '40px 24px 56px',
                  }}
                >
                  <span className="lg-node-chip" style={{ marginBottom: '22px' }}>
                    TEKAN UNTUK BUKA NOTA PENUH
                  </span>
                  {(() => {
                    const currentNota = dataNotaLengkap[flashIndex];
                    const tArab =
                      currentNota?.tajukArab ||
                      (currentNota?.tajuk && currentNota.tajuk.includes('(')
                        ? currentNota.tajuk.split('(')[0].trim()
                        : /[\u0600-\u06FF]/.test(currentNota?.tajuk || '')
                        ? currentNota?.tajuk
                        : '');
                    const tBm =
                      currentNota?.tajukBm ||
                      (currentNota?.tajuk && currentNota.tajuk.includes('(')
                        ? currentNota.tajuk.match(/\((.*?)\)/)?.[1]?.trim()
                        : !tArab
                        ? currentNota?.tajuk
                        : '');

                    return tArab ? (
                      <div style={{ width: '100%', maxWidth: '720px', marginBottom: '16px' }}>
                        <div
                          dir="rtl"
                          lang="ar"
                          style={{
                            fontFamily: '"Noto Naskh Arabic", serif',
                            fontSize: '2rem',
                            fontWeight: 700,
                            lineHeight: 1.85,
                            color: 'var(--text-strong)',
                            margin: '0 0 12px',
                            textAlign: 'center',
                          }}
                        >
                          {tArab}
                        </div>
                        {tBm && (
                          <p
                            dir="ltr"
                            style={{
                              fontFamily: 'inherit',
                              fontSize: '1.05rem',
                              fontWeight: 600,
                              lineHeight: 1.55,
                              color: '#38bdf8',
                              margin: '0 auto',
                              maxWidth: '560px',
                              textAlign: 'center',
                            }}
                          >
                            &ldquo;{tBm}&rdquo;
                          </p>
                        )}
                      </div>
                    ) : (
                      <h2
                        style={{
                          fontSize: '1.65rem',
                          fontWeight: 700,
                          lineHeight: 1.5,
                          color: 'var(--text-strong)',
                          margin: '0 0 16px',
                          textAlign: 'center',
                          maxWidth: '680px',
                        }}
                      >
                        {currentNota?.tajuk}
                      </h2>
                    );
                  })()}
                  <p
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      margin: 0,
                    }}
                  >
                    {dataNotaLengkap[flashIndex].kategori || "Qawaid Fiqhiyyah"}
                  </p>
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid var(--card-divider)',
                    }}
                  >
                    <span className="lg-node-chip">
                      {dataNotaLengkap[flashIndex].kategori || "Qawaid Fiqhiyyah"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsFlipped(false)}
                      className="lg-btn-glass"
                    >
                      <span>Tutup Nota</span>
                      <LucideIcon name="x" size={14} />
                    </button>
                  </div>

                  {(() => {
                    const currentNota = dataNotaLengkap[flashIndex];
                    const tArab =
                      currentNota?.tajukArab ||
                      (currentNota?.tajuk && currentNota.tajuk.includes('(')
                        ? currentNota.tajuk.split('(')[0].trim()
                        : /[\u0600-\u06FF]/.test(currentNota?.tajuk || '')
                        ? currentNota?.tajuk
                        : '');
                    const tBm =
                      currentNota?.tajukBm ||
                      (currentNota?.tajuk && currentNota.tajuk.includes('(')
                        ? currentNota.tajuk.match(/\((.*?)\)/)?.[1]?.trim()
                        : !tArab
                        ? currentNota?.tajuk
                        : '');

                    return tArab ? (
                      <div
                        style={{
                          marginBottom: '20px',
                          paddingBottom: '14px',
                          borderBottom: '1px solid var(--card-divider)',
                        }}
                      >
                        <div
                          dir="rtl"
                          lang="ar"
                          style={{
                            fontFamily: '"Noto Naskh Arabic", serif',
                            fontSize: '1.65rem',
                            fontWeight: 700,
                            lineHeight: 1.8,
                            color: 'var(--text-strong)',
                            margin: '0 0 8px',
                            textAlign: 'right',
                          }}
                        >
                          {tArab}
                        </div>
                        {tBm && (
                          <p
                            dir="ltr"
                            style={{
                              fontFamily: 'inherit',
                              fontSize: '0.98rem',
                              fontWeight: 600,
                              lineHeight: 1.5,
                              color: '#38bdf8',
                              margin: 0,
                              textAlign: 'left',
                            }}
                          >
                            &ldquo;{tBm}&rdquo;
                          </p>
                        )}
                      </div>
                    ) : (
                      <h3
                        style={{
                          fontSize: '1.45rem',
                          fontWeight: 700,
                          color: 'var(--text-strong)',
                          margin: '0 0 20px',
                          textAlign: 'left',
                        }}
                      >
                        {currentNota?.tajuk}
                      </h3>
                    );
                  })()}

                  {(() => {
                    const nota = dataNotaLengkap[flashIndex];
                    const isTeori =
                      (nota.kategori &&
                        (nota.kategori.includes('Pengenalan') ||
                          nota.kategori.includes('Sejarah') ||
                          nota.kategori.includes('Takrif'))) ||
                      (nota.tajuk &&
                        (nota.tajuk.includes('Fasa') ||
                          nota.tajuk.includes('Takrif') ||
                          nota.tajuk.includes('Sejarah')));

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="lg-inner-well">
                          <h4
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: 'var(--text-muted)',
                              margin: '0 0 6px',
                            }}
                          >
                            {isTeori ? 'Huraian Fakta' : 'Takrif & Huraian Kaedah'}
                          </h4>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.9rem',
                              lineHeight: 1.65,
                              color: 'var(--text-strong)',
                            }}
                          >
                            {nota.huraian}
                          </p>
                        </div>

                        <div className="lg-inner-well">
                          <h4
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: 'var(--text-muted)',
                              margin: '0 0 6px',
                            }}
                          >
                            {isTeori ? 'Info Penting' : 'Contoh Aplikasi'}
                          </h4>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.9rem',
                              lineHeight: 1.65,
                              color: 'var(--text-strong)',
                            }}
                          >
                            {nota.aplikasi}
                          </p>
                        </div>

                        <div className="lg-inner-well">
                          <h4
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: 'var(--text-muted)',
                              margin: '0 0 6px',
                            }}
                          >
                            {isTeori ? 'Catatan Tambahan' : 'Syarat & Pengecualian'}
                          </h4>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.9rem',
                              lineHeight: 1.65,
                              color: 'var(--text-strong)',
                            }}
                          >
                            {nota.syarat}
                          </p>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            gap: '10px',
                            paddingTop: '6px',
                          }}
                        >
                          {nota.urlShamela && (
                            <a
                              href={nota.urlShamela}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="lg-btn-primary"
                              style={{ textDecoration: 'none' }}
                            >
                              <LucideIcon name="external" size={14} />
                              <span>
                                Buka Halaman Kitab di Shamela.ws (Jil. {nota.jilid}, Hlm.{' '}
                                {nota.halaman})
                              </span>
                            </a>
                          )}
                          <a
                            href={`https://shamela.ws/search?q=${encodeURIComponent(
                              nota.teksArabCarian
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="lg-btn-glass"
                            style={{ textDecoration: 'none' }}
                          >
                            <LucideIcon name="search" size={14} />
                            <span>Cari Kaedah Tepat di Shamela.ws</span>
                          </a>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                marginTop: '16px',
                marginBottom: '48px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setFlashIndex((prev) =>
                    prev === 0 ? dataNotaLengkap.length - 1 : prev - 1
                  );
                  setIsFlipped(false);
                }}
                className="lg-btn-glass"
                style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
              >
                <LucideIcon name="arrow-left" size={15} />
                <span>Kad Sebelum</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFlashIndex((prev) => (prev + 1) % dataNotaLengkap.length);
                  setIsFlipped(false);
                }}
                className="lg-btn-primary"
                style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
              >
                <span>Kad Seterusnya</span>
                <LucideIcon name="arrow-right" size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
            BOOKMARK VIEW
           ==================================================================== */}
        {viewMode === 'NOTES' && (
          <div style={{ maxWidth: '760px', margin: '24px auto 0' }}>
            {bookmarks.length === 0 ? (
              <div
                className="lg-panel glass-card"
                style={{ textAlign: 'center', margin: 0 }}
              >
                <p
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: 'var(--text-body)',
                    margin: 0,
                  }}
                >
                  Klik ikon bintang pada kad direktori untuk menyimpan kaedah di sini.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {bookmarks.map((b) => (
                  <div
                    key={b.id}
                    className="glass-card"
                    style={{
                      borderRadius: 'var(--r-lg)',
                      padding: '20px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div
                        dir="rtl"
                        style={{
                          fontFamily: '"Noto Naskh Arabic", serif',
                          fontSize: '1.3rem',
                          fontWeight: 700,
                          lineHeight: 1.85,
                          color: 'var(--text-strong)',
                        }}
                      >
                        {b.kaedah_ranting_ar}
                      </div>
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          color: 'var(--text-body)',
                        }}
                      >
                        {b.kaedah_ranting_bm}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => bukaNotaUntukKad(b)}
                      className="lg-btn-nota"
                      title="Buka Nota Lengkap"
                    >
                      <span>Nota</span>
                      <LucideIcon name="arrow-right" size={14} className="lg-nota-arrow" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            AI TURATH RAG VIEW
           ==================================================================== */}
        {viewMode === 'AI_CHAT' && (
          <div
            className="lg-panel glass-card"
            style={{
              maxWidth: '840px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              height: '75vh',
              minHeight: '520px',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--card-divider)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="lg-brand-icon">
                  <LucideIcon name="sparkles" size={17} />
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      margin: 0,
                      color: 'var(--text-strong)',
                    }}
                  >
                    Penyelidik AI
                  </h2>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('EXPLORER')}
                  className="lg-btn-glass"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                  }}
                  title="Tutup Penyelidik AI"
                  aria-label="Tutup"
                >
                  <LucideIcon name="x" size={14} />
                  <span>Tutup</span>
                </button>
              </div>
            </div>

            {/* Jalur Maklumat Sumber */}
            <div className="lg-source-strip">
              <div className="lg-source-strip-icon">
                <LucideIcon name="book-open" size={16} />
              </div>
              <div className="lg-source-strip-content">
                <p className={`lg-source-strip-text ${isSourceStripExpanded ? 'is-expanded' : ''}`}>
                  Rujukan eksklusif kitab{' '}
                  <span
                    dir="rtl"
                    lang="ar"
                    className="lg-source-strip-ar"
                    style={{
                      unicodeBidi: 'isolate',
                      fontFamily: "'Amiri', 'Scheherazade New', 'Noto Naskh Arabic', serif",
                      fontSize: '1.05em',
                    }}
                  >
                    القواعد الفقهية وتطبيقاتها في المذاهب الأربعة
                  </span>{' '}
                  karya Dr. Muhammad Mustafa al-Zuhaili, dengan pautan terus ke teks asal di{' '}
                  <a
                    href="https://shamela.ws/book/21786"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lg-shamela-link"
                  >
                    Shamela
                    <LucideIcon name="external-link" size={12} />
                  </a>
                  .
                </p>
                <button
                  type="button"
                  onClick={() => setIsSourceStripExpanded(!isSourceStripExpanded)}
                  className="lg-source-strip-toggle"
                  aria-expanded={isSourceStripExpanded}
                >
                  <span>{isSourceStripExpanded ? 'Kurang' : 'Lagi'}</span>
                  <LucideIcon name={isSourceStripExpanded ? 'chevron-up' : 'chevron-down'} size={12} />
                </button>
              </div>
            </div>

            {/* Suggested Prompts */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                padding: '12px 0',
                borderBottom: '1px solid var(--card-divider)',
              }}
            >
              {[
                'Huraikan kaedah الأمور بمقاصدها dan syarat niat berserta halaman Shamela',
                'Apakah beza syarat niat wuduk antara Hanafi dan Syafie dalam kitab ini?',
                'Jelaskan kaedah اليقين لا يزول بالشك beserta contoh dan muka suratnya',
                'Bagaimana kaedah الضرر يزال diaplikasikan dalam empat mazhab?',
              ].map((contoh, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => hantarSoalanAI(contoh)}
                  className="lg-btn-glass"
                  style={{ whiteSpace: 'nowrap', fontSize: '0.73rem' }}
                >
                  <LucideIcon name="sparkles" size={12} />
                  <span>{contoh}</span>
                </button>
              ))}
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={msg.role === 'user' ? '' : 'lg-inner-well'}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    padding: '14px 18px',
                    borderRadius: 'var(--r-md)',
                    background:
                      msg.role === 'user' ? 'var(--tint-primary)' : undefined,
                    color: msg.role === 'user' ? '#ffffff' : 'var(--text-strong)',
                    fontSize: '0.88rem',
                    lineHeight: 1.65,
                  }}
                >
                  <div style={{ whiteSpace: msg.role === 'user' ? 'pre-wrap' : 'normal' }}>
                    {msg.role === 'ai' ? renderFormattedAiText(msg.text) : msg.text}
                  </div>

                  {msg.sumber && msg.sumber.length > 0 && (
                    <details
                      className="lg-details-sumber"
                      style={{
                        marginTop: '14px',
                        borderRadius: 'var(--r-md)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 18, 38, 0.5) 100%)',
                        overflow: 'hidden',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      <summary
                        style={{
                          cursor: 'pointer',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          userSelect: 'none',
                          listStyle: 'none',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                          <span
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'rgba(16, 185, 129, 0.2)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#34d399',
                              flexShrink: 0,
                            }}
                          >
                            <LucideIcon name="book-open" size={14} />
                          </span>
                          <span
                            style={{
                              fontWeight: 700,
                              color: '#ffffff',
                              fontSize: '0.84rem',
                              lineHeight: 1.4,
                            }}
                          >
                            Rujukan Kitab ({msg.sumber.length} Halaman Terpilih)
                          </span>
                        </div>

                        <span
                          className="lg-node-chip"
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#6ee7b7',
                            borderColor: 'rgba(16, 185, 129, 0.4)',
                            background: 'rgba(16, 185, 129, 0.18)',
                            padding: '4px 10px',
                            flexShrink: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span className="text-closed">Buka Rujukan</span>
                          <span className="text-open">Tutup</span>
                          <span className="lg-summary-arrow" style={{ fontSize: '0.65rem', transition: 'transform 0.25s ease', display: 'inline-block' }}>
                            ▼
                          </span>
                        </span>
                      </summary>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          padding: '0 12px 14px 12px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          marginTop: '6px',
                          paddingTop: '12px',
                        }}
                      >
                        {msg.sumber.map((s, sIdx) => (
                          <div
                            key={sIdx}
                            className="lg-inner-well"
                            style={{
                              padding: '12px 14px',
                              borderRadius: 'var(--r-md)',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '8px',
                                fontWeight: 700,
                                marginBottom: '8px',
                                color: 'var(--text-strong)',
                                fontSize: '0.82rem',
                              }}
                            >
                              <span>
                                📖 {s.kitab || s.tajuk || 'القواعد الفقهية وتطبيقاتها في المذاهب الأربعة'}
                              </span>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {s.urlShamela && (
                                  <a
                                    href={s.urlShamela}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="lg-btn-primary"
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '0.72rem',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    <LucideIcon name="external" size={12} />
                                    <span>
                                      Buka Muka Surat di Shamela.ws ({s.jilidHalaman || 'Kitab #21786'})
                                    </span>
                                  </a>
                                )}
                                {s.urlCarianShamela && (
                                  <a
                                    href={s.urlCarianShamela}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="lg-btn-glass"
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '0.70rem',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    <LucideIcon name="search" size={11} />
                                    <span>Cari Kaedah Tepat</span>
                                  </a>
                                )}
                              </div>
                            </div>
                            <div
                              dir="auto"
                              style={{
                                fontSize: '0.82rem',
                                lineHeight: 1.65,
                                color: 'var(--text-body, #cbd5e1)',
                                marginBottom: '4px',
                              }}
                            >
                              {(s.teks || s.huraian || s.tajuk || '').slice(0, 380)}
                              {(s.teks || s.huraian || s.tajuk || '').length > 380 ? '...' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}

              {isLoadingAI && (
                <div
                  className="lg-inner-well"
                  style={{ alignSelf: 'flex-start', fontSize: '0.84rem' }}
                >
                  <i>Sedang menyemak kitab القواعد الفقهية وتطبيقاتها في المذاهب الأربعة &amp; memetakan halaman Shamela.ws...</i>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                hantarSoalanAI();
              }}
              style={{
                display: 'flex',
                gap: '10px',
                paddingTop: '12px',
                borderTop: '1px solid var(--card-divider)',
              }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tanya soalan daripada kitab القواعد الفقهية وتطبيقاتها في المذاهب الأربعة..."
                className="lg-search-input"
                style={{ flex: 1, height: '42px', paddingLeft: '16px' }}
              />
              <button
                type="submit"
                disabled={isLoadingAI}
                className="lg-btn-primary"
                style={{ padding: '0 20px', height: '42px' }}
              >
                <span>{isLoadingAI ? '...' : 'Hantar'}</span>
                <LucideIcon name="send" size={14} />
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer Bersih dengan Pintu Masuk Rahsia Pentadbir */}
      <footer
        style={{
          textAlign: 'center',
          padding: '24px 16px 48px',
          fontSize: '0.74rem',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          userSelect: 'none',
        }}
      >
        <span>Qawaid OS • Sistem Ulang Kaji Kaedah Fiqh</span>
        <span
          onClick={() => setShowPasswordModal(true)}
          title="Pentadbir"
          style={{
            cursor: 'pointer',
            opacity: 0.25,
            fontSize: '0.70rem',
            padding: '2px 6px',
            borderRadius: '4px',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.25')}
        >
          🔒
        </span>
      </footer>

      {/* ====================================================================
          CONTROL LAYER: SINGLE FLOATING "AI CHATBOX" GLASS BUTTON (Bottom-Right)
         ==================================================================== */}
      <button
        type="button"
        onClick={() =>
          setViewMode((prev) => (prev === 'AI_CHAT' ? 'EXPLORER' : 'AI_CHAT'))
        }
        className="lg-fab-ai glass-control glass-control--refract"
        aria-label="AI Chatbox"
        title={viewMode === 'AI_CHAT' ? 'Kembali ke Direktori' : 'Buka AI Chatbox'}
      >
        <span className="lg-fab-dot" />
        <LucideIcon name="sparkles" size={16} />
        <span>{viewMode === 'AI_CHAT' ? 'Kembali ke Direktori' : 'AI Chatbox'}</span>
      </button>

      {/* Modal Kata Laluan Admin (Kalis Sekatan Pelayar) */}
      <AdminPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => setIsAdmin(true)}
      />

      {/* ====================================================================
          FASA 3: MODAL UJI MINDA RAWAK (80 SOALAN AL-ZUHAILI)
         ==================================================================== */}
      <ModalUjiMindaRawak
        rawakSoalan={rawakSoalan}
        onClose={() => setRawakSoalan(null)}
        onSoalanLain={handleUjiMindaRawak}
      />

      {/* ====================================================================
          FASA 2: PORTAL ADMIN RAHSIA (MODAL)
         ==================================================================== */}
      {isAdmin && (
        <AdminDashboard
          kuizMingguan={kuizMingguan}
          onKemaskiniKuiz={(dataBaru) => {
            setKuizMingguan(dataBaru);
            try {
              localStorage.setItem('qawaid_kuiz_mingguan', JSON.stringify(dataBaru));
            } catch {}
          }}
          tetapanWeb={tetapanWeb}
          onKemaskiniTetapan={(dataBaru) => {
            setTetapanWeb(dataBaru);
          }}
          onClose={() => setIsAdmin(false)}
        />
      )}
    </div>
  );
}
