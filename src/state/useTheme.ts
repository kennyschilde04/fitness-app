import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'purple' | 'light' | 'midnight' | 'ember' | 'mint' | 'mono';

const THEME_KEY = 'gym-tracker-theme';
const THEMES: Theme[] = ['dark', 'purple', 'light', 'midnight', 'ember', 'mint', 'mono'];

function loadTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  return THEMES.includes(stored as Theme) ? (stored as Theme) : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(loadTheme);

  useEffect(() => {
    document.documentElement.classList.remove(...THEMES);
    document.documentElement.classList.add(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, setTheme, toggleTheme };
}
