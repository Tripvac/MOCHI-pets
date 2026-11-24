import {
  eyePose,
  pusheenEyes,
  closePusheenEyePixels,
} from "../shared/pet-animation.mjs";
export function animatePusheen(
  x: CanvasRenderingContext2D,
  emotion: string,
  frame: number,
) {
  const pose = eyePose(emotion, frame);
  if (pose !== "open") {
    // Replace only the dark eye pixels, interpolating the existing fur from both
    // sides. The cheeks, whiskers, stripes and outline are left untouched.
    const image = x.getImageData(0, 0, 128, 128),
      data = image.data;
    closePusheenEyePixels(data);
    x.putImageData(image, 0, 0);
    x.save();
    x.lineWidth = 1.8;
    x.lineCap = "round";
    x.strokeStyle = "#45342e";
    for (const [a, b] of pusheenEyes) {
      x.beginPath();
      x.moveTo(a - 4, b);
      x.quadraticCurveTo(a, b + (pose === "happy" ? -3 : 3), a + 4, b);
      x.stroke();
    }
    x.restore();
  }
  if (frame === 1 && emotion !== "sleep") {
    // A tiny two-frame tail swish retains the original pixel silhouette.
    x.save();
    x.beginPath();
    x.rect(103, 86, 25, 38);
    x.clip();
    const patch = x.getImageData(103, 86, 25, 38);
    x.clearRect(103, 86, 25, 38);
    const tail = document.createElement("canvas");
    tail.width = 25;
    tail.height = 38;
    tail.getContext("2d")!.putImageData(patch, 0, 0);
    x.translate(103, 114);
    x.rotate(-0.07);
    x.drawImage(tail, 0, -28);
    x.restore();
  }
}
