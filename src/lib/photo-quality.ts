// Client-side quality check for ID card photos: size, brightness and sharpness.
export async function checkPhotoQuality(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return "Please choose an image file";
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Could not read this image"));
      i.src = url;
    });
    const w = img.naturalWidth, h = img.naturalHeight;
    if (Math.min(w, h) < 480 || Math.max(w, h) < 640) return "Photo is too small. Use a clearer, higher-resolution photo";
    const W = 320, H = Math.round((h / w) * 320);
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0, W, H);
    const d = ctx.getImageData(0, 0, W, H).data;
    const g = new Float32Array(W * H);
    let sum = 0;
    for (let p = 0; p < W * H; p++) {
      g[p] = 0.299 * d[p * 4]! + 0.587 * d[p * 4 + 1]! + 0.114 * d[p * 4 + 2]!;
      sum += g[p]!;
    }
    const mean = sum / (W * H);
    if (mean < 45) return "Photo is too dark. Retake it in better light";
    if (mean > 235) return "Photo is too bright or has glare. Retake it";
    let s = 0, s2 = 0, n = 0;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const l = 4 * g[i]! - g[i - 1]! - g[i + 1]! - g[i - W]! - g[i + W]!;
      s += l; s2 += l * l; n++;
    }
    const variance = s2 / n - (s / n) ** 2;
    if (variance < 60) return "Photo looks blurry. Hold steady and retake it";
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
