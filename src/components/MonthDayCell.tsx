import type { UnitDef } from '../types';
import { getUnitColor } from '../types';
import { isSameDay } from '../utils/date';
import { useLongPress } from '../utils/useLongPress';

interface MonthDayCellProps {
  date: Date;
  unit: UnitDef | undefined;
  isCurrentMonth: boolean;
  onClick: () => void;
  onLongPress?: () => void;
}

export function MonthDayCell({ date, unit, isCurrentMonth, onClick, onLongPress }: MonthDayCellProps) {
  const today = isSameDay(date, new Date());
  const colors = unit ? getUnitColor(unit) : null;
  const longPress = useLongPress(() => onLongPress?.());

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
      className={`flex min-h-14 flex-col items-center gap-1 rounded-lg border p-1.5 transition-all duration-150 active:scale-95 sm:min-h-20 sm:p-2
        ${colors ? `${colors.bg} ${colors.border}` : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700 light:bg-white light:hover:border-neutral-300'}
        ${isCurrentMonth ? '' : 'opacity-40'}
      `}
    >
      <span className={`text-base font-medium sm:text-lg ${today ? 'text-red-400' : 'text-neutral-200 light:text-neutral-700'}`}>
        {date.getDate()}
      </span>
      {unit && (
        <span
          className={`w-full truncate text-center text-[10px] font-semibold leading-tight sm:whitespace-normal sm:break-words sm:text-sm ${colors!.text}`}
        >
          {unit.name}
        </span>
      )}
    </button>
  );
}
