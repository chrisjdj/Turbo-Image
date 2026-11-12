import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
    >
      <div className={`icon-container ${theme}`}>
        {theme === 'dark' ? <Moon size={20} className="moon-icon" aria-hidden /> : <Sun size={20} className="sun-icon" aria-hidden />}
      </div>
    </button>
  );
};

export default ThemeToggle;
