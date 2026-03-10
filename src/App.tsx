import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadCloud, Download, Settings, Image as ImageIcon, SlidersHorizontal, Layers, CheckCircle } from 'lucide-react';
import JSZip from 'jszip';
import { WorkerPool } from './scheduler/WorkerPool';
import type { ProcessOptions, ImageFormat } from './utils/types';
import ThemeToggle from './ThemeToggle';
import './App.scss';

// Single instance of pool
const pool = new WorkerPool();

interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  originalSize: number;
  resultBlob?: Blob;
  resultTimeMs?: number;
  errorMsg?: string;
  previewUrl: string;
}

async function loadSvgToBitmap(file: File): Promise<ImageBitmap> {
  const text = await file.text();
  // Create a clean blob from the text to avoid origin issues
  const blob = new Blob([text], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const MAX_DIMENSION = 4096;
        let width = img.naturalWidth || 800;
        let height = img.naturalHeight || 800;

        // Cap dimensions to avoid memory issues with massive SVGs
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = width / height;
          if (width > height) {
            width = MAX_DIMENSION;
            height = Math.round(MAX_DIMENSION / ratio);
          } else {
            height = MAX_DIMENSION;
            width = Math.round(MAX_DIMENSION * ratio);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");
        
        ctx.drawImage(img, 0, 0, width, height);
        const bitmap = await createImageBitmap(canvas);
        URL.revokeObjectURL(url);
        resolve(bitmap);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG image. It might contain external resources that prevent clean rasterization."));
    };
    img.src = url;
  });
}

function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [options, setOptions] = useState<ProcessOptions>({
    format: 'webp',
    quality: 80,
  });
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const newItems: QueueItem[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const id = Math.random().toString(36).substring(7);
      const previewUrl = URL.createObjectURL(file); // Fast low-res preview or original
      
      const item: QueueItem = {
        id,
        file,
        status: 'pending',
        originalSize: file.size,
        previewUrl,
      };
      
      newItems.push(item);
    }

    setQueue((prev) => [...newItems, ...prev]);

    // Dispatch to worker pool
    for (const item of newItems) {
      setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'processing' } : i));
      
      try {
        let bitmap: ImageBitmap;
        if (item.file.type === 'image/svg+xml') {
          bitmap = await loadSvgToBitmap(item.file);
        } else {
          bitmap = await createImageBitmap(item.file);
        }
        const result = await pool.schedule({
          id: item.id,
          bitmap,
          options,
          originalFileName: item.file.name,
          originalSize: item.file.size
        });
        
        setQueue(q => q.map(i => i.id === item.id ? {
          ...i,
          status: 'done',
          resultBlob: result.blob,
          resultTimeMs: result.timeMs,
          previewUrl: URL.createObjectURL(result.blob) // Update preview to compressed version
        } : i));
      } catch (err: any) {
        setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'error', errorMsg: err.message } : i));
      }
    }
  }, [options]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadZip = async () => {
    const doneItems = queue.filter(i => i.status === 'done' && i.resultBlob);
    if (doneItems.length === 0) return;

    const zip = new JSZip();
    doneItems.forEach(item => {
      // Replace extension
      const nameParts = item.file.name.split('.');
      nameParts.pop();
      const baseName = nameParts.join('.');
      const ext = options.format === 'jpeg' ? 'jpg' : options.format;
      zip.file(`${baseName}_optimized.${ext}`, item.resultBlob!);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = `optimized_images.zip`;
    a.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <main className="app-container">
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Layers className="logo-icon" size={40} />
          </div>
          <div className="title-area">
            <h1>TurboImage</h1>
            <p>Ultra-fast local browser image compression</p>
          </div>
        </div>
      </header>

      <aside className="sidebar">
        <div className="panel settings-group">
          <h3><Settings size={18} className="panel-icon" /> Settings</h3>
          
          <div className="setting-item">
            <label><ImageIcon size={14} className="label-icon"/> Target Format</label>
            <select 
              value={options.format}
              onChange={e => setOptions({...options, format: e.target.value as ImageFormat})}
            >
              <option value="jpeg">JPEG</option>
              <option value="png">PNG (Lossless)</option>
              <option value="webp">WebP</option>
              <option value="avif">AVIF</option>
            </select>
          </div>

          <div className="setting-item">
            <label><SlidersHorizontal size={14} className="label-icon"/> Quality ({options.quality}%)</label>
            <input 
              type="range" 
              min="1" max="100" 
              value={options.quality}
              onChange={e => setOptions({...options, quality: parseInt(e.target.value)})}
              disabled={options.format === 'png'}
            />
          </div>

          <div className="setting-item">
            <label><ImageIcon size={14} className="label-icon"/> Max Width (px, optional)</label>
            <input 
              type="number" 
              placeholder="e.g. 1920" 
              value={options.maxWidth || ''}
              onChange={e => setOptions({...options, maxWidth: e.target.value ? parseInt(e.target.value) : undefined})}
            />
          </div>
        </div>

        {queue.some(i => i.status === 'done') && (
          <div className="panel" style={{ marginTop: '1rem' }}>
            <button 
              className="primary-btn" 
              onClick={handleDownloadZip}
              style={{ width: '100%' }}
              aria-label="Download all optimized images as a ZIP file"
            >
              <Download size={20} style={{ marginRight: '0.5rem' }}/> 
              Download ZIP
            </button>
          </div>
        )}
      </aside>

      <section className="main-content">
        <div 
          className={`panel upload-zone ${isDragging ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud size={48} className="icon" />
          <h2>Drop images here or click to upload</h2>
          <p>Processes locally. No files are uploaded to any server.</p>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
        </div>

        {queue.length > 0 && (
          <div className="panel queue-list" style={{ marginTop: '1rem' }}>
            <h3>Processing Queue ({queue.filter(i => i.status === 'done').length}/{queue.length})</h3>
            {queue.map(item => (
              <div key={item.id} className="queue-item">
                <img src={item.previewUrl} alt="preview" className="preview" />
                <div className="details">
                  <div className="name">{item.file.name}</div>
                    <div className="stats">
                    <span>{formatSize(item.originalSize)}</span>
                    {item.resultBlob && (
                      <>
                        <span>→ {formatSize(item.resultBlob.size)}</span>
                        <span className={`reduction ${item.resultBlob.size > item.originalSize ? 'increase' : ''}`}>
                          {item.resultBlob.size > item.originalSize ? '+' : '-'}
                          {Math.abs(Math.round((1 - item.resultBlob.size / item.originalSize) * 100))}%
                        </span>
                        <span className="time">⏱ {Math.round(item.resultTimeMs || 0)}ms</span>
                      </>
                    )}
                    {item.errorMsg && <span style={{ color: '#ef4444' }}>{item.errorMsg}</span>}
                  </div>
                </div>
                <div className={`status ${item.status}`}>
                  {item.status === 'done' && <CheckCircle size={14} style={{ marginRight: '4px' }}/>}
                  {item.status.toUpperCase()}
                </div>
                {item.status === 'done' && item.resultBlob && (
                  <button 
                    className="download-btn"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = item.previewUrl;
                      const nameParts = item.file.name.split('.');
                      nameParts.pop();
                      a.download = `${nameParts.join('.')}_optimized.${options.format}`;
                      a.click();
                    }}
                    aria-label={`Download optimized ${item.file.name}`}
                  >
                    <Download size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
