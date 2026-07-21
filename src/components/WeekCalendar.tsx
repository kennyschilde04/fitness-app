import { useMemo, useState } from 'react';
import type { Session, UnitDef } from '../types';
import { getUnitColor } from '../types';
import { addWeeks, formatDayMonth, formatWeekRange, getWeekDays, isSameDay, toISODate, weekdayLabel } from '../utils/date';
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
  const [focusedDate, setFocusedDate] = useState(() => {
    const today = new Date();
    return days.some((day) => isSameDay(day, today)) ? today : days[0];
  });
  const visibleFocusedDate = days.some((day) => isSameDay(day, focusedDate)) ? focusedDate : days[0];
  const focusedSession = getSessionForDate(toISODate(visibleFocusedDate));
  const focusedUnit = focusedSession ? units.find((u) => u.id === focusedSession.unitId) : undefined;
  const focusedColors = focusedUnit ? getUnitColor(focusedUnit) : null;
  const weekSessions = useMemo(
    () => days.map((date) => getSessionForDate(toISODate(date))).filter((session): session is Session => Boolean(session)),
    [days, getSessionForDate],
  );
  const completedSets = focusedSession
    ? focusedSession.exercises.reduce(
        (total, exercise) => total + exercise.sets.filter((set) => set.weight !== null || set.reps !== null).length,
        0,
      )
    : 0;

  function moveWeek(delta: number) {
    const nextStart = addWeeks(weekStart, delta);
    onWeekStartChange(nextStart);
    setFocusedDate(nextStart);
  }

  function handleDayClick(date: Date) {
    setFocusedDate(date);
  }

  return (
    <div className="flex min-h-full w-full flex-col gap-4 pb-8">
      <div className="flex shrink-0 items-center justify-between">
        <button
          onClick={() => moveWeek(-1)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/70 text-neutral-300 transition-transform active:scale-90 hover:bg-neutral-800 light:border-neutral-300 light:bg-white light:text-neutral-600 light:hover:bg-neutral-100"
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
          onClick={() => moveWeek(1)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/70 text-neutral-300 transition-transform active:scale-90 hover:bg-neutral-800 light:border-neutral-300 light:bg-white light:text-neutral-600 light:hover:bg-neutral-100"
          aria-label="Nächste Woche"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <div className="relative -mx-4 max-w-[calc(100%+2rem)] shrink-0 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-7 bg-gradient-to-r from-neutral-950 to-transparent light:from-neutral-50" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-7 bg-gradient-to-l from-neutral-950 to-transparent light:from-neutral-50" />
        <div className="week-strip flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 pt-1">
          {days.map((date) => {
            const session = getSessionForDate(toISODate(date));
            const unit = session ? units.find((u) => u.id === session.unitId) : undefined;
            return (
              <div key={toISODate(date)} className="shrink-0 snap-center">
                <DayCell
                  date={date}
                  unit={unit}
                  session={session}
                  active={isSameDay(date, visibleFocusedDate)}
                  onClick={() => handleDayClick(date)}
                  onLongPress={(x, y) => onDayLongPress?.(date, x, y)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <section className={`shrink-0 overflow-hidden rounded-3xl border p-5 sm:p-6 ${focusedColors ? `${focusedColors.bg} ${focusedColors.border}` : 'border-neutral-800 bg-neutral-900/70 light:border-neutral-200 light:bg-white'}`}>
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-neutral-500 light:text-neutral-500">
                {isSameDay(visibleFocusedDate, new Date()) ? 'Heute' : weekdayLabel(visibleFocusedDate)}
              </p>
              <h2 className="mt-1 text-3xl font-black leading-none text-neutral-100 light:text-neutral-950">
                {formatDayMonth(visibleFocusedDate)}
              </h2>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/50 px-3 py-2 text-right light:border-neutral-200 light:bg-white/70">
              <p className="text-xl font-black text-lime-300 light:text-lime-600">{weekSessions.length}/7</p>
              <p className="text-[10px] font-semibold uppercase text-neutral-500">Woche</p>
            </div>
          </div>

          {focusedSession && focusedUnit ? (
            <div className="mt-5 flex flex-col">
              <span className={`w-fit rounded-full px-3 py-1 text-sm font-bold ${focusedColors!.text}`}>
                {focusedUnit.name}
              </span>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-white/10 bg-neutral-950/45 p-3 light:border-neutral-200 light:bg-white/70">
                  <p className="text-2xl font-black text-neutral-100 light:text-neutral-950">{focusedSession.exercises.length}</p>
                  <p className="text-xs text-neutral-500">Übungen</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-neutral-950/45 p-3 light:border-neutral-200 light:bg-white/70">
                  <p className="text-2xl font-black text-neutral-100 light:text-neutral-950">{completedSets}</p>
                  <p className="text-xs text-neutral-500">Sätze</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-neutral-950/45 p-3 light:border-neutral-200 light:bg-white/70">
                  <p className="text-2xl font-black text-neutral-100 light:text-neutral-950">
                    {focusedSession.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)}
                  </p>
                  <p className="text-xs text-neutral-500">Slots</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex flex-col gap-2">
                  {focusedSession.exercises.slice(0, 5).map((exercise) => (
                    <div key={exercise.exerciseId} className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-950/35 px-3 py-2 light:bg-white/70">
                      <span className="truncate text-sm font-semibold text-neutral-200 light:text-neutral-800">{exercise.name}</span>
                      <span className="shrink-0 text-xs font-medium text-neutral-500">{exercise.sets.length} Sätze</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onDayClick(visibleFocusedDate)}
                className="mt-5 h-12 rounded-2xl bg-lime-300 px-4 text-sm font-black text-neutral-950 transition-transform active:scale-95 hover:bg-lime-200 light:bg-lime-500 light:hover:bg-lime-400"
              >
                Training öffnen
              </button>
            </div>
          ) : (
            <div className="mt-7 flex flex-col">
              <div>
                <p className="text-xl font-bold text-neutral-100 light:text-neutral-950">Noch kein Training geplant</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500 light:text-neutral-600">
                  Lege für diesen Tag eine Einheit an und baue dir Stück für Stück deinen Trainingsrhythmus auf.
                </p>
              </div>
              <button
                onClick={() => onDayClick(visibleFocusedDate)}
                className="mt-7 h-12 rounded-2xl border border-lime-300/70 px-4 text-sm font-black text-lime-200 transition-transform active:scale-95 hover:bg-lime-300/10 light:border-lime-500 light:text-lime-700 light:hover:bg-lime-50"
              >
                Training starten
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
