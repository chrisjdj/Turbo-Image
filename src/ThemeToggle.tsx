import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      <div className={`icon-container ${theme}`}>
        {theme === 'dark' ? (
          <Moon size={20} className="moon-icon" />
        ) : (
          <Sun size={20} className="sun-icon" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
