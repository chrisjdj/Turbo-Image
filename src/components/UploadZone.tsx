import React, { useRef, useState } from 'react';
import { UploadCloud, ImagePlus } from 'lucide-react';

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
}

/**
 * Drop target + explicit "Choose images" button. The whole area is clickable for
 * mouse users; keyboard and screen-reader users get a real <button>.
 */
export const UploadZone: React.FC<UploadZoneProps> = ({ onFiles }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  return (
    <div
      className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
      onClick={e => {
        if ((e.target as HTMLElement).closest('button')) return;
        openPicker();
      }}
      onDragOver={e => {
        e.preventDefault();
        if (!isDragging) setIsDragging(true);
      }}
      onDragLeave={e => {
        // Ignore dragleave events fired when moving over child elements.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragging(false);
      }}
      onDrop={e => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) onFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <span className="dropzone__icon" aria-hidden>
        <UploadCloud size={24} />
      </span>
      <h2 className="dropzone__title">Drop images here</h2>
      <p className="dropzone__hint">
        JPEG, PNG, WebP, AVIF, GIF, BMP or SVG. You can also paste with <kbd>Ctrl</kbd>+<kbd>V</kbd>.
        Everything is processed on your device.
      </p>
      <button type="button" className="btn btn--primary" onClick={openPicker}>
        <ImagePlus size={16} aria-hidden /> Choose images
      </button>
      <input
        type="file"
        multiple
        accept="image/*,.svg,.avif"
        hidden
        ref={inputRef}
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) onFiles(Array.from(e.target.files));
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default UploadZone;
