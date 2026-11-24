import type { Species } from "./art";

import { petRigs, headwearPlacement } from "../shared/pet-rigs.mjs";
export { petRigs } from "../shared/pet-rigs.mjs";

export function dressPet(
  x: CanvasRenderingContext2D,
  species: Species,
  accessory: string,
  stage: number,
) {
  const rig = petRigs[species];
  const cap = headwearPlacement(species);
  const wear = accessory || (stage >= 3 ? "crown" : "");
  if (!wear) return;
  x.save();
  x.lineCap = "round";
  x.lineJoin = "round";
  const shape = (d: string, fill: string, stroke = "#674f45", width = 1.2) => {
    const p = new Path2D(d);
    x.fillStyle = fill;
    x.fill(p);
    if (width) {
      x.strokeStyle = stroke;
      x.lineWidth = width;
      x.stroke(p);
    }
  };
  const line = (d: string, color: string, width = 1) => {
    x.strokeStyle = color;
    x.lineWidth = width;
    x.stroke(new Path2D(d));
  };
  const {
    center: c,
    forehead: top,
    headWidth: head,
    eyeY,
    neck: n,
    neckWidth: nw,
  } = rig;
  if (wear === "scarf") {
    const l = c - nw / 2,
      r = c + nw / 2;
    // A narrow curved wrap and two short ends; never cover the paws or face.
    shape(`M${c + 10} ${n + 1}l11 3-3 22-10-2z`, "#b86d43");
    shape(`M${c + 3} ${n + 2}l11 3-5 23-11-3z`, "#cf8353");
    shape(
      `M${l} ${n - 5}Q${c} ${n + 3} ${r} ${n - 5}L${r - 1} ${n + 4}Q${c} ${n + 12} ${l + 1} ${n + 4}Z`,
      "#d18a57",
    );
    for (let i = 0; i < 11; i++) {
      const a = l + 3 + (i * (nw - 6)) / 10;
      const y = n - 3 + 4 * Math.sin((i / 10) * Math.PI);
      line(`M${a} ${y}l-1 4 2 1`, "#edb27b", 0.8);
    }
    for (let i = 0; i < 4; i++) {
      line(`M${c + 2 + i * 2} ${n + 22}l-1 5`, "#8f5239", 0.8);
      line(`M${c + 11 + i * 2} ${n + 21}l0 5`, "#8f5239", 0.8);
    }
  } else if (wear === "bow") {
    const [a, b] = rig.bow;
    x.translate(a, b);
    x.rotate(0.23);
    shape(
      "M-2 0Q-18-14-17-2Q-18 12-2 4M2 0Q18-14 17-2Q18 12 2 4",
      "#d58ba1",
      "#84586a",
    );
    shape("M-4-2Q0-5 4-2L4 5Q0 8-4 5Z", "#e8a6b6", "#84586a");
    line("M-12-2-5 1M12-2 5 1", "#f5bdca", 1.5);
  } else if (wear === "crown") {
    const w = Math.min(head * 0.58, 44), y = cap.base, h = cap.crownHeight;
    shape(`M${c-w/2} ${y}l-2-${h*.65} ${w*.27} ${h*.27} ${w*.27}-${h*.62} ${w*.27} ${h*.62} ${w*.27}-${h*.27}-2 ${h*.65}Z`, "#e9ba56", "#99763e");
    shape(`M${c-w/2} ${y-3}Q${c} ${y+1} ${c+w/2} ${y-3}v5Q${c} ${y+7} ${c-w/2} ${y+2}Z`, "#f3cd77", "#99763e");
    x.fillStyle = "#bd6c73";
    x.beginPath(); x.ellipse(c, y-6, 2.5, 3, 0, 0, Math.PI*2); x.fill();
    line(`M${c-w*.3} ${y-4}v-4M${c+w*.3} ${y-4}v-4`, "#fff0b4", 1.2);
  } else if (wear === "hat") {
    const w = cap.width, y = cap.base, h = cap.capHeight;
    shape(`M${c-w/2} ${y}Q${c-w/2-1} ${y-h} ${c} ${y-h}Q${c+w/2+1} ${y-h} ${c+w/2} ${y}Z`, "#d7b187", "#927254");
    for (let i=-3;i<=3;i++) line(`M${c+i*w/8} ${y-2}Q${c+i*w/9} ${y-h*.5} ${c+i*w/15} ${y-h+2}`, "#efcda5", 1);
    shape(`M${c-w/2-1} ${y-2}Q${c} ${y+1} ${c+w/2+1} ${y-2}v6Q${c} ${y+8} ${c-w/2-1} ${y+4}Z`, "#edc79b", "#927254");
    for (let i=0;i<12;i++) line(`M${c-w/2+i*w/11} ${y}v5`, "#ba946c", .7);
    if (cap.pom) { x.fillStyle = "#f4d8b5"; x.beginPath(); x.arc(c, y-h-3, 4, 0, Math.PI*2); x.fill(); }
  } else if (wear === "phones" || wear === "headphones") {
    const l = c - head / 2 + 2,
      r = c + head / 2 - 2,
      y = eyeY - 2;
    line(
      `M${l} ${y + 3}Q${l - 3} ${Math.max(8, top - 14)} ${c} ${Math.max(9, top - 11)}Q${r + 3} ${Math.max(8, top - 14)} ${r} ${y + 3}`,
      "#354a60",
      6,
    );
    line(
      `M${l} ${y}Q${l} ${Math.max(9, top - 11)} ${c} ${Math.max(10, top - 8)}Q${r} ${Math.max(9, top - 11)} ${r} ${y}`,
      "#8db2bd",
      2.5,
    );
    for (const a of [l, r]) {
      shape(
        `M${a - 5} ${y - 9}Q${a} ${y - 13} ${a + 5} ${y - 9}v20q-5 5-10 0Z`,
        "#7196a9",
        "#354a60",
        1.4,
      );
      line(`M${a - 2} ${y - 6}v14`, "#c4dcda", 2);
    }
  } else if (wear === "sunglasses") {
    const y = eyeY - 5,
      l = c - head * 0.34,
      r = c + head * 0.04,
      w = head * 0.29;
    shape(
      `M${l} ${y}h${w}v12h-4v3h-${w - 8}v-3h-4zM${r} ${y}h${w}v12h-4v3h-${w - 8}v-3h-4z`,
      "#26343a",
      "#192730",
      1,
    );
    line(`M${l - 6} ${y}H${r + w + 5}`, "#26343a", 3);
    line(`M${l + 5} ${y + 4}h6M${r + 5} ${y + 4}h6`, "#bbd6cd", 2);
  } else if (wear === "frog") {
    const w = cap.width,
      y = cap.base;
    x.save();
    x.translate(c, y);
    x.scale(1, cap.heightScale);
    x.translate(-c, -y);
    shape(
      `M${c - w / 2} ${y}q0-22 ${w / 2}-22q${w / 2} 0 ${w / 2} 22v5H${c - w / 2}Z`,
      "#83ad62",
      "#45694a",
      1.4,
    );
    for (const a of [c - w * 0.27, c + w * 0.27]) {
      shape(`M${a - 7} ${y - 16}v-8h3v-3h8v3h3v8z`, "#a1c57c", "#45694a");
      x.fillStyle = "#fff4ce";
      x.fillRect(a - 3, y - 24, 6, 7);
      x.fillStyle = "#33493a";
      x.fillRect(a, y - 23, 2, 4);
    }
    line(`M${c - 5} ${y - 7}q5 4 10 0`, "#45694a", 1.2);
    x.restore();
  } else if (wear === "sprout") {
    const y = cap.base;
    x.save();
    x.translate(c, y);
    x.scale(1, Math.min(1, (y - 4) / 29));
    x.translate(-c, -y);
    line(`M${c} ${y + 4}q-1-13 1-20`, "#527a48", 3);
    shape(
      `M${c} ${y - 8}q-22 0-22-14q19-1 22 14M${c + 1} ${y - 12}q2-16 20-15q0 14-20 15`,
      "#91b96b",
      "#527a48",
      1.2,
    );
    line(`M${c - 2} ${y - 11}l-13-7M${c + 3} ${y - 15}l10-7`, "#c4db91", 1);
    x.restore();
  } else if (wear === "wizard") {
    const y = cap.base,
      w = cap.width;
    x.save();
    x.translate(c, y);
    x.scale(1, cap.coneHeight / 35);
    x.translate(-c, -y);
    shape(
      `M${c - w / 2} ${y}l${w * 0.35}-35 10 4 ${w * 0.35} 31z`,
      "#4c6388",
      "#344462",
      1.2,
    );
    shape(
      `M${c - w * 0.7} ${y - 1}q${w * 0.7}-6 ${w * 1.4} 0v5q-${w * 0.7} 8-${w * 1.4} 0z`,
      "#60769e",
      "#344462",
      1.2,
    );
    x.fillStyle = "#ead28a";
    for (const [a, b] of [
      [c - 3, y - 23],
      [c - 9, y - 12],
      [c + 7, y - 9],
    ]) {
      x.fillRect(a, b, 2, 6);
      x.fillRect(a - 2, b + 2, 6, 2);
    }
    x.restore();
  } else if (wear === "duck") {
    const y = cap.base,
      w = cap.width;
    x.save();
    x.translate(c, y);
    x.scale(1, cap.heightScale);
    x.translate(-c, -y);
    shape(
      `M${c - w / 2} ${y}q0-25 ${w / 2}-25q${w / 2} 0 ${w / 2} 25v4H${c - w / 2}z`,
      "#e6bd60",
      "#9b763e",
      1.3,
    );
    x.fillStyle = "#493e35";
    x.fillRect(c - 13, y - 13, 3, 4);
    x.fillRect(c + 10, y - 13, 3, 4);
    shape(`M${c - 10} ${y - 6}h20l5 4-5 5h-20l-5-5z`, "#d98a42", "#9b673c", 1);
    line(`M${c - 6} ${y - 1}h12`, "#efbc68", 1);
    x.restore();
  } else if (wear === "toast") {
    const eyeLeft = Math.min(...rig.eyes.map(e => e[0]-e[2]));
    const eyeRight = Math.max(...rig.eyes.map(e => e[0]+e[2]));
    const mid = (eyeLeft+eyeRight)/2;
    const w = Math.max(head*.82, eyeRight-eyeLeft+20);
    const l = mid-w/2, r = mid+w/2;
    const openingTop = Math.min(...rig.eyes.map(e => e[1]-e[3]))-5;
    const openingBottom = Math.max(openingTop+18, n-6);
    const t = openingTop-9, b = openingBottom+7;
    const d = `M${l} ${t+10}q-4-14 ${w/2}-14q${w/2} 0 ${w/2} 14V${b}H${l}Z M${l+7} ${openingTop+4}Q${mid} ${openingTop-5} ${r-7} ${openingTop+4}V${openingBottom}H${l+7}Z`;
    const p = new Path2D(d);
    x.fillStyle = "#e7be79"; x.fill(p, "evenodd");
    x.strokeStyle = "#a87540"; x.lineWidth = 1.6; x.stroke(p);
    line(`M${l+3} ${t+12}V${b-4}M${r-3} ${t+12}V${b-4}`, "#f6dba4", 2);

  }
  x.restore();
}

