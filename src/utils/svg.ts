const MAX_SVG_DIMENSION = 4096;

/** Rasterises an SVG on the main thread (workers have no Image element). Capped at 4096px. */
export async function loadSvgToBitmap(file: File): Promise<ImageBitmap> {
  const text = await file.text();
  // A fresh blob from the text avoids origin issues with the original File.
  const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));

  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error('Failed to load SVG image. It might contain external resources that prevent clean rasterization.'));
      img.src = url;
    });

    let width = img.naturalWidth || 800;
    let height = img.naturalHeight || 800;
    if (width > MAX_SVG_DIMENSION || height > MAX_SVG_DIMENSION) {
      const ratio = width / height;
      if (width > height) {
        width = MAX_SVG_DIMENSION;
        height = Math.round(MAX_SVG_DIMENSION / ratio);
      } else {
        height = MAX_SVG_DIMENSION;
        width = Math.round(MAX_SVG_DIMENSION * ratio);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    ctx.drawImage(img, 0, 0, width, height);
    const bitmap = await createImageBitmap(canvas);
    canvas.width = 0;
    canvas.height = 0;
    return bitmap;
  } finally {
    URL.revokeObjectURL(url);
  }
}
