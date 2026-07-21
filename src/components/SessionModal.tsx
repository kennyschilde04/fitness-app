import { useEffect, useState } from 'react';
import type { PreviousSessionEntry } from '../state/useAppData';
import type { Session, SetEntry, UnitDef } from '../types';
import { getUnitColor, UNIT_COLOR_PALETTE } from '../types';
import { formatDayMonth, weekdayLabel } from '../utils/date';
import { ExerciseRow } from './ExerciseRow';
import { UnitPicker } from './UnitPicker';

interface SessionModalProps {
  date: Date;
  session: Session | undefined;
  units: UnitDef[];
  onClose: () => void;
  onSelectUnit: (unitId: string) => void;
  onCreateUnit: (name: string, colorIndex?: number) => void;
  onUpdateUnitColor: (unitId: string, colorIndex: number) => void;
  onDeleteUnit: (unitId: string) => void;
  onDeleteSession: () => void;
  onSetChange: (exerciseId: string, setIndex: number, patch: Partial<SetEntry>) => void;
  onAddSet: (exerciseId: string) => void;
  onRemoveSet: (exerciseId: string) => void;
  onNoteChange: (exerciseId: string, note: string) => void;
  onAddExercise: (name: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onReorderExercises: (draggedExerciseId: string, targetExerciseId: string) => void;
  getPreviousSessions: (unitId: string, exerciseId: string) => PreviousSessionEntry[];
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
  onUpdateUnitColor,
  onDeleteUnit,
  onDeleteSession,
  onSetChange,
  onAddSet,
  onRemoveSet,
  onNoteChange,
  onAddExercise,
  onRemoveExercise,
  onReorderExercises,
  getPreviousSessions,
}: SessionModalProps) {
  const [newExerciseName, setNewExerciseName] = useState('');
  const [visible, setVisible] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(session?.exercises[0]?.exerciseId ?? null);
  const [draggedExerciseId, setDraggedExerciseId] = useState<string | null>(null);
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

  function handleExerciseDrop(targetExerciseId: string) {
    if (!draggedExerciseId) return;
    onReorderExercises(draggedExerciseId, targetExerciseId);
    setDraggedExerciseId(null);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-200 sm:items-center sm:p-4 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className={`flex h-[100dvh] w-full flex-col overflow-hidden bg-neutral-950 shadow-2xl transition-transform duration-300 ease-out sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl sm:border sm:border-neutral-800 light:bg-white light:sm:border-neutral-200 ${
          visible ? 'translate-y-0' : 'translate-y-6'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex shrink-0 flex-col border-b border-neutral-900 px-5 pb-5 pt-[max(1.5rem,calc(env(safe-area-inset-top)+0.75rem))] light:border-neutral-200 sm:px-6 ${unit ? `rounded-b-[2rem] ${colors!.bg}` : ''}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-wide text-neutral-500">
                {unit ? `${weekdayLabel(date)} · ${formatDayMonth(date)}` : weekdayLabel(date)}
              </p>
              {unit ? (
                <p className={`mt-1 truncate text-3xl font-black leading-none ${colors!.text}`}>{unit.name}</p>
              ) : (
                <p className="mt-1 text-3xl font-black leading-none text-neutral-100 light:text-neutral-900">{formatDayMonth(date)}</p>
              )}
            </div>
            {unit && (
              <button
                onClick={handleDeleteSession}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-300 transition-transform active:scale-90"
                aria-label="Training löschen"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M6.5 6l1 14h9l1-14" />
                  <path d="M10 11v5" />
                  <path d="M14 11v5" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-xl text-neutral-500 transition-transform active:scale-90 hover:text-neutral-200 light:border-neutral-200 light:bg-white light:text-neutral-500"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>

          {session && session.exercises.length > 1 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {session.exercises.map((exercise) => (
                <button
                  key={exercise.exerciseId}
                  onClick={() => jumpToExercise(exercise.exerciseId)}
                  className="rounded-full border border-neutral-800 px-2.5 py-1 text-[11px] text-neutral-400 transition-transform active:scale-95 hover:text-neutral-200 light:border-neutral-300 light:text-neutral-500"
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
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            <div className="flex flex-col gap-6">
              {session.exercises.length === 0 && (
                <div className={`overflow-hidden rounded-[2rem] border ${colors ? colors.border : 'border-neutral-800'} bg-white/[0.035] light:bg-white/70`}>
                  <div className={`h-2 ${colors ? colors.bg : 'bg-neutral-800'}`} />
                  <div className="px-6 py-8">
                    <p className="text-xs font-black uppercase tracking-wide text-neutral-500">Bereit</p>
                    <p className={`mt-3 text-3xl font-black leading-none ${colors ? colors.text : 'text-neutral-100 light:text-neutral-950'}`}>
                      {unit ? unit.name : 'Einheit'}
                    </p>
                    <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-neutral-500 light:text-neutral-600">
                      Lege jetzt die erste Übung an. Danach kannst du Sätze, Gewicht, Wiederholungen und Notizen erfassen.
                    </p>
                    {unit && (
                      <div className="mt-6">
                        <p className="mb-3 text-xs font-black uppercase tracking-wide text-neutral-500">Farbe</p>
                        <div className="grid grid-cols-4 gap-2">
                          {UNIT_COLOR_PALETTE.map((color, index) => (
                            <button
                              key={color.text}
                              type="button"
                              onClick={() => onUpdateUnitColor(unit.id, index)}
                              className={`flex h-12 items-center justify-center rounded-2xl border transition-transform active:scale-95 ${color.bg} ${color.border} ${
                                unit.colorIndex === index ? `ring-2 ${color.ring} ring-offset-2 ring-offset-neutral-950 light:ring-offset-white` : ''
                              }`}
                              aria-label={`Farbe ${index + 1} auswählen`}
                            >
                              <span className={`h-5 w-5 rounded-full bg-current ${color.text}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      {['Übungen', 'Sätze', 'Notizen'].map((label) => (
                        <div key={label} className="rounded-2xl bg-neutral-950/50 px-3 py-4 light:bg-neutral-100">
                          <p className="text-xl font-black text-neutral-100 light:text-neutral-950">0</p>
                          <p className="mt-1 text-[11px] font-black uppercase text-neutral-500">{label}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={onClose}
                      className="app-primary-button mt-6 w-full px-5 py-4 text-sm"
                    >
                      Split speichern
                    </button>
                  </div>
                </div>
              )}

              {session.exercises.map((exercise) => (
                <ExerciseRow
                  key={exercise.exerciseId}
                  exercise={exercise}
                  history={getPreviousSessions(session.unitId, exercise.exerciseId)}
                  expanded={expandedExerciseId === exercise.exerciseId}
                  dragging={draggedExerciseId === exercise.exerciseId}
                  onToggle={() => setExpandedExerciseId((current) => (current === exercise.exerciseId ? null : exercise.exerciseId))}
                  onDragStart={() => setDraggedExerciseId(exercise.exerciseId)}
                  onDragEnter={() => draggedExerciseId && draggedExerciseId !== exercise.exerciseId && handleExerciseDrop(exercise.exerciseId)}
                  onDragOverExercise={handleExerciseDrop}
                  onDragEnd={() => setDraggedExerciseId(null)}
                  onSetChange={(setIndex, patch) => onSetChange(exercise.exerciseId, setIndex, patch)}
                  onAddSet={() => onAddSet(exercise.exerciseId)}
                  onRemoveSet={() => onRemoveSet(exercise.exerciseId)}
                  onNoteChange={(note) => onNoteChange(exercise.exerciseId, note)}
                  onRemove={() => onRemoveExercise(exercise.exerciseId)}
                />
              ))}
            </div>

            <div className="mt-6 flex gap-3 pb-[env(safe-area-inset-bottom)]">
              <input
                type="text"
                placeholder="Neue Übung hinzufügen…"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
                className="app-input app-input-wide flex-1"
              />
              <button
                onClick={handleAddExercise}
                className="app-primary-button shrink-0 px-5 py-4 text-sm disabled:opacity-40"
                disabled={newExerciseName.trim() === ''}
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
