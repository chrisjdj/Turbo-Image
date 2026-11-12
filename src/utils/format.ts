import type { ImageFormat } from './types';

export const FORMAT_EXTENSION: Record<ImageFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
};

export const FORMAT_MIME: Record<ImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};

/** Input limits (requirement.md §14). */
export const LIMITS = {
  maxFileBytes: 50 * 1024 * 1024,
  maxPixels: 100_000_000,
  maxBatch: 200,
};

const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp|avif|gif|bmp|svg|ico|tiff?)$/i;

/** Some files (e.g. dragged from certain apps) arrive with an empty MIME type, so fall back to the extension. */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || (file.type === '' && ACCEPTED_EXTENSIONS.test(file.name));
}

export function getOutputName(fileName: string, format: ImageFormat): string {
  const dot = fileName.lastIndexOf('.');
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  return `${base}_optimized.${FORMAT_EXTENSION[format]}`;
}

export function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Signed percentage change from original to result: negative = smaller. */
export function percentChange(original: number, result: number): number {
  if (original <= 0) return 0;
  return Math.round((result / original - 1) * 100);
}

export function triggerDownload(url: string, fileName: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Makes ZIP entry names unique: "a.webp", "a (2).webp", ... */
export function dedupeName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let n = 2;
  while (used.has(`${base} (${n})${ext}`)) n++;
  const unique = `${base} (${n})${ext}`;
  used.add(unique);
  return unique;
}
