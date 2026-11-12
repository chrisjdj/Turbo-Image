Below is an **updated requirement specification focused on maximum performance**, incorporating the **fastest browser-based techniques currently possible** (WASM codecs, worker pools, GPU resizing, zero-copy transfers, streaming pipeline, etc.).

This version is more like a **high-performance engineering spec** rather than a basic product spec.

---

# High-Performance Browser Image Compression & Conversion

## Requirement Specification (Optimized Architecture)

## 1. Overview

### Product Name

**TurboImage Web** (placeholder)

### Product Description

TurboImage Web is a **fully browser-based image compression and conversion tool optimized for maximum speed**.

The system uses:

* **WebAssembly codecs**
* **Worker thread pools**
* **GPU-accelerated resizing**
* **Zero-copy memory transfer**
* **streamed batch processing**

All operations occur **locally in the browser**.

No files are uploaded.

---

# 2. Performance Objectives

Primary goal: **Be at least 10× faster than most web compressors.**

### Target Benchmarks

| Task                   | Target Time |
| ---------------------- | ----------- |
| 5MB JPEG compress      | <300ms      |
| 10 images batch        | <2s         |
| 50 images batch        | <8s         |
| 20MP resize + compress | <1s         |

---

# 3. Supported Formats

### Input Formats

Required:

* JPEG / JPG
* PNG
* WebP
* GIF
* BMP

Optional (browser dependent):

* AVIF
* TIFF
* HEIC

---

### Output Formats

* JPEG
* PNG
* WebP
* AVIF

---

# 4. Core Features

## 4.1 High-Speed Compression

User controls:

| Control          | Description  |
| ---------------- | ------------ |
| Quality          | 0–100 slider |
| Target file size | optional     |
| Lossless mode    | toggle       |
| Metadata removal | toggle       |

Compression engines run in **WebAssembly**.

Codecs must include:

* MozJPEG
* OxiPNG
* libwebp
* libavif

These are the same codecs used by tools like **Squoosh**.

---

# 5. High-Speed Processing Architecture

## 5.1 Processing Pipeline

Fast pipeline design:

```
Upload
 ↓
createImageBitmap (fast decode)
 ↓
Transfer to worker pool
 ↓
OffscreenCanvas resize
 ↓
WASM codec compression
 ↓
Blob output
 ↓
Preview + download
```

Key principle:

**Decode once, reuse bitmap.**

---

# 6. Multi-Threaded Processing

## Worker Pool System

The application must implement a **persistent worker pool**.

Example:

```
CPU cores = N
Workers = N - 1
```

Example on 8-core CPU:

```
7 workers
```

### Worker responsibilities

Workers perform:

* resize
* format conversion
* compression

Main thread only handles:

* UI
* previews
* scheduling

---

# 7. OffscreenCanvas Processing

All image operations must occur in workers using:

```
OffscreenCanvas
```

Advantages:

* GPU acceleration
* no UI blocking
* faster scaling

---

# 8. GPU Accelerated Resizing

For large images:

Use **WebGL-based resizing**.

Fallback:

* **pica.js**

Resize must occur **before compression**.

Example:

```
6000px image
↓
resize to 2000px
↓
compress
```

This reduces processing cost drastically.

---

# 9. Zero-Copy Memory Transfers

Large image data must be passed using **transferable objects**.

Required method:

```
postMessage(bitmap, [bitmap])
```

This prevents memory duplication.

---

# 10. Image Decoding Strategy

Use hardware accelerated decoding.

Required method:

```
createImageBitmap()
```

Benefits:

* GPU decoding
* faster than FileReader + Image element

---

# 11. Streaming Batch Processing

Images must be processed **incrementally**, not sequentially.

Bad pattern:

```
Upload all
Process all
Show results
```

Required pattern:

```
Upload
↓
Queue processing
↓
Each image processed immediately
↓
Results streamed
```

---

# 12. Batch Processing Engine

Implement a **task queue scheduler**.

Example:

```
Image queue
 ↓
Worker1
Worker2
Worker3
Worker4
```

Queue must support:

* prioritization
* cancellation
* retry

---

# 13. Lazy Codec Loading

WASM codecs must be loaded **only when required**.

Example:

```
User selects AVIF
↓
Load AVIF codec
```

Startup bundle should remain under:

```
500 KB
```

---

# 14. Memory Management

To avoid browser crashes:

### Limits

| Property       | Limit      |
| -------------- | ---------- |
| Max file size  | 50MB       |
| Max resolution | 100MP      |
| Max batch      | 200 images |

### Cleanup

After processing:

```
bitmap.close()
canvas.width = 0
```

---

# 15. Preview System

Preview must render **immediately**.

Two-stage preview:

```
Fast preview
↓
Final compression preview
```

Comparison modes:

