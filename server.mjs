// LAN shared-home prototype preserved from the supplied project.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { fresh, normalize, act, progress, pets } from "./shared/game.mjs";
const root = path.dirname(fileURLToPath(import.meta.url)),
  web = path.join(root, "dist");
const dataDir = process.env.MOCHI_DATA_DIR || path.join(root, ".mochi-data");
fs.mkdirSync(dataDir, { recursive: true });
const database = path.join(dataDir, "houses.json");
let houses = {};
try {
  houses = JSON.parse(fs.readFileSync(database, "utf8"));
} catch {}
const persist = () => {
  fs.writeFileSync(database + ".tmp", JSON.stringify(houses));
  fs.renameSync(database + ".tmp", database);
};
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".json": "application/json",
};
function json(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(data));
}
async function body(req) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 150000) throw Error("Слишком большой запрос.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "GET" && url.pathname === "/api/health")
      return json(res, 200, { sharing: true, version: 3 });
    if (url.pathname.startsWith("/api/")) {
      if (
        req.method !== "POST" ||
        !["/api/create", "/api/state", "/api/action"].includes(url.pathname)
      )
        return json(res, 404, { error: "Не найдено." });
      if (req.headers.origin) {
        let origin;
        try {
          origin = new URL(req.headers.origin).host;
        } catch {}
        if (origin !== req.headers.host)
          return json(res, 403, {
            error: "Открой общий дом с адреса этого сервера.",
          });
      }
      const b = await body(req);
      if (url.pathname === "/api/create") {
        if (!pets[b.state?.species]) throw Error("Выбери питомца.");
        const code = crypto.randomBytes(12).toString("hex");
        let state = fresh();
        state = act(state, {
          type: "adopt",
          species: b.state.species,
          name: String(b.state.name || "Моти").slice(0, 24),
          actor: b.actor,
        });
        houses[code] = { state, requests: {} };
        persist();
        return json(res, 200, { code, state });
      }
      if (
        typeof b.code !== "string" ||
        !/^[a-f0-9]{24}$/.test(b.code) ||
        !Object.hasOwn(houses, b.code)
      )
        return json(res, 404, { error: "Дом не найден. Проверь код." });
      let house = houses[b.code];
      if (!house.state) {
        house = { state: normalize(house), requests: {} };
        houses[b.code] = house;
      }
      house.requests ||= {};
      house.state = normalize(house.state);
      if (url.pathname === "/api/state") {
        house.state = progress(house.state);
        persist();
        return json(res, 200, { state: house.state });
      }
      if (typeof b.requestId !== "string" || b.requestId.length > 100)
        throw Error("Не указан номер действия.");
      if (Object.hasOwn(house.requests, b.requestId))
        return json(res, 200, { state: house.state, duplicate: true });
      if (Number(b.expectedVersion) !== house.state.rev)
        return json(res, 409, {
          error: "История обновилась. Повторяем действие.",
          state: house.state,
        });
      if (
        ![
          "feed",
          "pet",
          "play",
          "sleep",
          "buy",
          "equip",
          "game",
          "claim",
          "rename",
          "companion",
        ].includes(b.action?.type)
      )
        throw Error("Недопустимое действие общего дома.");
      house.state = act(house.state, b.action);
      house.requests[b.requestId] = Date.now();
      const ids = Object.keys(house.requests);
      if (ids.length > 300)
        for (const id of ids.slice(0, ids.length - 300))
          delete house.requests[id];
      persist();
      return json(res, 200, { state: house.state });
    }
    if (req.method !== "GET" && req.method !== "HEAD")
      return json(res, 405, { error: "Метод не поддерживается." });
    let requested;
    try {
      requested = decodeURIComponent(url.pathname);
    } catch {
      return json(res, 400, { error: "Некорректный путь." });
    }
    const file = path.resolve(
      web,
      "." + (requested === "/" ? "/index.html" : requested),
    );
    if (!file.startsWith(web + path.sep))
      return json(res, 403, { error: "Недоступно." });
    if (!fs.existsSync(file) || !fs.statSync(file).isFile())
      return json(res, 404, { error: "Не найдено." });
    res.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      "Cache-Control":
        path.extname(file) === ".html" ? "no-store" : "public, max-age=600",
      "X-Content-Type-Options": "nosniff",
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    json(res, 400, { error: String(e.message || e).slice(0, 200) });
  }
});
const port = Number(process.env.MOCHI_PORT ?? process.env.PORT ?? 3000),
  host = process.env.MOCHI_HOST || "127.0.0.1";
server.listen(port, host, () => {
  console.log("MOCHI: http://" + host + ":" + server.address().port);
  console.log("Shared home: local/LAN prototype. Keep this window open.");
});
