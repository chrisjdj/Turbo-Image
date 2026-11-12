import React from 'react';
import { Settings2, RefreshCw } from 'lucide-react';
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
    <div className="card">
      <div className="card__header">
        <h2 className="card__title">
          <Settings2 size={16} aria-hidden /> Output settings
        </h2>
      </div>

      <div className="card__body">
        <div className="field">
          <label className="field__label" htmlFor="opt-format">Format</label>
          <select
            id="opt-format"
            className="select"
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
          <label className="checkbox">
            <input
              type="checkbox"
              checked={!!options.lossless}
              onChange={e => set({ lossless: e.target.checked })}
            />
            Lossless
          </label>
        )}

        {usesQuality ? (
          <div className="field">
            <label className="field__label" htmlFor="opt-quality">
              Quality
              <output className="field__value" htmlFor="opt-quality">{options.quality}%</output>
            </label>
            <input
              id="opt-quality"
              className="slider"
              type="range"
              min="1"
              max="100"
              value={options.quality}
              onChange={e => set({ quality: parseInt(e.target.value, 10) })}
            />
          </div>
        ) : (
          <p className="field__hint">
            {options.format === 'png'
              ? 'PNG is lossless, so there is no quality setting. OxiPNG shrinks the file without changing any pixels.'
              : 'Lossless mode keeps every pixel, so there is no quality setting.'}
          </p>
        )}

        <fieldset className="field">
          <legend className="field__label">Max size (px, optional)</legend>
          <div className="dimension-row">
            <input
              type="number"
              className="input"
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
              className="input"
              min={1}
              inputMode="numeric"
              placeholder="Height"
              aria-label="Max height in pixels"
              value={options.maxHeight ?? ''}
              onChange={e => set({ maxHeight: parseDimension(e.target.value) })}
            />
          </div>
          <p className="field__hint">Images keep their aspect ratio and are never upscaled.</p>
        </fieldset>

        {canReprocess && (
          <button type="button" className="btn btn--secondary btn--block" onClick={onReprocessAll}>
            <RefreshCw size={16} aria-hidden /> Apply to all images
          </button>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
