// Animation poses are deliberately separate from saved gameplay state.
export function eyePose(emotion, frame = 0) {
  if (emotion === "sleep") return "sleep";
  if (emotion === "love" || emotion === "eat") return "happy";
  if (frame === 2) return "blink";
  return "open";
}
export const pusheenEyes = [
  [31.5, 69.7],
  [57.6, 69.7],
];

export function closePusheenEyePixels(data, width = 128) {
  for (const [cx, cy] of pusheenEyes) {
    const left = Math.floor(cx - 4),
      right = Math.ceil(cx + 4),
      top = Math.floor(cy - 5),
      bottom = Math.ceil(cy + 5);
    for (let y = top; y <= bottom; y++) {
      const l = (y * width + left - 3) * 4,
        r = (y * width + right + 3) * 4;
      for (let x = left; x <= right; x++) {
        const i = (y * width + x) * 4;
        if (
          data[i + 3] < 180 ||
          data[i] > 135 ||
          data[i + 1] > 120 ||
          data[i + 2] > 110
        )
          continue;
        const t = (x - left) / (right - left);
        for (let ch = 0; ch < 3; ch++)
          data[i + ch] = Math.round(data[l + ch] * (1 - t) + data[r + ch] * t);
      }
    }
  }
  return data;
}
