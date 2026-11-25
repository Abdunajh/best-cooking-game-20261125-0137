// Rush Hour Kitchen — the world: state, orders, serving and scoring.
// One clear job: the rules of the lunch rush, with no drawing in it.
// The world steps in fixed slices; the renderer only reads `state`.
import {
  SHIFT_SECONDS,
  START_LIVES,
  MAX_ORDERS,
  ORDER_SPAWN_FIRST,
  ORDER_SPAWN_EARLY,
  ORDER_SPAWN_LATE,
  ORDER_TIME_EARLY,
  ORDER_TIME_LATE,
  SCORE_DISH,
  SCORE_TIP_MAX,
  COMBO_STEP,
  clamp,
} from './config.js';
import { pickRecipe, plateMatchesRecipe } from './recipes.js';

// Event flags returned by step(), so the shell knows what just happened.
export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_WRONG = 2;
export const EVENT_EXPIRED = 4;
export const EVENT_NEW_ORDER = 8;
export const EVENT_OVER = 16;

let nextOrderId = 1;

// A fresh world: empty plate, three lives, a full shift ahead.
export function createWorld(random) {
  return {
    random: random || Math.random,
    screen: 'title',
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    score: 0,
    lives: START_LIVES,
    combo: 0,
    bestCombo: 0,
    served: 0,
    expiredCount: 0,
    wrongCount: 0,
    plate: [],
    orders: [],
    spawnIn: ORDER_SPAWN_FIRST,
    flash: null,
    flashUntil: 0,
    lastServedTip: 0,
    lastServedName: '',
  };
}

// Reset the world in place for a new shift, keeping the same random source.
export function resetWorld(world) {
  const fresh = createWorld(world.random);
  for (const key of Object.keys(fresh)) world[key] = fresh[key];
}

// How far through the shift we are, 0 at the open and 1 at the close.
export function shiftProgress(world) {
  return clamp(1 - world.shiftLeft / SHIFT_SECONDS, 0, 1);
}

// The gap before the next ticket, shrinking as the rush builds.
function spawnGap(world) {
  const p = shiftProgress(world);
  return ORDER_SPAWN_EARLY + (ORDER_SPAWN_LATE - ORDER_SPAWN_EARLY) * p;
}

// The time a fresh ticket gives you, shrinking as the rush builds.
function orderTime(world) {
  const p = shiftProgress(world);
  return ORDER_TIME_EARLY + (ORDER_TIME_LATE - ORDER_TIME_EARLY) * p;
}

// Drop a new ticket on the board: a recipe, a countdown, an id.
export function spawnOrder(world) {
  const recipe = pickRecipe(world.random, shiftProgress(world));
  const seconds = orderTime(world);
  world.orders.push({
    id: nextOrderId,
    recipe,
    timeLeft: seconds,
    timeTotal: seconds,
    warned: false,
  });
  nextOrderId += 1;
  return world.orders[world.orders.length - 1];
}

// Add one ingredient to the plate (at most seven — the deluxe burger).
// Returns true when it landed, false when the plate is already full.
export function addIngredient(world, key) {
  if (world.plate.length >= 7) return false;
  world.plate.push(key);
  return true;
}

// Take the last ingredient back off the plate; false when it is empty.
export function removeLastIngredient(world) {
  if (world.plate.length === 0) return false;
  world.plate.pop();
  return true;
}

// Tip the whole plate into the bin and start over.
export function clearPlate(world) {
  world.plate = [];
}

// Serve the plate. When it matches an open ticket, that ticket is served:
// points plus a speed tip, the combo climbs, the plate clears. When it
// matches nothing, it is a wrong dish: a life is lost and the combo dies.
// Returns an event flag and, for a serve, the ticket that was served.
export function servePlate(world) {
  if (world.plate.length === 0) return { event: EVENT_NONE, order: null };
  for (let i = 0; i < world.orders.length; i += 1) {
    const order = world.orders[i];
    if (!plateMatchesRecipe(world.plate, order.recipe)) continue;
    const tip = Math.round(SCORE_TIP_MAX * (order.timeLeft / order.timeTotal));
    const comboBonus = world.combo * COMBO_STEP;
    world.score += SCORE_DISH + tip + comboBonus;
    world.combo += 1;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    world.served += 1;
    world.lastServedTip = tip + comboBonus;
    world.lastServedName = order.recipe.name;
    world.orders.splice(i, 1);
    world.plate = [];
    world.flash = 'served';
    world.flashUntil = world.time + 1.2;
    return { event: EVENT_SERVED, order };
  }
  world.lives -= 1;
  world.wrongCount += 1;
  world.combo = 0;
  world.plate = [];
  world.flash = 'wrong';
  world.flashUntil = world.time + 1.2;
  if (world.lives <= 0) return { event: EVENT_WRONG | EVENT_OVER, order: null };
  return { event: EVENT_WRONG, order: null };
}

// Advance the world by `dt` seconds. Tickets tick down (one that hits
// zero expires and costs a life), new tickets arrive, the shift clock
// runs out. Returns the event flags for this step.
export function stepWorld(world, dt) {
  if (world.screen !== 'play') return EVENT_NONE;
  let events = EVENT_NONE;
  world.time += dt;
  world.shiftLeft -= dt;

  for (let i = world.orders.length - 1; i >= 0; i -= 1) {
    const order = world.orders[i];
    order.timeLeft -= dt;
    if (!order.warned && order.timeLeft <= 10) order.warned = true;
    if (order.timeLeft <= 0) {
      world.orders.splice(i, 1);
      world.lives -= 1;
      world.expiredCount += 1;
      world.combo = 0;
      world.flash = 'expired';
      world.flashUntil = world.time + 1.2;
      events |= EVENT_EXPIRED;
    }
  }

  if (world.shiftLeft > 0 && world.orders.length < MAX_ORDERS) {
    world.spawnIn -= dt;
    if (world.spawnIn <= 0) {
      spawnOrder(world);
      world.spawnIn = spawnGap(world);
      events |= EVENT_NEW_ORDER;
    }
  }

  if (world.lives <= 0 || world.shiftLeft <= 0) {
    world.shiftLeft = Math.max(0, world.shiftLeft);
    world.screen = 'over';
    events |= EVENT_OVER;
  }
  return events;
}

// Begin a fresh shift from the title screen: reset, deal the first
// ticket at once so the board is never empty, and start playing.
export function startShift(world) {
  resetWorld(world);
  world.screen = 'play';
  spawnOrder(world);
  world.spawnIn = spawnGap(world);
}

// The ticket whose recipe best matches the plate right now, for the
// "almost there" hint on the board; null when no ticket is close.
export function bestMatchingOrder(world) {
  let best = null;
  let bestRight = -1;
  for (let i = 0; i < world.orders.length; i += 1) {
    const order = world.orders[i];
    const wanted = {};
    for (let j = 0; j < order.recipe.needs.length; j += 1) {
      wanted[order.recipe.needs[j]] = (wanted[order.recipe.needs[j]] || 0) + 1;
    }
    let right = 0;
    for (let j = 0; j < world.plate.length; j += 1) {
      if (wanted[world.plate[j]]) {
        wanted[world.plate[j]] -= 1;
        right += 1;
      }
    }
    if (right > bestRight) {
      bestRight = right;
      best = order;
    }
  }
  return bestRight > 0 ? best : null;
}

// Is the plate exactly one open ticket, ready to serve?
export function plateReadyToServe(world) {
  for (let i = 0; i < world.orders.length; i += 1) {
    if (plateMatchesRecipe(world.plate, world.orders[i].recipe)) return true;
  }
  return false;
}
