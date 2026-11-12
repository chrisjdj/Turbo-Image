import React, { useEffect, useRef, useState } from 'react';
import { X, Download } from 'lucide-react';
import type { QueueItem } from '../hooks/useImageQueue';
import { formatSize, percentChange } from '../utils/format';

interface CompareModalProps {
  item: QueueItem;
  onClose: () => void;
  onDownload: (item: QueueItem) => void;
}

/** Before/after slider comparing the original file with the optimized output. */
export const CompareModal: React.FC<CompareModalProps> = ({ item, onClose, onDownload }) => {
  const [position, setPosition] = useState(50);
  const closeRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const updateFromPointer = (clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPosition(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  };

  const resultSize = item.resultBlob?.size ?? 0;
  const change = percentChange(item.file.size, resultSize);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal compare-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="compare-title" title={item.file.name}>{item.file.name}</h2>
          <button ref={closeRef} type="button" className="icon-btn subtle" onClick={onClose} aria-label="Close comparison">
            <X size={18} aria-hidden />
          </button>
        </div>

        <div
          className="compare-stage"
          ref={stageRef}
          onPointerDown={e => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            updateFromPointer(e.clientX);
          }}
          onPointerMove={e => dragging.current && updateFromPointer(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          <img
            src={item.resultUrl}
            alt="Optimized"
            className="compare-img"
            style={{ clipPath: `inset(0 0 0 ${position}%)` }}
            draggable={false}
          />
          <img
            src={item.originalUrl}
            alt="Original"
            className="compare-img compare-original"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            draggable={false}
          />
          <div className="compare-divider" style={{ left: `${position}%` }} aria-hidden>
            <span className="compare-handle" />
          </div>
          <span className="compare-tag left">Original · {formatSize(item.file.size)}</span>
          <span className="compare-tag right">Optimized · {formatSize(resultSize)}</span>
        </div>

        <div className="modal-footer">
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(position)}
            onChange={e => setPosition(Number(e.target.value))}
            aria-label="Comparison slider position"
            className="compare-range"
          />
          <span className={`reduction ${change > 0 ? 'increase' : ''}`}>{change > 0 ? '+' : ''}{change}%</span>
          <button type="button" className="primary-btn compact" onClick={() => onDownload(item)}>
            <Download size={16} aria-hidden /> Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareModal;
