import type { PreviousSessionEntry } from '../state/useAppData';
import type { SessionExercise, SetEntry } from '../types';
import { formatDayMonth, fromISODate } from '../utils/date';
import { formatSet } from '../utils/format';

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

const inputClass =
  'w-full min-w-0 rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-3 text-center text-base text-neutral-100 focus:border-neutral-400 focus:outline-none sm:py-1.5 sm:text-sm';

export function ExerciseRow({ exercise, history, onSetChange, onNoteChange, onRemove }: ExerciseRowProps) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-neutral-100">{exercise.name}</h3>
        <button
          onClick={onRemove}
          className="shrink-0 rounded-md border border-red-900/40 bg-red-500/10 px-2.5 py-1 text-xs text-red-400/90 transition-transform active:scale-95 hover:bg-red-500/20 hover:text-red-300"
          aria-label={`${exercise.name} entfernen`}
        >
          Entfernen
        </button>
      </div>

      <div className="mb-3 flex flex-col gap-2">
        {exercise.sets.map((set, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Satz {i + 1}
            </span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="kg"
              value={set.weight ?? ''}
              onChange={(e) => onSetChange(i, { weight: parseNumber(e.target.value) })}
              className={inputClass}
            />
            <span className="shrink-0 text-neutral-600">×</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Wdh"
              value={set.reps ?? ''}
              onChange={(e) => onSetChange(i, { reps: parseNumber(e.target.value) })}
              className={inputClass}
            />
          </div>
        ))}
      </div>

      {history.length > 0 ? (
        <div className="mb-3 flex flex-col gap-1.5 border-t border-neutral-800 pt-3">
          <p className="text-[10px] uppercase tracking-wide text-neutral-600">Letzte Einheiten</p>
          {history.map((entry) => (
            <div key={entry.date} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs">
              <span className="w-16 shrink-0 text-neutral-600">{formatDayMonth(fromISODate(entry.date))}</span>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
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
        <p className="mb-3 border-t border-neutral-800 pt-3 text-xs italic text-neutral-600">
          Noch keine vorherige Einheit erfasst.
        </p>
      )}

      <input
        type="text"
        placeholder="Notiz (optional)"
        value={exercise.note}
        onChange={(e) => onNoteChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 placeholder:text-neutral-700 focus:border-neutral-400 focus:outline-none"
      />
    </div>
  );
}
