import { useEffect, useState } from 'react';
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
  onAddSet: (exerciseId: string) => void;
  onRemoveSet: (exerciseId: string) => void;
  onNoteChange: (exerciseId: string, note: string) => void;
  onAddExercise: (name: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  getPreviousSessions: (unitId: string, exerciseId: string) => PreviousSessionEntry[];
  onViewHistory: (unitId: string) => void;
}

function jumpToExercise(exerciseId: string) {
  document.getElementById(`exercise-${exerciseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  onAddSet,
  onRemoveSet,
  onNoteChange,
  onAddExercise,
  onRemoveExercise,
  getPreviousSessions,
  onViewHistory,
}: SessionModalProps) {
  const [newExerciseName, setNewExerciseName] = useState('');
  const [visible, setVisible] = useState(false);
  const unit = session ? units.find((u) => u.id === session.unitId) : undefined;
  const colors = unit ? getUnitColor(unit) : null;

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

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
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-200 sm:items-center sm:p-4 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className={`flex h-[100dvh] w-full flex-col bg-neutral-950 shadow-2xl transition-transform duration-300 ease-out sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl sm:border sm:border-neutral-800 light:bg-white light:sm:border-neutral-200 ${
          visible ? 'translate-y-0' : 'translate-y-6'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 flex-col gap-2 border-b border-neutral-800 px-4 py-4 light:border-neutral-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">{weekdayLabel(date)}</p>
              <p className="text-lg font-semibold text-neutral-100 light:text-neutral-900">{formatDayMonth(date)}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-neutral-500 transition-transform active:scale-90 hover:text-neutral-200"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>

          {unit && (
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors!.bg} ${colors!.text}`}>
                {unit.name}
              </span>
              <button
                onClick={() => onViewHistory(unit.id)}
                className="rounded-md px-2 py-1 text-xs text-neutral-500 transition-transform active:scale-95 hover:text-neutral-300"
              >
                Insight
              </button>
              <button
                onClick={handleDeleteSession}
                className="rounded-md border border-red-900/40 bg-red-500/10 px-2.5 py-1 text-xs text-red-400/90 transition-transform active:scale-95 hover:bg-red-500/20 hover:text-red-300"
              >
                Löschen
              </button>
            </div>
          )}

          {session && session.exercises.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pt-1">
              {session.exercises.map((exercise) => (
                <button
                  key={exercise.exerciseId}
                  onClick={() => jumpToExercise(exercise.exerciseId)}
                  className="shrink-0 rounded-full border border-neutral-800 px-2.5 py-1 text-[11px] text-neutral-400 transition-transform active:scale-95 hover:text-neutral-200 light:border-neutral-300 light:text-neutral-500"
                >
                  {exercise.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {!session ? (
          <div className="flex-1 overflow-y-auto">
            <UnitPicker units={units} onSelect={onSelectUnit} onCreateUnit={onCreateUnit} onDeleteUnit={onDeleteUnit} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                  onAddSet={() => onAddSet(exercise.exerciseId)}
                  onRemoveSet={() => onRemoveSet(exercise.exerciseId)}
                  onNoteChange={(note) => onNoteChange(exercise.exerciseId, note)}
                  onRemove={() => onRemoveExercise(exercise.exerciseId)}
                />
              ))}
            </div>

            <div className="mt-4 flex gap-2 pb-[env(safe-area-inset-bottom)]">
              <input
                type="text"
                placeholder="Neue Übung hinzufügen…"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
                className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-3 text-base text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-400 focus:outline-none sm:py-2 sm:text-sm light:border-neutral-300 light:bg-neutral-50 light:text-neutral-900"
              />
              <button
                onClick={handleAddExercise}
                className="shrink-0 rounded-lg border border-neutral-700 px-4 py-3 text-sm font-medium text-neutral-200 transition-transform active:scale-95 hover:bg-neutral-800 sm:py-2 light:border-neutral-300 light:text-neutral-700 light:hover:bg-neutral-100"
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
