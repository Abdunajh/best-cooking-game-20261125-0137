# Rush Hour Kitchen

A fast, complete, playable 2D cooking game for the make.fun
"Make the best cooking game" bounty. Original art, sounds and names;
no network, no libraries, no build step — plain static files under
`game/` that open in a desktop browser.

## How to play

The lunch rush is on. Order tickets land on the board at the top,
each with a recipe and a countdown. Pick ingredients from the counter
(click, or press keys 1–8), stack them on your plate, and serve before
the ticket runs out.

- **Serve** (Space, or click SERVE) when the plate matches an open
  ticket: 100 points plus a speed tip, and the combo climbs.
- A **wrong dish** costs a life. An **expired ticket** costs a life.
- **Backspace** (or right-click) takes the last ingredient back;
  **Del** clears the plate.
- Three lives, one three-minute shift. When the shift ends — or the
  lives run out — the results screen shows your score, dishes served
  and best combo. Press **R** to play again.
- **M** toggles the sound (WebAudio bleeps, synthesised at run time).

## The menu

- **Burger** — bun, patty, cheese, lettuce, tomato
- **Garden Salad** — bowl, lettuce, tomato, cucumber, sauce
- **Tomato Pasta** — bowl, sauce, tomato, cheese
- Late in the shift the **Deluxe Burger** joins the rotation:
  bun, patty, cheese, lettuce, tomato, cucumber, sauce.

Orders arrive faster and give you less time as the shift goes on, so
the rush reads in a glance: the ticket bars turn red under ten seconds.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with `buildDossier` from `vendor/makefun-game.ts`.

## Screenshots

`shots.json` lists the four shots, each a frozen frame of the real game
behind `?shot=`:

1. `1-start.jpg` — the title screen over a kitchen with tickets on the board
2. `2-play.jpg` — mid-rush: three tickets, a burger half-built, the clock running
3. `3-serve.jpg` — a complete burger on the plate, ready to serve
4. `4-end.jpg` — the results screen at the end of the shift

## Structure

- `game/index.html` — the page: a 1280×720 canvas, one module script
- `game/src/main.js` — the shell: canvas, loop, actions, shot mode
- `game/src/config.js` — constants: size, timing, palette, layout
- `game/src/recipes.js` — ingredients, the three dishes, the deluxe, matching
- `game/src/world.js` — the rules: orders, serving, scoring, the shift clock
- `game/src/input.js` — keyboard and mouse, mapped into game coordinates
- `game/src/render.js` — everything drawn: kitchen, board, counter, plate
- `game/src/audio.js` — WebAudio bleeps, synthesised, no audio files
- `game/src/shots.js` — the staged screenshot scenes behind `?shot=`
- `main.ts` — hands the game in (copies `game/` + `screenshots/`, writes the dossier)
- `serve.ts` — a tiny static server for local play-testing
