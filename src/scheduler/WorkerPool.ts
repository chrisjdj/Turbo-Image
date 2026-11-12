import * as Comlink from 'comlink';
import type { ImageProcessor } from '../workers/imageWorker';
import type { CompressResult, TaskPayload } from '../utils/types';
import { processImageInternal } from '../utils/imageProcessorLogic';

interface QueuedTask {
  payload: TaskPayload;
  resolve: (val: CompressResult) => void;
  reject: (err: unknown) => void;
}

interface WorkerWrapper {
  worker: Worker;
  api: Comlink.Remote<ImageProcessor>;
  current: QueuedTask | null;
}

export class CancelledError extends Error {
  constructor() {
    super('Cancelled');
    this.name = 'CancelledError';
  }
}

const MAX_WORKERS_CAP = 6;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Persistent pool of image workers.
 * - Workers are created on demand (none exist until the first image arrives).
 * - Bitmaps are decoded only when a worker is free, which bounds memory use on large batches.
 * - A crashed worker is replaced and its task rejected, instead of hanging forever.
 */
export class WorkerPool {
  private workers: WorkerWrapper[] = [];
  private taskQueue: QueuedTask[] = [];
  private readonly maxWorkers: number;

  constructor() {
    const cores = navigator.hardwareConcurrency || 4;
    // Leave 1 core for the main thread; cap to limit per-worker WASM memory.
    this.maxWorkers = Math.max(1, Math.min(cores - 1, MAX_WORKERS_CAP));
  }

  public schedule(payload: TaskPayload): Promise<CompressResult> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ payload, resolve, reject });
      this.processNext();
    });
  }

  /** Removes a task that has not started yet. Running tasks finish but their result can be ignored. */
  public cancel(id: string) {
    const idx = this.taskQueue.findIndex(t => t.payload.id === id);
    if (idx !== -1) {
      const [task] = this.taskQueue.splice(idx, 1);
      task.reject(new CancelledError());
    }
  }

  private spawnWorker(): WorkerWrapper {
    const worker = new Worker(new URL('../workers/imageWorker.ts', import.meta.url), { type: 'module' });
    const wrapper: WorkerWrapper = { worker, api: Comlink.wrap<ImageProcessor>(worker), current: null };
    worker.addEventListener('error', () => this.replaceWorker(wrapper));
    this.workers.push(wrapper);
    return wrapper;
  }

  private replaceWorker(wrapper: WorkerWrapper) {
    const idx = this.workers.indexOf(wrapper);
    if (idx === -1) return;
    this.workers.splice(idx, 1);
    wrapper.worker.terminate();
    if (wrapper.current) {
      wrapper.current.reject(new Error('The image worker crashed (possibly out of memory). Try a smaller image or retry.'));
      wrapper.current = null;
    }
    this.processNext();
  }

  private getIdleWorker(): WorkerWrapper | null {
    const idle = this.workers.find(w => !w.current);
    if (idle) return idle;
    if (this.workers.length < this.maxWorkers) return this.spawnWorker();
    return null;
  }

  private processNext() {
    while (this.taskQueue.length > 0) {
      const wrapper = this.getIdleWorker();
      if (!wrapper) return; // All busy
      const task = this.taskQueue.shift()!;
      wrapper.current = task;
      void this.run(wrapper, task);
    }
  }

  private async run(wrapper: WorkerWrapper, task: QueuedTask) {
    const finish = () => {
      if (wrapper.current === task) wrapper.current = null;
      this.processNext();
    };

    let bitmap: ImageBitmap;
    try {
      task.payload.onStart?.();
      bitmap = await task.payload.load();
    } catch (err) {
      task.reject(err);
      finish();
      return;
    }

    try {
      // Zero-copy transfer of the ImageBitmap to the worker.
      const result = await wrapper.api.processImage(Comlink.transfer(bitmap, [bitmap]), task.payload.options);
      task.resolve(result);
    } catch (err) {
      // Some browsers refuse to transfer SVG-derived bitmaps (non-origin-clean).
      // The bitmap is still ours in that case, so process it on the main thread.
      if (/non-origin-clean|tainted|origin-clean/i.test(errorMessage(err))) {
        try {
          task.resolve(await processImageInternal(bitmap, task.payload.options));
        } catch (fallbackErr) {
          task.reject(fallbackErr);
        }
      } else {
        task.reject(err);
      }
    } finally {
      finish();
    }
  }
}
