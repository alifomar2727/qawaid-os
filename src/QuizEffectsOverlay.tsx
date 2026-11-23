import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

export interface QuizEffectsHandle {
  burstFromRect: (rect: DOMRect | null | undefined, streak?: number) => void;
  fireDualCannons: (isHighScore?: boolean) => void;
}

interface ConfettiParticle {
  kind: 'paper' | 'sparkle';
  x: number;
  y: number;
  vx: number;
  vy: number;
  drag: number;
  gravity: number;
  size: number;
  aspect: number;
  color: string;
  backColor: string;
  angle: number;
  spin: number;
  flipPhase: number;
  flipSpeed: number;
  flutterAmp: number;
  flutterFreq: number;
  age: number;
  life: number;
}

interface RippleEntry {
  id: number;
  x: number;
  y: number;
  size: number;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Eased requestAnimationFrame score counter (default 700ms).
 */
export function useCountUp(target: number, active: boolean, durationMs = 700): number {
  const [value, setValue] = useState<number>(() => (active && prefersReducedMotion() ? target : 0));

  useEffect(() => {
    let rafId = 0;
    if (!active) {
      rafId = window.requestAnimationFrame(() => setValue(0));
      return () => window.cancelAnimationFrame(rafId);
    }
    if (prefersReducedMotion() || durationMs <= 0) {
      rafId = window.requestAnimationFrame(() => setValue(target));
      return () => window.cancelAnimationFrame(rafId);
    }

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [target, active, durationMs]);

  return value;
}

interface SmoothMorphContainerProps {
  morphKey: string | number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Smooth height morph container powered by ResizeObserver + crossfade slide on questionKey change.
 */
export const SmoothMorphContainer: React.FC<SmoothMorphContainerProps> = ({
  morphKey,
  children,
  className = '',
  style,
}) => {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number | undefined>(undefined);
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return undefined;

    const updateHeight = () => {
      const next = Math.ceil(el.scrollHeight || el.getBoundingClientRect().height);
      if (next > 0) {
        setMeasuredHeight(next);
      }
    };

    const initRaf = window.requestAnimationFrame(updateHeight);

    if (typeof ResizeObserver === 'undefined') {
      return () => window.cancelAnimationFrame(initRaf);
    }

    const observer = new ResizeObserver(() => {
      updateHeight();
    });
    observer.observe(el);

    return () => {
      window.cancelAnimationFrame(initRaf);
      observer.disconnect();
    };
  }, [morphKey]);

  return (
    <div
      className={`quiz-morph-outer ${className}`.trim()}
      style={{
        height: measuredHeight !== undefined && !reducedMotion ? `${measuredHeight}px` : 'auto',
        transition: reducedMotion ? 'none' : 'height 320ms cubic-bezier(0.22, 1, 0.36, 1)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div ref={innerRef} key={morphKey} className="quiz-morph-inner">
        {children}
      </div>
    </div>
  );
};

const PAPER_PALETTE: Array<{ front: string; back: string }> = [
  { front: '#10b981', back: '#047857' },
  { front: '#fbbf24', back: '#b45309' },
  { front: '#34d399', back: '#065f46' },
  { front: '#38bdf8', back: '#0369a1' },
  { front: '#fde047', back: '#ca8a04' },
  { front: '#f8fafc', back: '#94a3b8' },
];

const SPARKLE_COLORS = ['#fbbf24', '#34d399', '#ffffff', '#fde68a'];

/**
 * Full-viewport 60 FPS Canvas particle engine for physical 3D flipping confetti & sparkles.
 * Idle loop stops automatically when particles reach zero.
 */
export const QuizEffectsOverlay = forwardRef<QuizEffectsHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const timersRef = useRef<number[]>([]);

  const drawFourPointStar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    rotation: number,
    color: string,
    alpha: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = color;

    ctx.beginPath();
    const inner = radius * 0.24;
    for (let i = 0; i < 8; i += 1) {
      const r = i % 2 === 0 ? radius : inner;
      const a = (i * Math.PI) / 4;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const renderFrame = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      rafIdRef.current = null;
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      rafIdRef.current = null;
      return;
    }

    const dtMs = lastFrameRef.current ? Math.min(now - lastFrameRef.current, 45) : 16.67;
    lastFrameRef.current = now;
    const dtScale = dtMs / 16.67;
    const dtSec = dtMs / 1000;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const nextParticles: ConfettiParticle[] = [];
    const list = particlesRef.current;

    for (let i = 0; i < list.length; i += 1) {
      const p = list[i];
      p.age += dtSec;
      if (p.age >= p.life || p.y > height + 60) continue;

      const dragFactor = Math.pow(p.drag, dtScale);
      p.vx *= dragFactor;
      p.vy = p.vy * dragFactor + p.gravity * dtScale;

      const flutter =
        p.flutterAmp > 0 ? Math.sin(p.age * p.flutterFreq + p.flipPhase) * p.flutterAmp * dtSec : 0;
      p.x += p.vx * dtScale + flutter;
      p.y += p.vy * dtScale;
      p.angle += p.spin * dtScale;
      p.flipPhase += p.flipSpeed * dtScale;

      const fadeProgress = Math.max(0, (p.age - p.life * 0.65) / (p.life * 0.35));
      const alpha = Math.max(0, Math.min(1, 1 - fadeProgress));

      if (p.kind === 'paper') {
        const cosFlip = Math.cos(p.flipPhase);
        const scaleY = Math.abs(cosFlip);
        const isFront = cosFlip >= 0;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = isFront ? p.color : p.backColor;
        const w = p.size;
        const h = Math.max(1.4, p.size * p.aspect * (0.18 + 0.82 * scaleY));
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.restore();
      } else {
        const twinkle = 0.55 + 0.45 * Math.sin(p.age * 11 + p.flipPhase);
        drawFourPointStar(
          ctx,
          p.x,
          p.y,
          p.size * twinkle,
          p.angle,
          p.color,
          alpha * (0.65 + 0.35 * twinkle)
        );
      }

      nextParticles.push(p);
    }

    particlesRef.current = nextParticles;

    if (nextParticles.length > 0) {
      rafIdRef.current = window.requestAnimationFrame(renderFrame);
    } else {
      rafIdRef.current = null;
      lastFrameRef.current = 0;
      ctx.clearRect(0, 0, width, height);
    }
  }, []);

