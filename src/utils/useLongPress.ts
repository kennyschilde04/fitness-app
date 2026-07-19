import { useRef } from 'react';

export function useLongPress(onLongPress: (x: number, y: number) => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  function start(e: React.PointerEvent) {
    firedRef.current = false;
    const x = e.clientX;
    const y = e.clientY;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress(x, y);
    }, ms);
  }

  function clear() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    wasLongPress: () => firedRef.current,
  };
}
