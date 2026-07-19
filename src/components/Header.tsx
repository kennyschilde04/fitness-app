import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../state/useTheme';

interface HeaderProps {
  backLabel?: string;
  title?: string;
}

export function Header({ backLabel, title }: HeaderProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <header className="mx-auto mb-6 flex w-full max-w-5xl items-center gap-3 sm:mb-8">
      {backLabel ? (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-sm leading-none text-neutral-400 transition-transform active:scale-95 hover:text-neutral-200 light:text-neutral-500 light:hover:text-neutral-700"
        >
          <span className="-mt-0.5">←</span>
          <span>{backLabel}</span>
        </button>
      ) : (
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-md py-1 transition-transform active:scale-95"
          aria-label="Zur Startseite"
        >
          <span className="text-lg leading-none">🏋️</span>
        </button>
      )}

      <h1 className="text-base font-semibold tracking-tight text-neutral-100 sm:text-lg light:text-neutral-900">
        {title ?? 'Gym Tracker'}
      </h1>

      <div className="relative ml-auto" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-full px-3 py-1.5 text-lg leading-none tracking-wider text-neutral-500 transition-transform active:scale-90 hover:text-neutral-300 light:text-neutral-400 light:hover:text-neutral-600"
          aria-label="Menü öffnen"
          aria-expanded={menuOpen}
        >
          •••
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-10 mt-2 w-48 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 shadow-xl light:border-neutral-200 light:bg-white">
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate('/history');
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-neutral-300 transition-colors hover:bg-neutral-800 light:text-neutral-700 light:hover:bg-neutral-100"
            >
              Insight
            </button>
            <button
              onClick={() => {
                toggleTheme();
                setMenuOpen(false);
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-neutral-300 transition-colors hover:bg-neutral-800 light:text-neutral-700 light:hover:bg-neutral-100"
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
