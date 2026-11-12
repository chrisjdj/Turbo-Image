import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFiles }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  return (
    <div
      className={`panel upload-zone ${isDragging ? 'drag-active' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Upload images: drop files here, click to choose, or paste from the clipboard"
      onClick={openPicker}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPicker();
        }
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
      <UploadCloud size={48} className="icon" aria-hidden />
      <h2>Drop images here or click to upload</h2>
      <p>
        You can also paste with <kbd>Ctrl</kbd>+<kbd>V</kbd>. Everything is processed on your device;
        nothing is uploaded.
      </p>
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
