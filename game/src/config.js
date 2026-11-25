// Rush Hour Kitchen — shared constants: canvas size, timing and layout.
// One clear job: every number the rest of the game agrees on lives here.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

// A shift is three minutes of lunch rush; the clock you can feel.
export const SHIFT_SECONDS = 180;
export const START_LIVES = 3;
export const MAX_ORDERS = 4;

// Order pressure grows as the shift goes on: tickets arrive sooner and
// give you less time, so the rush reads in a glance.
export const ORDER_SPAWN_FIRST = 2.5;
export const ORDER_SPAWN_EARLY = 13;
export const ORDER_SPAWN_LATE = 7;
export const ORDER_TIME_EARLY = 55;
export const ORDER_TIME_LATE = 34;

// Points: a served dish is worth 100, plus a speed tip of up to 60.
export const SCORE_DISH = 100;
export const SCORE_TIP_MAX = 60;
export const COMBO_STEP = 10;

// Fixed step for the world update, so the game plays the same anywhere.
export const STEP = 1 / 60;

// Warm, readable kitchen palette: cream walls, wood counter, tomato red,
// leafy green and cheese yellow. Text is dark brown on cream, never thin.
export const COLORS = {
  cream: '#FFF6E3',
  wall: '#F7E8C8',
  wood: '#A9713F',
  woodDark: '#7C4F27',
  counter: '#B9824F',
  counterEdge: '#8A5A2B',
  red: '#E4572E',
  redDark: '#B23A17',
  green: '#4C956C',
  greenDark: '#2F6B4A',
  yellow: '#F2C14E',
  brown: '#5B3A1E',
  ink: '#2B2118',
  inkSoft: '#6B5A45',
  white: '#FFFFFF',
  plate: '#FDFDF8',
  plateEdge: '#D8CDB4',
  ticket: '#FFFDF6',
  ticketEdge: '#E3D5B8',
  danger: '#C0392B',
  gold: '#E9A820',
};

// Layout bands on the 1280x720 canvas, top to bottom: header, order board,
// counter, plating area, footer hints.
export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 24, y: 88, w: 1232, h: 128 },
  counter: { x: 24, y: 224, w: 1232, h: 168 },
  plate: { x: 24, y: 412, w: 1232, h: 220 },
  footer: { x: 0, y: 648, w: 1280, h: 72 },
};

// Eight ingredient bins across the counter, each 140 wide with a gap.
export const BIN_WIDTH = 140;
export const BIN_HEIGHT = 132;
export const BIN_GAP = 16;
export const BIN_Y = 252;

// The plating area: plate on the left, Serve and Trash buttons on the right.
export const PLATE = { x: 120, y: 470, w: 420, h: 140 };
export const SERVE_BUTTON = { x: 940, y: 470, w: 180, h: 64 };
export const TRASH_BUTTON = { x: 940, y: 548, w: 180, h: 48 };

// Clamp a number into [lo, hi]; used for timers, bars and combo counts.
export function clamp(value, lo, hi) {
  return value < lo ? lo : value > hi ? hi : value;
}

// A tiny seeded random, so the screenshot scenes are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
