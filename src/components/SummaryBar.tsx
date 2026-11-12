import React, { useState } from 'react';
import { Download, Trash2, Loader2 } from 'lucide-react';
import type { QueueItem } from '../hooks/useImageQueue';
import { formatSize, percentChange } from '../utils/format';

interface SummaryBarProps {
  items: QueueItem[];
  onDownloadAll: () => Promise<void>;
  onClearAll: () => void;
}

export const SummaryBar: React.FC<SummaryBarProps> = ({ items, onDownloadAll, onClearAll }) => {
  const [zipping, setZipping] = useState(false);

  const done = items.filter(it => it.status === 'done' && it.resultBlob);
  const finished = items.filter(it => it.status === 'done' || it.status === 'error').length;
  const originalTotal = done.reduce((sum, it) => sum + it.file.size, 0);
  const resultTotal = done.reduce((sum, it) => sum + (it.resultBlob?.size ?? 0), 0);
  const saved = originalTotal - resultTotal;
  const change = percentChange(originalTotal, resultTotal);
  const progress = items.length ? Math.round((finished / items.length) * 100) : 0;
  const busy = finished < items.length;

  const handleZip = async () => {
    setZipping(true);
    try {
      await onDownloadAll();
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="card summary-bar">
      <div className="summary-bar__stats" aria-live="polite">
        <div className="summary-bar__headline">
          {done.length > 0 && saved > 0 ? (
            <>
              <span>Saved <strong>{formatSize(saved)}</strong></span>
              <span className="badge badge--success">{change}%</span>
            </>
          ) : done.length > 0 ? (
            <>Total {formatSize(resultTotal)}</>
          ) : (
            <>Optimizing…</>
          )}
        </div>
        <div className="summary-bar__sub">
          {finished}/{items.length} processed
          {done.length > 0 && <> · {formatSize(originalTotal)} → {formatSize(resultTotal)}</>}
        </div>
        {busy && (
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Batch progress">
            <div className="progress__fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div className="summary-bar__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleZip}
          disabled={done.length === 0 || zipping}
        >
          {zipping ? <Loader2 size={16} className="spin" aria-hidden /> : <Download size={16} aria-hidden />}
          {zipping ? 'Zipping…' : `Download ZIP${done.length ? ` (${done.length})` : ''}`}
        </button>
        <button type="button" className="btn btn--secondary" onClick={onClearAll} aria-label="Clear all images">
          <Trash2 size={16} aria-hidden /> Clear
        </button>
      </div>
    </div>
  );
};

export default SummaryBar;
