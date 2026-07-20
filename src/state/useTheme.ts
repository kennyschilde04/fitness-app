import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const THEME_KEY = 'gym-tracker-theme';

function loadTheme(): Theme {
  return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(loadTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggleTheme };
}
