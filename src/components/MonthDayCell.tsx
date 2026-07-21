import type { UnitDef } from '../types';
import { getUnitColor } from '../types';
import { isSameDay } from '../utils/date';
import { useLongPress } from '../utils/useLongPress';

interface MonthDayCellProps {
  date: Date;
  unit: UnitDef | undefined;
  isCurrentMonth: boolean;
  onClick: () => void;
  onLongPress?: (x: number, y: number) => void;
}

export function MonthDayCell({ date, unit, isCurrentMonth, onClick, onLongPress }: MonthDayCellProps) {
  const today = isSameDay(date, new Date());
  const colors = unit ? getUnitColor(unit) : null;
  const longPress = useLongPress((x, y) => onLongPress?.(x, y));

  return (
    <button
      onClick={() => {
        if (longPress.wasLongPress()) return;
        onClick();
      }}
      onPointerDown={longPress.onPointerDown}
      onPointerUp={longPress.onPointerUp}
      onPointerLeave={longPress.onPointerLeave}
      onPointerCancel={longPress.onPointerCancel}
      className={`flex h-[5.15rem] flex-col items-center justify-start rounded-2xl px-0.5 py-2 transition-all duration-150 active:scale-95
        ${isCurrentMonth ? '' : 'opacity-30'}
      `}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
          today
            ? 'bg-lime-300 text-neutral-950 light:bg-lime-500 light:text-white'
            : 'text-neutral-100 light:text-neutral-900'
        }`}
      >
        {date.getDate()}
      </span>
      {unit && (
        <div className={`mt-2 w-full rounded-full border px-1.5 py-1.5 ${colors!.bg} ${colors!.border}`}>
          <span className={`block truncate text-center text-[9px] font-black leading-none ${colors!.text}`}>
            {unit.name}
          </span>
        </div>
      )}
    </button>
  );
}
