// Rush Hour Kitchen — ingredients and recipes.
// One clear job: what a dish is made of, and how the ticket reads it.
// Every ingredient has a key, a name, a hotkey, a draw colour and a
// one-letter chip so the order tickets stay legible at a glance.
export const INGREDIENTS = [
  { key: 'bun', name: 'Bun', hotkey: '1', color: '#E8B04B', dark: '#B97F24', chip: 'B' },
  { key: 'patty', name: 'Patty', hotkey: '2', color: '#7A4A21', dark: '#4E2C10', chip: 'P' },
  { key: 'lettuce', name: 'Lettuce', hotkey: '3', color: '#7CB342', dark: '#4C7A24', chip: 'L' },
  { key: 'tomato', name: 'Tomato', hotkey: '4', color: '#E4572E', dark: '#A93214', chip: 'T' },
  { key: 'cheese', name: 'Cheese', hotkey: '5', color: '#F2C14E', dark: '#C08A12', chip: 'C' },
  { key: 'bowl', name: 'Bowl', hotkey: '6', color: '#5B8DBF', dark: '#33597E', chip: 'W' },
  { key: 'cucumber', name: 'Cucumber', hotkey: '7', color: '#4C956C', dark: '#2F6B4A', chip: 'U' },
  { key: 'sauce', name: 'Sauce', hotkey: '8', color: '#B23A17', dark: '#7A2410', chip: 'S' },
];

// Look an ingredient up by its key; returns undefined for a bad key.
export function ingredientByKey(key) {
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    if (INGREDIENTS[i].key === key) return INGREDIENTS[i];
  }
  return undefined;
}

// Look an ingredient up by its hotkey ('1'..'8'); undefined when none.
export function ingredientByHotkey(hotkey) {
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    if (INGREDIENTS[i].hotkey === hotkey) return INGREDIENTS[i];
  }
  return undefined;
}

// Three dishes on the menu. A recipe is a list of ingredient keys; the
// plate matches an order when it holds the same multiset, in any order,
// so the player plans the route, not a memorised sequence.
export const RECIPES = [
  {
    id: 'burger',
    name: 'Burger',
    blurb: 'Bun, patty, cheese, lettuce, tomato',
    needs: ['bun', 'patty', 'cheese', 'lettuce', 'tomato'],
    color: '#E4572E',
  },
  {
    id: 'salad',
    name: 'Garden Salad',
    blurb: 'Bowl, lettuce, tomato, cucumber, sauce',
    needs: ['bowl', 'lettuce', 'tomato', 'cucumber', 'sauce'],
    color: '#4C956C',
  },
  {
    id: 'pasta',
    name: 'Tomato Pasta',
    blurb: 'Bowl, sauce, tomato, cheese',
    needs: ['bowl', 'sauce', 'tomato', 'cheese'],
    color: '#B23A17',
  },
];

// The late-shift special: a seven-ingredient burger that only appears
// once the rush is properly on, for the players chasing a big tip.
export const DELUXE_BURGER = {
  id: 'deluxe',
  name: 'Deluxe Burger',
  blurb: 'Bun, patty, cheese, lettuce, tomato, cucumber, sauce',
  needs: ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'cucumber', 'sauce'],
  color: '#E9A820',
};

// Pick the recipe for the next order. Early on it is one of the three
// menu dishes; once the shift is past half, the Deluxe Burger joins the
// rotation so the rush keeps escalating.
export function pickRecipe(random, shiftProgress) {
  const pool = RECIPES.slice();
  if (shiftProgress > 0.5) pool.push(DELUXE_BURGER);
  return pool[Math.floor(random() * pool.length)];
}

// Find a recipe by id; undefined when the id is not on the menu.
export function recipeById(id) {
  if (id === DELUXE_BURGER.id) return DELUXE_BURGER;
  for (let i = 0; i < RECIPES.length; i += 1) {
    if (RECIPES[i].id === id) return RECIPES[i];
  }
  return undefined;
}

// Do the plate's ingredient keys match this recipe, as a multiset?
// Same keys, same counts, any order — extra or missing items fail.
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const counts = {};
  for (let i = 0; i < plate.length; i += 1) counts[plate[i]] = (counts[plate[i]] || 0) + 1;
  for (let i = 0; i < recipe.needs.length; i += 1) {
    const key = recipe.needs[i];
    if (!counts[key]) return false;
    counts[key] -= 1;
  }
  return true;
}

// Which of the plate's items are already part of the recipe (for the
// green tick on the ticket), and which are wrong (for the red cross).
export function plateAgainstRecipe(plate, recipe) {
  const wanted = {};
  for (let i = 0; i < recipe.needs.length; i += 1) wanted[recipe.needs[i]] = (wanted[recipe.needs[i]] || 0) + 1;
  let right = 0;
  let wrong = 0;
  for (let i = 0; i < plate.length; i += 1) {
    if (wanted[plate[i]]) {
      wanted[plate[i]] -= 1;
      right += 1;
    } else {
      wrong += 1;
    }
  }
  return { right, wrong, missing: recipe.needs.length - right };
}
