import { useRef } from 'react';

export function useLongPress(onLongPress: (x: number, y: number) => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  function start(e: React.PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    firedRef.current = false;
    const x = e.clientX;
    const y = e.clientY;
    startRef.current = { x, y };
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress(x, y);
    }, ms);
  }

  function clear() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    startRef.current = null;
  }

  function move(e: React.PointerEvent) {
    if (!startRef.current || !timerRef.current) return;
    const dx = Math.abs(e.clientX - startRef.current.x);
    const dy = Math.abs(e.clientY - startRef.current.y);
    if (dx > 12 || dy > 12) clear();
  }

  return {
    onPointerDown: start,
    onPointerMove: move,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    wasLongPress: () => firedRef.current,
  };
}
