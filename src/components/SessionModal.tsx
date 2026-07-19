import { useState } from 'react';
import type { PreviousSessionEntry } from '../state/useAppData';
import type { Session, SetEntry, UnitDef } from '../types';
import { getUnitColor } from '../types';
import { formatDayMonth, weekdayLabel } from '../utils/date';
import { ExerciseRow } from './ExerciseRow';
import { UnitPicker } from './UnitPicker';

interface SessionModalProps {
  date: Date;
  session: Session | undefined;
  units: UnitDef[];
  onClose: () => void;
  onSelectUnit: (unitId: string) => void;
  onCreateUnit: (name: string) => void;
  onDeleteUnit: (unitId: string) => void;
  onDeleteSession: () => void;
  onSetChange: (exerciseId: string, setIndex: number, patch: Partial<SetEntry>) => void;
  onNoteChange: (exerciseId: string, note: string) => void;
  onAddExercise: (name: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  getPreviousSessions: (unitId: string, exerciseId: string) => PreviousSessionEntry[];
}

export function SessionModal({
  date,
  session,
  units,
  onClose,
  onSelectUnit,
  onCreateUnit,
  onDeleteUnit,
  onDeleteSession,
  onSetChange,
  onNoteChange,
  onAddExercise,
  onRemoveExercise,
  getPreviousSessions,
}: SessionModalProps) {
  const [newExerciseName, setNewExerciseName] = useState('');
  const unit = session ? units.find((u) => u.id === session.unitId) : undefined;
  const colors = unit ? getUnitColor(unit) : null;

  function handleAddExercise() {
    if (newExerciseName.trim() === '') return;
    onAddExercise(newExerciseName);
    setNewExerciseName('');
  }

  function handleDeleteSession() {
    if (window.confirm('Diese Einheit für den Tag wirklich löschen? Alle erfassten Sätze gehen verloren.')) {
      onDeleteSession();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">{weekdayLabel(date)}</p>
            <p className="text-lg font-semibold text-neutral-100">{formatDayMonth(date)}</p>
          </div>
          {unit && (
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors!.bg} ${colors!.text}`}>
                {unit.name}
              </span>
              <button onClick={handleDeleteSession} className="text-xs text-neutral-500 hover:text-red-400">
                Einheit löschen
              </button>
            </div>
          )}
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200" aria-label="Schließen">
            ✕
          </button>
        </div>

        {!session ? (
          <UnitPicker units={units} onSelect={onSelectUnit} onCreateUnit={onCreateUnit} onDeleteUnit={onDeleteUnit} />
        ) : (
          <div className="max-h-[70vh] overflow-y-auto p-6">
            <div className="flex flex-col gap-4">
              {session.exercises.length === 0 && (
                <p className="text-sm text-neutral-500">
                  Noch keine Übungen für diese Einheit. Füge unten deine erste Übung hinzu.
                </p>
              )}

              {session.exercises.map((exercise) => (
                <ExerciseRow
                  key={exercise.exerciseId}
                  exercise={exercise}
                  history={getPreviousSessions(session.unitId, exercise.exerciseId)}
                  onSetChange={(setIndex, patch) => onSetChange(exercise.exerciseId, setIndex, patch)}
                  onNoteChange={(note) => onNoteChange(exercise.exerciseId, note)}
                  onRemove={() => onRemoveExercise(exercise.exerciseId)}
                />
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Neue Übung hinzufügen…"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
                className="flex-1 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-400 focus:outline-none"
              />
              <button
                onClick={handleAddExercise}
                className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-800"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
