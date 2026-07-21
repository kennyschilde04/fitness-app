import type { PreviousSessionEntry } from '../state/useAppData';
import type { SessionExercise, SetEntry } from '../types';
import { MAX_SETS, MIN_SETS } from '../types';
import { formatDayMonth, fromISODate } from '../utils/date';
import { formatSet } from '../utils/format';
import { Reorder, useDragControls } from 'framer-motion';

interface ExerciseRowProps {
  exercise: SessionExercise;
  history: PreviousSessionEntry[];
  expanded: boolean;
  onToggle: () => void;
  onSetChange: (setIndex: number, patch: Partial<SetEntry>) => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
  onNoteChange: (note: string) => void;
  onRemove: () => void;
}

function parseNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export function ExerciseRow({
  exercise,
  history,
  expanded,
  onToggle,
  onSetChange,
  onAddSet,
  onRemoveSet,
  onNoteChange,
  onRemove,
}: ExerciseRowProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      as="div"
      value={exercise.exerciseId}
      id={`exercise-${exercise.exerciseId}`}
      dragControls={dragControls}
      dragListener={false}
      layout="position"
      whileDrag={{ scale: 0.975, boxShadow: '0 24px 60px rgba(0, 0, 0, 0.36)', zIndex: 20 }}
      className={`app-exercise-card app-exercise-card-animated relative ${expanded ? 'app-exercise-card-expanded' : 'p-0'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-3 rounded-[1.75rem] text-left transition-[margin,transform] duration-300 active:scale-[0.98] ${
          expanded ? 'mb-6' : 'p-4'
        }`}
        aria-expanded={expanded}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            onPointerDown={(event) => {
              event.stopPropagation();
              dragControls.start(event);
            }}
            className="flex h-10 w-10 shrink-0 touch-none items-center justify-center rounded-2xl bg-[var(--app-surface-strong)] text-[var(--app-text-muted)] transition-all duration-200 active:scale-110 active:text-[var(--app-accent)]"
            aria-label={`${exercise.name} verschieben`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className="h-5 w-5">
              <path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-black text-neutral-100 light:text-neutral-900">{exercise.name}</span>
            <span className="app-muted mt-0.5 block text-xs font-bold">
              {exercise.sets.length} Sätze
              {exercise.note.trim() ? ' · Notiz' : ''}
            </span>
          </span>
        </span>
        <span className={`shrink-0 text-[var(--app-text-muted)] transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      <div className={`app-exercise-accordion ${expanded ? 'app-exercise-accordion-open' : ''}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-neutral-500">Übung</p>
              <h3 className="mt-1 text-2xl font-black leading-none text-neutral-100 light:text-neutral-900">{exercise.name}</h3>
            </div>
            <button
              onClick={onRemove}
              className="app-danger-button shrink-0 px-4 py-2 text-xs"
              aria-label={`${exercise.name} entfernen`}
            >
              Entfernen
            </button>
          </div>

      <div className="mb-4 flex flex-col gap-3">
        {exercise.sets.map((set, i) => (
          <div key={i} className="grid grid-cols-[3.25rem_minmax(0,1fr)_1rem_minmax(0,1fr)] items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
              S{i + 1}
            </span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="kg"
              value={set.weight ?? ''}
              onChange={(e) => onSetChange(i, { weight: parseNumber(e.target.value) })}
              className="app-input app-input-compact w-full"
            />
            <span className="text-center text-neutral-600">×</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Wdh"
              value={set.reps ?? ''}
              onChange={(e) => onSetChange(i, { reps: parseNumber(e.target.value) })}
              className="app-input app-input-compact w-full"
            />
          </div>
        ))}
      </div>

      <div className="mb-5 flex gap-3">
        <button
          onClick={onRemoveSet}
          disabled={exercise.sets.length <= MIN_SETS}
          className="app-secondary-button px-4 py-2 text-xs"
        >
          − Satz
        </button>
        <button
          onClick={onAddSet}
          disabled={exercise.sets.length >= MAX_SETS}
          className="app-secondary-button px-4 py-2 text-xs"
        >
          + Satz
        </button>
      </div>

      {history.length > 0 ? (
        <div className="mb-5 flex flex-col gap-2 border-t border-white/10 pt-5 light:border-neutral-200">
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-600">Letzte Einheiten</p>
          {history.map((entry) => (
            <div key={entry.date} className="app-soft-row flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
              <span className="w-16 shrink-0 font-black text-neutral-500">{formatDayMonth(fromISODate(entry.date))}</span>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {entry.exercise.sets.map((set, i) => (
                  <span key={i} className="text-neutral-400">
                    <span className="text-neutral-600">S{i + 1}</span> {formatSet(set)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-5 border-t border-white/10 pt-5 text-sm font-semibold text-neutral-600 light:border-neutral-200">
          Noch keine vorherige Einheit erfasst.
        </p>
      )}

      <input
        type="text"
        placeholder="Notiz (optional)"
        value={exercise.note}
        onChange={(e) => onNoteChange(e.target.value)}
        className="app-input app-input-wide w-full text-sm"
      />
        </div>
      </div>
    </Reorder.Item>
  );
}
