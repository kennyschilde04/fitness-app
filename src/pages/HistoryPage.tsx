import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ExerciseHistoryEntry } from '../state/useAppData';
import { useAppData } from '../state/useAppData';
import type { Session, SetEntry, UnitDef } from '../types';
import { getUnitColor, UNIT_COLOR_PALETTE } from '../types';
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
type InsightTab = 'overview' | 'splits' | 'exercises';
const INSIGHT_TABS: { id: InsightTab; label: string }[] = [
  { id: 'overview', label: 'Übersicht' },
  { id: 'splits', label: 'Splits' },
  { id: 'exercises', label: 'Übungen' },
];
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
      <div className="flex items-start justify-between gap-3">
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

      <div className="mt-6 grid grid-cols-7 gap-1.5">
        {getWeekDays(getWeekStart(monthStart)).map((day) => (
          <p key={weekdayShort(day)} className="pb-1 text-center text-[10px] font-black uppercase text-neutral-600">
            {weekdayShort(day)}
          </p>
        ))}
        {days.map((day) => {
          const iso = toISODate(day);
          const isToday = iso === toISODate(new Date());
          const session = sessionsByDate.get(iso);
          const unit = session ? units.find((item) => item.id === session.unitId) : undefined;
          const isCurrentMonth = day.getMonth() === monthStart.getMonth();
          const setCount = session ? completedSets(session) : 0;
          const level = activityLevel(setCount);
          const colors = unit ? getUnitColor(unit) : null;
          const fallbackLevels = [
            'bg-neutral-900/75 light:bg-neutral-100',
            'bg-white/[0.055] light:bg-neutral-100',
            'bg-white/[0.075] light:bg-neutral-100',
            'bg-white/[0.095] light:bg-neutral-100',
            'bg-white/[0.12] light:bg-neutral-200',
          ];

          return (
            <div
              key={iso}
              className={`relative aspect-square overflow-hidden rounded-xl border border-white/[0.055] transition-transform active:scale-95 light:border-neutral-200 ${
                fallbackLevels[level]
              } ${isCurrentMonth ? '' : 'opacity-20'}`}
              title={session ? `${formatDayMonth(day)} · ${setCount} Sätze` : formatDayMonth(day)}
            >
              <span className="relative flex h-full items-center justify-center text-[11px] font-black text-neutral-500">
                {day.getDate()}
              </span>
              {isToday && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--app-accent)]" />}
              {session && colors && (
                <span className={`absolute inset-x-2 bottom-1.5 h-1 rounded-full ${colors.text} bg-current opacity-90`} />
              )}
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

function AddSplitSheet({
  initialColorIndex,
  onCreate,
  onClose,
}: {
  initialColorIndex: number;
  onCreate: (name: string, colorIndex: number) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [colorIndex, setColorIndex] = useState(initialColorIndex);

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, colorIndex);
  }

  return (
    <div className="app-sheet-backdrop" onClick={onClose}>
      <div className="app-bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="app-sheet-handle" aria-label="Split anlegen schließen" />
        <div>
          <p className="app-eyebrow">Neuer Split</p>
          <h2 className="mt-1 text-3xl font-black">Split anlegen</h2>
          <p className="app-muted mt-2 text-sm font-semibold">Name und Farbe wählen, dann speichern.</p>
        </div>

        <div className="mt-7">
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-neutral-500">Name</p>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleCreate()}
            placeholder="z.B. Push/Pull"
            className="app-input app-input-wide w-full"
            autoFocus
          />
        </div>

        <div className="mt-6">
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-neutral-500">Farbe</p>
          <div className="grid grid-cols-4 gap-2">
            {UNIT_COLOR_PALETTE.map((color, index) => (
              <button
                key={color.text}
                type="button"
                onClick={() => setColorIndex(index)}
                className={`flex h-12 items-center justify-center rounded-2xl border transition-transform active:scale-95 ${color.bg} ${color.border} ${
                  colorIndex === index ? `ring-2 ${color.ring} ring-offset-2 ring-offset-neutral-950 light:ring-offset-white` : ''
                }`}
                aria-label={`Farbe ${index + 1} auswählen`}
              >
                <span className={`h-5 w-5 rounded-full bg-current ${color.text}`} />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={name.trim() === ''}
          className="app-primary-button mt-8 w-full px-5 py-4 text-sm"
        >
          Split speichern
        </button>
      </div>
    </div>
  );
}

function EditSplitSheet({
  unit,
  exercises,
  onSave,
  onAddExercise,
  onRemoveExercise,
  onClose,
}: {
  unit: UnitDef;
  exercises: { id: string; name: string }[];
  onSave: (unitId: string, name: string, colorIndex: number) => void;
  onAddExercise: (unitId: string, name: string) => void;
  onRemoveExercise: (unitId: string, exerciseId: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(unit.name);
  const [colorIndex, setColorIndex] = useState(unit.colorIndex);
  const [exerciseName, setExerciseName] = useState('');

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(unit.id, trimmed, colorIndex);
  }

  function handleAddExercise() {
    const trimmed = exerciseName.trim();
    if (!trimmed) return;
    onAddExercise(unit.id, trimmed);
    setExerciseName('');
  }

  return (
    <div className="app-sheet-backdrop" onClick={onClose}>
      <div className="app-bottom-sheet app-bottom-sheet-tall" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="app-sheet-handle" aria-label="Split bearbeiten schließen" />
        <div>
          <p className="app-eyebrow">Split bearbeiten</p>
          <h2 className="mt-1 text-3xl font-black">{unit.name}</h2>
          <p className="app-muted mt-2 text-sm font-semibold">Name und Farbe des Splits anpassen.</p>
        </div>

        <div className="mt-7">
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-neutral-500">Name</p>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSave()}
            className="app-input app-input-wide w-full"
            autoFocus
          />
        </div>

        <div className="mt-6">
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-neutral-500">Farbe</p>
          <div className="grid grid-cols-4 gap-2">
            {UNIT_COLOR_PALETTE.map((color, index) => (
              <button
                key={color.text}
                type="button"
                onClick={() => setColorIndex(index)}
                className={`flex h-12 items-center justify-center rounded-2xl border transition-transform active:scale-95 ${color.bg} ${color.border} ${
                  colorIndex === index ? `ring-2 ${color.ring} ring-offset-2 ring-offset-neutral-950 light:ring-offset-white` : ''
                }`}
                aria-label={`Farbe ${index + 1} auswählen`}
              >
                <span className={`h-5 w-5 rounded-full bg-current ${color.text}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 min-h-0 flex-1 overflow-y-auto">
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-neutral-500">Übungen</p>
          {exercises.length > 0 ? (
            <div className="flex flex-col gap-3">
              {exercises.map((exercise) => (
                <div key={exercise.id} className="app-soft-row flex items-center justify-between gap-3">
                  <span className="text-sm font-black text-[var(--app-text)]">{exercise.name}</span>
                  <button
                    onClick={() => onRemoveExercise(unit.id, exercise.id)}
                    className="app-danger-button px-3 py-2 text-xs"
                    aria-label={`${exercise.name} entfernen`}
                  >
                    Entfernen
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="app-muted text-sm font-semibold">Noch keine Übungen in diesem Split.</p>
          )}

          <div className="mt-4 flex gap-3">
            <input
              value={exerciseName}
              onChange={(event) => setExerciseName(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleAddExercise()}
              placeholder="Neue Übung"
              className="app-input app-input-wide flex-1"
            />
            <button
              onClick={handleAddExercise}
              disabled={exerciseName.trim() === ''}
              className="app-primary-button shrink-0 px-4 py-3 text-sm"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={name.trim() === ''}
          className="app-primary-button mt-8 w-full px-5 py-4 text-sm"
        >
          Änderungen speichern
        </button>
      </div>
    </div>
  );
}

export function HistoryPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const {
    units,
    exercises,
    sessions,
    createUnit,
    updateUnit,
    addExerciseToUnit,
    removeExerciseFromUnitPlan,
    getUnitExerciseHistory,
  } = useAppData();
  const [activeTab, setActiveTab] = useState<InsightTab>('overview');
  const [addSplitOpen, setAddSplitOpen] = useState(false);
  const [editSplitOpen, setEditSplitOpen] = useState(false);

  const sortedUnits = [...units].sort((a, b) => a.order - b.order);
  const sortedSessions = [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1));
  const activeUnit = (unitId && sortedUnits.find((u) => u.id === unitId)) || sortedUnits[0];
  const exerciseHistory = activeUnit ? getUnitExerciseHistory(activeUnit.id, ALL_LIMIT) : [];
  const activeUnitSessions = activeUnit ? sortedSessions.filter((session) => session.unitId === activeUnit.id) : [];
  const activeUnitExercises = activeUnit
    ? exercises.filter((exercise) => exercise.unitId === activeUnit.id).sort((a, b) => a.order - b.order)
    : [];
  const activeUnitSets = activeUnitSessions.reduce((total, session) => total + completedSets(session), 0);
  const activeUnitVolume = activeUnitSessions.reduce((total, session) => total + sessionVolume(session), 0);
  const latestSession = activeUnit ? latestSessionForUnit(sortedSessions, activeUnit.id) : undefined;
  const totalSets = sortedSessions.reduce((total, session) => total + completedSets(session), 0);
  const totalVolume = sortedSessions.reduce((total, session) => total + sessionVolume(session), 0);
  const weekDays = getWeekDays(getWeekStart(new Date()));
  const currentWeekSessions = weekDays
    .map((day) => sortedSessions.find((session) => session.date === toISODate(day)))
    .filter((session): session is Session => Boolean(session));

  function handleCreateSplit(name: string, colorIndex: number) {
    const id = createUnit(name, colorIndex);
    if (!id) return;
    setAddSplitOpen(false);
    setActiveTab('splits');
    navigate(`/history/${id}`, { replace: true });
  }

  function handleSaveSplit(unitId: string, name: string, colorIndex: number) {
    updateUnit(unitId, { name, colorIndex });
    setEditSplitOpen(false);
  }

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

        <div className="app-segmented-control mt-7">
          <span
            className="app-segmented-slider"
            style={{ transform: `translateX(${INSIGHT_TABS.findIndex((tab) => tab.id === activeTab) * 100}%)` }}
          />
          {INSIGHT_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`app-segmented-option active:scale-95 ${active ? 'app-segmented-option-active' : ''}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && (
          <>
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
          </>
        )}

        {activeTab === 'splits' && (
          <>
            <section className="mt-9">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-black">Split</p>
                <div className="flex items-center gap-3">
                  <p className="app-muted text-xs font-bold">{activeUnitSessions.length} Einheiten</p>
                  <button
                    onClick={() => setAddSplitOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--app-border-strong)] bg-[var(--app-surface)] text-[var(--app-accent)] shadow-lg shadow-black/10 transition-transform active:scale-90"
                    aria-label="Split hinzufügen"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" className="h-5 w-5">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
              {sortedUnits.length > 0 ? (
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
              ) : (
                <button onClick={() => setAddSplitOpen(true)} className="app-card app-card-button app-card-spacious">
                  <p className="text-lg font-black">Ersten Split anlegen</p>
                  <p className="app-muted mt-2 text-sm font-semibold">Erstelle deinen Trainingssplit und wähle eine Farbe.</p>
                </button>
              )}
            </section>

            {activeUnit && (
              <>
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
                  <button
                    onClick={() => setEditSplitOpen(true)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 text-sm font-black text-[var(--app-text-soft)] transition-transform active:scale-[0.98]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
                      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.36a1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.08a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.08a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9c.25.6.84 1 1.56 1H21a2 2 0 1 1 0 4h-.08a1.7 1.7 0 0 0-1.52 1Z" />
                    </svg>
                    Split bearbeiten
                  </button>
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

                <section className="app-card mt-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black">Split-Insights</p>
                      <p className="app-muted mt-1 text-xs font-semibold">
                        {latestSession ? `Zuletzt: ${formatDayMonth(fromISODate(latestSession.date))}` : 'Noch keine Einheit'}
                      </p>
                    </div>
                    <div className="app-stat-badge">
                      <p className={`text-lg font-black ${getUnitColor(activeUnit).text}`}>{activeUnitExercises.length}</p>
                      <p className="app-muted text-[10px] font-bold uppercase">Übungen</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="app-soft-row">
                      <p className="text-xl font-black">{activeUnitSets}</p>
                      <p className="app-muted mt-1 text-[11px] font-black uppercase">Sätze</p>
                    </div>
                    <div className="app-soft-row">
                      <p className="text-xl font-black">{formatVolume(activeUnitVolume)}</p>
                      <p className="app-muted mt-1 text-[11px] font-black uppercase">Volumen</p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="mb-3 text-xs font-black uppercase tracking-wide text-neutral-500">Übungen im Split</p>
                    {activeUnitExercises.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {activeUnitExercises.map((exercise) => (
                          <span key={exercise.id} className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-3 py-2 text-xs font-black text-[var(--app-text-soft)]">
                            {exercise.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="app-muted text-sm font-semibold">Noch keine Übungen in diesem Split.</p>
                    )}
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {activeTab === 'exercises' && (
          <section className="mt-9">
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
        )}
      </main>
      {addSplitOpen && (
        <AddSplitSheet
          initialColorIndex={sortedUnits.length % UNIT_COLOR_PALETTE.length}
          onCreate={handleCreateSplit}
          onClose={() => setAddSplitOpen(false)}
        />
      )}
      {editSplitOpen && activeUnit && (
        <EditSplitSheet
          unit={activeUnit}
          exercises={activeUnitExercises}
          onSave={handleSaveSplit}
          onAddExercise={addExerciseToUnit}
          onRemoveExercise={removeExerciseFromUnitPlan}
          onClose={() => setEditSplitOpen(false)}
        />
      )}
    </div>
  );
}
