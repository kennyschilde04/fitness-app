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
    <header className="mx-auto mb-4 flex w-full max-w-5xl items-center gap-3 sm:mb-5">
      {backLabel ? (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-sm leading-none text-neutral-400 transition-transform active:scale-95 hover:text-neutral-200 light:text-neutral-500 light:hover:text-neutral-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          <span>{backLabel}</span>
        </button>
      ) : (
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-2xl py-1 transition-transform active:scale-95"
          aria-label="Zur Startseite"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-lime-300 text-sm font-black text-neutral-950 shadow-lg shadow-lime-300/20 light:bg-lime-500 light:text-white">
            GT
          </span>
        </button>
      )}

      <h1 className="text-base font-black text-neutral-100 sm:text-lg light:text-neutral-950">
        {title ?? 'Gym Tracker'}
      </h1>

      <div className="relative ml-auto" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950/60 text-neutral-400 transition-transform active:scale-90 hover:text-neutral-200 light:border-neutral-200 light:bg-white/80 light:text-neutral-500 light:hover:text-neutral-700"
          aria-label="Menü öffnen"
          aria-expanded={menuOpen}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
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
