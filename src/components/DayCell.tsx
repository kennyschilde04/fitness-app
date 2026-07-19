import type { UnitDef } from '../types';
import { getUnitColor } from '../types';
import { formatDayMonth, isSameDay, weekdayLabel } from '../utils/date';
import { useLongPress } from '../utils/useLongPress';

interface DayCellProps {
  date: Date;
  unit: UnitDef | undefined;
  onClick: () => void;
  onLongPress?: (x: number, y: number) => void;
}

export function DayCell({ date, unit, onClick, onLongPress }: DayCellProps) {
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
      className={`flex h-full min-h-14 flex-col items-center gap-1.5 rounded-xl border p-2.5 text-left transition-all duration-150 active:scale-95
        ${colors ? `${colors.bg} ${colors.border}` : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700 light:bg-white light:hover:border-neutral-300'}
      `}
    >
      <div className="w-full">
        <div className="text-xs font-medium uppercase tracking-wide text-neutral-400 light:text-neutral-500">
          {weekdayLabel(date)}
        </div>
        <div className={`text-sm ${today ? 'font-semibold text-red-400' : 'text-neutral-300 light:text-neutral-700'}`}>
          {formatDayMonth(date)}
        </div>
      </div>

      <div className="mt-auto w-full">
        {unit ? (
          <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${colors!.text}`}>
            {unit.name}
          </span>
        ) : (
          <span className="text-xs text-neutral-600 light:text-neutral-400">+ Einheit</span>
        )}
      </div>
    </button>
  );
}
