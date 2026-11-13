// qawaid-explorer/src/arcadeAudio.js
// Procedural Web Audio API + Mobile Haptics Synthesizer for 3D Arcade Games
// Zero external MP3/WAV dependencies; respects soundEnabled toggle cleanly.

export function createArcadeAudio() {
  let ctx = null;
  let noiseBuffer = null;

  const getCtx = () => {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  };

  const getNoiseBuffer = (audio) => {
    if (noiseBuffer && noiseBuffer.sampleRate === audio.sampleRate) return noiseBuffer;
    const len = Math.floor(audio.sampleRate * 0.35);
    const buf = audio.createBuffer(1, len, audio.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBuffer = buf;
    return buf;
  };

  const vibrate = (pattern) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore unsupported vibration environments
      }
    }
  };

  return {
    vibrateTap() {
      vibrate(14);
    },
    vibrateSuccess() {
      vibrate([22, 32, 22]);
    },
    vibrateError() {
      vibrate([45, 30, 45]);
    },
    playTick(freq = 520, duration = 0.08) {
      const audio = getCtx();
      if (!audio) return;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audio.currentTime);
      gain.gain.setValueAtTime(0.08, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + duration);
    },
    playBeamFire() {
      const audio = getCtx();
      if (!audio) return;
      const now = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(760, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.14);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    },
    playCorrect(streak = 1) {
      const audio = getCtx();
      if (!audio) return;
      const now = audio.currentTime;
      const baseFreq = Math.min(523.25 + streak * 42, 1100);
      [baseFreq, baseFreq * 1.25, baseFreq * 1.5].forEach((f, idx) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'triangle';
        const start = now + idx * 0.042;
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.095, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.19);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(start);
        osc.stop(start + 0.19);
      });

      // Short crystalline shatter noise burst
      const noise = audio.createBufferSource();
      noise.buffer = getNoiseBuffer(audio);
      const filter = audio.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2600;
      const nGain = audio.createGain();
      nGain.gain.setValueAtTime(0.06, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(audio.destination);
      noise.start(now);
      noise.stop(now + 0.14);
    },
    playWrong() {
      const audio = getCtx();
      if (!audio) return;
      const now = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(115, now + 0.24);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    },
    playPowerFreeze() {
      const audio = getCtx();
      if (!audio) return;
      const now = audio.currentTime;
      [880, 1046.5, 1318.5, 1567.98].forEach((f, idx) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'sine';
        const start = now + idx * 0.045;
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.075, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(start);
        osc.stop(start + 0.24);
      });
    },
    playPowerLightning() {
      const audio = getCtx();
      if (!audio) return;
      const now = audio.currentTime;
      const noise = audio.createBufferSource();
      noise.buffer = getNoiseBuffer(audio);
      const bandpass = audio.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1800, now);
      bandpass.frequency.exponentialRampToValueAtTime(420, now + 0.22);
      const gain = audio.createGain();
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(audio.destination);
      noise.start(now);
      noise.stop(now + 0.22);
    },
    playPowerup() {
      const audio = getCtx();
      if (!audio) return;
      [440, 554.37, 659.25, 880].forEach((f, idx) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'sine';
        const start = audio.currentTime + idx * 0.04;
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(start);
        osc.stop(start + 0.14);
      });
    },
    playGoldenOverdrive() {
      const audio = getCtx();
      if (!audio) return;
      const now = audio.currentTime;
      [587.33, 739.99, 880, 1174.66, 1479.98].forEach((f, idx) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'triangle';
        const start = now + idx * 0.045;
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.09, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(start);
        osc.stop(start + 0.24);
      });
    },
    playSwipe() {
      const audio = getCtx();
      if (!audio) return;
      const now = audio.currentTime;
      const noise = audio.createBufferSource();
      noise.buffer = getNoiseBuffer(audio);
      const filter = audio.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(320, now + 0.10);
      const gain = audio.createGain();
      gain.gain.setValueAtTime(0.075, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audio.destination);
      noise.start(now);
      noise.stop(now + 0.10);
    },
    playFinish() {
      const audio = getCtx();
      if (!audio) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'triangle';
        const start = audio.currentTime + idx * 0.08;
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.11, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(start);
        osc.stop(start + 0.28);
      });
    },
  };
}