  const ensureLoopRunning = useCallback(() => {
    if (rafIdRef.current === null && particlesRef.current.length > 0) {
      lastFrameRef.current = 0;
      rafIdRef.current = window.requestAnimationFrame(renderFrame);
    }
  }, [renderFrame]);

  const spawnBurst = useCallback(
    (originX: number, originY: number, angleCenterRad: number, spreadRad: number, speedMin: number, speedMax: number, paperCount: number, sparkleCount: number) => {
      const reduced = prefersReducedMotion();
      const effectivePapers = reduced ? Math.min(paperCount, 6) : paperCount;
      const effectiveSparkles = reduced ? Math.min(sparkleCount, 4) : sparkleCount;

      for (let i = 0; i < effectivePapers; i += 1) {
        const angle = angleCenterRad + (Math.random() - 0.5) * spreadRad;
        const speed = speedMin + Math.random() * (speedMax - speedMin);
        const pal = PAPER_PALETTE[Math.floor(Math.random() * PAPER_PALETTE.length)];
        particlesRef.current.push({
          kind: 'paper',
          x: originX + (Math.random() - 0.5) * 18,
          y: originY + (Math.random() - 0.5) * 12,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          drag: 0.965 + Math.random() * 0.018,
          gravity: 0.24 + Math.random() * 0.08,
          size: 7 + Math.random() * 5.5,
          aspect: 0.48 + Math.random() * 0.35,
          color: pal.front,
          backColor: pal.back,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.16,
          flipPhase: Math.random() * Math.PI * 2,
          flipSpeed: 0.14 + Math.random() * 0.18,
          flutterAmp: 22 + Math.random() * 34,
          flutterFreq: 4 + Math.random() * 5,
          age: 0,
          life: 1.35 + Math.random() * 0.75,
        });
      }

      for (let i = 0; i < effectiveSparkles; i += 1) {
        const angle = angleCenterRad + (Math.random() - 0.5) * spreadRad * 1.15;
        const speed = speedMin * 0.62 + Math.random() * ((speedMax - speedMin) * 0.55);
        particlesRef.current.push({
          kind: 'sparkle',
          x: originX + (Math.random() - 0.5) * 24,
          y: originY + (Math.random() - 0.5) * 16,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          drag: 0.975,
          gravity: 0.09 + Math.random() * 0.05,
          size: 5 + Math.random() * 5,
          aspect: 1,
          color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
          backColor: '#ffffff',
          angle: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.09,
          flipPhase: Math.random() * Math.PI * 2,
          flipSpeed: 0.1,
          flutterAmp: 8,
          flutterFreq: 3,
          age: 0,
          life: 1.05 + Math.random() * 0.6,
        });
      }

      ensureLoopRunning();
    },
    [ensureLoopRunning]
  );

