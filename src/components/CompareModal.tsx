import React, { useEffect, useRef, useState } from 'react';
import { X, Download, ChevronsLeftRight } from 'lucide-react';
import type { QueueItem } from '../hooks/useImageQueue';
import { formatSize, percentChange } from '../utils/format';

interface CompareModalProps {
  item: QueueItem;
  onClose: () => void;
  onDownload: (item: QueueItem) => void;
}

/**
 * Before/after slider comparing the original file with the optimized output.
 * Uses native <dialog> + showModal() for focus trapping, Esc and inert background.
 */
export const CompareModal: React.FC<CompareModalProps> = ({ item, onClose, onDownload }) => {
  const [position, setPosition] = useState(50);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (!dialog.open) dialog.showModal();
    // Ignore a stale 'close' event queued by a previous cleanup (StrictMode re-runs effects).
    const handleClose = () => {
      if (!dialog.open) onClose();
    };
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
      if (dialog.open) dialog.close();
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
    <dialog
      ref={dialogRef}
      className="dialog compare-dialog"
      aria-labelledby="compare-title"
      onClick={e => {
        // Click on the backdrop (the dialog element itself, outside its content) closes it.
        if (e.target === e.currentTarget) dialogRef.current?.close();
      }}
    >
      <div className="dialog__header">
        <h2 id="compare-title" className="dialog__title" title={item.file.name}>{item.file.name}</h2>
        <button type="button" className="btn btn--ghost btn--icon" onClick={() => dialogRef.current?.close()} aria-label="Close comparison" autoFocus>
          <X size={18} aria-hidden />
        </button>
      </div>

      <div className="dialog__body">
        <div
          className="compare-stage checkerboard"
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
            className="compare-stage__img"
            style={{ clipPath: `inset(0 0 0 ${position}%)` }}
            draggable={false}
          />
          <img
            src={item.originalUrl}
            alt="Original"
            className="compare-stage__img"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            draggable={false}
          />
          <div className="compare-stage__divider" style={{ left: `${position}%` }} aria-hidden>
            <span className="compare-stage__handle">
              <ChevronsLeftRight size={18} />
            </span>
          </div>
          <span className="compare-stage__tag compare-stage__tag--left">Original · {formatSize(item.file.size)}</span>
          <span className="compare-stage__tag compare-stage__tag--right">Optimized · {formatSize(resultSize)}</span>
        </div>
      </div>

      <div className="dialog__footer compare-footer">
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(position)}
          onChange={e => setPosition(Number(e.target.value))}
          aria-label="Comparison slider position"
          className="slider"
        />
        <span className={`badge ${change > 0 ? 'badge--danger' : 'badge--success'}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
        <button type="button" className="btn btn--primary" onClick={() => onDownload(item)}>
          <Download size={16} aria-hidden /> Download
        </button>
      </div>
    </dialog>
  );
};

export default CompareModal;