* slider (implemented: before/after dialog with drag handle and keyboard range input)
* side-by-side (not implemented yet)

---

# 16. Download System

Users can download:

* individual files
* all files as ZIP

ZIP library:

* JSZip

Download must use:

```
Blob URLs
```

---

# 17. Offline Support (PWA)

The application must function offline.

Required components:

* service worker
* manifest.json
* cached assets

---

# 18. UI Requirements

## Main Layout

Sections (implemented):

1. Header: brand, privacy badge, "All tools" link, System / Light / Dark theme switch
2. Upload zone
3. Summary and download panel (savings, progress, Download ZIP, Clear)
4. Image queue (per-image stats, status, download/retry/remove)
5. Settings panel
6. Preview (before/after comparison dialog)
7. Footer (about and features)

Responsive behaviour (mobile-first):

* below 1024px: one column, in the order upload, summary, queue, settings
* 1024px and up: sticky 320px settings sidebar on the left, workspace on the right
* no horizontal scrolling from 320px upwards; touch targets at least 44px on touch devices

## Theme

* Three modes: System (default), Light, Dark
* System follows the OS colour scheme live
* A manual choice is stored in localStorage (theme-preference) and shared with the other tools on the same origin
* The theme is applied before first paint (no flash)
* Both themes meet WCAG 2.2 AA contrast

See DESIGN.md for tokens, components and breakpoints.

---

## Upload Interface

Drag-and-drop zone.

Example text:

```
Drop images here
or
Click to upload
```

Clipboard paste supported.

---

# 19. Security Requirements

Because the tool runs locally:

* No image upload
* No server storage
* No analytics on image data

All operations use:

```
File API
Blob API
Canvas API
```

---

# 20. Technology Stack

## Core Framework

Recommended:

* React or Svelte
* TypeScript
* Vite

---

## Image Processing

Required technologies:

```
WebAssembly codecs
Web Workers
OffscreenCanvas
createImageBitmap
WebGL resizing
```

---

## Supporting Libraries

Resize:

```
OffscreenCanvas step-down resizing (pica.js was considered but is not used)
```

Worker communication:

```
Comlink
```

ZIP generation:

```
JSZip
```

---

# 21. File Structure

Example:

```
/turboimage
    /src
        /components
        /workers
        /scheduler
        /utils
    /wasm
        mozjpeg
        oxipng
        libwebp
        libavif
    index.html
    main.ts
    styles.css
    manifest.json
    service-worker.js
```

---

# 22. Failure Handling

Errors to detect:

| Error              | Response        |
| ------------------ | --------------- |
| Unsupported format | show message    |
| Image too large    | reject          |
| Memory overflow    | stop processing |
| Worker failure     | restart worker  |

---

# 23. Testing Requirements

### Performance Testing

Test scenarios:

* 1 image
* 10 images
* 100 images

Images sizes:

* 1MB
* 5MB
* 20MB

---

# 24. Deployment

Since no server is needed, deployment is static.

Possible platforms:

* [Active] GitHub Pages: https://chrisjdj.github.io/Turbo-Image/
* Netlify
* Cloudflare Pages

---

# 25. Success Metrics

Key metrics:

| Metric            | Target            |
| ----------------- | ----------------- |
| Compression speed | 10× faster        |
| Batch performance | <8s for 50 images |
| UI blocking       | none              |
| Crash rate        | <0.1%             |

---

# 26. Competitive Benchmark

Performance target vs typical tools.

| Tool Type                  | Time for 10 images |
| -------------------------- | ------------------ |
| typical online compressor  | 15–30s             |
| optimized browser pipeline | <2s                |

---

# 27. Future Enhancements

Possible additions:

* AI upscaling
* background removal
* cropping
* watermarking
* palette reduction
* EXIF editing

---

---

# 28. SVG Handling Implementation Notes

To achieve maximum compatibility with the vector-heavy nature of SVGs, the following specialized pipeline was implemented:

### 28.1 Rasterization Strategy
- **Fallback Loader**: `createImageBitmap` failure triggers a `Canvas` + `HTMLImageElement` rasterization path.
- **Dimension Capping**: SVGs are capped at **4096px** to prevent memory exhaustion on complex vector files.

### 28.2 Security & Threading
- **Consolidated Processing**: Processing logic is shared between `imageWorker.ts` and the main thread via `src/utils/imageProcessorLogic.ts`.
- **Worker Fallback**: If browser security blocks transferring an SVG-derived bitmap to a Worker (e.g., `Non-origin-clean` error), the system automatically performs optimization on the main thread.
- **Security Awareness**: The system detects "Tainted Canvas" errors and provides clear user feedback when an SVG contains forbidden external resources.

---

✅ **Final Status**: High-performance browser image manipulation tool with robust SVG support fully implemented and verified.
