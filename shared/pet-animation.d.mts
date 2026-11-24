export function eyePose(
  emotion: string,
  frame?: number,
): "open" | "sleep" | "happy" | "blink";
export const pusheenEyes: number[][];

export function closePusheenEyePixels(
  data: Uint8ClampedArray,
  width?: number,
): Uint8ClampedArray;