  useImperativeHandle(
    ref,
    () => ({
      burstFromRect(rect: DOMRect | null | undefined, streak = 1) {
        if (!rect || typeof window === 'undefined') return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const streakBonus = streak >= 3 ? Math.min(streak * 3, 18) : 0;
        spawnBurst(
          cx,
          cy,
          -Math.PI / 2,
          Math.PI * 0.92,
          4.5,
          11.2 + Math.min(streak, 5) * 0.6,
          24 + streakBonus,
          12 + (streak >= 3 ? 10 : 0)
        );
      },
      fireDualCannons(isHighScore = false) {
        if (typeof window === 'undefined') return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cannonY = h * 0.92;

        // Bottom-left & bottom-right high-velocity angled waves
        spawnBurst(18, cannonY, -Math.PI * 0.34, 0.56, 11.5, 19.5, 36, 16);
        spawnBurst(w - 18, cannonY, -Math.PI * 0.66, 0.56, 11.5, 19.5, 36, 16);

        if (isHighScore && !prefersReducedMotion()) {
          const timerId = window.setTimeout(() => {
            const w2 = window.innerWidth;
            const h2 = window.innerHeight;
            spawnBurst(24, h2 * 0.88, -Math.PI * 0.32, 0.62, 12.5, 20.5, 32, 18);
            spawnBurst(w2 - 24, h2 * 0.88, -Math.PI * 0.68, 0.62, 12.5, 20.5, 32, 18);
          }, 350);
          timersRef.current.push(timerId);
        }
      },
    }),
    [spawnBurst]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      timers.forEach((id) => window.clearTimeout(id));
      particlesRef.current = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 10010,
      }}
    />
  );
});

QuizEffectsOverlay.displayName = 'QuizEffectsOverlay';

