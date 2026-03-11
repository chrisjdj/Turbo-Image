import type { ProcessOptions, CompressResult } from './types';

async function encodeImage(imageData: ImageData, options: ProcessOptions): Promise<ArrayBuffer> {
  const format = options.format;

  
  if (format === 'jpeg') {
    const { encode } = await import('@jsquash/jpeg');
    const res = await encode(imageData, { quality: options.quality });
    return res;
  } else if (format === 'png') {
    const { encode } = await import('@jsquash/png');
    const res = await encode(imageData);
    return res;
  } else if (format === 'webp') {
    const { encode } = await import('@jsquash/webp');
    const res = await encode(imageData, { quality: options.quality });
    return res;
  } else if (format === 'avif') {
    const { encode } = await import('@jsquash/avif');
    const res = await encode(imageData, { quality: options.quality });
    return res;
  }
  
  console.error(`[imageProcessorLogic] Unsupported format: ${format}`);
  throw new Error(`Unsupported format: ${format}`);
}

export async function processImageInternal(
  bitmap: ImageBitmap,
  options: ProcessOptions
): Promise<CompressResult> {
  const startTime = performance.now();
  let targetWidth = bitmap.width;
  let targetHeight = bitmap.height;

  if (options.maxWidth && targetWidth > options.maxWidth) {
    const ratio = options.maxWidth / targetWidth;
    targetWidth = options.maxWidth;
    targetHeight = targetHeight * ratio;
  }

  if (options.maxHeight && targetHeight > options.maxHeight) {
    const ratio = options.maxHeight / targetHeight;
    targetHeight = options.maxHeight;
    targetWidth = targetWidth * ratio;
  }

  targetWidth = Math.round(targetWidth);
  targetHeight = Math.round(targetHeight);

  // Use OffscreenCanvas if available (worker or modern main thread), 
  // otherwise fallback to regular canvas.
  let canvas: OffscreenCanvas | HTMLCanvasElement;
  let ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;

  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(targetWidth, targetHeight);
    ctx = canvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
  } else {
    canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  }

  if (!ctx) {
    throw new Error('Could not get 2d context for image processing');
  }

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  } catch (err: any) {
    if (err.name === 'SecurityError' || err.message.includes('tainted')) {
      throw new Error("This SVG contains external resources or restricted features (like foreignObject) that prevent pixel extraction for optimization. Please ensure the SVG is self-contained or use a different file.");
    }
    throw err;
  }
  
  // Close the bitmap to free memory immediately
  if (typeof bitmap.close === 'function') {
    bitmap.close();
  }
  
  const buffer = await encodeImage(imageData, options);
  
  // Clean up
  canvas.width = 0;
  canvas.height = 0;

  const timeMs = performance.now() - startTime;
  const blob = new Blob([buffer], { type: `image/${options.format}` });

  return {
    blob,
    width: targetWidth,
    height: targetHeight,
    timeMs,
    format: options.format,
  };
}
