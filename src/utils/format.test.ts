import { describe, expect, it } from 'vitest';
import { dedupeName, formatSize, getOutputName, percentChange } from './format';
import { computeTargetSize } from './imageProcessorLogic';

describe('getOutputName', () => {
  it('replaces the extension and uses jpg for jpeg', () => {
    expect(getOutputName('photo.PNG', 'jpeg')).toBe('photo_optimized.jpg');
    expect(getOutputName('my.holiday.pic.jpg', 'webp')).toBe('my.holiday.pic_optimized.webp');
  });
  it('handles names without an extension or dotfiles', () => {
    expect(getOutputName('image', 'avif')).toBe('image_optimized.avif');
    expect(getOutputName('.hidden', 'png')).toBe('.hidden_optimized.png');
  });
});

describe('dedupeName', () => {
  it('suffixes duplicates', () => {
    const used = new Set<string>();
    expect(dedupeName('a.webp', used)).toBe('a.webp');
    expect(dedupeName('a.webp', used)).toBe('a (2).webp');
    expect(dedupeName('a.webp', used)).toBe('a (3).webp');
  });
});

describe('formatSize', () => {
  it('formats bytes', () => {
    expect(formatSize(0)).toBe('0 B');
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(1536)).toBe('1.5 KB');
    expect(formatSize(5 * 1024 * 1024)).toBe('5 MB');
  });
});

describe('percentChange', () => {
  it('is negative when smaller and positive when larger', () => {
    expect(percentChange(1000, 250)).toBe(-75);
    expect(percentChange(1000, 1200)).toBe(20);
    expect(percentChange(0, 10)).toBe(0);
  });
});

describe('computeTargetSize', () => {
  it('keeps size when no limits', () => {
    expect(computeTargetSize(4000, 3000)).toEqual({ width: 4000, height: 3000 });
  });
  it('fits within max width and height preserving aspect ratio', () => {
    expect(computeTargetSize(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 });
    expect(computeTargetSize(3000, 4000, 2000, 1000)).toEqual({ width: 750, height: 1000 });
  });
  it('never upscales', () => {
    expect(computeTargetSize(800, 600, 1920, 1080)).toEqual({ width: 800, height: 600 });
  });
});
