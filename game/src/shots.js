// Rush Hour Kitchen — staged screenshot scenes behind ?shot=.
// One clear job: set the world to a fixed, readable frame for each
// screenshot name, using the real rules and the real renderer, so the
// shots are what a short game really looks like. The scenes are frozen:
// main.js renders one frame and does not step the world.
import { mulberry32 } from './config.js';
import { createWorld } from './world.js';
import { recipeById } from './recipes.js';

// Put one ticket on the board by hand: a recipe, a countdown, a total.
function stageOrder(world, recipeId, timeLeft, timeTotal, id) {
  const recipe = recipeById(recipeId);
  world.orders.push({ id, recipe, timeLeft, timeTotal, warned: timeLeft <= 10 });
}

// A world with a seeded random, already in play, for the scenes.
function stagedWorld(seed) {
  const world = createWorld(mulberry32(seed));
  world.screen = 'play';
  return world;
}

// The start scene: the title screen over a kitchen that already has
// two tickets on the board, so the cover shows the game behind the title.
function stageStart(world) {
  world.screen = 'title';
  stageOrder(world, 'burger', 48, 55, 1);
  stageOrder(world, 'salad', 38, 55, 2);
  return { screen: 'title' };
}

// The play scene: mid-rush. Three tickets, one nearly out of time, a
// burger half-built on the plate, the clock at two minutes, a combo going.
function stagePlay(world) {
  world.shiftLeft = 122;
  world.score = 240;
  world.combo = 2;
  world.bestCombo = 2;
  world.served = 2;
  world.plate = ['bun', 'patty', 'cheese'];
  stageOrder(world, 'burger', 42, 55, 1);
  stageOrder(world, 'salad', 26, 55, 2);
  stageOrder(world, 'pasta', 9, 45, 3);
  return { screen: 'play' };
}

// The serve scene: a complete burger on the plate, matching the first
// ticket, the Serve button lit green and READY TO SERVE on the board.
function stageServe(world) {
  world.shiftLeft = 96;
  world.score = 610;
  world.combo = 4;
  world.bestCombo = 4;
  world.served = 5;
  world.plate = ['bun', 'patty', 'cheese', 'lettuce', 'tomato'];
  stageOrder(world, 'burger', 31, 55, 1);
  stageOrder(world, 'salad', 18, 55, 2);
  stageOrder(world, 'pasta', 40, 45, 3);
  return { screen: 'play' };
}

// The end scene: the shift is over, the results board is up.
function stageEnd(world) {
  world.screen = 'over';
  world.shiftLeft = 0;
  world.score = 1240;
  world.combo = 0;
  world.bestCombo = 5;
  world.served = 9;
  world.expiredCount = 1;
  world.wrongCount = 0;
  world.lives = 2;
  stageOrder(world, 'burger', 12, 55, 7);
  return { screen: 'over' };
}

// Set `world` to the named scene (start, play, serve or end; anything
// else is start) and return the screen to draw. The seed only matters
// for the random source; the scenes themselves are fixed.
export function stageShot(name, world, seed) {
  const staged = stagedWorld(seed || 1);
  for (const key of Object.keys(staged)) world[key] = staged[key];
  if (name === 'play') return stagePlay(world);
  if (name === 'serve') return stageServe(world);
  if (name === 'end') return stageEnd(world);
  return stageStart(world);
}

// The four screenshot scenes, in the order shots.json lists them.
export const SHOT_NAMES = ['start', 'play', 'serve', 'end'];
