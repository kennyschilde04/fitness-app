import { useRef } from 'react';

export function useLongPress(onLongPress: () => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  function start() {
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress();
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
