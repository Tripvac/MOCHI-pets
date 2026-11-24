import { loadArtAssets, atlasArt, assetUrl } from "./assets";
import { dressPet, wearableArt } from "./accessories";
import { animatePusheen } from "./pusheen";
import { PET_HEADROOM, headwearKinds } from "../shared/pet-rigs.mjs";
import { animateCompanion } from "./companion-animation";
import type { Species } from "../shared/companions.mjs";
export type { Species } from "../shared/companions.mjs";
const cache = new Map<string, HTMLCanvasElement>();
let atlas: HTMLImageElement | undefined;
export async function initPetArt() {
  await loadArtAssets();
  try {
    const image = new Image();
    image.src = assetUrl("/art/pets.png");
    await image.decode();
    atlas = image;
    cache.clear();
  } catch {
    /* The hand-authored sprite is an offline fallback. */
  }
}

export function art(kind: string, variant = ""): HTMLCanvasElement {
  const wearable = wearableArt(kind);
  if (wearable) return wearable;
  const generated = atlasArt(kind);
  if (generated) return generated;
  const key = kind + variant;
  if (cache.has(key)) return cache.get(key)!;
  const c = document.createElement("canvas");
  c.width = c.height = 96;
  const x = c.getContext("2d")!;
  x.imageSmoothingEnabled = false;
  x.lineCap = "round";
  x.lineJoin = "round";
  const path = (d: string, fill: string, stroke = "#75533d", lw = 2) => {
    const p = new Path2D(d);
    x.fillStyle = fill;
    x.fill(p);
    if (lw) {
      x.strokeStyle = stroke;
      x.lineWidth = lw;
      x.stroke(p);
    }
  };
  const oval = (a: number, b: number, w: number, h: number, f: string) => {
    x.fillStyle = f;
    x.beginPath();
    x.ellipse(a, b, w, h, 0, 0, Math.PI * 2);
    x.fill();
  };
  const rect = (a: number, b: number, w: number, h: number, f: string) => {
    x.fillStyle = f;
    x.fillRect(a, b, w, h);
  };
  const shine = (a: number, b: number) => {
    rect(a, b, 3, 3, "#fff8dc");
    rect(a + 3, b + 3, 2, 2, "#fff8dc");
  };
  const leaf = (a: number, b: number, angle = 0) => {
    x.save();
    x.translate(a, b);
    x.rotate(angle);
    path("M0 0Q-15-18 0-22Q15-14 0 0", "#699052", "#446b45", 1.5);
    x.restore();
  };
  if (kind === "strawberry") {
    path(
      "M20 35Q16 18 38 23Q48 17 57 23Q81 18 78 39Q73 61 49 82Q22 67 20 35",
      "#d85d4e",
      "#94473a",
      2,
    );
    path("M25 43Q27 65 48 76Q65 61 69 46Q61 59 47 64Z", "#c74943", "", 0);
    for (const [a, b] of [
      [31, 38],
      [49, 35],
      [65, 36],
      [38, 51],
      [57, 49],
      [47, 65],
      [27, 51],
      [64, 60],
    ]) {
      rect(a, b, 2, 4, "#ffe3a0");
    }
    for (let i = 0; i < 5; i++) {
      x.save();
      x.translate(48, 27);
      x.rotate(i * 1.25);
      path("M0 0Q-15-4-16-15Q-1-15 0 0", "#729451", "#456b3c", 1);
      x.restore();
    }
    shine(25, 32);
  } else if (kind === "pear") {
    path(
      "M44 19Q35 25 36 37Q14 53 23 71Q32 86 56 82Q80 80 77 60Q76 48 59 37Q59 21 52 19Z",
      "#c1c76b",
      "#8d914d",
    );
    path("M47 20 51 10", "#8d6848", "#805339", 4);
    leaf(54, 18, 1.1);
    oval(35, 62, 7, 10, "#dadd89");
    for (let i = 0; i < 22; i++)
      rect(29 + ((i * 13) % 41), 45 + ((i * 7) % 27), 1, 1, "#a5a95b");
  } else if (kind === "banana") {
    path(
      "M20 27Q23 66 61 65Q78 63 82 45Q73 80 43 78Q13 69 15 35Z",
      "#f3cd68",
      "#b78c40",
    );
    path("M21 30Q28 67 62 69", "#ffe297", "#e6b950", 2);
    rect(14, 23, 8, 12, "#88714d");
    rect(79, 42, 6, 7, "#88714d");
  } else if (kind === "watermelon") {
    path("M13 30H83Q77 79 48 82Q18 77 13 30", "#6e9b59", "#3f6949");
    path("M18 31H78Q72 73 48 76Q23 70 18 31", "#e2e4ac", "", 0);
    path("M23 33H74Q68 66 48 71Q29 65 23 33", "#e77868", "", 0);
    for (const [a, b] of [
      [33, 42],
      [48, 41],
      [62, 42],
      [39, 55],
      [55, 57],
    ])
      path(`M${a} ${b}q-3 5 0 6q3-1 0-6`, "#62473c", "", 0);
  } else if (kind === "cherry") {
    path("M30 49Q48 30 51 13Q57 40 67 52", "transparent", "#6c824d", 3);
    leaf(51, 22, 1.2);
    oval(30, 61, 17, 18, "#b94f52");
    oval(65, 64, 17, 18, "#cc5e58");
    shine(22, 51);
    shine(57, 54);
  } else if (kind === "peach") {
    path(
      "M48 30Q25 15 17 44Q7 70 34 79Q46 85 49 77Q69 89 80 64Q91 41 70 28Q57 22 48 30",
      "#eda97a",
      "#bd7959",
    );
    path("M48 32Q59 51 48 75", "transparent", "#da8b68", 2);
    leaf(48, 28, 1);
    oval(29, 46, 6, 9, "#f8c398");
  } else if (kind === "croissant") {
    path(
      "M13 60Q9 38 28 34L35 23Q48 15 61 25L71 36Q87 39 84 61L73 66Q74 51 64 50Q49 43 32 52Q23 57 24 68Z",
      "#dca45e",
      "#9c6b3c",
    );
    path(
      "M33 28Q41 42 34 53M53 24Q59 35 57 47M70 38 65 50",
      "transparent",
      "#b67d42",
      3,
    );
    shine(40, 27);
    shine(17, 43);
  } else if (kind === "pancakes") {
    oval(48, 76, 38, 9, "#d7dfd4");
    for (let i = 0; i < 3; i++) {
      oval(48, 64 - i * 11, 29, 10, "#b97c45");
      oval(48, 60 - i * 11, 29, 10, "#ebc480");
    }
    path(
      "M28 34Q48 24 68 35L64 49Q58 55 54 45Q46 41 41 51Q34 55 28 34",
      "#9b6842",
      "",
      0,
    );
    rect(40, 27, 16, 9, "#f1d991");
    rect(41, 25, 15, 5, "#ffe6a7");
  } else if (kind === "sushi") {
    path(
      "M17 49Q18 35 48 35Q77 35 78 49V72Q49 90 17 72Z",
      "#f5eddb",
      "#aaa68b",
    );
    oval(48, 48, 30, 13, "#fff5df");
    path(
      "M22 41Q32 25 74 37L80 49Q66 42 55 52Q43 46 28 54Z",
      "#e98e72",
      "#c57559",
    );
    for (let i = 0; i < 5; i++)
      path(`M${29 + i * 9} 37l6 11`, "transparent", "#f9be9c", 2);
    path("M43 37 55 39 56 78 43 79Z", "#435944", "#304436");
  } else if (kind === "cookie") {
    path(
      "M46 16 63 20 76 33 80 52 73 70 54 80 34 78 18 64 15 44 24 26Z",
      "#d2a56d",
      "#a37d50",
    );
    for (const [a, b] of [
      [35, 32],
      [57, 29],
      [65, 49],
      [45, 48],
      [30, 60],
      [55, 66],
    ]) {
      rect(a, b, 7, 7, "#7c5642");
      rect(a + 1, b - 2, 4, 2, "#916148");
    }
    oval(29, 40, 3, 4, "#ecc794");
  } else if (kind === "milk") {
    path("M27 30 35 15H60L70 30V79H27Z", "#f3ecdb", "#8e9b96");
    path("M27 30H70V79H27Z", "#e8e3d4", "#9ca79f");
    rect(28, 47, 41, 25, "#a4b9aa");
    rect(39, 14, 20, 6, "#eee7d8");
    path("M45 53Q34 66 47 69Q62 68 52 55Z", "#f8f1df", "", 0);
    rect(31, 34, 4, 10, "#fffae9");
  } else if (kind === "donut") {
    oval(48, 53, 32, 29, "#c48b55");
    oval(48, 47, 32, 27, "#e7b17b");
    path(
      "M18 44Q20 16 48 20Q78 18 79 45Q72 53 67 43Q60 53 54 45Q45 55 39 44Q28 56 25 45Z",
      "#d1939e",
      "#c3848d",
    );
    oval(48, 44, 11, 9, "#a67144");
    oval(48, 41, 9, 6, "#f2ead7");
    for (let i = 0; i < 13; i++)
      rect(
        25 + ((i * 13) % 46),
        28 + ((i * 7) % 12),
        3,
        2,
        i % 2 ? "#e8cb77" : "#eeddc6",
      );
  } else if (kind === "hat") {
    path("M24 46Q22 15 48 15Q73 15 72 46Z", "#b68d65", "#7c664b");
    oval(48, 49, 39, 10, "#cba276");
    rect(24, 39, 48, 7, "#738266");
    for (let i = 0; i < 6; i++)
      path(`M${31 + i * 5} 22v14`, "transparent", "#d3b48a", 1);
  } else if (kind === "bow") {
    path(
      "M44 45Q6 13 17 60Q25 75 45 53M53 46Q89 11 81 60Q71 74 52 53",
      "#ba6d60",
      "#8c554d",
      2,
    );
    oval(48, 48, 10, 12, "#ce8375");
    path(
      "M39 57 31 80 46 75 50 59M55 56 64 79 74 76 61 55",
      "#b97265",
      "#8c554d",
      1,
    );
  } else if (kind === "scarf") {
    path("M15 32Q49 47 80 31L80 50Q45 68 15 51Z", "#b3715c", "#865341");
    path("M58 53H76L80 81H59Z", "#ca8a6c", "#865341");
    for (let i = 0; i < 4; i++) rect(60 + i * 5, 79, 2, 7, "#a96553");
    rect(20, 42, 52, 3, "#e3b294");
  } else if (kind === "headphones") {
    path("M19 56V40Q20 10 48 10Q79 10 79 42V58", "transparent", "#495654", 8);
    path("M22 42Q24 18 48 18Q72 18 76 42", "transparent", "#a1b6a2", 4);
    for (const a of [12, 70]) {
      path(`M${a} 42h14v28h-14Z`, "#718574", "#384d49");
      rect(a + 3, 45, 7, 22, "#9db5a3");
    }
  } else if (kind === "plant" || kind === "flowers") {
    path("M29 64H68L62 87H35Z", "#bd805d", "#8d634a");
    rect(27, 60, 43, 7, "#d79f75");
    for (let i = 0; i < 7; i++) {
      const a = 36 + ((i * 13) % 27),
        b = 25 + ((i * 9) % 25);
      path(`M48 62Q${a} 46 ${a} ${b}`, "transparent", "#526d42", 2);
      if (kind === "plant") {
        leaf(a, b, i * 0.7);
        leaf(a, b + 8, i * 0.8 + 1);
      } else {
        for (let j = 0; j < 5; j++)
          oval(
            a + Math.cos(j * 1.26) * 5,
            b + Math.sin(j * 1.26) * 5,
            4,
            4,
            "#d29483",
          );
        oval(a, b, 3, 3, "#e5c781");
      }
    }
  } else if (kind === "lamp") {
    oval(48, 82, 25, 5, "#9f7d49");
    rect(45, 33, 6, 48, "#bd935b");
    path("M28 15H67L79 49Q48 58 16 49Z", "#eee0b4", "#b3996b");
    for (let i = 0; i < 6; i++)
      path(`M${31 + i * 6} 18l${i - 3} 30`, "transparent", "#d4bf94", 1);
  } else if (kind === "books") {
    rect(13, 20, 72, 65, "#b28b60");
    rect(17, 23, 64, 57, "#765b46");
    rect(17, 52, 64, 4, "#bc956c");
    for (let i = 0; i < 7; i++) {
      rect(
        22 + i * 8,
        29 + (i % 3) * 2,
        6,
        22 - (i % 3) * 2,
        ["#869d82", "#b77460", "#d0b57f", "#72858b"][i % 4],
      );
      rect(23 + i * 8, 33 + (i % 3) * 2, 4, 1, "#e1d2b0");
    }
    for (let i = 0; i < 6; i++) {
      rect(23 + i * 9, 59, 7, 17, ["#ad7a68", "#b3b18b", "#768b78"][i % 3]);
      rect(24 + i * 9, 63, 5, 1, "#ddc7a1");
    }
    rect(18, 85, 6, 5, "#8e6d50");
    rect(72, 85, 6, 5, "#8e6d50");
  } else if (kind === "radio") {
    path("M15 38H81V80H15Z", "#b4855c", "#785b43");
    rect(19, 42, 58, 33, "#c7a274");
    oval(35, 59, 13, 13, "#635c4e");
    for (let i = 0; i < 5; i++) rect(25, 49 + i * 5, 20, 1, "#9d9679");
    rect(55, 48, 17, 9, "#a4b1a0");
    oval(61, 66, 5, 5, "#e3c8a0");
    path("M59 36 73 12", "transparent", "#7c806f", 2);
  } else if (kind === "picture") {
    rect(18, 12, 60, 72, "#986e46");
    rect(22, 16, 52, 64, "#dec49d");
    rect(26, 20, 44, 56, "#e5e7cf");
    oval(58, 33, 7, 7, "#d4ac6c");
    path("M26 63 39 45 52 57 63 47 70 60V76H26Z", "#8caa89", "", 0);
    path("M26 76V66L44 58 57 73 70 66V76Z", "#647f6b", "", 0);
  } else if (kind === "rug") {
    oval(48, 55, 41, 27, "#b88261");
    oval(48, 53, 37, 23, "#d5bb8f");
    oval(48, 53, 31, 18, "#84917b");
    for (let i = 0; i < 15; i++)
      rect(18 + ((i * 7) % 60), 41 + ((i * 11) % 24), 2, 1, "#bdc3a1");
  } else if (kind === "chair") {
    path("M22 19H73V61H22Z", "#88947a", "#606e58");
    path("M17 49H79V73H17Z", "#9da88c", "#68795f");
    rect(23, 74, 5, 14, "#976e4d");
    rect(69, 74, 5, 14, "#976e4d");
    rect(21, 51, 54, 3, "#b3b99d");
    path("M29 27H65V48H29Z", "#c9ba97", "#b3a582", 1);
  } else if (kind === "bed") {
    rect(12, 27, 72, 55, "#b58a60");
    rect(16, 33, 64, 42, "#ece2c9");
    rect(16, 47, 64, 28, "#91a59b");
    for (let i = 0; i < 6; i++) rect(17 + i * 11, 49, 1, 24, "#c7d4c2");
    rect(20, 35, 22, 13, "#f6edda");
    rect(51, 35, 22, 13, "#f6edda");
    rect(13, 80, 5, 10, "#9d7656");
    rect(77, 80, 5, 10, "#9d7656");
  } else if (kind === "clock") {
    oval(48, 47, 32, 32, "#a98253");
    oval(48, 46, 27, 27, "#f2e7c9");
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      rect(47 + Math.sin(a) * 21, 45 - Math.cos(a) * 21, 2, 2, "#9e8961");
    }
    path("M48 29V46L61 53", "transparent", "#646d58", 2);
    oval(48, 46, 3, 3, "#8a7555");
  } else if (kind === "ball") {
    oval(48, 50, 29, 29, "#c9856c");
    path("M22 40Q53 62 73 37M47 22Q31 45 55 76", "transparent", "#e5b693", 5);
    oval(35, 33, 5, 4, "#eec7a7");
  } else if (kind === "box") {
    path("M15 33 48 21 82 34 81 76 48 88 16 75Z", "#b78e61", "#7e6449");
    path("M16 35 48 48 80 35M48 48V86", "transparent", "#97744d", 2);
    path("M35 27 66 40 55 45 24 32Z", "#dcc299", "", 0);
  } else {
    oval(48, 54, 31, 27, "#d2b180");
    shine(28, 39);
  }
  cache.set(key, c);
  return c;
}
export function petArt(
  species: Species = "cat",
  emotion = "happy",
  frame = 0,
  accessory = "",
  stage = 0,
  sceneFrame = false,
): HTMLCanvasElement {
  const key = `pet-${species}-${emotion}-${frame}-${accessory}-${stage}-${sceneFrame}`;
  if (cache.has(key)) return cache.get(key)!;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  x.lineJoin = "round";
  x.lineCap = "round";
  const finish = () => {
    const wear = accessory || (stage >= 3 ? "crown" : "");
    let out = c;
    if (sceneFrame || headwearKinds.includes(wear)) {
      const padded = document.createElement("canvas");
      padded.width = 128; padded.height = 128 + PET_HEADROOM;
      const ctx = padded.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(c, 0, PET_HEADROOM);
      ctx.translate(0, PET_HEADROOM);
      dressPet(ctx, species, accessory, stage);
      if (sceneFrame) out = padded;
      else {
        const data = ctx.getImageData(0, 0, 128, padded.height).data;
        let first = PET_HEADROOM;
        for(let py=0;py<PET_HEADROOM;py++) {
          if (Array.from({length:128},(_,px)=>data[(py*128+px)*4+3]).some(a=>a>30)) { first=py; break; }
        }
        const extra = PET_HEADROOM-first;
        const scale = 128/(128+extra);
        x.clearRect(0,0,128,128);
        x.imageSmoothingEnabled = false;
        x.drawImage(padded,0,first,128,128+extra,(128-128*scale)/2,0,128*scale,128);
      }
    } else dressPet(x, species, accessory, stage);
    cache.set(key, out);
    return out;
  };
  const p = (d: string, f: string, s = "#454554", lw = 2.4) => {
    const q = new Path2D(d);
    x.fillStyle = f;
    x.fill(q);
    if (lw) {
      x.strokeStyle = s;
      x.lineWidth = lw;
      x.stroke(q);
    }
  };
  const o = (a: number, b: number, w: number, h: number, f: string) => {
    x.beginPath();
    x.ellipse(a, b, w, h, 0, 0, 7);
    x.fillStyle = f;
    x.fill();
  };
  // Rounded, chubby silhouette and layered wool highlights. Tail is a separate animated pose.
  if (atlasArt(species)) {
    const sprite = atlasArt(species)!,
      scale = 117 / Math.max(sprite.width, sprite.height),
      w = sprite.width * scale,
      h = sprite.height * scale;
    x.imageSmoothingEnabled = false;
    x.drawImage(sprite, (128 - w) / 2, 124 - h, w, h);
    if (species === "pusheen") animatePusheen(x, emotion, frame);
    else animateCompanion(x, species, emotion, frame);
    return finish();
  }
  if (atlas) {
    // Each sprite is kept as a separate atlas region; faces remain editable for animation.
    const region = {
      cat: {
        sx: 42,
        sy: 318,
        sw: 446,
        sh: 494,
        dx: 9,
        dy: 5,
        dw: 110,
        dh: 122,
        eyes: [
          [181, 522],
          [309, 522],
        ],
      },
      rabbit: {
        sx: 563,
        sy: 227,
        sw: 423,
        sh: 585,
        dx: 18,
        dy: 1,
        dw: 89,
        dh: 123,
        eyes: [
          [689, 522],
          [819, 522],
        ],
      },
      dog: {
        sx: 1028,
        sy: 348,
        sw: 485,
        sh: 464,
        dx: 2,
        dy: 9,
        dw: 123,
        dh: 118,
        eyes: [
          [1209, 523],
          [1336, 523],
        ],
      },
    }[species === "rabbit" || species === "dog" ? species : "cat"];
    const r = region;
    x.imageSmoothingEnabled = false;
    x.drawImage(atlas, r.sx, r.sy, r.sw, r.sh, r.dx, r.dy, r.dw, r.dh);
    if (
      emotion === "sleep" ||
      emotion === "love" ||
      emotion === "eat" ||
      frame === 2
    ) {
      const qx = r.dw / r.sw,
        qy = r.dh / r.sh;
      for (const [ex, ey] of r.eyes) {
        const a = r.dx + (ex - r.sx) * qx,
          b = r.dy + (ey - r.sy) * qy;
        x.fillStyle = "#fff2e1";
        x.beginPath();
        x.ellipse(a, b, 7, 8, 0, 0, 7);
        x.fill();
        p(
          emotion === "love" || emotion === "eat"
            ? `M${a - 5} ${b + 1}q5-6 10 0`
            : `M${a - 5} ${b}q5 5 10 0`,
          "transparent",
          "#3a3038",
          2,
        );
      }
    }
    if (emotion === "sad") {
      const center =
        species === "cat" ? 245 : species === "rabbit" ? 755 : 1271;
      const a = r.dx + ((center - r.sx) * r.dw) / r.sw,
        b = r.dy + ((552 - r.sy) * r.dh) / r.sh;
      o(a, b, 9, 6, "#fff2e1");
      p(`M${a - 6} ${b + 2}q6-6 12 0`, "transparent", "#4f3e42", 1.7);
    }
    return finish();
  }
  const cream = "#fff6dd",
    shade = "#e7d8b8",
    patch = species === "dog" ? "#bd9168" : "#575c71";
  p(
    `M91 91Q${121 - frame * 2} ${92 - frame * 4} 113 74Q107 70 105 78Q105 87 94 84Z`,
    cream,
  );
  if (species === "rabbit") {
    p("M37 50Q17 4 35 5Q49 5 48 45M75 45Q77 4 92 8Q103 16 87 53", cream);
    p(
      "M36 40Q29 14 35 13Q42 18 42 40M83 42Q86 15 91 16Q95 20 87 42",
      "#e6b7b3",
      "",
      0,
    );
  } else if (species === "cat") {
    p("M28 55 27 15Q27 11 32 14L53 34M77 34 97 14Q103 10 102 18L100 60", patch);
    p("M32 39 32 22 46 36M84 36 96 23 96 43", "#dca9ae", "", 0);
  } else {
    p("M34 36Q16 17 10 43Q3 68 22 69L38 53", patch);
    p("M84 36Q107 16 115 43Q122 67 104 69L88 53", patch);
  }
  p(
    "M26 47Q36 29 62 29Q91 28 102 52L105 69 103 74 106 80 102 84Q103 102 85 110L79 116 69 115 65 111 59 112 56 116 45 116 40 111Q20 105 21 86L18 82 22 77 20 72Z",
    cream,
  );
  p(
    "M26 84Q29 103 45 106L51 111 63 106 77 109Q97 101 100 87Q96 111 80 111L77 114 70 113 66 109 59 110 55 114 46 114 42 109Q24 105 26 84",
    shade,
    "",
    0,
  );
  if (species !== "rabbit") {
    p("M27 48Q34 33 52 32L47 50 36 58 24 62Z", patch, "", 0);
    p("M77 32Q93 34 101 53L103 64 88 60 79 48Z", patch, "", 0);
    if (species === "dog")
      p("M57 31Q63 29 69 31L68 48 61 50 55 46Z", "#edd4ac", "", 0);
  }
  // Fur clusters stay crisp after nearest-neighbour upscaling.
  for (const [a, b] of [
    [27, 66],
    [92, 69],
    [32, 87],
    [83, 91],
    [47, 99],
    [70, 38],
    [34, 60],
  ]) {
    x.fillStyle = "#f1e5c9";
    x.fillRect(a, b, 3, 1);
    x.fillRect(a + 2, b + 2, 2, 1);
  }
  if (emotion === "sleep" || frame === 2) {
    p("M37 73q5 5 10 0M77 73q5 5 10 0", "transparent", "#454554", 2.6);
  } else if (emotion === "love" || emotion === "eat") {
    p("M37 74q5-7 10 0M77 74q5-7 10 0", "transparent", "#454554", 2.6);
  } else {
    o(42, 72, 3.5, 4.7, "#3d4052");
    o(82, 72, 3.5, 4.7, "#3d4052");
    o(41, 70, 1, 1, "#fff9e6");
    o(81, 70, 1, 1, "#fff9e6");
  }
  o(34, 81, 6, 3, "#eab6ac");
  o(90, 81, 6, 3, "#eab6ac");
  p("M59 79Q63 77 66 79L63 83Z", "#ac7e79", "", 0);
  p(
    emotion === "sad" ? "M56 91q7-6 14 0" : "M55 86q4 5 8 0q4 5 8 0",
    "transparent",
    "#5b4d53",
    1.7,
  );
  if (emotion === "eat") o(63, 89, 3, 3, "#cc8c82");
  p("M44 104v7M81 104v7", "transparent", "#c7b899", 1.3);
  return finish();
}