interface TactileAnswerButtonProps {
  badgeLabel: string;
  isAnswered: boolean;
  isCorrect: boolean;
  isPicked: boolean;
  feedbackPulseKey: number;
  onSelect: (rect: DOMRect) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedCheckSvg: React.FC = () => (
  <svg
    className="quiz-svg-icon quiz-svg-check"
    viewBox="0 0 24 24"
    width="15"
    height="15"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path className="quiz-check-path" d="M5 13l4 4L19 7" />
  </svg>
);

export const AnimatedCrossSvg: React.FC = () => (
  <svg
    className="quiz-svg-icon quiz-svg-cross"
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.1"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path className="quiz-cross-line-1" d="M6 6l12 12" />
    <path className="quiz-cross-line-2" d="M18 6L6 18" />
  </svg>
);

/**
 * Tactile quiz option button featuring:
 * 1. Coordinate-aware pointer-down tap ripple + 0.97 press spring
 * 2. Drawn SVG Checkmark (260ms) / Cross (240ms sequential) + damped shake on wrong
 * 3. Concentric shockwave impact ring centered on button
 */
export const TactileAnswerButton: React.FC<TactileAnswerButtonProps> = ({
  badgeLabel,
  isAnswered,
  isCorrect,
  isPicked,
  feedbackPulseKey,
  onSelect,
  children,
  className = '',
  style,
}) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [ripples, setRipples] = useState<RippleEntry[]>([]);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isAnswered) return;
    setIsPressing(true);

    const btn = btnRef.current;
    if (!btn || prefersReducedMotion()) return;

    const rect = btn.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
    const size = Math.max(rect.width, rect.height, 140) * 0.9;
    const id = Date.now() + Math.random();

    setRipples((prev) => [...prev.slice(-3), { id, x, y, size }]);
    const cleanupTimer = window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 450);
    timersRef.current.push(cleanupTimer);
  };

  const releasePress = () => {
    setIsPressing(false);
  };

  const handleClick = () => {
    setIsPressing(false);
    if (isAnswered || !btnRef.current) return;
    onSelect(btnRef.current.getBoundingClientRect());
  };

  const showCorrect = isAnswered && isCorrect;
  const showWrongPicked = isAnswered && isPicked && !isCorrect;

  let borderCol: string | undefined;
  let bgCol: string | undefined;
  if (showCorrect) {
    borderCol = '#10b981';
    bgCol = 'rgba(16, 185, 129, 0.22)';
  } else if (showWrongPicked) {
    borderCol = '#ef4444';
    bgCol = 'rgba(239, 68, 68, 0.22)';
  }

  return (
    <button
      ref={btnRef}
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={releasePress}
      onPointerCancel={releasePress}
      onPointerLeave={releasePress}
      onClick={handleClick}
      className={`lg-inner-well quiz-tactile-btn ${isPressing ? 'is-pressing' : ''} ${
        showWrongPicked ? 'is-wrong-shake' : ''
      } ${showCorrect && isPicked ? 'is-correct-picked' : ''} ${className}`.trim()}
      style={{
        position: 'relative',
        overflow: 'visible',
        textAlign: 'left',
        cursor: isAnswered ? 'default' : 'pointer',
        borderColor: borderCol,
        background: bgCol,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        ...style,
      }}
    >
      {/* Clipped inner surface for coordinate tap ripples */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {ripples.map((r) => (
          <span
            key={r.id}
            className="quiz-tap-ripple"
            style={{
              left: `${r.x}px`,
              top: `${r.y}px`,
              width: `${r.size}px`,
              height: `${r.size}px`,
            }}
          />
        ))}
      </span>

      {/* Impact Shockwave Ring (only on picked button) */}
      {isPicked && isAnswered && !prefersReducedMotion() && (
        <span
          key={`ring-${feedbackPulseKey}`}
          aria-hidden="true"
          className={`quiz-shockwave-ring ${isCorrect ? 'is-correct' : 'is-wrong'}`}
        />
      )}

      {/* Animated SVG Check / Cross or Option Badge */}
      <span
        className={`quiz-opt-badge ${showCorrect && isPicked ? 'quiz-badge-pop' : ''}`}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: showCorrect
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : showWrongPicked
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : 'rgba(255, 255, 255, 0.11)',
          border: showCorrect
            ? '1px solid #fbbf24'
            : showWrongPicked
            ? '1px solid #fca5a5'
            : '1px solid rgba(255, 255, 255, 0.2)',
          color: showCorrect ? '#fef08a' : '#ffffff',
          fontWeight: 800,
          fontSize: '0.8rem',
          flexShrink: 0,
          boxShadow: showCorrect ? '0 0 14px rgba(16, 185, 129, 0.45)' : undefined,
        }}
      >
        {showCorrect ? <AnimatedCheckSvg /> : showWrongPicked ? <AnimatedCrossSvg /> : badgeLabel}
      </span>

      <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>{children}</div>
    </button>
  );
};

export interface QuizReviewEntry {
  soalan: string;
  soalan_ar?: string;
  userAnswer: string;
  correctAnswer: string;
  correctAnswerAr?: string;
  isCorrect: boolean;
  huraian?: string;
}

interface QuizResultsCelebrationProps {
  title: string;
  subtitle?: string;
  score: number;
  total: number;
  maxStreak?: number;
  bestScore: number;
  isNewRecord: boolean;
  reviewItems?: QuizReviewEntry[];
  onRetry: () => void;
  onBack: () => void;
}

/**
 * Staggered spring reveal Results Screen with 700ms eased count-up & review summary.
 */
