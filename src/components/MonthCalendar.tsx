import type { Session, UnitDef } from '../types';
import { addMonths, formatMonthYear, getMonthGridDays, toISODate } from '../utils/date';
import { MonthDayCell } from './MonthDayCell';

interface MonthCalendarProps {
  monthStart: Date;
  onMonthStartChange: (date: Date) => void;
  units: UnitDef[];
  getSessionForDate: (date: string) => Session | undefined;
  onDayClick: (date: Date) => void;
  onDayLongPress?: (date: Date) => void;
}

const WEEKDAY_HEADERS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function MonthCalendar({
  monthStart,
  onMonthStartChange,
  units,
  getSessionForDate,
  onDayClick,
  onDayLongPress,
}: MonthCalendarProps) {
  const days = getMonthGridDays(monthStart);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => onMonthStartChange(addMonths(monthStart, -1))}
          className="rounded-lg border border-neutral-800 px-3 py-2 text-neutral-300 transition-transform active:scale-90 hover:bg-neutral-800 light:border-neutral-300 light:text-neutral-600 light:hover:bg-neutral-100"
          aria-label="Vorheriger Monat"
        >
          ←
        </button>

        <span className="text-lg font-semibold text-neutral-100 light:text-neutral-900">
          {formatMonthYear(monthStart)}
        </span>

        <button
          onClick={() => onMonthStartChange(addMonths(monthStart, 1))}
          className="rounded-lg border border-neutral-800 px-3 py-2 text-neutral-300 transition-transform active:scale-90 hover:bg-neutral-800 light:border-neutral-300 light:text-neutral-600 light:hover:bg-neutral-100"
          aria-label="Nächster Monat"
        >
          →
        </button>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1 sm:gap-1.5">
        {WEEKDAY_HEADERS.map((d) => (
          <span key={d} className="text-center text-xs font-medium uppercase tracking-wide text-neutral-500">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {days.map((date) => {
          const session = getSessionForDate(toISODate(date));
          const unit = session ? units.find((u) => u.id === session.unitId) : undefined;
          return (
            <MonthDayCell
              key={toISODate(date)}
              date={date}
              unit={unit}
              isCurrentMonth={date.getMonth() === monthStart.getMonth()}
              onClick={() => onDayClick(date)}
              onLongPress={() => onDayLongPress?.(date)}
            />
          );
        })}
      </div>
    </div>
  );
}
