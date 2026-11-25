// Rush Hour Kitchen — keyboard and mouse input.
// One clear job: turn keys and clicks into game actions, and report
// where the pointer is so the renderer can highlight what it hovers.
// The canvas is scaled by CSS; every pointer position is mapped back
// into the 1280x720 game space before hit-testing.
import { CANVAS_WIDTH, CANVAS_HEIGHT, BIN_WIDTH, BIN_HEIGHT, BIN_GAP, BIN_Y, SERVE_BUTTON, TRASH_BUTTON } from './config.js';
import { ingredientByHotkey } from './recipes.js';

// Where the ingredient bins sit: eight across the counter, centred.
export function binRect(index) {
  const total = 8 * BIN_WIDTH + 7 * BIN_GAP;
  const x0 = (CANVAS_WIDTH - total) / 2;
  return { x: x0 + index * (BIN_WIDTH + BIN_GAP), y: BIN_Y, w: BIN_WIDTH, h: BIN_HEIGHT };
}

function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

// Map a pointer event on the canvas into game coordinates.
export function pointerToGame(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

// Which ingredient bin (0..7) the point is over, or -1 when none.
export function binAt(point) {
  for (let i = 0; i < 8; i += 1) {
    if (inside(point, binRect(i))) return i;
  }
  return -1;
}

export function serveAt(point) {
  return inside(point, SERVE_BUTTON);
}

export function trashAt(point) {
  return inside(point, TRASH_BUTTON);
}

// Wire the keyboard and pointer up. `actions` is the set of verbs the
// game shell provides: start, addIngredient(key), serve, removeLast,
// clearPlate, restart, toggleMute. Returns a small handle with the
// current hover point and a detach function.
export function attachInput(canvas, world, actions) {
  const hover = { x: -1, y: -1, bin: -1, serve: false, trash: false };

  function refreshHover(point) {
    hover.x = point.x;
    hover.y = point.y;
    hover.bin = binAt(point);
    hover.serve = serveAt(point);
    hover.trash = trashAt(point);
  }

  function onKeyDown(event) {
    const key = event.key;
    if (key === 'm' || key === 'M') {
      actions.toggleMute();
      return;
    }
    if (world.screen === 'title') {
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        actions.start();
      }
      return;
    }
    if (world.screen === 'over') {
      if (key === 'r' || key === 'R' || key === 'Enter' || key === ' ') {
        event.preventDefault();
        actions.restart();
      }
      return;
    }
    const ingredient = ingredientByHotkey(key);
    if (ingredient) {
      actions.addIngredient(ingredient.key);
      return;
    }
    if (key === ' ') {
      event.preventDefault();
      actions.serve();
    } else if (key === 'Backspace') {
      event.preventDefault();
      actions.removeLast();
    } else if (key === 'Delete') {
      actions.clearPlate();
    }
  }

  function onPointerMove(event) {
    refreshHover(pointerToGame(canvas, event));
  }

  function onPointerDown(event) {
    const point = pointerToGame(canvas, event);
    refreshHover(point);
    if (world.screen === 'title') {
      actions.start();
      return;
    }
    if (world.screen === 'over') {
      actions.restart();
      return;
    }
    if (event.button === 2) {
      actions.removeLast();
      return;
    }
    if (hover.serve) {
      actions.serve();
      return;
    }
    if (hover.trash) {
      actions.clearPlate();
      return;
    }
    if (hover.bin >= 0) {
      const ingredient = ingredientByHotkey(String(hover.bin + 1));
      if (ingredient) actions.addIngredient(ingredient.key);
    }
  }

  function onContextMenu(event) {
    event.preventDefault();
  }

  // Keys are listened on the window only: the canvas listener would
  // double-fire, since a canvas keydown bubbles up to the window.
  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('contextmenu', onContextMenu);

  return {
    hover,
    detach() {
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('contextmenu', onContextMenu);
    },
  };
}
