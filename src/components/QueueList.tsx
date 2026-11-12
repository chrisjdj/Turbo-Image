import React from 'react';
import { CheckCircle2, Download, RotateCcw, X, AlertCircle, Loader2, Clock } from 'lucide-react';
import type { QueueItem } from '../hooks/useImageQueue';
import { formatSize, percentChange } from '../utils/format';

interface QueueListProps {
  items: QueueItem[];
  onCompare: (item: QueueItem) => void;
  onDownload: (item: QueueItem) => void;
  onRetry: (item: QueueItem) => void;
  onRemove: (item: QueueItem) => void;
}

const STATUS: Record<QueueItem['status'], { label: string; badge: string; Icon: typeof Clock }> = {
  queued: { label: 'Queued', badge: '', Icon: Clock },
  processing: { label: 'Processing', badge: 'badge--info status--processing', Icon: Loader2 },
  done: { label: 'Done', badge: 'badge--success', Icon: CheckCircle2 },
  error: { label: 'Error', badge: 'badge--danger', Icon: AlertCircle },
};

const QueueRow: React.FC<{ item: QueueItem } & Omit<QueueListProps, 'items'>> = ({
  item,
  onCompare,
  onDownload,
  onRetry,
  onRemove,
}) => {
  const isDone = item.status === 'done' && !!item.resultBlob;
  const change = isDone ? percentChange(item.file.size, item.resultBlob!.size) : 0;
  const status = STATUS[item.status];

  return (
    <li className="queue-item">
      <button
        type="button"
        className="queue-item__thumb checkerboard"
        onClick={() => onCompare(item)}
        disabled={!isDone}
        aria-label={isDone ? `Compare original and optimized ${item.file.name}` : `Preview of ${item.file.name}`}
      >
        <img src={item.resultUrl ?? item.originalUrl} alt="" loading="lazy" decoding="async" />
      </button>

      <div className="queue-item__details">
        <div className="queue-item__name" title={item.file.name}>{item.file.name}</div>
        <div className="queue-item__stats">
          <span>{formatSize(item.file.size)}</span>
          {isDone && (
            <>
              <span>→ {formatSize(item.resultBlob!.size)}</span>
              {item.keptOriginal ? (
                <span className="badge" title="The re-encoded file was larger, so the original was kept.">
                  Already optimal
                </span>
              ) : (
                <span className={`badge ${change > 0 ? 'badge--danger' : 'badge--success'}`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
              )}
              <span>{Math.round(item.timeMs ?? 0)} ms</span>
            </>
          )}
          {item.status === 'error' && item.errorMsg && <span className="queue-item__error">{item.errorMsg}</span>}
        </div>
      </div>

      <span className={`badge ${status.badge} queue-item__status`}>
        <status.Icon size={12} aria-hidden />
        {status.label}
      </span>

      <div className="queue-item__actions">
        {isDone && (
          <button type="button" className="btn btn--ghost btn--icon" onClick={() => onDownload(item)} aria-label={`Download optimized ${item.file.name}`} title="Download">
            <Download size={16} aria-hidden />
          </button>
        )}
        {item.status === 'error' && (
          <button type="button" className="btn btn--ghost btn--icon" onClick={() => onRetry(item)} aria-label={`Retry ${item.file.name}`} title="Retry">
            <RotateCcw size={16} aria-hidden />
          </button>
        )}
        <button type="button" className="btn btn--ghost btn--icon" onClick={() => onRemove(item)} aria-label={`Remove ${item.file.name}`} title="Remove">
          <X size={16} aria-hidden />
        </button>
      </div>
    </li>
  );
};

export const QueueList: React.FC<QueueListProps> = ({ items, ...handlers }) => (
  <section className="card" aria-label="Processing queue">
    <ul className="queue">
      {items.map(item => (
        <QueueRow key={item.id} item={item} {...handlers} />
      ))}
    </ul>
  </section>
);

export default QueueList;
