// qawaid-explorer/src/SprintGame.jsx
// Game 1 dalam Hab Permainan Qawaid OS:
// "SPRINT 60 SAAT: TIME ATTACK QAWAID" — Berdasarkan القواعد الفقهية وتطبيقاتها في المذاهب الأربعة

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { dataKuiz50 } from './dataKuiz';
import KembaraQawaidGame from './KembaraQawaidGame';
import QawaidSwipeGame from './QawaidSwipeGame';
import ThreeArcadeSprint from './ThreeArcadeSprint';
import { createArcadeAudio } from './arcadeAudio';

export default function SprintGame() {
  // Active Game in Hub: 'SPRINT' (1st) | 'SWIPE' | 'KEMBARA'
  const [activeGame, setActiveGame] = useState(() => {
    if (typeof window !== 'undefined') {
      const g = new URLSearchParams(window.location.search).get('game');
      if (g) return g.toUpperCase();
    }
    return 'SPRINT';
  });
  // Game States: 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'RESULT'
  const [gameState, setGameState] = useState('LOBBY');
  // Modes: 'MIXED' | 'SPEED_MATAN' | 'CASE_SOLVER'
  const [sprintMode, setSprintMode] = useState('MIXED');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [countdownNum, setCountdownNum] = useState(3);
  const [timeLeftMs, setTimeLeftMs] = useState(60000);
  const [isFrozen, setIsFrozen] = useState(false);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('qawaid_sprint_highscore') || 0);
    } catch {
      return 0;
    }
  });
  const [isNewRecord, setIsNewRecord] = useState(false);

  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  // Deck of shuffled questions
  const [deck, setDeck] = useState([]);
  const [deckIndex, setDeckIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [hiddenOptionIds, setHiddenOptionIds] = useState([]);
  const [selectedOptId, setSelectedOptId] = useState(null);
  const [feedbackState, setFeedbackState] = useState(null); // 'CORRECT' | 'WRONG' | null
  const [cardAnimKey, setCardAnimKey] = useState(0);

  // Power-ups (1 each per sprint run)
  const [powerups, setPowerups] = useState({
    freeze: true,
    fifty: true,
    skip: true,
  });

  // Floating popups (+100, +2s Masa!, COMBO x3)
  const [popups, setPopups] = useState([]);
  // History of answered questions for post-game review
  const [history, setHistory] = useState([]);

  const sprint3DControlRef = useRef(null);
  const soundRef = useRef(null);
  if (!soundRef.current) {
    soundRef.current = createArcadeAudio();
  }

  const spawnPopup = useCallback((text, tone = 'cyan') => {
    const id = `${Date.now()}-${Math.random()}`;
    setPopups((prev) => [...prev.slice(-4), { id, text, tone }]);
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 950);
  }, []);

  // Build 4 options for current question
  const generateOptionsForItem = useCallback((targetItem) => {
    if (!targetItem) return [];
    const distractors = dataKuiz50
      .filter((d) => d.id !== targetItem.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    return [...distractors, targetItem].sort(() => 0.5 - Math.random());
  }, []);

  // Prepare & start countdown
  const startSprint = () => {
    const shuffled = [...dataKuiz50].sort(() => 0.5 - Math.random());
    setDeck(shuffled);
    setDeckIndex(0);
    setOptions(generateOptionsForItem(shuffled[0]));
    setHiddenOptionIds([]);
    setSelectedOptId(null);
    setFeedbackState(null);

    setScore(0);
    setIsNewRecord(false);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setHistory([]);
    setPowerups({ freeze: true, fifty: true, skip: true });
    setTimeLeftMs(60000);
    setIsFrozen(false);

    setCountdownNum(3);
    setGameState('COUNTDOWN');
    if (soundEnabled) soundRef.current?.playTick(440, 0.09);
  };

  // 3..2..1 Countdown Effect
  useEffect(() => {
    if (gameState !== 'COUNTDOWN') return;
    const timer = setTimeout(() => {
      if (countdownNum > 1) {
        setCountdownNum((c) => c - 1);
        if (soundEnabled) soundRef.current?.playTick(520, 0.09);
      } else {
        setGameState('PLAYING');
        if (soundEnabled) soundRef.current?.playTick(784, 0.16);
      }
    }, 750);
    return () => clearTimeout(timer);
  }, [gameState, countdownNum, soundEnabled]);

  // 60.0s High-Precision Sprint Timer
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    let lastTick = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTick;
      lastTick = now;

      if (!isFrozen) {
        setTimeLeftMs((prev) => {
          if (prev <= delta) {
            clearInterval(interval);
            return 0;
          }
          return prev - delta;
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [gameState, isFrozen]);

  // End sprint when timer hits 0
  useEffect(() => {
    if (gameState === 'PLAYING' && timeLeftMs <= 0) {
      setGameState('RESULT');
      if (soundEnabled) soundRef.current?.playFinish();
      if (score > highScore) {
        setHighScore(score);
        setIsNewRecord(true);
        try {
          localStorage.setItem('qawaid_sprint_highscore', String(score));
        } catch {
          // ignore storage errors
        }
      }
    }
  }, [timeLeftMs, gameState, score, highScore, soundEnabled]);

  const currentQuestion = deck[deckIndex % Math.max(deck.length, 1)] || dataKuiz50[0];

  const isGoldenOverdrive = streak > 0 && streak % 5 === 0;

  const eliminatedIndices = useMemo(() => {
    const res = [];
    options.forEach((o, i) => {
      if (hiddenOptionIds.includes(o.id)) res.push(i);
    });
    return res;
  }, [options, hiddenOptionIds]);

  const multiplier = useMemo(() => {
    if (isGoldenOverdrive) return 3;
    if (streak >= 8) return 4;
    if (streak >= 5) return 3;
    if (streak >= 3) return 2;
    return 1;
  }, [streak, isGoldenOverdrive]);

  // Advance to next question in deck
  const advanceQuestion = useCallback(
    (nextIdx) => {
      const actualIdx = nextIdx % deck.length;
      const nextItem = deck[actualIdx];
      setDeckIndex(nextIdx);
      setOptions(generateOptionsForItem(nextItem));
      setHiddenOptionIds([]);
      setSelectedOptId(null);
      setFeedbackState(null);
      setCardAnimKey((k) => k + 1);
    },
    [deck, generateOptionsForItem]
  );

  // Handle Answer Selection
  const handleSelectOption = useCallback(
    (opt) => {
      if (gameState !== 'PLAYING' || selectedOptId) return;
      setSelectedOptId(opt.id);

      const optIdx = options.findIndex((o) => o.id === opt.id);
      const isCorrect = opt.id === currentQuestion.id;

      if (soundEnabled) soundRef.current?.playBeamFire?.();
      soundRef.current?.vibrateTap?.();
      sprint3DControlRef.current?.fireBeamShot?.(optIdx >= 0 ? optIdx : 0, isCorrect);

      if (isCorrect) {
        const nextStreak = streak + 1;
        const baseMult =
          nextStreak >= 8 ? 4 : nextStreak >= 5 ? 3 : nextStreak >= 3 ? 2 : 1;
        const effectiveMult = isGoldenOverdrive ? Math.max(baseMult, 3) : baseMult;
        const speedBonus = Math.round((timeLeftMs / 60000) * 35);
        const gained = 100 * effectiveMult + speedBonus;

        setScore((s) => s + gained);
        setStreak(nextStreak);
        setMaxStreak((m) => Math.max(m, nextStreak));
        setCorrectCount((c) => c + 1);
        setFeedbackState('CORRECT');

        soundRef.current?.vibrateSuccess?.();
        if (soundEnabled) {
          if (isGoldenOverdrive || nextStreak % 5 === 0) {
            soundRef.current?.playGoldenOverdrive?.();
          } else {
            soundRef.current?.playCorrect(nextStreak);
          }
        }
        spawnPopup(`+${gained} (${effectiveMult}x)`, isGoldenOverdrive ? 'gold' : 'emerald');

        // 5x Streak Golden Overdrive ("Soalan Cabang") rewards +2.0s & 3x!
        if (isGoldenOverdrive) {
          setTimeLeftMs((t) => Math.min(60000, t + 2000));
          spawnPopup('👑 OVERDRIVE 3x! +2.0s Masa!', 'gold');
        } else if (nextStreak % 5 === 0) {
          setTimeLeftMs((t) => Math.min(60000, t + 2000));
          spawnPopup('⚡ 5x STREAK! SOALAN CABANG +2.0s!', 'gold');
        } else if (nextStreak % 3 === 0) {
          setTimeLeftMs((t) => Math.min(60000, t + 2000));
          spawnPopup('🔥 COMBO! +2.0s Masa!', 'gold');
        }

        setHistory((prev) => [
          ...prev,
          {
            question: currentQuestion,
            picked: opt,
            isCorrect: true,
          },
        ]);

        setTimeout(() => {
          advanceQuestion(deckIndex + 1);
        }, 320);
      } else {
        setStreak(0);
        setWrongCount((w) => w + 1);
        setFeedbackState('WRONG');
        setTimeLeftMs((t) => Math.max(0, t - 1000));

        soundRef.current?.vibrateError?.();
        if (soundEnabled) soundRef.current?.playWrong();
        spawnPopup('Kurang Tepat (-1.0s)', 'crimson');

        setHistory((prev) => [
          ...prev,
          {
            question: currentQuestion,
            picked: opt,
            isCorrect: false,
          },
        ]);

        setTimeout(() => {
          advanceQuestion(deckIndex + 1);
        }, 620);
      }
    },
    [
      gameState,
      selectedOptId,
      options,
      currentQuestion,
      streak,
      isGoldenOverdrive,
      timeLeftMs,
      soundEnabled,
      spawnPopup,
      advanceQuestion,
      deckIndex,
    ]
  );

  const handleSelectPillar = useCallback(
    (pillarIdx) => {
      const opt = options[pillarIdx];
      if (!opt || hiddenOptionIds.includes(opt.id)) return;
      handleSelectOption(opt);
    },
    [options, hiddenOptionIds, handleSelectOption]
  );

  // Power-Up 1: Freeze Timer for 4s + add 3s (turns 3D tunnel icy cyan)
  const triggerFreeze = () => {
    if (gameState !== 'PLAYING' || !powerups.freeze) return;
    setPowerups((p) => ({ ...p, freeze: false }));
    setIsFrozen(true);
    setTimeLeftMs((t) => Math.min(60000, t + 3000));
    soundRef.current?.vibrateTap?.();
    if (soundEnabled) soundRef.current?.playPowerFreeze?.();
    spawnPopup('🧊 Masa Dibeku +3.0s!', 'cyan');
    setTimeout(() => {
      setIsFrozen(false);
    }, 3500);
  };

  // Power-Up 2: 50:50 Eliminate 2 Wrong Options with 3D cyan lightning bolts
  const triggerFifty = () => {
    if (gameState !== 'PLAYING' || !powerups.fifty || hiddenOptionIds.length > 0) return;
    const wrongPairs = options
      .map((o, idx) => ({ o, idx }))
      .filter(({ o }) => o.id !== currentQuestion.id)
      .slice(0, 2);
    const toHide = wrongPairs.map(({ o }) => o.id);
    const wrongIndices = wrongPairs.map(({ idx }) => idx);

    sprint3DControlRef.current?.fireFiftyBolts?.(wrongIndices);
    setHiddenOptionIds(toHide);
    setPowerups((p) => ({ ...p, fifty: false }));
    soundRef.current?.vibrateTap?.();
    if (soundEnabled) soundRef.current?.playPowerLightning?.();
    spawnPopup('⚡ Kilat 50:50 Diaktifkan!', 'gold');
  };

  // Power-Up 3: Skip Question Without Losing Streak
  const triggerSkip = () => {
    if (gameState !== 'PLAYING' || !powerups.skip || selectedOptId) return;
    setPowerups((p) => ({ ...p, skip: false }));
    if (soundEnabled) soundRef.current?.playPowerup();
    spawnPopup('⏭️ Soalan Dilangkau (Streak Kekal)', 'cyan');
    advanceQuestion(deckIndex + 1);
  };

  // Keyboard shortcuts (1, 2, 3, 4) for fast desktop play
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const onKeyDown = (e) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        const opt = options[idx];
        if (opt && !hiddenOptionIds.includes(opt.id)) {
          handleSelectOption(opt);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, options, hiddenOptionIds, handleSelectOption]);

  // Determine prompt text based on selected Sprint Mode
  const promptData = useMemo(() => {
    if (!currentQuestion) return { badge: '', prompt: '', hideOptionBm: false };

    // Bina cabaran lengkapkan lafaz kaedah Arab (sembunyikan bahagian hujung kaedah)
    const wordsAr = (currentQuestion.kaedah_ranting_ar || '').trim().split(/\s+/);
    const cutCount = Math.max(1, Math.floor(wordsAr.length / 2));
    const maskedAr =
      wordsAr.length >= 3
        ? `« ${wordsAr.slice(0, wordsAr.length - cutCount).join(' ')}  [ ...... ] »`
        : `« [ ...... ] »`;

    if (sprintMode === 'SPEED_MATAN') {
      const jenisCabaran = deckIndex % 3;
      if (jenisCabaran === 1 && wordsAr.length >= 3) {
        return {
          badge: 'KILAT KAEDAH • LENGKAPKAN LAFAZ KAEDAH ARAB',
          prompt: `${maskedAr}\n(${currentQuestion.huraian_jawapan})`,
          subHint: `${currentQuestion.kategori} • ${currentQuestion.jilid_halaman}`,
          hideOptionBm: true,
        };
      }
      if (jenisCabaran === 2) {
        return {
          badge: 'KILAT KAEDAH • PRINSIP HUKUM KE KAEDAH ARAB',
          prompt: currentQuestion.huraian_jawapan,
          subHint: `${currentQuestion.kategori} • ${currentQuestion.jilid_halaman}`,
          hideOptionBm: true,
        };
      }
      return {
        badge: 'KILAT KAEDAH • PILIH LAFAZ KAEDAH ARAB YANG TEPAT',
        prompt: `“${currentQuestion.kaedah_ranting_bm}”`,
        subHint: currentQuestion.kategori,
        hideOptionBm: true,
      };
    }

    if (sprintMode === 'CASE_SOLVER') {
      return {
        badge: 'HAKIM PANTAS • ANALISIS KES & TATBIQAT',
        prompt: currentQuestion.isu_kontemporari,
        subHint: `${currentQuestion.kategori} • ${currentQuestion.jilid_halaman}`,
        hideOptionBm: false,
      };
    }

    // MIXED mode: selang-seli antara Kilat Kaedah (tanpa terjemahan bocor) dan Analisis Kes
    const useShort = deckIndex % 2 === 0;
    return useShort
      ? {
          badge: 'KILAT KAEDAH • PILIH LAFAZ KAEDAH ARAB YANG TEPAT',
          prompt: `“${currentQuestion.kaedah_ranting_bm}”`,
          subHint: currentQuestion.kategori,
          hideOptionBm: true,
        }
      : {
          badge: 'ANALISIS KES • PILIH KAEDAH FIQH YANG TEPAT',
          prompt: currentQuestion.isu_kontemporari,
          subHint: `${currentQuestion.kategori} • ${currentQuestion.jilid_halaman}`,
          hideOptionBm: false,
        };
  }, [currentQuestion, sprintMode, deckIndex]);

  const secondsFormatted = (timeLeftMs / 1000).toFixed(1);
  const timePercent = Math.max(0, Math.min(100, (timeLeftMs / 60000) * 100));
  const isUrgent = timeLeftMs <= 10000 && !isFrozen;

  // Rank calculation for Results
  const totalAnswered = correctCount + wrongCount;
  const accuracy =
    totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  const rankInfo = useMemo(() => {
    if (score >= 2800) {
      return {
        grade: 'S+',
        title: 'Mujtahid Mutlaq (Legenda Qawaid)',
        desc: 'Kepantasan dan ketepatan luar biasa! Penguasaan kaedah dan tatbiqat empat mazhab yang sangat mantap.',
        color: '#fbbf24',
      };
    }
    if (score >= 1800) {
      return {
        grade: 'A',
        title: 'Faqih Tangkas (Mahir)',
        desc: 'Sangat cemerlang! Anda mampu mengaitkan kes semasa dengan kaedah fiqh secara pantas.',
        color: '#34d399',
      };
    }
    if (score >= 900) {
      return {
        grade: 'B',
        title: 'Thalib Tekun (Pertengahan)',
        desc: 'Prestasi yang baik! Teruskan latihan untuk mengekalkan Streak 3x dan 4x.',
        color: '#38bdf8',
      };
    }
    return {
      grade: 'C',
      title: 'Perlu Latihan Lagi',
      desc: 'Jangan putus asa! Semak semula jawapan di bawah dan cuba pecahkan rekod anda.',
      color: '#a78bfa',
    };
  }, [score]);

  return (
    <div className="sprint-hub-wrap">
      {/* ====================================================================
          ARCADE HUB BAR (Pilih Permainan dalam Hab Qawaid OS)
         ==================================================================== */}
      <div className="sprint-arcade-bar glass-control">
        <div className="sprint-arcade-tabs">
          {/* TAB 1 (Paling Kiri): SPRINT 60 SAAT */}
          <button
            type="button"
            onClick={() => setActiveGame('SPRINT')}
            className={`sprint-arcade-tab ${
              activeGame === 'SPRINT' ? 'is-active' : 'is-inactive'
            }`}
          >
            {activeGame === 'SPRINT' && <span className="sprint-live-dot" />}
            <span className="sprint-tab-desktop">⚡ Sprint 60 Saat (Time Attack)</span>
            <span className="sprint-tab-mobile">⚡ Sprint 60s</span>
          </button>

          {/* TAB 2: QAWAID SWIPE (GAYA TINDER / RAPID-FIRE) */}
          <button
            type="button"
            onClick={() => setActiveGame('SWIPE')}
            className={`sprint-arcade-tab ${
              activeGame === 'SWIPE' ? 'is-active' : 'is-inactive'
            }`}
          >
            {activeGame === 'SWIPE' && <span className="sprint-live-dot" />}
            <span className="sprint-tab-desktop">🔥 Qawaid Swipe (Leret Kad)</span>
            <span className="sprint-tab-mobile">🔥 Swipe Kad</span>
          </button>

          {/* TAB 3: KEMBARA QAWAID */}
          <button
            type="button"
            onClick={() => setActiveGame('KEMBARA')}
            className={`sprint-arcade-tab ${
              activeGame === 'KEMBARA' ? 'is-active' : 'is-inactive'
            }`}
          >
            {activeGame === 'KEMBARA' && <span className="sprint-live-dot" />}
            <span className="sprint-tab-desktop">🗺️ Kembara Qawaid</span>
            <span className="sprint-tab-mobile">🗺️ Kembara</span>
          </button>
        </div>

        {activeGame === 'SPRINT' && (
          <div className="sprint-arcade-meta">
            <span className="lg-node-chip sprint-high-score-chip">
              🏆 REKOD TERTINGGI: {highScore.toLocaleString()} MATA
            </span>
            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className="lg-btn-glass sprint-sound-btn"
              title={soundEnabled ? 'Matikan Bunyi' : 'Hidupkan Bunyi'}
            >
              <span>{soundEnabled ? '🔊 Bunyi: Aktif' : '🔇 Bunyi: Senyap'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ====================================================================
          GAME 2: QAWAID SWIPE (FIQH SWIPE — GAYA TINDER / RAPID-FIRE)
         ==================================================================== */}
      {activeGame === 'SWIPE' && (
        <QawaidSwipeGame onBackToHub={() => setActiveGame('SPRINT')} />
      )}

      {/* ====================================================================
          GAME 3: KEMBARA QAWAID ("PENYELESAI MASALAH" — RPG OPEN-WORLD 2D)
         ==================================================================== */}
      {activeGame === 'KEMBARA' && <KembaraQawaidGame />}

      {/* ====================================================================
          GAME 1: SPRINT 60 SAAT — STATE 1: LOBBY SCREEN
         ==================================================================== */}
      {activeGame === 'SPRINT' && gameState === 'LOBBY' && (
        <div className="sprint-lobby glass-card">
          <div className="sprint-lobby-badge">
            <span>⚡ CABARAN KEPAKARAN 60 SAAT</span>
          </div>

          <h2 className="sprint-lobby-title">
            Sprint 60 Saat: Qawaid Time Attack
          </h2>
          <p className="sprint-lobby-desc">
            Uji ketangkasan anda memadankan <strong>59 Kaedah Fiqhiyyah</strong> dan
            aplikasi empat mazhab daripada kitab{' '}
            <span
              dir="rtl"
              lang="ar"
              style={{
                unicodeBidi: 'isolate',
                fontFamily: "'Amiri', 'Scheherazade New', 'Noto Naskh Arabic', serif",
                fontSize: '1.08em',
                fontStyle: 'normal',
                color: 'rgba(255, 255, 255, 0.95)',
              }}
            >
              القواعد الفقهية وتطبيقاتها في المذاهب الأربعة
            </span>{' '}
            sebelum masa tamat! Bina <strong>Combo Streak</strong> untuk gandakan mata sehingga{' '}
            <strong>4x</strong> dan raih <strong>+2.0 saat masa tambahan</strong>.
          </p>

          {/* 3 Pilihan Mod Permainan */}
          <div className="sprint-mode-grid">
            <button
              type="button"
              onClick={() => setSprintMode('MIXED')}
              className={`sprint-mode-card ${
                sprintMode === 'MIXED' ? 'is-selected' : ''
              }`}
            >
              <div className="sprint-mode-icon">🔥</div>
              <div className="sprint-mode-name">Mod Campuran (Disyorkan)</div>
              <div className="sprint-mode-sub">
                Gabungan pengecaman kaedah pantas &amp; analisis senario kes semasa.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSprintMode('SPEED_MATAN')}
              className={`sprint-mode-card ${
                sprintMode === 'SPEED_MATAN' ? 'is-selected' : ''
              }`}
            >
              <div className="sprint-mode-icon">⚡</div>
              <div className="sprint-mode-name">Mod Kilat Kaedah</div>
              <div className="sprint-mode-sub">
                Fokus 100% kepantasan mengecam &amp; melengkapkan lafaz kaedah Arab tanpa bantuan terjemahan pada pilihan.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSprintMode('CASE_SOLVER')}
              className={`sprint-mode-card ${
                sprintMode === 'CASE_SOLVER' ? 'is-selected' : ''
              }`}
            >
              <div className="sprint-mode-icon">⚖️</div>
              <div className="sprint-mode-name">Mod Hakim Pantas</div>
              <div className="sprint-mode-sub">
                Selesaikan kes-kes muamalat, ibadah &amp; tatbiqat 4 mazhab.
              </div>
            </button>
          </div>

          {/* Peraturan Ringkas & Power-ups */}
          <div className="sprint-rules-strip">
            <div className="sprint-rule-pill">
              <span>👑</span>
              <span>Setiap 5 Streak = <strong>Overdrive Emas 3x &amp; +2.0s</strong></span>
            </div>
            <div className="sprint-rule-pill">
              <span>🧊</span>
              <span>3 Kuasa 3D: <strong>Beku Ais, Kilat 50:50 &amp; Langkau</strong></span>
            </div>
            <div className="sprint-rule-pill sprint-rule-keyboard">
              <span>⌨️</span>
              <span>Ketik Pilar 3D, Butang, atau Kekunci <strong>[1]–[4]</strong></span>
            </div>
          </div>

          <button
            type="button"
            onClick={startSprint}
            className="sprint-start-btn lg-btn-primary"
          >
            <span>🚀 MULA SPRINT 60 SAAT SEKARANG</span>
          </button>
        </div>
      )}

      {/* ====================================================================
          STATE 2: 3.. 2.. 1.. COUNTDOWN OVERLAY (dengan Previu Terowong 3D)
         ==================================================================== */}
      {activeGame === 'SPRINT' && gameState === 'COUNTDOWN' && (
        <div
          className="sprint-countdown-panel glass-card"
          style={{ position: 'relative', overflow: 'hidden', minHeight: '280px' }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.55,
              pointerEvents: 'none',
            }}
          >
            <ThreeArcadeSprint isPaused />
          </div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <p className="sprint-countdown-label">BERSEDIA UNTUK PECUTAN ILMU...</p>
            <div key={countdownNum} className="sprint-countdown-num">
              {countdownNum}
            </div>
            <p className="sprint-countdown-hint">
              Ketik terus Pilar Kristal 3D, butang 1–4, atau kekunci papan kekunci
            </p>
          </div>
        </div>
      )}

      {/* ====================================================================
          STATE 3: ACTIVE SPRINT ARENA (60s Gameplay)
         ==================================================================== */}
      {activeGame === 'SPRINT' && gameState === 'PLAYING' && (
        <div
          className={`sprint-arena glass-card ${
            streak >= 5 ? 'is-frenzy' : ''
          } ${isFrozen ? 'is-frozen' : ''} ${
            feedbackState === 'WRONG' ? 'is-shake' : ''
          }`}
        >
          {/* Floating Score & Bonus Popups */}
          <div className="sprint-popup-layer" aria-live="polite">
            {popups.map((p) => (
              <div key={p.id} className={`sprint-float-popup tone-${p.tone}`}>
                {p.text}
              </div>
            ))}
          </div>

          {/* Top HUD: Circular Timer + Score + Combo Streak */}
          <div className="sprint-hud">
            {/* Timer Gauge */}
            <div
              className={`sprint-timer-box ${isUrgent ? 'is-urgent' : ''} ${
                isFrozen ? 'is-frozen' : ''
              }`}
            >
              <svg className="sprint-timer-svg" viewBox="0 0 48 48">
                <circle
                  className="sprint-timer-track"
                  cx="24"
                  cy="24"
                  r="20"
                />
                <circle
                  className="sprint-timer-ring"
                  cx="24"
                  cy="24"
                  r="20"
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (125.6 * timePercent) / 100}
                />
              </svg>
              <div className="sprint-timer-text">
                <span className="sprint-sec">{secondsFormatted}s</span>
                <span className="sprint-sec-label">
                  {isFrozen ? '🧊 BEKU' : 'MASA'}
                </span>
              </div>
            </div>

            {/* Center Streak Meter */}
            <div className={`sprint-streak-pill mult-${multiplier}`}>
              <span className="sprint-streak-fire">
                {streak >= 5 ? '🔥🔥' : streak >= 3 ? '🔥' : '⚡'}
              </span>
              <span>STREAK: {streak}</span>
              <span className="sprint-mult-badge">{multiplier}x MATA</span>
            </div>

            {/* Live Score */}
            <div className="sprint-score-box">
              <span className="sprint-score-label">SKOR SEMASA</span>
              <span className="sprint-score-val">{score.toLocaleString()}</span>
            </div>
          </div>

          {/* Horizontal Liquid Time Progress Bar */}
          <div className="sprint-progress-track">
            <div
              className={`sprint-progress-fill ${isUrgent ? 'is-urgent' : ''} ${
                isFrozen ? 'is-frozen' : ''
              }`}
              style={{ width: `${timePercent}%` }}
            />
          </div>

          {/* Power-Ups Bar */}
          <div className="sprint-powerups-bar">
            <button
              type="button"
              disabled={!powerups.freeze}
              onClick={triggerFreeze}
              className={`sprint-power-btn ${!powerups.freeze ? 'is-used' : ''}`}
            >
              <span>🧊 Beku Masa (+3s)</span>
            </button>
            <button
              type="button"
              disabled={!powerups.fifty}
              onClick={triggerFifty}
              className={`sprint-power-btn ${!powerups.fifty ? 'is-used' : ''}`}
            >
              <span>⚡ Tapis 50:50</span>
            </button>
            <button
              type="button"
              disabled={!powerups.skip}
              onClick={triggerSkip}
              className={`sprint-power-btn ${!powerups.skip ? 'is-used' : ''}`}
            >
              <span>⏭️ Langkau Soalan</span>
            </button>
          </div>

          {/* 3D WebGL Warp Tunnel & Aimable Mizan Reactor Stage */}
          <div
            className="sprint-3d-stage"
            style={{
              position: 'relative',
              width: '100%',
              height: 'clamp(195px, 31vh, 270px)',
              borderRadius: '18px',
              overflow: 'hidden',
              marginBottom: '14px',
              border: isGoldenOverdrive
                ? '1.5px solid rgba(251, 191, 36, 0.72)'
                : isFrozen
                ? '1.5px solid rgba(56, 189, 248, 0.65)'
                : '1px solid rgba(16, 185, 129, 0.35)',
              boxShadow: isGoldenOverdrive
                ? '0 0 26px rgba(245, 158, 11, 0.25)'
                : '0 8px 24px rgba(0, 0, 0, 0.38)',
            }}
          >
            <ThreeArcadeSprint
              engineControlRef={sprint3DControlRef}
              isFrozen={isFrozen}
              streak={streak}
              isGoldenOverdrive={isGoldenOverdrive}
              eliminatedIndices={eliminatedIndices}
              questionKey={cardAnimKey}
              onSelectPillar={handleSelectPillar}
            />
            {isGoldenOverdrive && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: 'rgba(120, 53, 15, 0.88)',
                  border: '1px solid #fbbf24',
                  color: '#fef08a',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                👑 SOALAN CABANG OVERDRIVE • 3x SKOR &amp; +2.0s
              </div>
            )}
          </div>

          {/* Animated Question Card */}
          <div
            key={cardAnimKey}
            className="sprint-question-box sprint-slide-in"
            style={
              isGoldenOverdrive
                ? {
                    borderColor: 'rgba(251, 191, 36, 0.6)',
                    background: 'linear-gradient(135deg, rgba(66, 32, 6, 0.55), rgba(15, 23, 42, 0.75))',
                  }
                : undefined
            }
          >
            <div className="sprint-q-meta">
              <span className="sprint-q-badge">
                {isGoldenOverdrive ? `👑 SOALAN CABANG (${promptData.badge})` : promptData.badge}
              </span>
              <span className="sprint-q-sub" dir="auto">
                {promptData.subHint}
              </span>
            </div>
            <p className="sprint-q-text">{promptData.prompt}</p>
          </div>

          {/* 4 Animated Answer Options */}
          <div className="sprint-options-grid">
            {options.map((opt, idx) => {
              const isHidden = hiddenOptionIds.includes(opt.id);
              const isSelected = selectedOptId === opt.id;
              const isRight = opt.id === currentQuestion.id;

              let stateClass = '';
              if (selectedOptId) {
                if (isRight) stateClass = 'is-correct';
                else if (isSelected) stateClass = 'is-wrong';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isHidden || Boolean(selectedOptId)}
                  onClick={() => handleSelectOption(opt)}
                  className={`sprint-opt-btn ${stateClass} ${
                    isHidden ? 'is-eliminated' : ''
                  }`}
                >
                  <div className="sprint-opt-top">
                    <span className="sprint-keycap">{idx + 1}</span>
                    {(!promptData.hideOptionBm || Boolean(selectedOptId)) ? (
                      <span className="sprint-opt-bm">{opt.kaedah_ranting_bm}</span>
                    ) : (
                      <span
                        className="sprint-opt-bm"
                        style={{ opacity: 0.55, fontSize: '0.78rem', fontWeight: 500 }}
                      >
                        Pilihan Kaedah #{idx + 1}
                      </span>
                    )}
                  </div>
                  <div dir="rtl" className="sprint-opt-ar">
                    {opt.kaedah_ranting_ar}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          STATE 4: SPRINT RESULTS & REVIEW SCREEN
         ==================================================================== */}
      {activeGame === 'SPRINT' && gameState === 'RESULT' && (
        <div className="sprint-result glass-card sprint-slide-in">
          {isNewRecord && (
            <div className="sprint-new-record-banner">
              🏆 REKOD TERTINGGI BAHARU DICIPTA!
            </div>
          )}

          <div className="sprint-rank-header">
            <div
              className="sprint-grade-circle"
              style={{ borderColor: rankInfo.color, color: rankInfo.color }}
            >
              {rankInfo.grade}
            </div>
            <div>
              <span className="sprint-result-eyebrow">KEPUTUSAN SPRINT 60 SAAT</span>
              <h2 className="sprint-rank-title">{rankInfo.title}</h2>
              <p className="sprint-rank-desc">{rankInfo.desc}</p>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="sprint-stats-grid">
            <div className="sprint-stat-box">
              <span className="sprint-stat-label">SKOR AKHIR</span>
              <span className="sprint-stat-num">{score.toLocaleString()}</span>
            </div>
            <div className="sprint-stat-box">
              <span className="sprint-stat-label">JAWAPAN BETUL</span>
              <span className="sprint-stat-num">
                {correctCount} / {totalAnswered}
              </span>
            </div>
            <div className="sprint-stat-box">
              <span className="sprint-stat-label">KETEPATAN</span>
              <span className="sprint-stat-num">{accuracy}%</span>
            </div>
            <div className="sprint-stat-box">
              <span className="sprint-stat-label">STREAK MAKSIMUM</span>
              <span className="sprint-stat-num">🔥 {maxStreak}x</span>
            </div>
          </div>

          <div className="sprint-result-actions">
            <button
              type="button"
              onClick={startSprint}
              className="lg-btn-primary sprint-replay-btn"
            >
              <span>⚡ Main Semula (Pecahkan Rekod!)</span>
            </button>
            <button
              type="button"
              onClick={() => setGameState('LOBBY')}
              className="lg-btn-glass"
              style={{ padding: '12px 20px' }}
            >
              <span>Tukar Mod Permainan</span>
            </button>
          </div>

          {/* Semakan Soalan yang Dijawab dalam Pusingan Ini */}
          {history.length > 0 && (
            <div className="sprint-review-section">
              <h3 className="sprint-review-title">
                Semakan Pantas Pusingan Ini ({history.length} Soalan Dijawab)
              </h3>
              <div className="sprint-review-list">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    className={`sprint-review-item ${
                      item.isCorrect ? 'is-ok' : 'is-miss'
                    }`}
                  >
                    <div className="sprint-review-status">
                      {item.isCorrect ? '✅ Betul' : '❌ Tersilap'} •{' '}
                      {item.question.jilid_halaman}
                    </div>
                    <p className="sprint-review-q">
                      {item.question.isu_kontemporari}
                    </p>
                    <div dir="rtl" className="sprint-review-ar">
                      {item.question.kaedah_ranting_ar}
                    </div>
                    <div className="sprint-review-bm">
                      “{item.question.kaedah_ranting_bm}”
                    </div>
                    {!item.isCorrect && item.question.huraian_jawapan && (
                      <div className="sprint-review-exp">
                        <strong>Huraian Kitab:</strong>{' '}
                        {item.question.huraian_jawapan}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