export const QuizResultsCelebration: React.FC<QuizResultsCelebrationProps> = ({
  title,
  subtitle,
  score,
  total,
  maxStreak = 0,
  bestScore,
  isNewRecord,
  reviewItems = [],
  onRetry,
  onBack,
}) => {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const animatedScore = useCountUp(score, true, 700);
  const animatedPct = useCountUp(pct, true, 700);
  const animatedBest = useCountUp(bestScore, true, 700);
  const wrongCount = Math.max(0, total - score);

  let emblem = '🌟';
  let rankLabel = 'MUMTAZ • CEMERLANG!';
  let rankAccent = '#fbbf24';
  if (pct < 50) {
    emblem = '📘';
    rankLabel = 'TERUSKAN USAHA!';
    rankAccent = '#38bdf8';
  } else if (pct < 80) {
    emblem = '⚖️';
    rankLabel = 'JAYYID JIDDAN • BAGUS!';
    rankAccent = '#34d399';
  }

  return (
    <div className="lg-panel glass-card quiz-results-wrap" style={{ textAlign: 'center' }}>
      {isNewRecord && (
        <div
          className="quiz-stagger-item quiz-stagger-1"
          style={{
            display: 'inline-flex',
            padding: '6px 14px',
            borderRadius: '999px',
            background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.28), rgba(16, 185, 129, 0.28))',
            border: '1px solid #fbbf24',
            color: '#fef08a',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            marginBottom: '14px',
          }}
        >
          🏆 REKOD TERTINGGI BAHARU DICATAT!
        </div>
      )}

      <div
        className="quiz-rank-pop"
        style={{
          width: '84px',
          height: '84px',
          margin: '0 auto 14px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.4rem',
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.22), rgba(16, 185, 129, 0.14))',
          border: `2px solid ${rankAccent}`,
          boxShadow: `0 0 28px ${rankAccent}44, inset 0 1px 0 rgba(255, 255, 255, 0.35)`,
        }}
      >
        {emblem}
      </div>

      <div className="quiz-stagger-item quiz-stagger-1">
        <span
          style={{
            display: 'inline-block',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: rankAccent,
            marginBottom: '6px',
          }}
        >
          {rankLabel}
        </span>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.55rem', fontWeight: 800, color: '#ffffff' }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ margin: '0 0 18px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Eased Score & Stats Grid */}
      <div
        className="quiz-stagger-item quiz-stagger-2"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        <div className="lg-inner-well" style={{ padding: '14px 10px' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            MARKAH AKHIR
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#6ee7b7', marginTop: '2px' }}>
            {animatedScore} / {total}
          </div>
        </div>
        <div className="lg-inner-well" style={{ padding: '14px 10px' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            KETEPATAN
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#fef08a', marginTop: '2px' }}>
            {animatedPct}%
          </div>
        </div>
        <div className="lg-inner-well" style={{ padding: '14px 10px' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            STREAK TERBAIK
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#7dd3fc', marginTop: '2px' }}>
            🔥 {maxStreak}
          </div>
        </div>
        <div className="lg-inner-well" style={{ padding: '14px 10px' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            REKOD PERIBADI
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
            {animatedBest} / {total}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="quiz-stagger-item quiz-stagger-3"
        style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: reviewItems.length > 0 ? '20px' : '0' }}
      >
        <button
          type="button"
          onClick={onRetry}
          className="lg-btn-primary"
          style={{ padding: '12px 22px', fontSize: '0.9rem', fontWeight: 700 }}
        >
          <span>🔄 Ulang Kuiz Semula</span>
        </button>
        <button
          type="button"
          onClick={onBack}
          className="lg-btn-glass"
          style={{ padding: '12px 18px', fontSize: '0.88rem', fontWeight: 600 }}
        >
          <span>← Kembali ke Mod Kuiz</span>
        </button>
      </div>

      {/* Review List for Exam Revision */}
      {reviewItems.length > 0 && (
        <div className="quiz-stagger-item quiz-stagger-4" style={{ textAlign: 'left' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#cbd5e1',
            }}
          >
            <span>📋 SEMAKAN JAWAPAN ({score} Betul • {wrongCount} Salah)</span>
          </div>
          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {reviewItems.map((item, idx) => (
              <div
                key={idx}
                className="lg-inner-well"
                style={{
                  padding: '12px 14px',
                  borderColor: item.isCorrect ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.42)',
                  background: item.isCorrect ? 'rgba(6, 40, 30, 0.4)' : 'rgba(60, 14, 22, 0.4)',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: item.isCorrect ? '#6ee7b7' : '#fca5a5', marginBottom: '4px' }}>
                  {item.isCorrect ? `✓ Soalan #${idx + 1} (Tepat)` : `✕ Soalan #${idx + 1} (Perlu Semak)`}
                </div>
                {item.soalan_ar && (
                  <div
                    dir="rtl"
                    lang="ar"
                    style={{
                      fontFamily: "'Amiri', 'Scheherazade New', 'Noto Naskh Arabic', serif",
                      fontSize: '0.96rem',
                      color: '#fef08a',
                      textAlign: 'right',
                      marginBottom: '3px',
                    }}
                  >
                    {item.soalan_ar}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600, marginBottom: '5px' }}>
                  {item.soalan}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>
                  Jawapan Betul: <strong>{item.correctAnswer}</strong>
                  {item.correctAnswerAr ? ` (${item.correctAnswerAr})` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
