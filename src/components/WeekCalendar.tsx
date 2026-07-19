import type { Session, UnitDef } from '../types';
import { addWeeks, formatWeekRange, getWeekDays, toISODate } from '../utils/date';
import { DayCell } from './DayCell';

interface WeekCalendarProps {
  weekStart: Date;
  onWeekStartChange: (date: Date) => void;
  units: UnitDef[];
  getSessionForDate: (date: string) => Session | undefined;
  onDayClick: (date: Date) => void;
  onDayLongPress?: (date: Date, x: number, y: number) => void;
}

export function WeekCalendar({
  weekStart,
  onWeekStartChange,
  units,
  getSessionForDate,
  onDayClick,
  onDayLongPress,
}: WeekCalendarProps) {
  const days = getWeekDays(weekStart);

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <button
          onClick={() => onWeekStartChange(addWeeks(weekStart, -1))}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-800 text-neutral-300 transition-transform active:scale-90 hover:bg-neutral-800 light:border-neutral-300 light:text-neutral-600 light:hover:bg-neutral-100"
          aria-label="Vorherige Woche"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <span className="text-lg font-semibold text-neutral-100 light:text-neutral-900">
          {formatWeekRange(weekStart)}
        </span>

        <button
          onClick={() => onWeekStartChange(addWeeks(weekStart, 1))}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-800 text-neutral-300 transition-transform active:scale-90 hover:bg-neutral-800 light:border-neutral-300 light:text-neutral-600 light:hover:bg-neutral-100"
          aria-label="Nächste Woche"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-7">
        {days.map((date) => {
          const session = getSessionForDate(toISODate(date));
          const unit = session ? units.find((u) => u.id === session.unitId) : undefined;
          return (
            <DayCell
              key={toISODate(date)}
              date={date}
              unit={unit}
              onClick={() => onDayClick(date)}
              onLongPress={(x, y) => onDayLongPress?.(date, x, y)}
            />
          );
        })}
      </div>
    </div>
  );
}
