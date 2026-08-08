import { useEffect, useRef } from 'react';

interface DayContextMenuProps {
  x: number;
  y: number;
  title?: string;
  onDelete: () => void;
  onClose: () => void;
}

export function DayContextMenu({ x, y, title = 'Training', onDelete, onClose }: DayContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const menuWidth = 220;
  const menuHeight = 116;
  const left = Math.max(12, Math.min(x - menuWidth / 2, window.innerWidth - menuWidth - 12));
  const top = Math.max(12, Math.min(y + 10, window.innerHeight - menuHeight - 12));

  return (
    <div
      ref={ref}
      style={{ left, top }}
      className="fixed z-[60] w-[220px] overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl light:border-neutral-200 light:bg-white/95"
    >
      <div className="px-3 pb-2 pt-2">
        <p className="text-xs font-black uppercase tracking-wide text-neutral-500">Auswahl</p>
        <p className="mt-0.5 truncate text-sm font-black text-neutral-100 light:text-neutral-950">{title}</p>
      </div>
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="block w-full rounded-2xl bg-red-500/10 px-3 py-3 text-left text-sm font-black text-red-300 transition-transform active:scale-[0.98] light:bg-red-50 light:text-red-600"
      >
        Training löschen
      </button>
    </div>
  );
}
