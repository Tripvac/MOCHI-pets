import test from "node:test";
import assert from "node:assert/strict";
import { fresh, act, normalize } from "../shared/game.mjs";
import {
  placedPosition,
  tabletopPlacement,
  lampSource,
} from "../shared/scene-geometry.mjs";
import {
  eyePose,
  pusheenEyes,
  closePusheenEyePixels,
} from "../shared/pet-animation.mjs";
const now = 1795500000000;
const pet = () =>
  act(fresh(now), { type: "adopt", species: "pusheen", name: "Пушин" }, now);
test("ordinary and lava lamps coexist; removing their table stows both safely", () => {
  let s = pet();
  s = act(
    s,
    { type: "buy", id: "lavaamber", room: "living", autoEquip: true },
    now,
  );
  assert.equal(s.rooms.living.lamp, "lamp");
  assert.equal(s.rooms.living.lava, "lavaamber");
  s = act(s, { type: "equip", id: "table", room: "bedroom" }, now + 1000);
  assert.equal(s.rooms.living.lamp, undefined);
  assert.equal(s.rooms.living.lava, undefined);
  assert.equal(s.inventory.lavaamber, 1);
  assert.equal(s.inventory.lamp, 1);
  assert.throws(() =>
    act(s, { type: "equip", id: "lavaamber", room: "living" }, now + 2000),
  );
});
test("old saves move lava into the adjacent slot and recover the owned desk lamp once", () => {
  const s = pet();
  s.inventory.lavaamber = 1;
  s.rooms.living.lamp = "lavaamber";
  s.coins = 640;
  const migrated = normalize(s, now);
  assert.equal(migrated.rooms.living.lava, "lavaamber");
  assert.equal(migrated.rooms.living.lamp, "lamp");
  assert.equal(migrated.coins, 640);
  delete migrated.rooms.living.lamp;
  assert.equal(normalize(migrated, now).rooms.living.lamp, undefined);
});
test("both lamp bases follow the table surface on portrait and landscape scenes", () => {
  const table = placedPosition("living", "table"),
    aspect = 0.674;
  const normal = tabletopPlacement("lamp", table, aspect),
    lava = tabletopPlacement("lava", table, aspect);
  assert.ok(normal.supportOffset < 0);
  assert.ok(lava.supportOffset > 0);
  for (const [w, h] of [
    [320, 510],
    [375, 742],
    [600, 900],
    [800, 360],
    [1024, 768],
  ]) {
    const unit = Math.min(w, h * 0.75) / 100;
    const surface = (table[1] / 100) * h - table[2] * unit * aspect * 0.73;
    for (const a of [normal, lava]) {
      assert.ok(
        Math.abs((a.position[1] / 100) * h - a.supportRise * unit - surface) <
          0.001,
      );
      const light = lampSource(
        a.position,
        1.5,
        w,
        h,
        0.73,
        a.supportRise,
        a.supportOffset,
      );
      assert.ok(light[1] * h < surface);
      const baseX = (a.position[0] / 100) * w + a.supportOffset * unit;
      assert.ok(
        baseX > (table[0] / 100) * w - (table[2] * unit) / 2 &&
          baseX < (table[0] / 100) * w + (table[2] * unit) / 2,
      );
      assert.ok(Math.abs(light[0] * w - baseX) < 0.001);
    }
  }
});
test("Pusheen sleeping and blinking replace open eye pixels without changing cheeks or stripes", () => {
  for (const frame of [0, 1, 2]) assert.equal(eyePose("sleep", frame), "sleep");
  assert.equal(eyePose("happy", 2), "blink");
  assert.equal(eyePose("love", 0), "happy");
  assert.equal(eyePose("happy", 0), "open");
  const data = new Uint8ClampedArray(128 * 128 * 4);
  for (let i = 0; i < data.length; i += 4) data.set([166, 157, 154, 255], i);
  const cheek = (84 * 128 + 28) * 4;
  data.set([235, 169, 172, 255], cheek);
  const stripe = (53 * 128 + 47) * 4;
  data.set([105, 97, 94, 255], stripe);
  for (const [cx, cy] of pusheenEyes)
    for (let y = Math.round(cy) - 3; y <= Math.round(cy) + 3; y++)
      for (let x = Math.round(cx) - 2; x <= Math.round(cx) + 2; x++)
        data.set([61, 43, 34, 255], (y * 128 + x) * 4);
  closePusheenEyePixels(data);
  for (const [cx, cy] of pusheenEyes)
    assert.deepEqual(
      [
        ...data.slice(
          (Math.round(cy) * 128 + Math.round(cx)) * 4,
          (Math.round(cy) * 128 + Math.round(cx)) * 4 + 3,
        ),
      ],
      [166, 157, 154],
    );
  assert.deepEqual([...data.slice(cheek, cheek + 4)], [235, 169, 172, 255]);
  assert.deepEqual([...data.slice(stripe, stripe + 4)], [105, 97, 94, 255]);
});
