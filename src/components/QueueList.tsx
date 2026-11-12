import React from 'react';
import { CheckCircle, Download, RotateCcw, X, AlertCircle, Loader2, Clock } from 'lucide-react';
import type { QueueItem } from '../hooks/useImageQueue';
import { formatSize, percentChange } from '../utils/format';

interface QueueListProps {
  items: QueueItem[];
  onCompare: (item: QueueItem) => void;
  onDownload: (item: QueueItem) => void;
  onRetry: (item: QueueItem) => void;
  onRemove: (item: QueueItem) => void;
}

const STATUS_LABEL: Record<QueueItem['status'], string> = {
  queued: 'Queued',
  processing: 'Processing',
  done: 'Done',
  error: 'Error',
};

const StatusIcon: React.FC<{ status: QueueItem['status'] }> = ({ status }) => {
  switch (status) {
    case 'done':
      return <CheckCircle size={14} aria-hidden />;
    case 'processing':
      return <Loader2 size={14} className="spin" aria-hidden />;
    case 'error':
      return <AlertCircle size={14} aria-hidden />;
    default:
      return <Clock size={14} aria-hidden />;
  }
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

  return (
    <li className="queue-item">
      <button
        type="button"
        className="preview-btn"
        onClick={() => onCompare(item)}
        disabled={!isDone}
        aria-label={isDone ? `Compare original and optimized ${item.file.name}` : `Preview of ${item.file.name}`}
      >
        <img
          src={item.resultUrl ?? item.originalUrl}
          alt=""
          className="preview"
          loading="lazy"
          decoding="async"
        />
      </button>

      <div className="details">
        <div className="name" title={item.file.name}>{item.file.name}</div>
        <div className="stats">
          <span>{formatSize(item.file.size)}</span>
          {isDone && (
            <>
              <span>→ {formatSize(item.resultBlob!.size)}</span>
              {item.keptOriginal ? (
                <span className="badge-muted" title="The re-encoded file was larger, so the original was kept.">
                  Already optimal
                </span>
              ) : (
                <span className={`reduction ${change > 0 ? 'increase' : ''}`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
              )}
              <span className="time">⏱ {Math.round(item.timeMs ?? 0)}ms</span>
            </>
          )}
          {item.status === 'error' && item.errorMsg && <span className="error-text">{item.errorMsg}</span>}
        </div>
      </div>

      <div className={`status ${item.status}`}>
        <StatusIcon status={item.status} />
        <span>{STATUS_LABEL[item.status]}</span>
      </div>

      <div className="row-actions">
        {isDone && (
          <button type="button" className="icon-btn" onClick={() => onDownload(item)} aria-label={`Download optimized ${item.file.name}`} title="Download">
            <Download size={16} aria-hidden />
          </button>
        )}
        {item.status === 'error' && (
          <button type="button" className="icon-btn" onClick={() => onRetry(item)} aria-label={`Retry ${item.file.name}`} title="Retry">
            <RotateCcw size={16} aria-hidden />
          </button>
        )}
        <button type="button" className="icon-btn subtle" onClick={() => onRemove(item)} aria-label={`Remove ${item.file.name}`} title="Remove">
          <X size={16} aria-hidden />
        </button>
      </div>
    </li>
  );
};

export const QueueList: React.FC<QueueListProps> = ({ items, ...handlers }) => (
  <section className="queue-list" aria-label="Processing queue">
    <ul>
      {items.map(item => (
        <QueueRow key={item.id} item={item} {...handlers} />
      ))}
    </ul>
  </section>
);

export default QueueList;
