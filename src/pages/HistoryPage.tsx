import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ExerciseHistoryEntry } from '../state/useAppData';
import { useAppData } from '../state/useAppData';
import type { Session, SetEntry, UnitDef } from '../types';
import { getUnitColor } from '../types';
import {
  formatDayMonth,
  formatMonthYear,
  fromISODate,
  getMonthGridDays,
  getMonthStart,
  getWeekDays,
  getWeekStart,
  toISODate,
  weekdayShort,
} from '../utils/date';
import { formatSet } from '../utils/format';

const PAGE_SIZE = 5;
const ALL_LIMIT = 1000;
const UNIT_COLOR_STYLE_PALETTE = [
  { background: 'rgba(14, 165, 233, 0.16)', border: 'rgba(14, 165, 233, 0.7)', text: '#38bdf8', glow: 'rgba(14, 165, 233, 0.34)' },
  { background: 'rgba(249, 115, 22, 0.16)', border: 'rgba(249, 115, 22, 0.7)', text: '#fb923c', glow: 'rgba(249, 115, 22, 0.34)' },
  { background: 'rgba(16, 185, 129, 0.16)', border: 'rgba(16, 185, 129, 0.7)', text: '#34d399', glow: 'rgba(16, 185, 129, 0.34)' },
  { background: 'rgba(168, 85, 247, 0.16)', border: 'rgba(168, 85, 247, 0.7)', text: '#c084fc', glow: 'rgba(168, 85, 247, 0.34)' },
  { background: 'rgba(236, 72, 153, 0.16)', border: 'rgba(236, 72, 153, 0.7)', text: '#f472b6', glow: 'rgba(236, 72, 153, 0.34)' },
  { background: 'rgba(245, 158, 11, 0.16)', border: 'rgba(245, 158, 11, 0.7)', text: '#fbbf24', glow: 'rgba(245, 158, 11, 0.34)' },
  { background: 'rgba(244, 63, 94, 0.16)', border: 'rgba(244, 63, 94, 0.7)', text: '#fb7185', glow: 'rgba(244, 63, 94, 0.34)' },
  { background: 'rgba(20, 184, 166, 0.16)', border: 'rgba(20, 184, 166, 0.7)', text: '#2dd4bf', glow: 'rgba(20, 184, 166, 0.34)' },
];

function completedSets(session: Session): number {
  return session.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.weight !== null || set.reps !== null).length,
    0,
  );
}

function setVolume(set: SetEntry): number {
  return (set.weight ?? 0) * (set.reps ?? 0);
}

function sessionVolume(session: Session): number {
  return session.exercises.reduce(
    (total, exercise) => total + exercise.sets.reduce((sum, set) => sum + setVolume(set), 0),
    0,
  );
}

function formatVolume(value: number): string {
  if (value >= 1000) return `${Math.round(value / 100) / 10}k kg`;
  return `${Math.round(value)} kg`;
}

