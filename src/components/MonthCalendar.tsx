import type { Session, UnitDef } from '../types';
import { addMonths, formatMonthYear, getMonthGridDays, getMonthStart, toISODate } from '../utils/date';
import { MonthDayCell } from './MonthDayCell';

interface MonthCalendarProps {
  monthStart: Date;
  onMonthStartChange: (date: Date) => void;
  units: UnitDef[];
  getSessionForDate: (date: string) => Session | undefined;
  onDayClick: (date: Date) => void;
}

const WEEKDAY_HEADERS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function MonthCalendar({
  monthStart,
  onMonthStartChange,
  units,
  getSessionForDate,
  onDayClick,
}: MonthCalendarProps) {
  const days = getMonthGridDays(monthStart);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => onMonthStartChange(addMonths(monthStart, -1))}
          className="rounded-lg border border-neutral-800 px-3 py-2 text-neutral-300 transition-transform active:scale-90 hover:bg-neutral-800"
          aria-label="Vorheriger Monat"
        >
          ←
        </button>

        <div className="flex flex-col items-center">
          <span className="text-lg font-semibold text-neutral-100">{formatMonthYear(monthStart)}</span>
          <button
            onClick={() => onMonthStartChange(getMonthStart(new Date()))}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Heute
          </button>
        </div>

        <button
          onClick={() => onMonthStartChange(addMonths(monthStart, 1))}
          className="rounded-lg border border-neutral-800 px-3 py-2 text-neutral-300 transition-transform active:scale-90 hover:bg-neutral-800"
          aria-label="Nächster Monat"
        >
          →
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-2 sm:gap-3">
        {WEEKDAY_HEADERS.map((d) => (
          <span key={d} className="text-center text-xs font-medium uppercase tracking-wide text-neutral-500">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-3">
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
            />
          );
        })}
      </div>
    </div>
  );
}
