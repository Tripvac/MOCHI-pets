// Glass interiors measured on the 1024 x 1536 room paintings. Every opaque
// mullion and curtain is outside the mask; all weather shares this one geometry.
const rect = (x, y, w, h) => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];
export const glassPanes = {
  living: [
    [
      [0.263, 0.306],
      [0.295, 0.312],
      [0.295, 0.335],
      [0.259, 0.331],
    ],
    [
      [0.309, 0.314],
      [0.341, 0.318],
      [0.341, 0.34],
      [0.309, 0.337],
    ],
    [
      [0.251, 0.35],
      [0.341, 0.359],
      [0.341, 0.406],
      [0.238, 0.396],
    ],
    [
      [0.224, 0.419],
      [0.341, 0.426],
      [0.341, 0.507],
      [0.219, 0.511],
    ],
    rect(0.395, 0.312, 0.038, 0.031),
    rect(0.442, 0.312, 0.063, 0.031),
    rect(0.515, 0.312, 0.037, 0.031),
    rect(0.561, 0.312, 0.071, 0.031),
    rect(0.395, 0.352, 0.238, 0.154),
    [
      [0.686, 0.314],
      [0.732, 0.308],
      [0.732, 0.336],
      [0.686, 0.342],
    ],
    [
      [0.744, 0.307],
      [0.764, 0.305],
      [0.771, 0.332],
      [0.744, 0.335],
    ],
    [
      [0.686, 0.352],
      [0.734, 0.346],
      [0.738, 0.394],
      [0.686, 0.402],
    ],
    [
      [0.746, 0.344],
      [0.776, 0.34],
      [0.786, 0.389],
      [0.746, 0.395],
    ],
    [
      [0.686, 0.418],
      [0.791, 0.408],
      [0.804, 0.509],
      [0.686, 0.505],
    ],
  ],
  bedroom: [
    rect(0.431, 0.259, 0.07, 0.057),
    rect(0.512, 0.259, 0.078, 0.057),
    rect(0.6, 0.259, 0.079, 0.057),
    [
      [0.69, 0.259],
      [0.754, 0.259],
      [0.768, 0.316],
      [0.69, 0.316],
    ],
    [
      [0.418, 0.324],
      [0.501, 0.324],
      [0.501, 0.377],
      [0.402, 0.377],
    ],
    rect(0.512, 0.324, 0.078, 0.053),
    rect(0.6, 0.324, 0.079, 0.053),
    [
      [0.69, 0.324],
      [0.77, 0.324],
      [0.79, 0.377],
      [0.69, 0.377],
    ],
    rect(0.403, 0.398, 0.098, 0.097),
    rect(0.512, 0.398, 0.165, 0.097),
    rect(0.69, 0.398, 0.097, 0.097),
  ],
};
export function pointInGlass(room, x, y) {
  return glassPanes[room].some((p) => {
    let inside = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [xi, yi] = p[i],
        [xj, yj] = p[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
        inside = !inside;
    }
    return inside;
  });
}
export function roomPainting(room, weather, night = false) {
  const variant =
    weather === "snow"
      ? "snow"
      : night || weather === "rain" || weather === "cloud"
        ? "overcast"
        : "clear";
  return `/art/v5/room-${room}-${variant}.webp`;
}
export const furniturePositions = {
  rug: [52, 77, 87, 1],
  sofa: [22, 67, 44, 3],
  bed: [76, 69, 47, 3],
  shelf: [81, 65, 28, 3],
  plant: [90, 73, 18, 5],
  poster: [8, 44, 10, 2],
  table: [18, 79, 28, 6],
  lamp: [10.16, 79, 10, 7],
  lava: [28.08, 79, 7.8, 7],
  recordstand: [59, 68, 22, 3],
  tabletop: [25, 73, 10, 7],
  floorlamp: [60, 65, 12, 3],
  ceiling: [83, 25, 15, 2],
  toy: [78, 84, 14, 8],
};
export function placedPosition(room, slot) {
  const p = furniturePositions[slot];
  if (!p) return null;
  if (room === "bedroom") {
    if (slot === "poster") return [16, 44, 18, 2];
    if (slot === "bed") return [24, 69, 48, 3];
    if (slot === "sofa") return [80, 67, 35, 3];
    if (slot === "shelf") return [82, 64, 26, 3];
  }
  return [...p];
}
export function lampSource(
  position,
  aspect,
  sceneWidth,
  sceneHeight,
  riseFraction = 0.73,
  supportRise = 0,
  supportOffset = 0,
) {
  const unit = Math.min(sceneWidth, sceneHeight * 0.75) / 100;
  const rise = (position[2] * aspect * riseFraction + supportRise) * unit;
  return [
    position[0] / 100 + (supportOffset * unit) / sceneWidth,
    position[1] / 100 - rise / sceneHeight,
  ];
}

// Height follows the actual rendered table, rather than a screen percentage.
export function tabletopPlacement(slot, table, aspect) {
  const offsets = { lamp: [-0.28, 10], lava: [0.36, 7.8], tabletop: [0.05, 8] };
  const o = offsets[slot];
  if (!o) return null;
  return {
    position: [table[0], table[1], o[1], 7],
    supportOffset: table[2] * o[0],
    supportRise: table[2] * aspect * 0.73,
  };
}