function latestSessionForUnit(sessions: Session[], unitId: string): Session | undefined {
  return [...sessions].filter((session) => session.unitId === unitId).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

function activityLevel(setCount: number): number {
  if (setCount <= 0) return 0;
  if (setCount <= 3) return 1;
  if (setCount <= 7) return 2;
  if (setCount <= 12) return 3;
  return 4;
}

function ActivityMonth({ sessions, units }: { sessions: Session[]; units: UnitDef[] }) {
  const monthStart = getMonthStart(new Date());
  const days = getMonthGridDays(monthStart);
  const sessionsByDate = new Map(sessions.map((session) => [session.date, session]));
  const monthSessions = sessions.filter((session) => {
    const date = fromISODate(session.date);
    return date.getFullYear() === monthStart.getFullYear() && date.getMonth() === monthStart.getMonth();
  });
  const activeDays = monthSessions.length;
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const bestDaySets = Math.max(0, ...monthSessions.map(completedSets));
  const monthVolume = monthSessions.reduce((total, session) => total + sessionVolume(session), 0);

  return (
    <section className="app-card mt-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black">Aktivität</p>
          <p className="app-muted mt-1 text-xs font-semibold">{formatMonthYear(monthStart)}</p>
        </div>
        <div className="flex gap-2">
          <div className="app-stat-badge">
            <p className="text-lg font-black text-lime-300 light:text-lime-700">{activeDays}/{daysInMonth}</p>
            <p className="app-muted text-[10px] font-bold uppercase">Tage</p>
          </div>
          <div className="app-stat-badge">
            <p className="text-lg font-black text-lime-300 light:text-lime-700">{formatVolume(monthVolume)}</p>
            <p className="app-muted text-[10px] font-bold uppercase">Monat</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2">
        {getWeekDays(getWeekStart(monthStart)).map((day) => (
          <p key={weekdayShort(day)} className="text-center text-[10px] font-black uppercase text-neutral-600">
            {weekdayShort(day)}
          </p>
        ))}
        {days.map((day) => {
          const iso = toISODate(day);
          const session = sessionsByDate.get(iso);
          const unit = session ? units.find((item) => item.id === session.unitId) : undefined;
          const isCurrentMonth = day.getMonth() === monthStart.getMonth();
          const setCount = session ? completedSets(session) : 0;
          const level = activityLevel(setCount);
          const colors = unit ? getUnitColor(unit) : null;
          const fallbackLevels = [
            'bg-neutral-900/80 light:bg-neutral-100',
            'bg-lime-300/20 light:bg-lime-200',
            'bg-lime-300/40 light:bg-lime-300',
            'bg-lime-300/70 light:bg-lime-400',
            'bg-lime-300 light:bg-lime-600',
          ];

          return (
            <div
              key={iso}
              className={`aspect-square rounded-xl border transition-transform active:scale-95 ${
                session && colors
                  ? `${colors.bg} ${colors.border}`
                  : `border-white/5 ${fallbackLevels[level]} light:border-neutral-200`
              } ${isCurrentMonth ? '' : 'opacity-20'}`}
              title={session ? `${formatDayMonth(day)} · ${setCount} Sätze` : formatDayMonth(day)}
            >
              <span className={`flex h-full items-center justify-center text-[11px] font-black ${
                session && colors ? colors.text : 'text-neutral-600'
              }`}>
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <p className="app-muted text-xs font-semibold">
          {bestDaySets > 0 ? `Stärkster Tag: ${bestDaySets} Sätze` : 'Noch kein Training diesen Monat'}
        </p>
      </div>
    </section>
  );
}

function SetRows({ entries }: { entries: ExerciseHistoryEntry['entries'] }) {
  return (
    <div className="flex flex-col gap-4">
      {entries.map((sets, i) => (
        <div key={i} className="app-soft-row">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold">
            {sets.map((set, j) => (
              <span key={j} className="app-muted">
                <span className="text-neutral-600">S{j + 1}</span> {formatSet(set)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExerciseHistoryCard({ entry }: { entry: ExerciseHistoryEntry }) {
  const [open, setOpen] = useState(false);
  const visible = entry.entries.slice(0, PAGE_SIZE);
  const hiddenCount = entry.entries.length - PAGE_SIZE;
  const latest = entry.entries[0] ?? [];
  const latestVolume = latest.reduce((total, set) => total + setVolume(set), 0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="app-card app-card-button app-card-spacious"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-lg font-black">{entry.name}</p>
            <p className="app-muted mt-2 text-xs font-semibold">{entry.entries.length} Einträge</p>
          </div>
          <div className="app-stat-badge">
            <p className="text-sm font-black text-lime-300 light:text-lime-700">{formatVolume(latestVolume)}</p>
            <p className="app-muted text-[10px] font-bold uppercase">zuletzt</p>
          </div>
        </div>

        <div className="mt-8">
          <SetRows entries={visible} />
        </div>

        {hiddenCount > 0 && (
          <p className="app-muted mt-5 text-xs font-bold">
            Alle {entry.entries.length} Einträge anzeigen
          </p>
        )}
      </button>

      {open && (
        <div
          className="app-sheet-backdrop"
          onClick={() => setOpen(false)}
        >
          <div
            className="app-bottom-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="app-sheet-handle"
              aria-label="Detail schließen"
            />
            <div className="flex shrink-0 items-start justify-between gap-4">
              <div>
                <p className="app-eyebrow">Übungsverlauf</p>
                <h2 className="mt-1 text-3xl font-black">{entry.name}</h2>
                <p className="app-muted mt-2 text-sm font-semibold">{entry.entries.length} Einträge gesamt</p>
              </div>
              <div className="app-stat-badge">
                <p className="text-sm font-black text-lime-300 light:text-lime-700">{formatVolume(latestVolume)}</p>
                <p className="app-muted text-[10px] font-bold uppercase">zuletzt</p>
              </div>
            </div>
            <div className="mt-7 min-h-0 flex-1 overflow-y-auto">
              <SetRows entries={entry.entries} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UnitPill({
  unit,
  active,
  onClick,
}: {
  unit: UnitDef;
  active: boolean;
  onClick: () => void;
}) {
  const colorStyle = UNIT_COLOR_STYLE_PALETTE[unit.colorIndex % UNIT_COLOR_STYLE_PALETTE.length];
  return (
    <button
      onClick={onClick}
      className={`app-chip ${active ? 'app-chip-active' : ''}`}
      style={
        active
          ? {
              background: colorStyle.background,
              borderColor: colorStyle.border,
              color: colorStyle.text,
              boxShadow: `0 0 0 2px ${colorStyle.glow}, 0 18px 38px rgba(0, 0, 0, 0.35)`,
            }
          : undefined
      }
    >
      {unit.name}
    </button>
  );
}

export function HistoryPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { units, sessions, getUnitExerciseHistory } = useAppData();

  const sortedUnits = [...units].sort((a, b) => a.order - b.order);
  const sortedSessions = [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1));
  const activeUnit = (unitId && sortedUnits.find((u) => u.id === unitId)) || sortedUnits[0];
  const exerciseHistory = activeUnit ? getUnitExerciseHistory(activeUnit.id, ALL_LIMIT) : [];
  const activeUnitSessions = activeUnit ? sortedSessions.filter((session) => session.unitId === activeUnit.id) : [];
  const latestSession = activeUnit ? latestSessionForUnit(sortedSessions, activeUnit.id) : undefined;
  const totalSets = sortedSessions.reduce((total, session) => total + completedSets(session), 0);
  const totalVolume = sortedSessions.reduce((total, session) => total + sessionVolume(session), 0);
  const weekDays = getWeekDays(getWeekStart(new Date()));
  const currentWeekSessions = weekDays
    .map((day) => sortedSessions.find((session) => session.date === toISODate(day)))
    .filter((session): session is Session => Boolean(session));

  return (
    <div className="app-screen">
      <main className="app-scroll">
        <button
          onClick={() => navigate('/')}
          className="app-icon-button mb-8"
          aria-label="Zurück"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <header>
          <p className="app-eyebrow">Insights</p>
          <h1 className="mt-1 text-4xl font-black leading-none">Dein Fortschritt</h1>
          <p className="app-muted mt-4 text-sm font-semibold">
            {latestSession ? `Letztes Training: ${formatDayMonth(fromISODate(latestSession.date))}` : 'Noch keine Trainingsdaten'}
          </p>
        </header>

        <section className="mt-8 grid grid-cols-3 gap-3">
          <div className="app-card p-5">
            <p className="text-3xl font-black">{sortedSessions.length}</p>
            <p className="app-muted mt-1 text-xs font-bold">Trainings</p>
          </div>
          <div className="app-card p-5">
            <p className="text-3xl font-black">{totalSets}</p>
            <p className="app-muted mt-1 text-xs font-bold">Sätze</p>
          </div>
          <div className="app-card p-5">
            <p className="text-3xl font-black text-lime-300 light:text-lime-700">{currentWeekSessions.length}/7</p>
            <p className="app-muted mt-1 text-xs font-bold">Woche</p>
          </div>
        </section>

        <section className="app-card mt-4 p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-black">Volumen</p>
              <p className="app-muted mt-1 text-xs font-semibold">Alle erfassten Sätze</p>
            </div>
            <p className="text-2xl font-black text-lime-300 light:text-lime-700">{formatVolume(totalVolume)}</p>
          </div>
          <div className="app-muted mt-3 flex items-center justify-between text-[10px] font-bold uppercase">
            <span>älter</span>
            <span>letzte Trainings</span>
            <span>neu</span>
          </div>
          <div className="mt-5 flex h-20 items-end gap-3">
            {sortedSessions.slice(0, 8).reverse().map((session) => {
              const unit = sortedUnits.find((item) => item.id === session.unitId);
              const colors = unit ? getUnitColor(unit) : null;
              const height = Math.max(18, Math.min(64, sessionVolume(session) / 90));
              return (
                <div key={session.id} className="flex flex-1 flex-col items-center gap-2">
                  <div className={`w-full rounded-full ${colors?.bg ?? 'bg-neutral-800'}`} style={{ height }} />
                </div>
              );
            })}
          </div>
        </section>

        <ActivityMonth sessions={sortedSessions} units={sortedUnits} />

        {sortedUnits.length > 0 && (
          <section className="mt-9">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-black">Split</p>
              <p className="app-muted text-xs font-bold">{activeUnitSessions.length} Einheiten</p>
            </div>
            <div className="app-x-scroll">
              {sortedUnits.map((unit) => (
                <UnitPill
                  key={unit.id}
                  unit={unit}
                  active={unit.id === activeUnit?.id}
                  onClick={() => navigate(`/history/${unit.id}`, { replace: true })}
                />
              ))}
            </div>
          </section>
        )}

        {activeUnit && (
          <section className="app-card mt-6 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="app-muted text-xs font-bold uppercase">Aktiver Split</p>
                <p className={`mt-1 text-2xl font-black ${getUnitColor(activeUnit).text}`}>{activeUnit.name}</p>
              </div>
              <div className="app-stat-badge">
                <p className="text-lg font-black">{activeUnitSessions.length}</p>
                <p className="app-muted text-[10px] font-bold uppercase">Sessions</p>
              </div>
            </div>
            <div className="app-muted mt-6 flex items-center justify-between text-[10px] font-bold uppercase">
              <span>Diese Woche</span>
              <span>Farbe = Split</span>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const session = sortedSessions.find((item) => item.date === toISODate(day));
                const unit = session ? sortedUnits.find((item) => item.id === session.unitId) : undefined;
                const colors = unit ? getUnitColor(unit) : null;
                return (
                  <span
                    key={toISODate(day)}
                    className={`h-2 rounded-full ${colors ? colors.bg : 'bg-neutral-800/80 light:bg-neutral-200'}`}
                  />
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-16">
          <p className="mb-7 text-lg font-black">Übungsverlauf</p>
          {exerciseHistory.length === 0 ? (
            <p className="text-sm font-semibold text-neutral-500">Noch keine Einheiten erfasst.</p>
          ) : (
            <div className="flex flex-col gap-10">
              {exerciseHistory.map((entry) => (
                <div key={entry.exerciseId} className="px-1">
                  <ExerciseHistoryCard entry={entry} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
