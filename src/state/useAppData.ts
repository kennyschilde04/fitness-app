import { useCallback, useEffect, useState } from 'react';
import { loadData, saveData } from '../storage';
import type { AppData, ExerciseDef, Session, SessionExercise, SetEntry, UnitDef } from '../types';
import { MAX_SETS } from '../types';

function emptySets(): SetEntry[] {
  return Array.from({ length: MAX_SETS }, () => ({ weight: null, reps: null }));
}

function newId(): string {
  return crypto.randomUUID();
}

export interface PreviousSessionEntry {
  date: string;
  exercise: SessionExercise;
}

export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const getSessionForDate = useCallback(
    (date: string): Session | undefined => data.sessions.find((s) => s.date === date),
    [data.sessions],
  );

  const createUnit = useCallback((name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    const id = newId();
    setData((prev) => {
      const maxOrder = prev.units.reduce((max, u) => Math.max(max, u.order), -1);
      const unit: UnitDef = { id, name: trimmed, colorIndex: prev.units.length, order: maxOrder + 1 };
      return { ...prev, units: [...prev.units, unit] };
    });
    return id;
  }, []);

  const createSession = useCallback((date: string, unitId: string) => {
    setData((prev) => {
      const existing = prev.sessions.find((s) => s.date === date);
      if (existing) return prev;

      const unitExercises = prev.exercises
        .filter((e) => e.unitId === unitId)
        .sort((a, b) => a.order - b.order);

      const session: Session = {
        id: newId(),
        date,
        unitId,
        exercises: unitExercises.map((ex) => ({
          exerciseId: ex.id,
          name: ex.name,
          note: '',
          sets: emptySets(),
        })),
      };

      return { ...prev, sessions: [...prev.sessions, session] };
    });
  }, []);

  const updateSet = useCallback(
    (sessionId: string, exerciseId: string, setIndex: number, patch: Partial<SetEntry>) => {
      setData((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            exercises: s.exercises.map((ex) => {
              if (ex.exerciseId !== exerciseId) return ex;
              const sets = ex.sets.slice();
              sets[setIndex] = { ...sets[setIndex], ...patch };
              return { ...ex, sets };
            }),
          };
        }),
      }));
    },
    [],
  );

  const updateExerciseNote = useCallback((sessionId: string, exerciseId: string, note: string) => {
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          exercises: s.exercises.map((ex) => (ex.exerciseId === exerciseId ? { ...ex, note } : ex)),
        };
      }),
    }));
  }, []);

  const addExerciseToSession = useCallback((sessionId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setData((prev) => {
      const session = prev.sessions.find((s) => s.id === sessionId);
      if (!session) return prev;

      const unitExercises = prev.exercises.filter((e) => e.unitId === session.unitId);
      const maxOrder = unitExercises.reduce((max, e) => Math.max(max, e.order), -1);

      const newExercise: ExerciseDef = {
        id: newId(),
        unitId: session.unitId,
        name: trimmed,
        order: maxOrder + 1,
      };

      const sessionExercise: SessionExercise = {
        exerciseId: newExercise.id,
        name: trimmed,
        note: '',
        sets: emptySets(),
      };

      return {
        ...prev,
        exercises: [...prev.exercises, newExercise],
        sessions: prev.sessions.map((s) =>
          s.id === sessionId ? { ...s, exercises: [...s.exercises, sessionExercise] } : s,
        ),
      };
    });
  }, []);

  const removeExerciseFromUnit = useCallback((sessionId: string, exerciseId: string) => {
    setData((prev) => {
      const session = prev.sessions.find((s) => s.id === sessionId);
      if (!session) return prev;
      return {
        ...prev,
        exercises: prev.exercises.filter((e) => !(e.id === exerciseId && e.unitId === session.unitId)),
        sessions: prev.sessions.map((s) =>
          s.id === sessionId
            ? { ...s, exercises: s.exercises.filter((ex) => ex.exerciseId !== exerciseId) }
            : s,
        ),
      };
    });
  }, []);

  const deleteUnit = useCallback((unitId: string) => {
    setData((prev) => ({
      units: prev.units.filter((u) => u.id !== unitId),
      exercises: prev.exercises.filter((e) => e.unitId !== unitId),
      sessions: prev.sessions.filter((s) => s.unitId !== unitId),
    }));
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== sessionId),
    }));
  }, []);

  const getPreviousSessions = useCallback(
    (unitId: string, exerciseId: string, currentSessionId: string, limit = 3): PreviousSessionEntry[] => {
      const currentSession = data.sessions.find((s) => s.id === currentSessionId);
      const beforeDate = currentSession?.date;

      return data.sessions
        .filter((s) => s.unitId === unitId && s.id !== currentSessionId)
        .filter((s) => (beforeDate ? s.date < beforeDate : true))
        .filter((s) => s.exercises.some((ex) => ex.exerciseId === exerciseId))
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, limit)
        .map((s) => ({
          date: s.date,
          exercise: s.exercises.find((ex) => ex.exerciseId === exerciseId)!,
        }));
    },
    [data.sessions],
  );

  return {
    units: data.units,
    exercises: data.exercises,
    sessions: data.sessions,
    getSessionForDate,
    createUnit,
    createSession,
    deleteUnit,
    deleteSession,
    updateSet,
    updateExerciseNote,
    addExerciseToSession,
    removeExerciseFromUnit,
    getPreviousSessions,
  };
}
