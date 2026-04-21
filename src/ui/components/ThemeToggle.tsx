'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/core/theme/useTheme';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={styles.button}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon size={20} color="var(--secondary-foreground)" />
      ) : (
        <Sun size={20} color="var(--secondary-foreground)" />
      )}
    </button>
  );
};

const styles: Record<string, React.CSSProperties> = {
  button: {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    padding: '10px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--shadow-sm)',
  },
};
