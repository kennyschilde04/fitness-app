import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'purple' | 'light' | 'midnight' | 'ember' | 'mint' | 'mono';

const THEME_KEY = 'gym-tracker-theme';
// Achtung: index.html setzt dieselbe Liste noch einmal, um das Theme vor dem
// ersten Paint anzuwenden. Neue Themes dort mit ergänzen, sonst blitzt beim
// Laden kurz das Default-Theme auf.
const THEMES: Theme[] = ['dark', 'purple', 'light', 'midnight', 'ember', 'mint', 'mono'];
const LIGHT_THEMES: Theme[] = ['light', 'mint'];

function loadTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  return THEMES.includes(stored as Theme) ? (stored as Theme) : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(loadTheme);

  useEffect(() => {
    document.documentElement.classList.remove(...THEMES);
    document.documentElement.classList.add(theme);
    document.documentElement.classList.toggle('light', LIGHT_THEMES.includes(theme));
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, setTheme, toggleTheme };
}
