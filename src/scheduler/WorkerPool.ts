import * as Comlink from 'comlink';
import type { ImageProcessor } from '../workers/imageWorker';
import type { CompressResult, TaskPayload } from '../utils/types';
import { processImageInternal } from '../utils/imageProcessorLogic';

interface WorkerWrapper {
  worker: Worker;
  api: Comlink.Remote<ImageProcessor>;
  busy: boolean;
}

export class WorkerPool {
  private workers: WorkerWrapper[] = [];
  private taskQueue: { payload: TaskPayload; resolve: (val: CompressResult) => void; reject: (err: any) => void }[] = [];

  constructor() {
    // Leave 1 core for the main thread
    const maxWorkers = Math.max(1, (navigator.hardwareConcurrency || 4) - 1);
    
    for (let i = 0; i < maxWorkers; i++) {
      // NOTE: Vite handles ?worker correctly to build the worker
      const worker = new Worker(new URL('../workers/imageWorker.ts', import.meta.url), {
        type: 'module',
      });
      const api = Comlink.wrap<ImageProcessor>(worker);
      this.workers.push({ worker, api, busy: false });
    }
  }

  public async schedule(payload: TaskPayload): Promise<CompressResult> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ payload, resolve, reject });
      this.processNext();
    });
  }

  private processNext() {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return; // All busy

    const task = this.taskQueue.shift();
    if (!task) return;

    const runFallback = (error: any) => {
      availableWorker.busy = false;
      // Broaden detection for tainted/origin-clean across browsers
      const errorMsg = error.message || String(error);
      const isTainted = /non-origin-clean|tainted|origin-clean/i.test(errorMsg);
      
      if (isTainted) {
        console.warn("Worker transfer failed (tainted image). Falling back to main-thread processing.");
        processImageInternal(task.payload.bitmap, task.payload.options)
          .then(result => task.resolve(result))
          .catch(err => task.reject(err))
          .finally(() => this.processNext());
      } else {
        task.reject(error);
        this.processNext();
      }
    };

    availableWorker.busy = true;

    // Use zero-copy transfer for the ImageBitmap
    try {
      availableWorker.api.processImage(Comlink.transfer(task.payload.bitmap, [task.payload.bitmap]), task.payload.options)
        .then(result => {
          availableWorker.busy = false;
          task.resolve(result);
          this.processNext();
        })
        .catch(err => {
          runFallback(err);
        });
    } catch (err: any) {
      runFallback(err);
    }
  }
}


