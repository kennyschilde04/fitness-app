import type { UnitDef } from '../types';
import { getUnitColor } from '../types';
import { formatDayMonth, isSameDay, weekdayLabel } from '../utils/date';

interface DayCellProps {
  date: Date;
  unit: UnitDef | undefined;
  onClick: () => void;
}

export function DayCell({ date, unit, onClick }: DayCellProps) {
  const today = isSameDay(date, new Date());
  const colors = unit ? getUnitColor(unit) : null;

  return (
    <button
      onClick={onClick}
      className={`flex min-h-[120px] flex-col items-center gap-2 rounded-xl border p-3 text-left transition-all duration-150 active:scale-95
        ${colors ? `${colors.bg} ${colors.border}` : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'}
        ${today ? 'ring-2 ring-white/40' : ''}
      `}
    >
      <div className="w-full">
        <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">{weekdayLabel(date)}</div>
        <div className="text-sm text-neutral-300">{formatDayMonth(date)}</div>
      </div>

      <div className="mt-auto w-full">
        {unit ? (
          <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${colors!.text}`}>
            {unit.name}
          </span>
        ) : (
          <span className="text-xs text-neutral-600">+ Einheit</span>
        )}
      </div>
    </button>
  );
}
