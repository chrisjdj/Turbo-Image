import * as Comlink from 'comlink';
import type { ProcessOptions, CompressResult } from '../utils/types';
import { processImageInternal } from '../utils/imageProcessorLogic';

export class ImageProcessor {
  public async processImage(
    bitmap: ImageBitmap,
    options: ProcessOptions
  ): Promise<CompressResult> {
    return processImageInternal(bitmap, options);
  }
}

const processor = new ImageProcessor();
Comlink.expose(processor);

