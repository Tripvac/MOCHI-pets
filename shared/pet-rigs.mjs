// Face anchors measured on the normalized 128px sprites, not on their full body bounds.
export const petRigs = {
  cat: { center: 77, neck: 95, neckWidth: 61, forehead: 39, headWidth: 72, eyeY: 61, bow: [100, 35], eyes: [[64, 61, 7, 5], [91, 61, 7, 5]] },
  rabbit: { center: 64, neck: 79, neckWidth: 44, forehead: 44, headWidth: 46, eyeY: 57, bow: [82, 44], eyes: [[54, 57, 4, 5], [74, 57, 4, 5]] },
  dog: { center: 38, neck: 85, neckWidth: 38, forehead: 51, headWidth: 43, eyeY: 61, bow: [59, 62], eyes: [[31, 61, 3, 4], [46, 62, 3, 4]] },
  hamster: { center: 64, neck: 75, neckWidth: 62, forehead: 31, headWidth: 84, eyeY: 45, bow: [94, 21], eyes: [[44, 45, 6, 8], [84, 45, 6, 8]] },
  pusheen: { center: 50, neck: 88, neckWidth: 74, forehead: 51, headWidth: 84, eyeY: 72, bow: [66, 50], eyes: [[31.5, 69.7, 4, 4], [57.6, 69.7, 4, 4]] },
  capybara: { center: 45, neck: 68, neckWidth: 54, forehead: 20, headWidth: 55, eyeY: 30, bow: [68, 18], eyes: [[28, 27, 2.5, 4], [61, 32, 4, 4]] },
  cheems: { center: 50, neck: 62, neckWidth: 56, forehead: 20, headWidth: 61, eyeY: 34, bow: [73, 22], eyes: [[41, 33, 4, 3], [59, 35, 5, 3]] },
};
export function headwearPlacement(species) {
  const r = petRigs[species];
  const base = Math.min(r.forehead + 1, Math.min(...r.eyes.map(e => e[1] - e[3])) - 9);
  return {
    center: r.center,
    base,
    width: r.headWidth * .73,
    capHeight: Math.min(28, r.headWidth * .34),
    pom: true,
    crownHeight: Math.min(25, r.headWidth * .38),
    coneHeight: Math.min(35, Math.max(23, r.headWidth * .48)),
    heightScale: Math.min(1.12, Math.max(.78, r.headWidth * .73 / 50)),
  };
}
export const PET_HEADROOM = 32;
export const headwearKinds = ["hat", "crown", "frog", "wizard", "duck"];
export function headwearRise(species, accessory, stage = 0) {
  const kind = accessory || (stage >= 3 ? "crown" : "");
  if (!headwearKinds.includes(kind)) return 0;
  const p = headwearPlacement(species);
  const height = {hat: p.capHeight+8, crown: p.crownHeight+2, frog: 28*p.heightScale, wizard: p.coneHeight+2, duck: 26*p.heightScale}[kind];
  return Math.max(0, height-p.base) / 128;
}
