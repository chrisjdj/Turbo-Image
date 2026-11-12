import React from 'react';
import { Layers, ShieldCheck, LayoutGrid } from 'lucide-react';
import ThemeSwitch from './ThemeSwitch';
import type { ThemePreference } from '../hooks/useTheme';

interface AppHeaderProps {
  theme: ThemePreference;
  onThemeChange: (pref: ThemePreference) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ theme, onThemeChange }) => (
  <header className="app-header">
    <div className="container app-header__inner">
      <a className="brand" href="./" aria-label="TurboImage home">
        <span className="brand__mark" aria-hidden>
          <Layers size={18} />
        </span>
        <span className="brand__text">
          <span className="brand__name">TurboImage</span>
          <span className="brand__tagline">Fast, private image compression in your browser</span>
        </span>
      </a>

      <div className="app-header__actions">
        <span className="badge badge--success privacy-pill">
          <ShieldCheck size={14} aria-hidden /> 100% on-device
        </span>
        <a className="btn btn--ghost btn--sm hub-link" href="https://chrisjdj.github.io/web-tools/" title="More free tools">
          <LayoutGrid size={16} aria-hidden />
          <span className="hub-link__label">All tools</span>
        </a>
        <ThemeSwitch preference={theme} onChange={onThemeChange} />
      </div>
    </div>
  </header>
);

export default AppHeader;
