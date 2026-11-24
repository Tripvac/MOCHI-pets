import test from "node:test";
import assert from "node:assert/strict";
import {
  fresh,
  act,
  progress,
  normalize,
  catalog,
  achievements,
  H,
  D,
} from "../shared/game.mjs";
import { companionIds } from "../shared/companions.mjs";
const now = 1795500000000;
const pet = (species = "cat") =>
  act(fresh(now), { type: "adopt", species, name: "Тестовый друг" }, now);
test("all original inventory IDs are retained; merged catalog is unique", () => {
  assert.equal(catalog.length, 70);
  assert.equal(new Set(catalog.map((i) => i.id)).size, 70);
  for (const id of [
    "apple",
    "pear",
    "berry",
    "peach",
    "melon",
    "bow",
    "scarf",
    "phones",
    "crown",
    "sofa",
    "chair",
    "bed",
    "bedpink",
    "rug",
    "rugblue",
    "rugrect",
    "rugcream",
    "table",
    "plant",
    "tv",
    "wave",
    "starry",
    "mars",
    "botanic",
    "lavaamber",
    "lavarose",
    "lavasage",
    "lavablue",
    "mushroom",
    "floorlamp",
    "paperlamp",
    "pendant",
  ])
    assert.ok(
      catalog.some((i) => i.id === id),
      id,
    );
  assert.equal(achievements.length, 50);
});
test("all seven companions adopt with a complete introduction and starter budget", () => {
  for (const species of companionIds) {
    const s = pet(species);
    assert.equal(s.species, species);
    assert.equal(s.coins, 1000);
    assert.equal(s.introSeen, true);
    assert.equal(s.adopted, true);
  }
});
test("replaying the introduction preserves the pet, inventory and coins", () => {
  const s = act(
    pet(),
    { type: "buy", id: "sofa", room: "living", autoEquip: true },
    now + 1000,
  );
  const replayed = act(s, { type: "intro" }, now + 1100);
  assert.equal(replayed.coins, 780);
  assert.deepEqual(replayed.inventory, s.inventory);
  assert.equal(replayed.name, s.name);
});
test("food consumes one serving, caps stats and cannot be spent when full or asleep", () => {
  const s = { ...pet(), food: 90 };
  const fed = act(s, { type: "feed", id: "apple" }, now + 1000);
  assert.equal(fed.inventory.apple, 1);
  assert.equal(fed.food, 100);
  assert.equal(fed.xp, 12);
  assert.equal(s.inventory.apple, 2);
  assert.throws(() =>
    act(
      { ...fed, food: 100, lastSeen: now + 1000 },
      { type: "feed", id: "apple" },
      now + 1000,
    ),
  );
  assert.throws(() =>
    act({ ...s, sleeping: true }, { type: "feed", id: "apple" }, now + 1000),
  );
});
test("missing food, repeat furniture and insufficient funds never alter the original state", () => {
  const s = pet();
  assert.throws(() =>
    act({ ...s, inventory: {} }, { type: "feed", id: "apple" }, now),
  );
  assert.throws(() =>
    act({ ...s, coins: 0 }, { type: "buy", id: "sofa" }, now),
  );
  const bought = act(s, { type: "buy", id: "sofa" }, now);
  assert.throws(() => act(bought, { type: "buy", id: "sofa" }, now));
  assert.equal(s.coins, 1000);
});
test("a single piece moves between rooms instead of appearing twice", () => {
  let s = act(
    pet(),
    { type: "buy", id: "sofa", room: "living", autoEquip: true },
    now,
  );
  s = act(s, { type: "equip", id: "sofa", room: "bedroom" }, now + 1000);
  assert.equal(s.rooms.living.sofa, undefined);
  assert.equal(s.rooms.bedroom.sofa, "sofa");
  s = act(s, { type: "equip", id: "sofa", room: "bedroom" }, now + 2000);
  assert.equal(s.rooms.bedroom.sofa, undefined);
});
test("tabletop objects require support; moving a table safely stows its decorations", () => {
  let s = pet();
  assert.throws(() =>
    act(
      s,
      { type: "buy", id: "mushroom", room: "bedroom", autoEquip: true },
      now,
    ),
  );
  assert.equal(s.coins, 1000);
  s = act(
    s,
    { type: "buy", id: "mushroom", room: "living", autoEquip: true },
    now,
  );
  s = act(s, { type: "equip", id: "table", room: "bedroom" }, now + 1000);
  assert.equal(s.rooms.living.lamp, undefined);
  assert.equal(s.inventory.mushroom, 1);
  assert.equal(s.rooms.bedroom.table, "table");
});
test("sleep recovers by elapsed time, including while closed, and stops at full energy", () => {
  let s = act({ ...pet(), energy: 50 }, { type: "sleep" }, now);
  assert.equal(progress(s, now + H).energy, 63);
  s = progress(s, now + 10 * H);
  assert.equal(s.energy, 100);
  assert.equal(s.sleeping, false);
});
test("care cooldowns prevent instant repeated XP awards", () => {
  const s = act(pet(), { type: "pet" }, now);
  assert.throws(() => act(s, { type: "pet" }, now + 100));
  assert.equal(act(s, { type: "pet" }, now + 8001).counts.pet, 2);
});
test("special form requires all three care skills; hunger delays evolution", () => {
  let s = {
    ...pet(),
    xp: 700,
    stageIndex: 2,
    counts: { ...pet().counts, feed: 3, play: 3, sleep: 2 },
  };
  assert.equal(progress(s, now).stageIndex, 2);
  s.counts.sleep = 3;
  s = progress(s, now);
  assert.equal(s.stageIndex, 3);
  assert.equal(s.superAt, now);
  const hungry = { ...pet(), xp: 300, lastFed: now - 73 * H };
  assert.equal(progress(hungry, now).stageIndex, 0);
});
test("both original timed story endings trigger", () => {
  assert.equal(
    progress({ ...pet(), lastFed: now - 7 * D }, now).ending,
    "left",
  );
  assert.equal(
    progress({ ...pet(), stageIndex: 3, superAt: now - 14 * D }, now).ending,
    "graduated",
  );
});
test("all four mini-games use their documented reward rules", () => {
  const cases = [
    ["jump", 1200, undefined, 120],
    ["catch", 300, undefined, 30],
    ["memory", 76, undefined, 30],
    ["bounce", 300, 4, 40],
  ];
  for (const [game, score, levels, coins] of cases) {
    const s = act(pet(), { type: "game", game, score, levels }, now);
    assert.equal(s.coins, 1000 + coins);
    assert.equal(s.counts.earned, coins);
    assert.equal(s.counts.games, 1);
  }
});
test("achievement rewards are one-time and locked claims cannot pay out", () => {
  let s = pet();
  assert.throws(() => act(s, { type: "claim", id: "feed4" }, now));
  s = act(s, { type: "claim", id: "days0" }, now);
  assert.equal(s.coins, 1020);
  assert.throws(() => act(s, { type: "claim", id: "days0" }, now + 1000));
});
test("original archive saves and prior React saves migrate without losing items", () => {
  const old = {
    version: 1,
    species: "hamster",
    name: "Пико",
    created: now,
    updated: now,
    lastFed: now,
    food: 60,
    sleep: 70,
    fun: 80,
    xp: 100,
    stage: 1,
    coins: 432,
    inventory: { apple: 2, scarf: 1, bedpink: 1 },
    rooms: { living: {}, bedroom: { bed: "bedpink" } },
    accessory: "scarf",
    counters: { feed: 2 },
    history: [],
    unlocked: [],
  };
  const a = normalize(old, now);
  assert.equal(a.coins, 432);
  assert.equal(a.energy, 70);
  assert.equal(a.rooms.bedroom.bed, "bedpink");
  assert.equal(a.species, "hamster");
  const b = normalize(
    {
      version: 2,
      species: "cat",
      name: "Моти",
      adopted: true,
      createdAt: now,
      lastSeen: now,
      xp: 700,
      coins: 777,
      inventory: { strawberry: 3, headphones: 1, fern: 1 },
      equipped: { plant: "fern" },
      accessory: "headphones",
      claims: [],
      counts: {},
    },
    now,
  );
  assert.equal(b.inventory.berry, 3);
  assert.equal(b.accessory, "phones");
  assert.equal(b.rooms.living.plant, "fern");
  assert.equal(b.coins, 777);
  assert.equal(b.stageIndex, 2);
  assert.equal(b.introSeen, false);
});

test("changing to Pusheen keeps the home, outfit, wallet and growth", () => {
  const s = pet("hamster");
  s.inventory.scarf = 1;
  s.accessory = "scarf";
  s.coins = 640;
  s.xp = 310;
  s.stageIndex = 2;
  const next = act(s, { type: "companion", species: "pusheen" }, now);
  assert.equal(next.species, "pusheen");
  assert.equal(next.coins, 640);
  assert.equal(next.accessory, "scarf");
  assert.equal(next.stageIndex, 2);
  assert.deepEqual(next.rooms, s.rooms);
  assert.deepEqual(next.inventory, s.inventory);
});
test("the room repair adds a starter interior once and respects later removals", () => {
  const old = pet();
  delete old.roomEdition;
  old.rooms = { living: {}, bedroom: {} };
  old.inventory = { apple: 1 };
  old.coins = 640;
  const repaired = normalize(old, now);
  assert.equal(repaired.rooms.living.sofa, "chair");
  assert.equal(repaired.coins, 640);
  assert.equal(repaired.roomEdition, 4);
  delete repaired.rooms.living.sofa;
  assert.equal(normalize(repaired, now).rooms.living.sofa, undefined);
});
