import { useCallback, useEffect, useRef, useState } from 'react';
import { WorkerPool, CancelledError } from '../scheduler/WorkerPool';
import type { ImageFormat, ProcessOptions } from '../utils/types';
import { loadSvgToBitmap } from '../utils/svg';
import {
  FORMAT_MIME,
  LIMITS,
  dedupeName,
  formatSize,
  getOutputName,
  isImageFile,
  triggerDownload,
} from '../utils/format';

export type QueueStatus = 'queued' | 'processing' | 'done' | 'error';

export interface QueueItem {
  id: string;
  file: File;
  status: QueueStatus;
  originalUrl: string;
  resultBlob?: Blob;
  resultUrl?: string;
  outputFormat?: ImageFormat;
  timeMs?: number;
  /** True when the encoded output was larger, so the original file is kept instead. */
  keptOriginal?: boolean;
  errorMsg?: string;
}

// Single shared pool; it creates workers lazily, so constructing it is cheap.
const pool = new WorkerPool();

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const isSvg = (file: File) => file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function useImageQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Mirrors of state that callbacks need synchronously, without re-creating them on every render.
  const itemsRef = useRef<QueueItem[]>([]);
  const originalUrls = useRef(new Map<string, string>());
  const resultUrls = useRef(new Map<string, string>());
  // Latest run per item: results from older runs (or removed items) are ignored.
  const runIds = useRef(new Map<string, number>());
  const runCounter = useRef(0);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const patch = useCallback((id: string, changes: Partial<QueueItem>) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...changes } : it)));
  }, []);

  const revokeResult = (id: string) => {
    const url = resultUrls.current.get(id);
    if (url) URL.revokeObjectURL(url);
    resultUrls.current.delete(id);
  };

  const run = useCallback(
    (item: Pick<QueueItem, 'id' | 'file'>, options: ProcessOptions) => {
      const runId = ++runCounter.current;
      runIds.current.set(item.id, runId);
      const isCurrent = () => runIds.current.get(item.id) === runId;
      let originalWidth = 0;
      let originalHeight = 0;

      pool
        .schedule({
          id: item.id,
          options,
          onStart: () => {
            if (isCurrent()) patch(item.id, { status: 'processing' });
          },
          load: async () => {
            const bitmap = isSvg(item.file) ? await loadSvgToBitmap(item.file) : await createImageBitmap(item.file);
            if (bitmap.width * bitmap.height > LIMITS.maxPixels) {
              const mp = Math.round((bitmap.width * bitmap.height) / 1e6);
              bitmap.close();
              throw new Error(`Image is ${mp} MP; the limit is ${LIMITS.maxPixels / 1e6} MP.`);
            }
            originalWidth = bitmap.width;
            originalHeight = bitmap.height;
            return bitmap;
          },
        })
        .then(result => {
          if (!isCurrent()) return;

          const sameFormat = item.file.type === FORMAT_MIME[result.format];
          const resized = result.width !== originalWidth || result.height !== originalHeight;
          const keptOriginal = sameFormat && !resized && result.blob.size >= item.file.size;
          const blob: Blob = keptOriginal ? item.file : result.blob;

          revokeResult(item.id);
          const url = URL.createObjectURL(blob);
          resultUrls.current.set(item.id, url);

          patch(item.id, {
            status: 'done',
            resultBlob: blob,
            resultUrl: url,
            outputFormat: result.format,
            timeMs: result.timeMs,
            keptOriginal,
          });
        })
        .catch(err => {
          if (err instanceof CancelledError || !isCurrent()) return;
          patch(item.id, { status: 'error', errorMsg: errorMessage(err) });
        });
    },
    [patch]
  );

  const addFiles = useCallback(
    (files: Iterable<File>, options: ProcessOptions) => {
      const all = Array.from(files);
      const images = all.filter(isImageFile);
      const skipped = all.length - images.length;

      const room = Math.max(0, LIMITS.maxBatch - itemsRef.current.length);
      const accepted = images.slice(0, room);
      const overBatch = images.length - accepted.length;

      const messages: string[] = [];
      if (skipped > 0) messages.push(`Skipped ${skipped} unsupported file${skipped > 1 ? 's' : ''}.`);
      if (overBatch > 0) {
        messages.push(`Queue limit is ${LIMITS.maxBatch} images; ${overBatch} file${overBatch > 1 ? 's were' : ' was'} not added.`);
      }
      setNotice(messages.length ? messages.join(' ') : null);
      if (accepted.length === 0) return;

      const newItems: QueueItem[] = accepted.map(file => {
        const id = newId();
        const originalUrl = URL.createObjectURL(file);
        originalUrls.current.set(id, originalUrl);
        const tooBig = file.size > LIMITS.maxFileBytes;
        return {
          id,
          file,
          originalUrl,
          status: tooBig ? 'error' : 'queued',
          errorMsg: tooBig
            ? `File is ${formatSize(file.size)}; the limit is ${formatSize(LIMITS.maxFileBytes)}.`
            : undefined,
        };
      });

      setItems(prev => [...newItems, ...prev]);
      // Dispatch everything at once: the pool runs as many in parallel as it has workers.
      newItems.filter(it => it.status === 'queued').forEach(it => run(it, options));
    },
    [run]
  );

  const reprocess = useCallback(
    (ids: string[], options: ProcessOptions) => {
      const targets = itemsRef.current.filter(
        it => ids.includes(it.id) && it.file.size <= LIMITS.maxFileBytes
      );
      for (const it of targets) {
        pool.cancel(it.id);
        revokeResult(it.id);
      }
      const targetIds = new Set(targets.map(t => t.id));
      setItems(prev =>
        prev.map(it =>
          targetIds.has(it.id)
            ? { ...it, status: 'queued', resultBlob: undefined, resultUrl: undefined, outputFormat: undefined, timeMs: undefined, keptOriginal: undefined, errorMsg: undefined }
            : it
        )
      );
      targets.forEach(it => run(it, options));
    },
    [run]
  );

  const reprocessAll = useCallback(
    (options: ProcessOptions) => reprocess(itemsRef.current.map(it => it.id), options),
    [reprocess]
  );

  const forget = useCallback((id: string) => {
    pool.cancel(id);
    runIds.current.delete(id);
    const result = resultUrls.current.get(id);
    if (result) URL.revokeObjectURL(result);
    resultUrls.current.delete(id);
    const original = originalUrls.current.get(id);
    if (original) URL.revokeObjectURL(original);
    originalUrls.current.delete(id);
  }, []);

  const remove = useCallback(
    (id: string) => {
      forget(id);
      setItems(prev => prev.filter(it => it.id !== id));
    },
    [forget]
  );

  const clearAll = useCallback(() => {
    itemsRef.current.forEach(it => forget(it.id));
    setItems([]);
    setNotice(null);
  }, [forget]);

  const downloadOne = useCallback((item: QueueItem) => {
    if (!item.resultUrl || !item.outputFormat) return;
    triggerDownload(item.resultUrl, getOutputName(item.file.name, item.outputFormat));
  }, []);

  const downloadAll = useCallback(async () => {
    const done = itemsRef.current.filter(it => it.status === 'done' && it.resultBlob && it.outputFormat);
    if (done.length === 0) return;

    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    const used = new Set<string>();
    // Oldest first, so names match the order the user added them.
    [...done].reverse().forEach(it => {
      zip.file(dedupeName(getOutputName(it.file.name, it.outputFormat!), used), it.resultBlob!);
    });
    // Images are already compressed; STORE skips pointless deflate work.
    const content = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
    const url = URL.createObjectURL(content);
    triggerDownload(url, 'optimized_images.zip');
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }, []);

  // Release every object URL when the app unmounts.
  useEffect(() => {
    const originals = originalUrls.current;
    const results = resultUrls.current;
    return () => {
      originals.forEach(url => URL.revokeObjectURL(url));
      results.forEach(url => URL.revokeObjectURL(url));
      originals.clear();
      results.clear();
    };
  }, []);

  return {
    items,
    notice,
    dismissNotice: () => setNotice(null),
    addFiles,
    retry: (id: string, options: ProcessOptions) => reprocess([id], options),
    reprocessAll,
    remove,
    clearAll,
    downloadOne,
    downloadAll,
  };
}
