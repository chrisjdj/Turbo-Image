import React from 'react';
import { Settings, Image as ImageIcon, SlidersHorizontal, Maximize2, RefreshCw } from 'lucide-react';
import type { ImageFormat, ProcessOptions } from '../utils/types';

interface SettingsPanelProps {
  options: ProcessOptions;
  onChange: (options: ProcessOptions) => void;
  canReprocess: boolean;
  onReprocessAll: () => void;
}

const parseDimension = (value: string): number | undefined => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ options, onChange, canReprocess, onReprocessAll }) => {
  const set = (changes: Partial<ProcessOptions>) => onChange({ ...options, ...changes });
  const supportsLossless = options.format === 'webp' || options.format === 'avif';
  const usesQuality = options.format !== 'png' && !(supportsLossless && options.lossless);

  return (
    <div className="panel settings-group">
      <h3><Settings size={18} className="panel-icon" aria-hidden /> Settings</h3>

      <div className="setting-item">
        <label htmlFor="opt-format"><ImageIcon size={14} className="label-icon" aria-hidden /> Target Format</label>
        <select
          id="opt-format"
          value={options.format}
          onChange={e => set({ format: e.target.value as ImageFormat })}
        >
          <option value="webp">WebP</option>
          <option value="avif">AVIF (smallest, slower)</option>
          <option value="jpeg">JPEG</option>
          <option value="png">PNG (lossless, OxiPNG)</option>
        </select>
      </div>

      {supportsLossless && (
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={!!options.lossless}
            onChange={e => set({ lossless: e.target.checked })}
          />
          Lossless
        </label>
      )}

      {usesQuality ? (
        <div className="setting-item">
          <label htmlFor="opt-quality">
            <SlidersHorizontal size={14} className="label-icon" aria-hidden /> Quality
            <span className="setting-value">{options.quality}%</span>
          </label>
          <input
            id="opt-quality"
            type="range"
            min="1"
            max="100"
            value={options.quality}
            onChange={e => set({ quality: parseInt(e.target.value, 10) })}
          />
        </div>
      ) : (
        <p className="setting-hint">
          {options.format === 'png'
            ? 'PNG is lossless, so there is no quality setting. OxiPNG shrinks the file without changing any pixels.'
            : 'Lossless mode keeps every pixel, so there is no quality setting.'}
        </p>
      )}

      <div className="setting-item">
        <span className="setting-label"><Maximize2 size={14} className="label-icon" aria-hidden /> Max size (px, optional)</span>
        <div className="dimension-row">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Width"
            aria-label="Max width in pixels"
            value={options.maxWidth ?? ''}
            onChange={e => set({ maxWidth: parseDimension(e.target.value) })}
          />
          <span aria-hidden>×</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Height"
            aria-label="Max height in pixels"
            value={options.maxHeight ?? ''}
            onChange={e => set({ maxHeight: parseDimension(e.target.value) })}
          />
        </div>
      </div>

      {canReprocess && (
        <button type="button" className="secondary-btn" onClick={onReprocessAll}>
          <RefreshCw size={16} aria-hidden /> Apply to all images
        </button>
      )}
    </div>
  );
};

export default SettingsPanel;
