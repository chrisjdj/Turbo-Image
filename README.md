# TurboImage ⚡

[Live Demo](https://chrisjdj.github.io/Turbo-Image/)


TurboImage is a high-performance, browser-based image compression and conversion tool. It processes all images locally on your device, ensuring maximum privacy and speed without ever uploading your files to a server.

---
<img width="1266" height="794" alt="image" src="https://github.com/user-attachments/assets/c8e54c52-844e-4759-8c9a-acb6e47d7544" />

---

## ✨ Features

- **Extreme Privacy**: All processing happens locally in your browser. No server-side uploads.
- **Turbo Speed**: Utilizes a combination of Web Workers, WASM-powered codecs, and hardware-accelerated rasterization.
- **Robust SVG Support**: Custom handling for SVGs to bypass common browser decoding and transfer restrictions, including support for large files (tested up to 44MB+).
- **Format Support**: Convert and optimize JPEG, PNG, WebP, and AVIF.
- **Batch Processing**: Parallelized optimization using a dynamic worker thread pool.
- **Zero-Copy Memory**: Uses `ImageBitmap` transfers for minimal memory overhead.
- **Modern UI**: Clean, responsive interface with Dark/Light mode support.

## 🛠️ Tech Stack

- **Core**: React 19 + TypeScript + Vite
- **Processing**: 
  - [jsquash](https://github.com/GoogleChromeLabs/jsquash) (WASM codecs for JPEG, PNG, WebP, and AVIF)
  - OffscreenCanvas for hardware-accelerated resizing
  - custom `WorkerPool` for parallel task scheduling
- **Icons**: Lucide React
- **Styling**: SCSS (Sass)
- **Utilities**: Comlink, JSZip, Pica

## 📁 Project Structure

```text
/src
  /components      # UI components (ThemeToggle, etc.)
  /scheduler       # WorkerPool management and task scheduling
  /utils           # Shared logic (image processing, types)
  /workers         # Web Workers for off-main-thread processing
  App.tsx          # Main application logic and UI
  App.scss         # Global styles and theme definitions
```

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License**. See the [LICENSE](LICENSE) file for details.

