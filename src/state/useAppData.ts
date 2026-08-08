import { useCallback, useEffect, useRef, useState } from 'react';
import {
  demoData,
  emptyData,
  fullDemoData,
  loadData,
  loescheRaum,
  saveData,
  savePlanSlot,
  setzeRaum,
  writeAutoBackup,
} from '../storage';
import { hochladenWennVerbunden, stillAnmelden } from './driveSync';
import type { AppData, ExerciseDef, Session, SessionExercise, SetEntry, UnitDef } from '../types';
import { DEFAULT_SETS, MAX_SETS, MIN_SETS } from '../types';

export type AppZustand = 'pruefe' | 'ohneKonto' | 'bereit' | 'demo';

function emptySets(count: number = DEFAULT_SETS): SetEntry[] {
  return Array.from({ length: count }, () => ({ weight: null, reps: null }));
}

function newId(): string {
  return crypto.randomUUID();
}

function hasSetData(sets: SetEntry[]): boolean {
  return sets.some((s) => s.weight !== null || s.reps !== null);
}

export interface PreviousSessionEntry {
  date: string;
  exercise: SessionExercise;
}

export interface ExerciseHistoryEntry {
  exerciseId: string;
  name: string;
  entries: SetEntry[][];
}

export function useAppData() {
  // Ohne Namensraum bleibt die App leer. Der Raum steht erst fest, wenn die
  // stille Anmeldung durch ist — vorher wird nichts geladen und nichts
  // geschrieben, sonst könnten Daten eines Kontos ohne Anmeldung erscheinen.
  const [zustand, setZustand] = useState<AppZustand>('pruefe');
  const [konto, setKonto] = useState<string | null>(null);
  const [data, setData] = useState<AppData>(() => emptyData());

  useEffect(() => {
    let abgebrochen = false;

    async function starten() {
      // Der Demo-Modus überlebt einen Neustart bewusst nicht: sonst bliebe die
      // App ohne Konto dauerhaft in den Testdaten stehen und fragte nie wieder
      // nach einer Anmeldung.
      const email = await stillAnmelden();
      if (abgebrochen) return;

      if (!email) {
        setzeRaum(null);
        setZustand('ohneKonto');
        return;
      }

      setzeRaum({ art: 'konto', email });
      setKonto(email);
      setData(loadData());
      setZustand('bereit');
    }

    void starten();
    return () => {
      abgebrochen = true;
    };
  }, []);

  useEffect(() => {
    if (zustand === 'pruefe' || zustand === 'ohneKonto') return;
    saveData(data);
  }, [data, zustand]);

  // Die resetTo*-Funktionen sind bewusst ohne Abhängigkeiten. Über die Ref
  // kommen sie trotzdem an den aktuellen Stand, um ihn vor dem Überschreiben
  // zu sichern.
  const currentData = useRef(data);
  currentData.current = data;


  // Eigene Stände werden laufend in den Plan-Slot gespiegelt. Dadurch braucht
  // es keinen Sichern-Button: der Plan ist immer der letzte eigene Stand.
  // Nur echte Kontodaten werden gespiegelt und hochgeladen — im Demo-Raum
  // wäre beides falsch.
  useEffect(() => {
    if (zustand !== 'bereit') return;
    if (data.sessions.length === 0) return;
    savePlanSlot(data);
    hochladenWennVerbunden(data);
  }, [data, zustand]);

  /**
   * Ersetzt den Bestand. `zielRaum` entscheidet, wohin geschrieben wird:
   * Demo-Datensätze landen im Demo-Raum, eigene Daten im Raum des Kontos.
   */
  const replaceAll = useCallback(
    (next: AppData, zielRaum: 'demo' | 'konto') => {
      writeAutoBackup(currentData.current);
      if (zielRaum === 'demo') {
        setzeRaum({ art: 'demo' });
        setZustand('demo');
      } else if (konto) {
        setzeRaum({ art: 'konto', email: konto });
        setZustand('bereit');
      }
      saveData(next);
      setData(next);
    },
    [konto],
  );

  /**
   * Wechselt den aktiven Raum auf ein Konto. Der Bestand des vorherigen
   * Kontos wird vom Gerät entfernt — dessen Daten liegen in seinem Drive.
   */
  const wechsleKonto = useCallback((email: string, stand: AppData, vorherigesKonto: string | null) => {
    if (vorherigesKonto && vorherigesKonto.toLowerCase() !== email.toLowerCase()) {
      loescheRaum(vorherigesKonto);
    }
    setzeRaum({ art: 'konto', email });
    setKonto(email);
    saveData(stand);
    setData(stand);
    setZustand('bereit');
  }, []);

  const getSessionForDate = useCallback(
    (date: string): Session | undefined => data.sessions.find((s) => s.date === date),
    [data.sessions],
  );

  const createUnit = useCallback((name: string, colorIndex?: number): string => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    const id = newId();
    setData((prev) => {
      const maxOrder = prev.units.reduce((max, u) => Math.max(max, u.order), -1);
      const unit: UnitDef = { id, name: trimmed, colorIndex: colorIndex ?? prev.units.length, order: maxOrder + 1 };
      return { ...prev, units: [...prev.units, unit] };
    });
    return id;
  }, []);

  const updateUnitColor = useCallback((unitId: string, colorIndex: number) => {
    setData((prev) => ({
      ...prev,
      units: prev.units.map((unit) => (unit.id === unitId ? { ...unit, colorIndex } : unit)),
    }));
  }, []);

  const updateUnit = useCallback((unitId: string, patch: Partial<Pick<UnitDef, 'name' | 'colorIndex'>>) => {
    setData((prev) => ({
      ...prev,
      units: prev.units.map((unit) => {
        if (unit.id !== unitId) return unit;
        const name = patch.name?.trim();
        return {
          ...unit,
          ...(name ? { name } : {}),
          ...(patch.colorIndex !== undefined ? { colorIndex: patch.colorIndex } : {}),
        };
      }),
    }));
  }, []);

  const createSession = useCallback((date: string, unitId: string) => {
    setData((prev) => {
      const existing = prev.sessions.find((s) => s.date === date);
      if (existing) return prev;

      const unitExercises = prev.exercises
        .filter((e) => e.unitId === unitId)
        .sort((a, b) => a.order - b.order);

      const priorSessions = prev.sessions
        .filter((s) => s.unitId === unitId && s.date < date)
        .sort((a, b) => (a.date < b.date ? 1 : -1));

      function lastNoteFor(exerciseId: string): string {
        for (const s of priorSessions) {
          const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
          if (ex && ex.note.trim()) return ex.note;
        }
        return '';
      }

      function maxSetCountFor(exerciseId: string): number {
        let max = 0;
        for (const s of priorSessions) {
          const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
          if (ex && hasSetData(ex.sets)) max = Math.max(max, ex.sets.length);
        }
        return max > 0 ? max : DEFAULT_SETS;
      }

      const session: Session = {
        id: newId(),
        date,
        unitId,
        exercises: unitExercises.map((ex) => ({
          exerciseId: ex.id,
          name: ex.name,
          note: lastNoteFor(ex.id),
          sets: emptySets(maxSetCountFor(ex.id)),
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

  const addSet = useCallback((sessionId: string, exerciseId: string) => {
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          exercises: s.exercises.map((ex) => {
            if (ex.exerciseId !== exerciseId) return ex;
            if (ex.sets.length >= MAX_SETS) return ex;
            return { ...ex, sets: [...ex.sets, { weight: null, reps: null }] };
          }),
        };
      }),
    }));
  }, []);

  const removeSet = useCallback((sessionId: string, exerciseId: string) => {
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          exercises: s.exercises.map((ex) => {
            if (ex.exerciseId !== exerciseId) return ex;
            if (ex.sets.length <= MIN_SETS) return ex;
            return { ...ex, sets: ex.sets.slice(0, -1) };
          }),
        };
      }),
    }));
  }, []);

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

  const addExerciseToUnit = useCallback((unitId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setData((prev) => {
      const unitExercises = prev.exercises.filter((e) => e.unitId === unitId);
      const maxOrder = unitExercises.reduce((max, e) => Math.max(max, e.order), -1);
      const newExercise: ExerciseDef = {
        id: newId(),
        unitId,
        name: trimmed,
        order: maxOrder + 1,
      };

      return {
        ...prev,
        exercises: [...prev.exercises, newExercise],
      };
    });
  }, []);

  const removeExerciseFromUnitPlan = useCallback((unitId: string, exerciseId: string) => {
    setData((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((exercise) => !(exercise.unitId === unitId && exercise.id === exerciseId)),
      sessions: prev.sessions.map((session) =>
        session.unitId === unitId
          ? { ...session, exercises: session.exercises.filter((exercise) => exercise.exerciseId !== exerciseId) }
          : session,
      ),
    }));
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

  const setExerciseOrder = useCallback((sessionId: string, orderedExerciseIds: string[]) => {
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) => {
        if (session.id !== sessionId) return session;
        const byId = new Map(session.exercises.map((exercise) => [exercise.exerciseId, exercise]));
        const exercises = orderedExerciseIds
          .map((id) => byId.get(id))
          .filter((exercise): exercise is SessionExercise => exercise !== undefined);
        return { ...session, exercises };
      }),
    }));
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

  const resetToDemoData = useCallback(() => replaceAll(demoData(), 'demo'), [replaceAll]);

  const resetToFullDemoData = useCallback(() => replaceAll(fullDemoData(), 'demo'), [replaceAll]);

  const resetToEmptyData = useCallback(() => replaceAll(emptyData(), 'demo'), [replaceAll]);

  /** Eigene Daten: Import oder der zurückgeholte Plan. */
  const replaceData = useCallback((next: AppData) => replaceAll(next, 'konto'), [replaceAll]);

  const getRecentSessions = useCallback(
    (unitId: string, limit = 10): Session[] =>
      data.sessions
        .filter((s) => s.unitId === unitId)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, limit),
    [data.sessions],
  );

  const getPreviousSessions = useCallback(
    (unitId: string, exerciseId: string, currentSessionId: string, limit = 3): PreviousSessionEntry[] => {
      const currentSession = data.sessions.find((s) => s.id === currentSessionId);
      const beforeDate = currentSession?.date;

      return data.sessions
        .filter((s) => s.unitId === unitId && s.id !== currentSessionId)
        .filter((s) => (beforeDate ? s.date < beforeDate : true))
        .filter((s) => s.exercises.some((ex) => ex.exerciseId === exerciseId && hasSetData(ex.sets)))
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, limit)
        .map((s) => ({
          date: s.date,
          exercise: s.exercises.find((ex) => ex.exerciseId === exerciseId)!,
        }));
    },
    [data.sessions],
  );

  const getUnitExerciseHistory = useCallback(
    (unitId: string, limitPerExercise = 10): ExerciseHistoryEntry[] => {
      const unitSessions = data.sessions
        .filter((s) => s.unitId === unitId)
        .sort((a, b) => (a.date < b.date ? 1 : -1));

      const byExercise = new Map<string, ExerciseHistoryEntry>();

      for (const session of unitSessions) {
        for (const ex of session.exercises) {
          if (!hasSetData(ex.sets)) continue;
          let entry = byExercise.get(ex.exerciseId);
          if (!entry) {
            entry = { exerciseId: ex.exerciseId, name: ex.name, entries: [] };
            byExercise.set(ex.exerciseId, entry);
          }
          if (entry.entries.length < limitPerExercise) {
            entry.entries.push(ex.sets);
          }
        }
      }

      return Array.from(byExercise.values());
    },
    [data.sessions],
  );

  return {
    units: data.units,
    exercises: data.exercises,
    sessions: data.sessions,
    getSessionForDate,
    createUnit,
    updateUnit,
    updateUnitColor,
    createSession,
    addSet,
    removeSet,
    deleteUnit,
    deleteSession,
    updateSet,
    updateExerciseNote,
    addExerciseToSession,
    addExerciseToUnit,
    removeExerciseFromUnit,
    removeExerciseFromUnitPlan,
    setExerciseOrder,
    getPreviousSessions,
    getRecentSessions,
    getUnitExerciseHistory,
    resetToDemoData,
    resetToFullDemoData,
    resetToEmptyData,
    replaceData,
    zustand,
    konto,
    /** Wechselt auf ein Konto und entfernt den Bestand des vorherigen vom Gerät. */
    wechsleKonto,
  };
}
