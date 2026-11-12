import { useCallback, useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import type { ImageFormat, ProcessOptions } from './utils/types';
import { useImageQueue } from './hooks/useImageQueue';
import { usePersistentState } from './hooks/usePersistentState';
import { useTheme } from './hooks/useTheme';
import AppHeader from './components/AppHeader';
import SettingsPanel from './components/SettingsPanel';
import UploadZone from './components/UploadZone';
import SummaryBar from './components/SummaryBar';
import QueueList from './components/QueueList';
import CompareModal from './components/CompareModal';
import { Footer } from './components/Footer';

const DEFAULT_OPTIONS: ProcessOptions = { format: 'webp', quality: 80 };
const FORMATS: ImageFormat[] = ['jpeg', 'png', 'webp', 'avif'];

const isProcessOptions = (v: unknown): v is ProcessOptions => {
  const o = v as ProcessOptions;
  return !!o && FORMATS.includes(o.format) && typeof o.quality === 'number' && o.quality >= 1 && o.quality <= 100;
};

function App() {
  const [options, setOptions] = usePersistentState<ProcessOptions>('turbo-options', DEFAULT_OPTIONS, isProcessOptions);
  const { preference: theme, setPreference: setTheme } = useTheme();
  const [compareId, setCompareId] = useState<string | null>(null);
  const queue = useImageQueue();
  const { addFiles } = queue;

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
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <AppHeader theme={theme} onThemeChange={setTheme} />

      <main id="main" className="app-main" tabIndex={-1}>
        <div className="container">
          <h1 className="sr-only">TurboImage — compress and convert images in your browser</h1>
          <div className="tool-layout">
            <section className="tool-layout__workspace" aria-label="Images">
              <UploadZone onFiles={handleFiles} />

              {queue.notice && (
                <div className="alert alert--warning" role="status">
                  <Info size={16} aria-hidden />
                  <span className="alert__body">{queue.notice}</span>
                  <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={queue.dismissNotice} aria-label="Dismiss message">
                    <X size={16} aria-hidden />
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

            <aside className="tool-layout__sidebar" aria-label="Output settings">
              <SettingsPanel
                options={options}
                onChange={setOptions}
                canReprocess={queue.items.length > 0}
                onReprocessAll={() => queue.reprocessAll(options)}
              />
            </aside>
          </div>
        </div>
      </main>

      <Footer />

      {compareItem && <CompareModal item={compareItem} onClose={closeCompare} onDownload={queue.downloadOne} />}
    </>
  );
}

export default App;
