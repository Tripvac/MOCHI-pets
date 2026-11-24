declare global {
  interface Window {
    __MOCHI_ASSETS__?: Record<string, string>;
  }
}
export const assetUrl = (path: string): string =>
  typeof window !== "undefined"
    ? window.__MOCHI_ASSETS__?.[path] || path
    : path;
// Production sprite atlases. Trimmed sprites keep their real aspect ratio in the room.
const images = new Map<string, HTMLImageElement>();
const sprites = new Map<string, HTMLCanvasElement>();
const files: Record<string, string> = {
  cat: "/art/v7/cat.webp",
  rabbit: "/art/v7/rabbit.webp",
  dog: "/art/v7/dog.webp",
  capybara: "/art/v7/capybara.webp",
  cheems: "/art/v7/cheems.webp",
  moreFurniture: "/art/v7/furniture.webp",
  food: "/art/v3/food-atlas.webp",
  furniture: "/art/v3/furniture-atlas.webp",
  extras: "/art/v3/extras-atlas.webp",
  hamster: "/art/v3/hamster.webp",
  pusheen: "/art/v4/pusheen.webp",
};
const grids: Record<
  string,
  { columns: number; rows: number; kinds: string[] }
> = {
  moreFurniture: {
    columns: 4,
    rows: 3,
    kinds: ["rocker", "beanbag", "canesofa", "sagebed", "sideboard", "bookcase", "turntable", "cattree", "figtree", "hydrangea", "starcushion", "teepee"],
  },
  food: {
    columns: 4,
    rows: 4,
    kinds: [
      "apple",
      "pear",
      "strawberry",
      "banana",
      "watermelon",
      "cherry",
      "peach",
      "croissant",
      "pancakes",
      "sushi",
      "cookie",
      "milk",
      "donut",
      "orange",
      "carrot",
      "salmon",
    ],
  },
  furniture: {
    columns: 4,
    rows: 4,
    kinds: [
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
      "books",
      "lamp",
      "mushroom",
      "floorlamp",
      "pendant",
    ],
  },
  extras: {
    columns: 5,
    rows: 4,
    kinds: [
      "wave",
      "starry",
      "mars",
      "botanic",
      "fern",
      "lavaamber",
      "lavarose",
      "lavasage",
      "lavablue",
      "flowers",
      "bow",
      "scarf",
      "headphones",
      "crown",
      "hat",
      "radio",
      "clock",
      "box",
      "ball",
      "basket",
    ],
  },
};
const aliases: Record<string, string> = {
  berry: "strawberry",
  melon: "watermelon",
  phones: "headphones",
  picture: "wave",
  paperlamp: "pendant",
};
export async function loadArtAssets() {
  await Promise.all(
    Object.entries(files).map(async ([name, url]) => {
      try {
        const image = new Image();
        image.src = assetUrl(url);
        await image.decode();
        images.set(name, image);
      } catch (e) {
        console.warn("Sprite unavailable: " + name, e);
      }
    }),
  );
  sprites.clear();
}
function trimmed(
  image: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
) {
  const source = document.createElement("canvas");
  source.width = Math.ceil(sw);
  source.height = Math.ceil(sh);
  const ctx = source.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, source.width, source.height);
  const pixels = ctx.getImageData(0, 0, source.width, source.height).data;
  let x0 = source.width,
    y0 = source.height,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < source.height; y++)
    for (let x = 0; x < source.width; x++) {
      if (pixels[(y * source.width + x) * 4 + 3] > 64) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
  if (x0 > x1) return source;
  const w = x1 - x0 + 1,
    h = y1 - y0 + 1,
    scale = 192 / Math.max(w, h);
  const out = document.createElement("canvas");
  out.width = Math.ceil(w * scale) + 4;
  out.height = Math.ceil(h * scale) + 4;
  const x = out.getContext("2d")!;
  x.imageSmoothingEnabled = false;
  x.drawImage(source, x0, y0, w, h, 2, 2, out.width - 4, out.height - 4);
  return out;
}
export function atlasArt(raw: string): HTMLCanvasElement | undefined {
  const kind = aliases[raw] || raw;
  if (sprites.has(kind)) return sprites.get(kind);
  if (["cat", "rabbit", "dog", "hamster", "pusheen", "capybara", "cheems"].includes(kind)) {
    const image = images.get(kind);
    if (!image) return;
    const c = trimmed(image, 0, 0, image.width, image.height);
    sprites.set(kind, c);
    return c;
  }
  for (const [name, grid] of Object.entries(grids)) {
    const index = grid.kinds.indexOf(kind),
      image = images.get(name);
    if (index < 0 || !image) continue;
    const sw = image.width / grid.columns,
      sh = image.height / grid.rows;
    const c = trimmed(
      image,
      (index % grid.columns) * sw,
      Math.floor(index / grid.columns) * sh,
      sw,
      sh,
    );
    sprites.set(kind, c);
    return c;
  }
}
