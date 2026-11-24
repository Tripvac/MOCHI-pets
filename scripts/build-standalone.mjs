// Produce the same complete application as one offline HTML file.
import { build } from "vite";
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const result = await build({
  configFile: false,
  publicDir: false,
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  logLevel: "warn",
  build: {
    write: false,
    target: "safari16",
    cssTarget: "safari16",
    minify: true,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve("src/main.tsx"),
      name: "MochiGame",
      formats: ["iife"],
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
const outputs = (Array.isArray(result) ? result : [result]).flatMap(
  (r) => r.output,
);
const js = outputs
  .filter((x) => x.type === "chunk")
  .map((x) => x.code)
  .join("\n");
let css = outputs
  .filter((x) => x.type === "asset" && x.fileName.endsWith(".css"))
  .map((x) => String(x.source))
  .join("\n");
const mime = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".wav": "audio/wav",
  ".woff2": "font/woff2",
  ".js": "text/javascript",
  ".scriptable": "application/json",
};
const dataUrl = (file) =>
  "data:" +
  mime[path.extname(file)] +
  ";base64," +
  fs.readFileSync(file).toString("base64");
const assets = {};
function embedFolder(folder) {
  for (const entry of fs.readdirSync("public/" + folder, {withFileTypes: true})) {
    if (folder === "art/v3" && entry.name.startsWith("hall-")) continue;
    if (folder === "art/v4" && entry.name.startsWith("room-")) continue;
    const relative = folder + "/" + entry.name;
    if (entry.isDirectory()) embedFolder(relative);
    else assets["/"+relative] = dataUrl(path.join("public", relative));
  }
}
for (const folder of ["art/v3", "art/v4", "art/v5", "art/v6", "art/v7", "audio", "widgets"]) embedFolder(folder);
assets["/art/pets.png"] = dataUrl("public/art/pets.png");
css = css.replace(
  /url\((['"]?)(\/fonts\/[^)'"]+)\1\)/g,
  (_, q, url) => 'url("' + dataUrl(path.join(root, "public", url)) + '")',
);
const safe = (s) => s.replace(/<\/script/gi, "<\\/script");
const html =
  '<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#f5f1e9"><title>MOCHI — наш маленький дом</title><style>' +
  css +
  '</style></head><body><div id="root"></div><script>window.__MOCHI_ASSETS__=' +
  safe(JSON.stringify(assets)) +
  ";</script><script>" +
  safe(js) +
  "</script></body></html>";
fs.writeFileSync("MOCHI-play.html", html);
console.log(
  JSON.stringify({
    file: "MOCHI-play.html",
    bytes: Buffer.byteLength(html),
    embeddedImages: Object.keys(assets).length,
  }),
);
