import type { UnitDef } from '../types';
import { getUnitColor } from '../types';
import { isSameDay } from '../utils/date';

interface MonthDayCellProps {
  date: Date;
  unit: UnitDef | undefined;
  isCurrentMonth: boolean;
  onClick: () => void;
}

export function MonthDayCell({ date, unit, isCurrentMonth, onClick }: MonthDayCellProps) {
  const today = isSameDay(date, new Date());
  const colors = unit ? getUnitColor(unit) : null;

  return (
    <button
      onClick={onClick}
      className={`flex min-h-20 flex-col items-center gap-1.5 rounded-lg border p-2 transition sm:min-h-28 sm:p-3
        ${colors ? `${colors.bg} ${colors.border}` : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'}
        ${today ? 'ring-2 ring-white/40' : ''}
        ${isCurrentMonth ? '' : 'opacity-40'}
      `}
    >
      <span className="text-base font-medium text-neutral-200 sm:text-lg">{date.getDate()}</span>
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
