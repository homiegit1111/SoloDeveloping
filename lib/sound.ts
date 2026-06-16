// ============================================================
// SYSTEM SOUND DESIGN — fully synthesized via Web Audio API.
// No audio files. Respects the user's mute setting.
//   sysOpen        digital chime
//   questComplete  sharp satisfying crack
//   rankUp         deep resonant tone + high harmonic
//   punishment     low ominous drone
//   shatter        glassy break
// Pure UI layer — does not read/write app state or storage.
// ============================================================

let _ctx: AudioContext | null = null;
let _enabled = true;

export function setSoundEnabled(on: boolean) {
  _enabled = on;
}

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_enabled) return null;
  try {
    if (!_ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      _ctx = new AC();
    }
    if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
    return _ctx;
  } catch {
    return null;
  }
}

type ToneOpts = {
  freq: number;
  type?: OscillatorType;
  dur: number;
  gain?: number;
  attack?: number;
  glideTo?: number;
  delay?: number;
};

function tone(c: AudioContext, o: ToneOpts) {
  const t0 = c.currentTime + (o.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, t0 + o.dur);
  const peak = o.gain ?? 0.18;
  const atk = o.attack ?? 0.008;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.05);
}

function noiseBurst(c: AudioContext, dur: number, gain = 0.25, hp = 1200, delay = 0) {
  const t0 = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = "highpass";
  filt.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt).connect(g).connect(c.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

export function sysOpen() {
  const c = ctx();
  if (!c) return;
  tone(c, { freq: 880, type: "triangle", dur: 0.12, gain: 0.12 });
  tone(c, { freq: 1320, type: "sine", dur: 0.16, gain: 0.08, delay: 0.05 });
}

export function questComplete() {
  const c = ctx();
  if (!c) return;
  noiseBurst(c, 0.09, 0.22, 2200);
  tone(c, { freq: 1200, type: "square", dur: 0.07, gain: 0.07 });
  tone(c, { freq: 1760, type: "sine", dur: 0.18, gain: 0.11, delay: 0.04 });
}

export function shatter() {
  const c = ctx();
  if (!c) return;
  noiseBurst(c, 0.18, 0.26, 1600);
  noiseBurst(c, 0.12, 0.16, 3400, 0.03);
  tone(c, { freq: 2200, type: "triangle", dur: 0.1, gain: 0.06, glideTo: 600 });
}

export function rankUp() {
  const c = ctx();
  if (!c) return;
  // deep resonant body
  tone(c, { freq: 110, type: "sine", dur: 1.6, gain: 0.22, glideTo: 165 });
  tone(c, { freq: 55, type: "sine", dur: 1.8, gain: 0.18 });
  // high harmonic shimmer
  tone(c, { freq: 880, type: "triangle", dur: 1.2, gain: 0.08, delay: 0.18 });
  tone(c, { freq: 1320, type: "sine", dur: 1.0, gain: 0.06, delay: 0.3 });
  // impact
  noiseBurst(c, 0.3, 0.2, 400, 0.0);
}

export function punishment() {
  const c = ctx();
  if (!c) return;
  tone(c, { freq: 70, type: "sawtooth", dur: 1.8, gain: 0.16 });
  tone(c, { freq: 104, type: "sine", dur: 1.6, gain: 0.12, glideTo: 80 });
  noiseBurst(c, 0.6, 0.08, 200);
}
