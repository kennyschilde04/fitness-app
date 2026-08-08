import type { Session, UnitDef } from '../types';
import { addMonths, formatMonthYear, getMonthGridDays, toISODate } from '../utils/date';
import { MonthDayCell } from './MonthDayCell';

interface MonthCalendarProps {
  monthStart: Date;
  onMonthStartChange: (date: Date) => void;
  units: UnitDef[];
  getSessionForDate: (date: string) => Session | undefined;
  onDayClick: (date: Date) => void;
  onDayLongPress?: (date: Date, x: number, y: number) => void;
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
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <button
          onClick={() => onMonthStartChange(addMonths(monthStart, -1))}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-neutral-800 bg-white/[0.035] text-neutral-300 transition-transform active:scale-90 light:border-neutral-200 light:bg-white/60 light:text-neutral-600"
          aria-label="Vorheriger Monat"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <span className="text-2xl font-black text-neutral-100 light:text-neutral-950">
          {formatMonthYear(monthStart)}
        </span>

        <button
          onClick={() => onMonthStartChange(addMonths(monthStart, 1))}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-neutral-800 bg-white/[0.035] text-neutral-300 transition-transform active:scale-90 light:border-neutral-200 light:bg-white/60 light:text-neutral-600"
          aria-label="Nächster Monat"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950/50 p-3 shadow-2xl shadow-black/20 light:border-neutral-200 light:bg-white/65 light:shadow-neutral-200/50">
        <div className="mb-1 grid shrink-0 grid-cols-7">
          {WEEKDAY_HEADERS.map((d) => (
            <span key={d} className="py-2 text-center text-[11px] font-black uppercase text-neutral-500">
              {d}
            </span>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-y-1.5">
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
                onLongPress={(x, y) => onDayLongPress?.(date, x, y)}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
