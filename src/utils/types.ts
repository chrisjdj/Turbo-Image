export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';

export interface ProcessOptions {
  format: ImageFormat;
  quality: number; // 1-100
  lossless?: boolean; // WebP / AVIF only
  maxWidth?: number;
  maxHeight?: number;
}

export interface CompressResult {
  blob: Blob;
  width: number;
  height: number;
  timeMs: number;
  format: ImageFormat;
}

export interface TaskPayload {
  id: string;
  /** Called by the pool once a worker is free, so bitmaps are only decoded when they can be processed. */
  load: () => Promise<ImageBitmap>;
  options: ProcessOptions;
  /** Called when the task leaves the queue and starts running. */
  onStart?: () => void;
}
