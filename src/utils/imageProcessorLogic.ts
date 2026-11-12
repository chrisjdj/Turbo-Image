import type { ProcessOptions, CompressResult } from './types';

type Canvas2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;

/** Fits (width, height) inside the optional max bounds, preserving aspect ratio. Never upscales. */
export function computeTargetSize(
  width: number,
  height: number,
  maxWidth?: number,
  maxHeight?: number
): { width: number; height: number } {
  let w = width;
  let h = height;

  if (maxWidth && maxWidth > 0 && w > maxWidth) {
    h = h * (maxWidth / w);
    w = maxWidth;
  }
  if (maxHeight && maxHeight > 0 && h > maxHeight) {
    w = w * (maxHeight / h);
    h = maxHeight;
  }

  return { width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) };
}

function createCanvas(width: number, height: number): { canvas: AnyCanvas; ctx: Canvas2D } {
  let canvas: AnyCanvas;
  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(width, height);
  } else {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as Canvas2D | null;
  if (!ctx) throw new Error('Could not get 2d context for image processing');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { canvas, ctx };
}

function releaseCanvas(canvas: AnyCanvas) {
  canvas.width = 0;
  canvas.height = 0;
}

/**
 * Draws the bitmap at the target size. For large reductions it halves the
 * image step by step, which avoids the aliasing of a single big downscale.
 */
function drawScaled(bitmap: ImageBitmap, targetWidth: number, targetHeight: number, opaque: boolean) {
  let source: CanvasImageSource = bitmap;
  let sw = bitmap.width;
  let sh = bitmap.height;
  let intermediate: AnyCanvas | null = null;

  while (sw / 2 >= targetWidth && sh / 2 >= targetHeight) {
    const nw = Math.round(sw / 2);
    const nh = Math.round(sh / 2);
    const step = createCanvas(nw, nh);
    step.ctx.drawImage(source, 0, 0, nw, nh);
    if (intermediate) releaseCanvas(intermediate);
    intermediate = step.canvas;
    source = step.canvas;
    sw = nw;
    sh = nh;
  }

  const { canvas, ctx } = createCanvas(targetWidth, targetHeight);
  if (opaque) {
    // Formats without alpha (JPEG) would otherwise turn transparent pixels black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  if (intermediate) releaseCanvas(intermediate);
  return { canvas, ctx };
}

async function encodeImage(imageData: ImageData, options: ProcessOptions): Promise<ArrayBuffer> {
  switch (options.format) {
    case 'jpeg': {
      const { encode } = await import('@jsquash/jpeg');
      return encode(imageData, { quality: options.quality });
    }
    case 'png': {
      // OxiPNG encodes straight from ImageData and optimises losslessly.
      const { optimise } = await import('@jsquash/oxipng');
      return optimise(imageData, { level: 2 });
    }
    case 'webp': {
      const { encode } = await import('@jsquash/webp');
      return encode(imageData, options.lossless ? { lossless: 1 } : { quality: options.quality });
    }
    case 'avif': {
      const { encode } = await import('@jsquash/avif');
      return encode(imageData, options.lossless ? { lossless: true } : { quality: options.quality });
    }
    default:
      throw new Error(`Unsupported format: ${String(options.format)}`);
  }
}

export async function processImageInternal(
  bitmap: ImageBitmap,
  options: ProcessOptions
): Promise<CompressResult> {
  const startTime = performance.now();
  const { width, height } = computeTargetSize(bitmap.width, bitmap.height, options.maxWidth, options.maxHeight);

  let imageData: ImageData;
  try {
    const { canvas, ctx } = drawScaled(bitmap, width, height, options.format === 'jpeg');
    try {
      imageData = ctx.getImageData(0, 0, width, height);
    } finally {
      releaseCanvas(canvas);
    }
  } catch (err) {
    const e = err as Error;
    if (e?.name === 'SecurityError' || /tainted/i.test(e?.message ?? '')) {
      throw new Error(
        'This SVG contains external resources or restricted features (like foreignObject) that prevent pixel extraction for optimization. Please ensure the SVG is self-contained or use a different file.'
      );
    }
    throw err;
  } finally {
    // Free the decoded pixels as early as possible.
    bitmap.close?.();
  }

  const buffer = await encodeImage(imageData, options);

  return {
    blob: new Blob([buffer], { type: `image/${options.format}` }),
    width,
    height,
    timeMs: performance.now() - startTime,
    format: options.format,
  };
}
