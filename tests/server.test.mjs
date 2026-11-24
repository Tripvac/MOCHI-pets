import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const directory = mkdtempSync(path.join(tmpdir(), "mochi-test-"));
let child, base;
async function start() {
  child = spawn(process.execPath, ["server.mjs"], {
    cwd: new URL("../", import.meta.url),
    env: {
      ...process.env,
      MOCHI_PORT: "0",
      MOCHI_HOST: "127.0.0.1",
      MOCHI_DATA_DIR: directory,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  base = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Error("Server start timed out")),
      5000,
    );
    child.stdout.on("data", (b) => {
      const m = String(b).match(/MOCHI: (http:\/\/127\.0\.0\.1:\d+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1]);
      }
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}
async function stop() {
  if (child && child.exitCode === null) {
    child.kill();
    await once(child, "exit");
  }
}
const post = async (url, body) => {
  const r = await fetch(base + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: r.status, data: await r.json() };
};
const create = async () => {
  const r = await post("/api/create", {
    state: { species: "cat", name: "Тестовый дом" },
    actor: "A",
  });
  assert.equal(r.status, 200);
  return r.data;
};
before(start);
after(async () => {
  await stop();
  rmSync(directory, { recursive: true, force: true });
});
test("shared action is idempotent and stale second-device updates conflict safely", async () => {
  const house = await create();
  const buy = {
    code: house.code,
    expectedVersion: 0,
    requestId: "one-purchase",
    action: {
      type: "buy",
      id: "sofa",
      room: "living",
      autoEquip: true,
      actor: "A",
    },
  };
  const first = await post("/api/action", buy);
  assert.equal(first.status, 200);
  assert.equal(first.data.state.coins, 780);
  const duplicate = await post("/api/action", buy);
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.data.state.coins, 780);
  const other = {
    code: house.code,
    expectedVersion: 0,
    requestId: "second-device",
    action: { type: "buy", id: "bed", actor: "B" },
  };
  const conflict = await post("/api/action", other);
  assert.equal(conflict.status, 409);
  assert.equal(conflict.data.state.rev, 1);
  const retried = await post("/api/action", { ...other, expectedVersion: 1 });
  assert.equal(retried.status, 200);
  assert.equal(retried.data.state.coins, 540);
});
test("two devices cannot consume the same last food serving", async () => {
  const house = await create();
  let r = await post("/api/action", {
    code: house.code,
    expectedVersion: 0,
    requestId: "buy-food",
    action: { type: "buy", id: "salmon" },
  });
  assert.equal(r.status, 200);
  const action = {
    code: house.code,
    expectedVersion: 1,
    requestId: "feed-A",
    action: { type: "feed", id: "salmon" },
  };
  r = await post("/api/action", action);
  assert.equal(r.status, 200);
  assert.equal(r.data.state.inventory.salmon, 0);
  const stale = await post("/api/action", { ...action, requestId: "feed-B" });
  assert.equal(stale.status, 409);
  const retry = await post("/api/action", {
    ...action,
    expectedVersion: 2,
    requestId: "feed-B",
  });
  assert.equal(retry.status, 400);
  const state = await post("/api/state", { code: house.code });
  assert.equal(state.data.state.inventory.salmon, 0);
  assert.equal(state.data.state.counts.feed, 1);
});
test("shared state survives process restart", async () => {
  const house = await create();
  await stop();
  await start();
  const r = await post("/api/state", { code: house.code });
  assert.equal(r.status, 200);
  assert.equal(r.data.state.name, "Тестовый дом");
});
test("invalid house codes and cross-origin mutation are rejected", async () => {
  assert.equal((await post("/api/state", { code: "invalid" })).status, 404);
  const r = await fetch(base + "/api/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://unrelated.invalid",
    },
    body: JSON.stringify({ state: { species: "cat" } }),
  });
  assert.equal(r.status, 403);
});