const wearables = new Set([
  "bow",
  "scarf",
  "hat",
  "crown",
  "phones",
  "headphones",
  "sunglasses",
  "frog",
  "sprout",
  "wizard",
  "duck",
  "toast",
]);
const thumbnails = new Map<string, HTMLCanvasElement>();
export function wearableArt(kind: string): HTMLCanvasElement | undefined {
  if (!wearables.has(kind)) return;
  if (thumbnails.has(kind)) return thumbnails.get(kind);
  const source = document.createElement("canvas");
  source.width = source.height = 128;
  const ctx = source.getContext("2d")!;
  dressPet(ctx, "cat", kind, 0);
  const pixels = ctx.getImageData(0, 0, 128, 128).data;
  let l = 128,
    t = 128,
    r = 0,
    b = 0;
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++)
      if (pixels[(y * 128 + x) * 4 + 3] > 30) {
        l = Math.min(l, x);
        r = Math.max(r, x);
        t = Math.min(t, y);
        b = Math.max(b, y);
      }
  const out = document.createElement("canvas");
  out.width = out.height = 96;
  if (l <= r) {
    const w = r - l + 1,
      h = b - t + 1,
      k = 80 / Math.max(w, h),
      x = out.getContext("2d")!;
    x.imageSmoothingEnabled = false;
    x.drawImage(
      source,
      l,
      t,
      w,
      h,
      (96 - w * k) / 2,
      (96 - h * k) / 2,
      w * k,
      h * k,
    );
  }
  thumbnails.set(kind, out);
  return out;
}
