import test from "node:test";
import assert from "node:assert/strict";
import { fresh, act, normalize } from "../shared/game.mjs";
import { catalog } from "../shared/catalog.mjs";
import { companionIds } from "../shared/companions.mjs";
import { petRigs, headwearPlacement, PET_HEADROOM } from "../shared/pet-rigs.mjs";
import { placedPosition } from "../shared/scene-geometry.mjs";
const now = 1795500000000;

test("all seven companions preserve a custom name, room, purchases and growth when switched", () => {
  let state = act(fresh(now), {type: "adopt", species: "hamster", name: "Наш друг"}, now);
  state.inventory.scarf = 1;
  state.accessory = "scarf";
  state.coins = 640;
  state.xp = 310;
  state.stageIndex = 2;
  const inventory = structuredClone(state.inventory), rooms = structuredClone(state.rooms);
  for (const species of companionIds) {
    state = normalize(act(state, {type: "companion", species}, now), now);
    assert.equal(state.species, species);
    assert.equal(state.name, "Наш друг");
    assert.equal(state.accessory, "scarf");
    assert.equal(state.coins, 640);
    assert.equal(state.xp, 310);
    assert.equal(state.stageIndex, 2);
    assert.deepEqual(state.inventory, inventory);
    assert.deepEqual(state.rooms, rooms);
  }
});

test("the twelve new furnishings can be bought, placed and moved without duplicate ownership", () => {
  const ids = ["rocker", "beanbag", "canesofa", "sagebed", "sideboard", "bookcase", "turntable", "cattree", "figtree", "hydrangea", "starcushion", "teepee"];
  assert.equal(catalog.filter(i => i.category === "furniture").length, 43);
  for (const id of ids) {
    const item = catalog.find(i => i.id === id);
    assert.ok(placedPosition("living", item.slot), id+" visible in living room");
    assert.ok(placedPosition("bedroom", item.slot), id+" visible in bedroom");
    if (["cattree", "teepee", "starcushion"].includes(id)) assert.ok(item.sceneLayer < 6, id+" behind the companion");
    let state = act(fresh(now), {type: "adopt", species: "dog", name: "Пончик"}, now);
    state = act(state, {type: "buy", id, room: "living", autoEquip: true}, now);
    assert.equal(state.coins, 1000-item.price);
    assert.equal(state.rooms.living[item.slot], id);
    assert.equal(state.inventory[id], 1);
    if (item.slot === "tabletop") state = act(state, {type: "equip", id: "table", room: "bedroom"}, now);
    state = act(state, {type: "equip", id, room: "bedroom"}, now);
    assert.equal(state.rooms.bedroom[item.slot], id);
    assert.notEqual(state.rooms.living[item.slot], id);
    assert.equal(state.inventory[id], 1);
    assert.throws(() => act(state, {type: "buy", id}, now));
  }
});

test("headwear anchors stay above the visible eyes and inside the sprite on all seven head shapes", () => {
  for (const species of companionIds) {
    const rig = petRigs[species], cap = headwearPlacement(species);
    const highestEye = Math.min(...rig.eyes.map(e => e[1]-e[3]));
    assert.ok(cap.base+8 < highestEye, species+" eye clearance");
    assert.ok(PET_HEADROOM+cap.base-cap.capHeight-8 >= 4, species+" cap and pom top");
    assert.ok(PET_HEADROOM+cap.base-cap.coneHeight >= 5, species+" cone top");
    assert.ok(cap.capHeight/cap.width >= .40, species+" rounded hat proportions");
    assert.ok(cap.center-cap.width*.7 > 0 && cap.center+cap.width*.7 < 128, species+" brim bounds");
  }
});
