// Rush Hour Kitchen — tiny WebAudio sound effects, no audio files.
// One clear job: short bleeps and chimes for picking, serving, errors
// and the end of the shift. Everything is synthesised at run time.
let context = null;
let muted = false;

// Lazily create the audio context on the first user gesture, so the
// browser's autoplay rules never block the game.
export function ensureAudio() {
  if (context === null) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  }
  if (context.state === 'suspended') context.resume();
  return context;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

// Play one short tone: a sine or triangle blip that slides from
// `fromHz` to `toHz` over `seconds`, at a modest volume.
function blip(fromHz, toHz, seconds, type, volume) {
  if (muted) return;
  const audio = ensureAudio();
  if (!audio) return;
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(fromHz, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), now + seconds);
  gain.gain.setValueAtTime(volume || 0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + seconds + 0.02);
}

// A bright pop when an ingredient lands on the plate.
export function soundPick() {
  blip(520, 760, 0.09, 'triangle', 0.12);
}

// A rising two-note chime when a dish is served: pitch climbs with the combo.
export function soundServe(combo) {
  const lift = Math.min(combo, 8) * 30;
  blip(520 + lift, 780 + lift, 0.12, 'sine', 0.14);
  setTimeout(() => blip(780 + lift, 1040 + lift, 0.14, 'sine', 0.12), 90);
}

// A low buzz for a wrong dish or a wasted ingredient.
export function soundWrong() {
  blip(220, 130, 0.22, 'sawtooth', 0.08);
}

// A soft tick when an order's timer drops under ten seconds.
export function soundTick() {
  blip(880, 880, 0.05, 'square', 0.05);
}

// A short ding when a new order ticket lands on the board.
export function soundNewOrder() {
  blip(660, 990, 0.1, 'triangle', 0.09);
}

// The end-of-shift fanfare: three rising notes, then a warm hold.
export function soundEnd() {
  blip(523, 523, 0.15, 'sine', 0.14);
  setTimeout(() => blip(659, 659, 0.15, 'sine', 0.14), 150);
  setTimeout(() => blip(784, 784, 0.3, 'sine', 0.14), 300);
}
