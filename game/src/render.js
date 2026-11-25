// Rush Hour Kitchen — everything the player sees, drawn on one canvas.
// One clear job: turn the world state into a warm, readable kitchen.
// No game logic lives here; it only reads `world` and the hover state.
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, LAYOUT, MAX_ORDERS, SCORE_DISH, BIN_WIDTH, BIN_HEIGHT, BIN_Y, PLATE, SERVE_BUTTON, TRASH_BUTTON, clamp } from './config.js';
import { INGREDIENTS, ingredientByKey, plateAgainstRecipe } from './recipes.js';
import { binRect } from './input.js';
import { plateReadyToServe, bestMatchingOrder, shiftProgress } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

// A rounded rectangle path, the kitchen's one shape language.
export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px "Trebuchet MS", "Segoe UI", Verdana, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function formatClock(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Draw one ingredient as a glyph inside a circle of radius `r`:
// a coloured disc, a simple shape for the food, and its letter chip.
export function drawIngredientGlyph(ctx, key, cx, cy, r) {
  const ingredient = ingredientByKey(key);
  if (!ingredient) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = ingredient.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = ingredient.dark;
  ctx.stroke();
  ctx.fillStyle = ingredient.dark;
  ctx.beginPath();
  if (key === 'bun') {
    ctx.arc(cx, cy + r * 0.15, r * 0.62, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - r * 0.62, cy + r * 0.1, r * 1.24, r * 0.22);
  } else if (key === 'patty') {
    roundRect(ctx, cx - r * 0.62, cy - r * 0.3, r * 1.24, r * 0.6, r * 0.25);
    ctx.fill();
  } else if (key === 'lettuce') {
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(cx + i * r * 0.42, cy, r * 0.34, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (key === 'tomato') {
    ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4C7A24';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.85);
    ctx.lineTo(cx + r * 0.28, cy - r * 0.35);
    ctx.lineTo(cx - r * 0.28, cy - r * 0.35);
    ctx.closePath();
    ctx.fill();
  } else if (key === 'cheese') {
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-r * 0.45, -r * 0.45, r * 0.9, r * 0.9);
    ctx.restore();
    ctx.save();
  } else if (key === 'bowl') {
    ctx.arc(cx, cy - r * 0.1, r * 0.62, 0, Math.PI);
    ctx.fill();
    ctx.fillRect(cx - r * 0.62, cy - r * 0.1, r * 1.24, r * 0.14);
  } else if (key === 'cucumber') {
    ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#D9EAD3';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (key === 'sauce') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.7);
    ctx.quadraticCurveTo(cx + r * 0.6, cy + r * 0.1, cx, cy + r * 0.55);
    ctx.quadraticCurveTo(cx - r * 0.6, cy + r * 0.1, cx, cy - r * 0.7);
    ctx.fill();
  }
  ctx.restore();
}

// A heart drawn with canvas paths, so lives never depend on a font
// having a heart glyph.
function drawHeart(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.7);
  ctx.bezierCurveTo(cx - size * 1.1, cy - size * 0.1, cx - size * 0.55, cy - size * 0.9, cx, cy - size * 0.25);
  ctx.bezierCurveTo(cx + size * 0.55, cy - size * 0.9, cx + size * 1.1, cy - size * 0.1, cx, cy + size * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// The header: title on the left, the shift clock in the middle, score,
// lives and combo on the right.
function drawHeader(ctx, world) {
  const h = LAYOUT.header;
  ctx.fillStyle = COLORS.woodDark;
  ctx.fillRect(h.x, h.y, h.w, h.h);
  text(ctx, 'RUSH HOUR KITCHEN', 28, 34, 30, COLORS.cream, 800);
  text(ctx, 'lunch rush', 392, 36, 15, '#E8C98F', 600);

  const clock = formatClock(world.shiftLeft);
  const progress = shiftProgress(world);
  const clockColor = world.shiftLeft <= 30 ? '#FFD166' : COLORS.cream;
  text(ctx, 'SHIFT', 560, 22, 13, '#E8C98F', 700, 'center');
  text(ctx, clock, 560, 46, 26, clockColor, 800, 'center');
  ctx.fillStyle = '#5B3A1E';
  roundRect(ctx, 500, 58, 120, 5, 2);
  ctx.fill();
  ctx.fillStyle = clockColor;
  roundRect(ctx, 500, 58, 120 * (1 - progress), 5, 2);
  ctx.fill();

  text(ctx, 'SCORE', 700, 22, 13, '#E8C98F', 700, 'center');
  text(ctx, String(world.score), 700, 46, 26, COLORS.cream, 800, 'center');

  for (let i = 0; i < 3; i += 1) {
    const color = i < world.lives ? (world.lives === 1 ? '#FF6B5B' : '#FF8A7A') : '#6B4A2F';
    drawHeart(ctx, 800 + i * 34, 34, 13, color);
  }

  if (world.combo >= 2) {
    text(ctx, `COMBO x${world.combo}`, 980, 34, 22, COLORS.gold, 800, 'center');
  }
  text(ctx, isMutedLabel(), 1180, 34, 13, '#E8C98F', 600, 'center');
}

let mutedState = false;
export function setMutedLabel(muted) {
  mutedState = muted;
}
function isMutedLabel() {
  return mutedState ? 'M: muted' : 'M: sound on';
}

// One order ticket: recipe name, ingredient chips, countdown bar.
function drawTicket(ctx, order, x, y, w, h, highlighted) {
  const urgent = order.timeLeft <= 10;
  ctx.fillStyle = COLORS.ticket;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.lineWidth = highlighted ? 4 : 2;
  ctx.strokeStyle = urgent ? COLORS.danger : highlighted ? COLORS.gold : COLORS.ticketEdge;
  ctx.stroke();

  text(ctx, `#${order.id} ${order.recipe.name}`, x + 14, y + 22, 19, COLORS.ink, 800);
  text(ctx, order.recipe.blurb, x + 14, y + 44, 12, COLORS.inkSoft, 600);

  const chipR = 13;
  let chipX = x + 14 + chipR;
  const chipY = y + 72;
  for (let i = 0; i < order.recipe.needs.length; i += 1) {
    const ingredient = ingredientByKey(order.recipe.needs[i]);
    ctx.beginPath();
    ctx.arc(chipX, chipY, chipR, 0, Math.PI * 2);
    ctx.fillStyle = ingredient.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = ingredient.dark;
    ctx.stroke();
    text(ctx, ingredient.chip, chipX, chipY + 1, 13, '#FFFFFF', 800, 'center');
    chipX += chipR * 2 + 6;
  }

  const barW = w - 28;
  const frac = clamp(order.timeLeft / order.timeTotal, 0, 1);
  ctx.fillStyle = '#EADFC6';
  roundRect(ctx, x + 14, y + h - 26, barW, 12, 6);
  ctx.fill();
  ctx.fillStyle = urgent ? COLORS.danger : frac > 0.5 ? COLORS.green : COLORS.gold;
  if (frac > 0) {
    roundRect(ctx, x + 14, y + h - 26, barW * frac, 12, 6);
    ctx.fill();
  }
  text(ctx, `${Math.ceil(order.timeLeft)}s`, x + w - 14, y + h - 20, 13, urgent ? COLORS.danger : COLORS.ink, 800, 'right');
}

// The order board: tickets in a row, or a friendly "no orders yet" note.
function drawBoard(ctx, world) {
  const b = LAYOUT.board;
  text(ctx, 'ORDER BOARD', b.x + 2, b.y - 12, 15, COLORS.inkSoft, 800);
  if (world.orders.length === 0) {
    ctx.fillStyle = COLORS.ticket;
    roundRect(ctx, b.x, b.y, b.w, b.h, 14);
    ctx.fill();
    ctx.strokeStyle = COLORS.ticketEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'No orders yet — the lunch rush is about to begin…', b.x + b.w / 2, b.y + b.h / 2, 20, COLORS.inkSoft, 600, 'center');
    return;
  }
  const gap = 16;
  const w = (b.w - gap * (MAX_ORDERS - 1)) / MAX_ORDERS;
  const best = highlightedOrder(world);
  for (let i = 0; i < world.orders.length; i += 1) {
    const order = world.orders[i];
    drawTicket(ctx, order, b.x + i * (w + gap), b.y, w, b.h, best === order);
  }
}

// The ticket the plate is closest to matching, for the gold outline.
function highlightedOrder(world) {
  if (world.plate.length === 0) return null;
  return bestMatchingOrder(world);
}

// The counter: a wooden worktop with eight ingredient bins. Each bin
// shows its glyph, its name and its hotkey; the hovered bin lifts.
function drawCounter(ctx, world, hover) {
  const c = LAYOUT.counter;
  ctx.fillStyle = COLORS.counter;
  roundRect(ctx, c.x, c.y, c.w, c.h, 16);
  ctx.fill();
  ctx.fillStyle = COLORS.counterEdge;
  ctx.fillRect(c.x, c.y + c.h - 10, c.w, 10);
  text(ctx, 'COUNTER — click an ingredient, or press 1–8', c.x + 14, c.y + 20, 15, '#FFF3DC', 800);

  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    const ingredient = INGREDIENTS[i];
    const rect = binRect(i);
    const isHover = hover && hover.bin === i;
    const lift = isHover ? -6 : 0;
    ctx.fillStyle = isHover ? '#FFFDF6' : '#F7E8C8';
    roundRect(ctx, rect.x, rect.y + lift, rect.w, rect.h, 14);
    ctx.fill();
    ctx.lineWidth = isHover ? 4 : 2;
    ctx.strokeStyle = isHover ? COLORS.gold : '#D8C49A';
    ctx.stroke();
    drawIngredientGlyph(ctx, ingredient.key, rect.x + rect.w / 2, rect.y + 44 + lift, 30);
    text(ctx, ingredient.name, rect.x + rect.w / 2, rect.y + 92 + lift, 16, COLORS.ink, 800, 'center');
    ctx.fillStyle = COLORS.inkSoft;
    roundRect(ctx, rect.x + rect.w / 2 - 13, rect.y + 104 + lift, 26, 20, 6);
    ctx.fill();
    text(ctx, ingredient.hotkey, rect.x + rect.w / 2, rect.y + 115 + lift, 13, '#FFFFFF', 800, 'center');
  }
}

// The plate, with the dish stacked on it layer by layer, and the
// Serve / Trash buttons beside it. A plate that matches a ticket
// glows gold and says READY.
function drawPlateArea(ctx, world, hover) {
  const p = LAYOUT.plate;
  // Top-right, clear of the plate stack even when a seven-layer deluxe
  // burger stacks up to the top of the plate area.
  text(ctx, 'YOUR PLATE — build the dish, then serve it', p.x + p.w - 2, p.y + 16, 15, COLORS.inkSoft, 800, 'right');

  ctx.fillStyle = '#EFE3C4';
  roundRect(ctx, p.x, p.y, p.w, p.h, 16);
  ctx.fill();

  const plateCx = PLATE.x + PLATE.w / 2;
  const plateCy = PLATE.y + PLATE.h - 34;
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath();
  ctx.ellipse(plateCx, plateCy, 190, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.plateEdge;
  ctx.stroke();
  ctx.fillStyle = '#EDE6D2';
  ctx.beginPath();
  ctx.ellipse(plateCx, plateCy, 150, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // The dish, stacked bottom-up: each ingredient is a coloured layer
  // with its name on it, so the assembly reads at a glance.
  const layerH = 24;
  const layerW = 300;
  let layerY = plateCy - 18;
  for (let i = 0; i < world.plate.length; i += 1) {
    const ingredient = ingredientByKey(world.plate[i]);
    layerY -= layerH;
    ctx.fillStyle = ingredient.color;
    roundRect(ctx, plateCx - layerW / 2, layerY, layerW, layerH + 4, 10);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = ingredient.dark;
    ctx.stroke();
    text(ctx, ingredient.name, plateCx, layerY + layerH / 2 + 2, 14, '#FFFFFF', 800, 'center');
  }
  if (world.plate.length === 0) {
    text(ctx, 'Empty plate — pick ingredients from the counter', plateCx, plateCy - 44, 15, COLORS.inkSoft, 600, 'center');
  }

  const ready = plateReadyToServe(world);
  const best = world.plate.length > 0 ? bestMatchingOrder(world) : null;
  if (best && !ready) {
    const check = plateAgainstRecipe(world.plate, best.recipe);
    text(ctx, `Closest: ${best.recipe.name} — ${check.right} right, ${check.missing} to go`, 640, p.y + 40, 16, COLORS.inkSoft, 700, 'center');
  }
  if (ready) {
    text(ctx, 'READY TO SERVE!', 640, p.y + 40, 22, COLORS.greenDark, 800, 'center');
  }

  drawServeButton(ctx, world, hover);
  drawTrashButton(ctx, hover);

  // The last serve, as a floating note.
  if (world.flash === 'served' && world.time < world.flashUntil) {
    text(ctx, `Served ${world.lastServedName}! +${SCORE_DISH + world.lastServedTip}`, 640, p.y + 96, 20, COLORS.greenDark, 800, 'center');
  }
  if (world.flash === 'wrong' && world.time < world.flashUntil) {
    text(ctx, 'Wrong dish! That ticket does not match.', 640, p.y + 96, 20, COLORS.danger, 800, 'center');
  }
  if (world.flash === 'expired' && world.time < world.flashUntil) {
    text(ctx, 'An order expired! A customer walked out.', 640, p.y + 96, 20, COLORS.danger, 800, 'center');
  }
}

function drawServeButton(ctx, world, hover) {
  const b = SERVE_BUTTON;
  const ready = plateReadyToServe(world);
  const isHover = hover && hover.serve;
  ctx.fillStyle = ready ? COLORS.green : '#9A8B74';
  roundRect(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fill();
  ctx.lineWidth = isHover ? 4 : 2;
  ctx.strokeStyle = ready ? COLORS.greenDark : '#7A6B52';
  ctx.stroke();
  text(ctx, 'SERVE', b.x + b.w / 2, b.y + 26, 26, '#FFFFFF', 800, 'center');
  text(ctx, 'Space', b.x + b.w / 2, b.y + 50, 13, '#EAF5EC', 600, 'center');
}

function drawTrashButton(ctx, hover) {
  const b = TRASH_BUTTON;
  const isHover = hover && hover.trash;
  ctx.fillStyle = isHover ? '#E8D9BE' : '#F7E8C8';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.red;
  ctx.stroke();
  text(ctx, 'Clear plate  (Del)', b.x + b.w / 2, b.y + b.h / 2, 15, COLORS.redDark, 700, 'center');
}

// The footer: the controls, always visible so a new player is never lost.
function drawFooter(ctx) {
  const f = LAYOUT.footer;
  ctx.fillStyle = COLORS.woodDark;
  ctx.fillRect(f.x, f.y, f.w, f.h);
  text(ctx, '1–8 pick ingredient   •   Space serve   •   Backspace take back   •   Del clear plate   •   Right-click take back   •   M mute   •   R restart', 640, f.y + 36, 17, COLORS.cream, 600, 'center');
}

// The title screen: the kitchen behind, dimmed, with the name of the
// game, the menu and how to play.
function drawTitle(ctx, world) {
  drawKitchen(ctx, world, null);
  ctx.fillStyle = 'rgba(43, 33, 24, 0.55)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  text(ctx, 'RUSH HOUR', 640, 170, 84, COLORS.cream, 800, 'center');
  text(ctx, 'KITCHEN', 640, 250, 84, COLORS.gold, 800, 'center');
  text(ctx, 'The lunch rush is on. Read the tickets, build the dishes, serve before the timer runs out.', 640, 320, 20, '#FFF3DC', 600, 'center');
  text(ctx, 'On the menu: Burger · Garden Salad · Tomato Pasta — and the Deluxe Burger, late in the shift.', 640, 352, 18, '#FFF3DC', 600, 'center');

  ctx.fillStyle = COLORS.red;
  roundRect(ctx, 490, 400, 300, 64, 16);
  ctx.fill();
  text(ctx, 'START COOKING', 640, 432, 26, '#FFFFFF', 800, 'center');
  text(ctx, 'Click anywhere, or press Enter', 640, 486, 16, '#FFF3DC', 600, 'center');
  text(ctx, '3 lives · 3-minute shift · wrong dish or expired order costs a life', 640, 600, 16, '#FFF3DC', 600, 'center');
}

// The results screen: score, dishes served, best combo, and restart.
function drawOver(ctx, world) {
  drawKitchen(ctx, world, null);
  ctx.fillStyle = 'rgba(43, 33, 24, 0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const ranOut = world.lives <= 0;
  text(ctx, ranOut ? 'THE RUSH GOT YOU!' : 'SHIFT OVER!', 640, 150, 64, COLORS.cream, 800, 'center');
  text(ctx, ranOut ? 'Three orders went wrong — the kitchen closes early.' : 'The lunch rush is done. Here is how the kitchen did.', 640, 210, 20, '#FFF3DC', 600, 'center');

  ctx.fillStyle = COLORS.ticket;
  roundRect(ctx, 390, 260, 500, 240, 18);
  ctx.fill();
  text(ctx, `SCORE  ${world.score}`, 640, 310, 34, COLORS.ink, 800, 'center');
  text(ctx, `Dishes served: ${world.served}`, 640, 360, 22, COLORS.ink, 700, 'center');
  text(ctx, `Best combo: x${world.bestCombo}`, 640, 396, 22, COLORS.ink, 700, 'center');
  text(ctx, `Orders expired: ${world.expiredCount}    Wrong dishes: ${world.wrongCount}`, 640, 432, 18, COLORS.inkSoft, 600, 'center');
  const verdict = world.score >= 800 ? 'Head chef material!' : world.score >= 400 ? 'A solid shift — the regulars are happy.' : 'The kitchen survived. Come back for the next rush.';
  text(ctx, verdict, 640, 470, 20, COLORS.greenDark, 700, 'center');

  ctx.fillStyle = COLORS.green;
  roundRect(ctx, 490, 540, 300, 60, 16);
  ctx.fill();
  text(ctx, 'PLAY AGAIN  (R)', 640, 570, 24, '#FFFFFF', 800, 'center');
}

// The kitchen itself: wall, board, counter and plate, without any overlay.
function drawKitchen(ctx, world, hover) {
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, LAYOUT.header.h, CANVAS_WIDTH, 12);
  drawHeader(ctx, world);
  drawBoard(ctx, world);
  drawCounter(ctx, world, hover);
  drawPlateArea(ctx, world, hover);
  drawFooter(ctx);
}

// Draw the current screen.
export function drawGame(ctx, world, hover) {
  if (world.screen === SCREEN_TITLE) {
    drawTitle(ctx, world);
  } else if (world.screen === SCREEN_OVER) {
    drawOver(ctx, world);
  } else {
    drawKitchen(ctx, world, hover);
  }
}
