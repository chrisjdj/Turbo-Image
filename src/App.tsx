import { useCallback, useEffect, useState } from 'react';
import { Layers, Info, X } from 'lucide-react';
import type { ImageFormat, ProcessOptions } from './utils/types';
import { useImageQueue } from './hooks/useImageQueue';
import { usePersistentState } from './hooks/usePersistentState';
import ThemeToggle from './components/ThemeToggle';
import SettingsPanel from './components/SettingsPanel';
import UploadZone from './components/UploadZone';
import SummaryBar from './components/SummaryBar';
import QueueList from './components/QueueList';
import CompareModal from './components/CompareModal';
import { Footer } from './components/Footer';

type Theme = 'dark' | 'light';

const DEFAULT_OPTIONS: ProcessOptions = { format: 'webp', quality: 80 };
const FORMATS: ImageFormat[] = ['jpeg', 'png', 'webp', 'avif'];

const isProcessOptions = (v: unknown): v is ProcessOptions => {
  const o = v as ProcessOptions;
  return !!o && FORMATS.includes(o.format) && typeof o.quality === 'number' && o.quality >= 1 && o.quality <= 100;
};

function getInitialTheme(): Theme {
  // index.html sets data-theme before React loads, so there is no flash of the wrong theme.
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function App() {
  const [options, setOptions] = usePersistentState<ProcessOptions>('turbo-options', DEFAULT_OPTIONS, isProcessOptions);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [compareId, setCompareId] = useState<string | null>(null);
  const queue = useImageQueue();
  const { addFiles } = queue;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const handleFiles = useCallback((files: File[]) => addFiles(files, options), [addFiles, options]);

  // Clipboard paste (Ctrl/Cmd+V) anywhere on the page, except inside form fields.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select')) return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length > 0) {
        e.preventDefault();
        handleFiles(files);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleFiles]);

  const compareItem = queue.items.find(it => it.id === compareId && it.status === 'done') ?? null;
  const closeCompare = useCallback(() => setCompareId(null), []);

  return (
    <main className="app-container">
      <ThemeToggle theme={theme} toggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))} />
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Layers className="logo-icon" size={40} aria-hidden />
          </div>
          <div className="title-area">
            <h1>TurboImage</h1>
            <p>Ultra-fast local browser image compression</p>
          </div>
        </div>
      </header>

      <aside className="sidebar">
        <SettingsPanel
          options={options}
          onChange={setOptions}
          canReprocess={queue.items.length > 0}
          onReprocessAll={() => queue.reprocessAll(options)}
        />
      </aside>

      <section className="main-content">
        <UploadZone onFiles={handleFiles} />

        {queue.notice && (
          <div className="notice" role="status">
            <Info size={16} aria-hidden />
            <span>{queue.notice}</span>
            <button type="button" className="icon-btn subtle" onClick={queue.dismissNotice} aria-label="Dismiss message">
              <X size={14} aria-hidden />
            </button>
          </div>
        )}

        {queue.items.length > 0 && (
          <>
            <SummaryBar items={queue.items} onDownloadAll={queue.downloadAll} onClearAll={queue.clearAll} />
            <QueueList
              items={queue.items}
              onCompare={item => setCompareId(item.id)}
              onDownload={queue.downloadOne}
              onRetry={item => queue.retry(item.id, options)}
              onRemove={item => queue.remove(item.id)}
            />
          </>
        )}
      </section>

      <Footer />

      {compareItem && <CompareModal item={compareItem} onClose={closeCompare} onDownload={queue.downloadOne} />}
    </main>
  );
}

export default App;
