import { companionIds } from "../shared/companions.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  pointInGlass,
  glassPanes,
  roomPainting,
  placedPosition,
  lampSource,
} from "../shared/scene-geometry.mjs";
import { fresh, act, catalog } from "../shared/game.mjs";
test("weather includes outdoor scenery and excludes walls, curtains and opaque frames", () => {
  for (const [room, x, y] of [
    ["living", 0.5, 0.44],
    ["living", 0.45, 0.32],
    ["bedroom", 0.55, 0.44],
    ["bedroom", 0.65, 0.28],
  ])
    assert.equal(pointInGlass(room, x, y), true, `${room} pane ${x},${y}`);
  for (const [room, x, y] of [
    ["living", 0.18, 0.45],
    ["living", 0.5, 0.347],
    ["living", 0.36, 0.45],
    ["living", 0.5, 0.75],
    ["bedroom", 0.35, 0.35],
    ["bedroom", 0.505, 0.44],
    ["bedroom", 0.6, 0.385],
    ["bedroom", 0.5, 0.7],
  ])
    assert.equal(
      pointInGlass(room, x, y),
      false,
      `${room} opaque surface ${x},${y}`,
    );
  for (const panes of Object.values(glassPanes))
    for (const p of panes)
      for (const [x, y] of p) assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1);
});
test("overcast and winter paintings are selected without reusing the sunny floor at night", () => {
  assert.match(roomPainting("living", "rain"), /living-overcast/);
  assert.match(roomPainting("bedroom", "cloud"), /bedroom-overcast/);
  assert.match(roomPainting("living", "snow", true), /living-snow/);
  assert.match(roomPainting("living", "clear", true), /living-overcast/);
  assert.match(roomPainting("bedroom", "clear", false), /bedroom-clear/);
});
test("table light stays attached to its actual shade across scene sizes", () => {
  const p = placedPosition("living", "lamp");
  for (const [w, h] of [
    [320, 510],
    [375, 742],
    [600, 900],
    [800, 360],
    [1024, 768],
  ]) {
    const [x, y] = lampSource(p, 1.6, w, h);
    assert.equal(x, p[0] / 100);
    assert.ok(y > 0 && y < p[1] / 100);
    const renderedWidth = (p[2] * Math.min(w, h * 0.75)) / 100;
    assert.ok(
      Math.abs(y * h - ((p[1] / 100) * h - renderedWidth * 1.6 * 0.73)) < 0.001,
    );
  }
});
test("all six new meme accessories can be purchased and worn by every companion", () => {
  const ids = ["sunglasses", "frog", "sprout", "wizard", "duck", "toast"];
  for (const species of companionIds)
    for (const id of ids) {
      let s = act(fresh(), { type: "adopt", species, name: "Друг" });
      s.coins = 1000;
      s = act(s, { type: "buy", id, autoEquip: true });
      assert.equal(s.accessory, id);
      assert.equal(s.inventory[id], 1);
      assert.equal(s.coins, 1000 - catalog.find((i) => i.id === id).price);
    }
});
