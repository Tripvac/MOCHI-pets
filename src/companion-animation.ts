import { petRigs } from "../shared/pet-rigs.mjs";
import type { Species } from "./art";

export function animateCompanion(x: CanvasRenderingContext2D, species: Species, emotion: string, frame: number) {
  if (!["sleep", "love", "eat"].includes(emotion) && frame !== 2) return;
  const image = x.getImageData(0, 0, 128, 128), data = image.data;
  for (const [cx, cy, rx, ry] of petRigs[species].eyes) {
    const left = Math.floor(cx-rx-2), right = Math.ceil(cx+rx+2);
    for (let y=Math.floor(cy-ry-1); y<=Math.ceil(cy+ry+1); y++) {
      const l=(y*128+left)*4, r=(y*128+right)*4;
      for(let px=left+1;px<right;px++) {
        if (((px-cx)/(rx+1))**2 + ((y-cy)/(ry+1))**2 > 1) continue;
        const at=(y*128+px)*4, t=(px-left)/(right-left);
        for(let channel=0;channel<3;channel++) data[at+channel]=Math.round(data[l+channel]*(1-t)+data[r+channel]*t);
      }
    }
  }
  x.putImageData(image, 0, 0);
  x.save(); x.lineCap="round"; x.lineWidth=1.5;
  x.strokeStyle=species === "cat" ? "#b8a993" : "#563c30";
  const closed=emotion === "sleep" || frame === 2;
  for(const [cx,cy,rx] of petRigs[species].eyes) {
    const span=Math.max(2, rx*.85);
    x.beginPath(); x.moveTo(cx-span,cy+.5);
    x.quadraticCurveTo(cx,cy+(closed?2.5:-2.5),cx+span,cy+.5); x.stroke();
  }
  x.restore();
}
