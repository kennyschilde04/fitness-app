import type { PreviousSessionEntry } from '../state/useAppData';
import type { SessionExercise, SetEntry } from '../types';
import { MAX_SETS } from '../types';
import { formatDayMonth, fromISODate } from '../utils/date';

interface ExerciseRowProps {
  exercise: SessionExercise;
  history: PreviousSessionEntry[];
  onSetChange: (setIndex: number, patch: Partial<SetEntry>) => void;
  onNoteChange: (note: string) => void;
  onRemove: () => void;
}

function parseNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function formatSet(set: SetEntry): string {
  if (set.weight === null && set.reps === null) return '–';
  return `${set.weight ?? '–'}×${set.reps ?? '–'}`;
}

const ROW_GRID = 'grid grid-cols-[3.5rem_repeat(4,1fr)] gap-2';

export function ExerciseRow({ exercise, history, onSetChange, onNoteChange, onRemove }: ExerciseRowProps) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-neutral-100">{exercise.name}</h3>
        <button
          onClick={onRemove}
          className="text-xs text-neutral-500 hover:text-red-400"
          aria-label={`${exercise.name} entfernen`}
        >
          Entfernen
        </button>
      </div>

      <div className={`${ROW_GRID} mb-1`}>
        <span></span>
        {Array.from({ length: MAX_SETS }, (_, i) => (
          <span key={i} className="text-center text-[10px] uppercase tracking-wide text-neutral-600">
            Satz {i + 1}
          </span>
        ))}
      </div>

      <div className={`${ROW_GRID} mb-2 items-center`}>
        <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Heute</span>
        {exercise.sets.map((set, i) => (
          <div key={i} className="flex items-center gap-1">
            <input
              type="number"
              inputMode="decimal"
              placeholder="kg"
              value={set.weight ?? ''}
              onChange={(e) => onSetChange(i, { weight: parseNumber(e.target.value) })}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-1.5 py-1 text-center text-sm text-neutral-100 focus:border-neutral-400 focus:outline-none"
            />
            <span className="text-neutral-600">×</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="wdh"
              value={set.reps ?? ''}
              onChange={(e) => onSetChange(i, { reps: parseNumber(e.target.value) })}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-1.5 py-1 text-center text-sm text-neutral-100 focus:border-neutral-400 focus:outline-none"
            />
          </div>
        ))}
      </div>

      {history.length > 0 ? (
        <div className="mb-3 flex flex-col gap-1 border-t border-neutral-800 pt-2">
          {history.map((entry) => (
            <div key={entry.date} className={`${ROW_GRID} items-center`}>
              <span className="text-[10px] text-neutral-600">{formatDayMonth(fromISODate(entry.date))}</span>
              {entry.exercise.sets.map((set, i) => (
                <span key={i} className="text-center text-xs text-neutral-500">
                  {formatSet(set)}
                </span>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 border-t border-neutral-800 pt-2 text-xs italic text-neutral-600">
          Noch keine vorherige Einheit erfasst.
        </p>
      )}

      <input
        type="text"
        placeholder="Notiz (optional)"
        value={exercise.note}
        onChange={(e) => onNoteChange(e.target.value)}
        className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1 text-sm text-neutral-300 placeholder:text-neutral-700 focus:border-neutral-400 focus:outline-none"
      />
    </div>
  );
}
