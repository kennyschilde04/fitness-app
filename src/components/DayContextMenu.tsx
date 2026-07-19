import { useEffect, useRef } from 'react';

interface DayContextMenuProps {
  x: number;
  y: number;
  onDelete: () => void;
  onClose: () => void;
}

export function DayContextMenu({ x, y, onDelete, onClose }: DayContextMenuProps) {
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

  const left = Math.min(x, window.innerWidth - 160);
  const top = Math.min(y, window.innerHeight - 60);

  return (
    <div
      ref={ref}
      style={{ left, top }}
      className="fixed z-[60] w-40 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 shadow-2xl light:border-neutral-200 light:bg-white"
    >
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="block w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
      >
        Löschen
      </button>
    </div>
  );
}
