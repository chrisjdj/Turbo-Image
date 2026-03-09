export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'original';

export interface ProcessOptions {
  format: ImageFormat;
  quality: number; // 0-100
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio?: boolean;
}

export interface CompressResult {
  blob: Blob;
  width: number;
  height: number;
  timeMs: number;
  format: string;
}

export interface TaskPayload {
  id: string;
  bitmap: ImageBitmap;
  options: ProcessOptions;
  originalFileName: string;
  originalSize: number;
}
