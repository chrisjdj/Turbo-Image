import * as Comlink from 'comlink';
import type { ProcessOptions, CompressResult } from '../utils/types';
import { processImageInternal } from '../utils/imageProcessorLogic';

export class ImageProcessor {
  public processImage(bitmap: ImageBitmap, options: ProcessOptions): Promise<CompressResult> {
    return processImageInternal(bitmap, options);
  }
}

Comlink.expose(new ImageProcessor());
