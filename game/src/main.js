// Rush Hour Kitchen — the shell: canvas, loop, actions and shot mode.
// One clear job: wire the world, the input and the renderer together.
// The world steps in fixed slices; the renderer draws the current state.
// With ?shot=start|play|serve|end in the URL, the game stages that
// screenshot scene, draws one frozen frame and never steps.
import { CANVAS_WIDTH, CANVAS_HEIGHT, STEP } from './config.js';
import { createWorld, resetWorld, startShift, stepWorld, addIngredient, removeLastIngredient, clearPlate, servePlate, EVENT_SERVED, EVENT_WRONG, EVENT_EXPIRED, EVENT_NEW_ORDER, EVENT_OVER } from './world.js';
import { drawGame, setMutedLabel } from './render.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';
import { ensureAudio, toggleMute, soundPick, soundServe, soundWrong, soundNewOrder, soundTick, soundEnd } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const world = createWorld(Math.random);
let lastTickAt = -1;

// A read-only handle for play-testing from the console or a script:
// window.__kitchen.world is the live game state.
window.__kitchen = { world };

// The verbs the input layer calls; each one answers at once.
const actions = {
  start() {
    ensureAudio();
    startShift(world);
  },
  restart() {
    ensureAudio();
    startShift(world);
  },
  addIngredient(key) {
    ensureAudio();
    if (world.screen !== 'play') return;
    if (addIngredient(world, key)) soundPick();
    else soundWrong();
  },
  serve() {
    ensureAudio();
    if (world.screen !== 'play') return;
    const result = servePlate(world);
    if (result.event & EVENT_SERVED) soundServe(world.combo);
    else if (result.event & EVENT_WRONG) soundWrong();
  },
  removeLast() {
    if (world.screen !== 'play') return;
    if (removeLastIngredient(world)) soundPick();
  },
  clearPlate() {
    if (world.screen !== 'play') return;
    clearPlate(world);
  },
  toggleMute() {
    setMutedLabel(toggleMute());
  },
};

const input = attachInput(canvas, world, actions);
setMutedLabel(false);

// One frame: step the world in fixed slices, answer the events with
// sound, then draw. The loop runs on requestAnimationFrame.
let lastTime = 0;
let accumulator = 0;

function onEvents(events) {
  if (events & EVENT_NEW_ORDER) soundNewOrder();
  if (events & EVENT_EXPIRED) soundWrong();
  if (events & EVENT_OVER) soundEnd();
}

function frame(time) {
  const dt = Math.min(0.1, (time - lastTime) / 1000 || 0);
  lastTime = time;
  accumulator += dt;
  while (accumulator >= STEP) {
    const events = stepWorld(world, STEP);
    onEvents(events);
    accumulator -= STEP;
  }
  // A soft tick each second while any ticket is under ten seconds.
  const urgent = world.orders.some((order) => order.timeLeft <= 10);
  if (urgent && world.time - lastTickAt >= 1) {
    lastTickAt = world.time;
    soundTick();
  }
  drawGame(ctx, world, input.hover);
  requestAnimationFrame(frame);
}

// Shot mode: stage the named scene, draw one frozen frame, and tell
// the screenshot script the frame is ready. No loop, no stepping.
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
if (shotName) {
  const seed = Number(params.get('seed') || 1);
  stageShot(shotName, world, seed);
  drawGame(ctx, world, { x: -1, y: -1, bin: -1, serve: false, trash: false });
  document.title = `Rush Hour Kitchen — ${shotName}`;
  window.__shotReady = true;
} else {
  requestAnimationFrame((time) => {
    lastTime = time;
    requestAnimationFrame(frame);
  });
}
