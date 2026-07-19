import type { Session, UnitDef } from '../types';
import { addWeeks, formatWeekRange, getWeekDays, getWeekStart, toISODate } from '../utils/date';
import { DayCell } from './DayCell';

interface WeekCalendarProps {
  weekStart: Date;
  onWeekStartChange: (date: Date) => void;
  units: UnitDef[];
  getSessionForDate: (date: string) => Session | undefined;
  onDayClick: (date: Date) => void;
}

export function WeekCalendar({ weekStart, onWeekStartChange, units, getSessionForDate, onDayClick }: WeekCalendarProps) {
  const days = getWeekDays(weekStart);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => onWeekStartChange(addWeeks(weekStart, -1))}
          className="rounded-lg border border-neutral-800 px-3 py-2 text-neutral-300 transition-transform active:scale-90 hover:bg-neutral-800"
          aria-label="Vorherige Woche"
        >
          ←
        </button>

        <div className="flex flex-col items-center">
          <span className="text-lg font-semibold text-neutral-100">{formatWeekRange(weekStart)}</span>
          <button
            onClick={() => onWeekStartChange(getWeekStart(new Date()))}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Heute
          </button>
        </div>

        <button
          onClick={() => onWeekStartChange(addWeeks(weekStart, 1))}
          className="rounded-lg border border-neutral-800 px-3 py-2 text-neutral-300 transition-transform active:scale-90 hover:bg-neutral-800"
          aria-label="Nächste Woche"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {days.map((date) => {
          const session = getSessionForDate(toISODate(date));
          const unit = session ? units.find((u) => u.id === session.unitId) : undefined;
          return <DayCell key={toISODate(date)} date={date} unit={unit} onClick={() => onDayClick(date)} />;
        })}
      </div>
    </div>
  );
}
