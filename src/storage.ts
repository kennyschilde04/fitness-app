import type { AppData, ExerciseDef, Session, UnitDef } from './types';

export const STORAGE_KEY = 'gym-tracker-data-v2';

const DEFAULT_UNITS: UnitDef[] = [
  { id: 'unit-schulter-ruecken', name: 'Schulter/Rücken', colorIndex: 0, order: 0 },
  { id: 'unit-arme-brust', name: 'Arme/Brust', colorIndex: 1, order: 1 },
  { id: 'unit-beine', name: 'Beine', colorIndex: 2, order: 2 },
];

const DEMO_EXERCISES: ExerciseDef[] = [
  { id: 'ex-latzug', unitId: 'unit-schulter-ruecken', name: 'Latzug', order: 0 },
  { id: 'ex-rudern', unitId: 'unit-schulter-ruecken', name: 'Rudern Kabel', order: 1 },
  { id: 'ex-schulterdruecken', unitId: 'unit-schulter-ruecken', name: 'Schulterdrücken', order: 2 },
  { id: 'ex-bankdruecken', unitId: 'unit-arme-brust', name: 'Bankdrücken', order: 0 },
  { id: 'ex-schraegbank', unitId: 'unit-arme-brust', name: 'Schrägbank Kurzhantel', order: 1 },
  { id: 'ex-curls', unitId: 'unit-arme-brust', name: 'Bizeps Curls', order: 2 },
  { id: 'ex-kniebeuge', unitId: 'unit-beine', name: 'Kniebeuge', order: 0 },
  { id: 'ex-beinpresse', unitId: 'unit-beine', name: 'Beinpresse', order: 1 },
  { id: 'ex-beinbeuger', unitId: 'unit-beine', name: 'Beinbeuger', order: 2 },
];

function isoDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function demoSession(daysAgo: number, unitId: string, exerciseIds: string[], baseWeight: number): Session {
  return {
    id: `demo-session-${daysAgo}`,
    date: isoDaysAgo(daysAgo),
    unitId,
    exercises: exerciseIds.map((exerciseId, index) => {
      const exercise = DEMO_EXERCISES.find((e) => e.id === exerciseId)!;
      return {
        exerciseId,
        name: exercise.name,
        note: index === 0 && daysAgo % 2 === 0 ? 'Saubere Technik, nächstes Mal +2,5 kg testen.' : '',
        sets: [
          { weight: baseWeight + index * 5, reps: 10 },
          { weight: baseWeight + index * 5, reps: 9 },
          { weight: baseWeight + index * 5 - 2.5, reps: 11 },
        ],
      };
    }),
  };
}

function isoFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function seededNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function fullDemoSession(dayOffset: number, splitIndex: number, trainingIndex: number): Session | null {
  const skippedDays = new Set([9, 22, 37, 45]);
  if (skippedDays.has(dayOffset)) return null;

  const unit = DEFAULT_UNITS[splitIndex];
  const exercises = DEMO_EXERCISES.filter((exercise) => exercise.unitId === unit.id).sort((a, b) => a.order - b.order);
  const omitLastExercise = [14, 29, 51].includes(dayOffset);
  const activeExercises = omitLastExercise ? exercises.slice(0, 2) : exercises;
  const baseByUnit = [37.5, 32.5, 57.5][splitIndex];
  const progress = Math.floor(trainingIndex / 6) * 2.5;
  const fatigue = seededNoise(dayOffset + splitIndex) > 0.78 ? -2.5 : 0;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (59 - dayOffset));

  return {
    id: `full-demo-session-${dayOffset}`,
    date: isoFromDate(date),
    unitId: unit.id,
    exercises: activeExercises.map((exercise, exerciseIndex) => {
      const baseWeight = baseByUnit + progress + fatigue + exerciseIndex * 5;
      const repDrop = seededNoise(dayOffset * 3 + exerciseIndex) > 0.65 ? 1 : 0;
      const setCount = seededNoise(dayOffset + exerciseIndex * 7) > 0.88 ? 2 : 3;
      const sets = Array.from({ length: setCount }, (_, setIndex) => ({
        weight: baseWeight - (setIndex === 2 ? 2.5 : 0),
        reps: Math.max(6, 10 - setIndex - repDrop + (seededNoise(dayOffset + setIndex) > 0.82 ? 1 : 0)),
      }));

      return {
        exerciseId: exercise.id,
        name: exercise.name,
        note: exerciseIndex === 0 && seededNoise(dayOffset) > 0.72 ? 'Starkes Training. Technik sauber halten.' : '',
        sets,
      };
    }),
  };
}

export function demoData(): AppData {
  const sessions: Session[] = [
    demoSession(0, 'unit-arme-brust', ['ex-bankdruecken', 'ex-schraegbank', 'ex-curls'], 35),
    demoSession(2, 'unit-beine', ['ex-kniebeuge', 'ex-beinpresse', 'ex-beinbeuger'], 60),
    demoSession(4, 'unit-schulter-ruecken', ['ex-latzug', 'ex-rudern', 'ex-schulterdruecken'], 40),
    demoSession(7, 'unit-arme-brust', ['ex-bankdruecken', 'ex-schraegbank', 'ex-curls'], 32.5),
    demoSession(10, 'unit-beine', ['ex-kniebeuge', 'ex-beinpresse', 'ex-beinbeuger'], 57.5),
    demoSession(12, 'unit-schulter-ruecken', ['ex-latzug', 'ex-rudern', 'ex-schulterdruecken'], 37.5),
    demoSession(16, 'unit-arme-brust', ['ex-bankdruecken', 'ex-schraegbank', 'ex-curls'], 30),
    demoSession(19, 'unit-beine', ['ex-kniebeuge', 'ex-beinpresse', 'ex-beinbeuger'], 55),
  ];

  return { units: structuredClone(DEFAULT_UNITS), exercises: structuredClone(DEMO_EXERCISES), sessions };
}

export function fullDemoData(): AppData {
  const sessions: Session[] = [];
  let trainingIndex = 0;

  for (let dayOffset = 0; dayOffset < 60; dayOffset += 1) {
    const weekday = dayOffset % 7;
    if (weekday === 6) continue;
    const splitIndex = trainingIndex % DEFAULT_UNITS.length;
    const session = fullDemoSession(dayOffset, splitIndex, trainingIndex);
    if (session) sessions.push(session);
    trainingIndex += 1;
  }

  return {
    units: structuredClone(DEFAULT_UNITS),
    exercises: structuredClone(DEMO_EXERCISES),
    sessions,
  };
}

export function emptyData(): AppData {
  return { units: [], exercises: [], sessions: [] };
}

export function loadData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyData();
  try {
    const parsed = JSON.parse(raw) as AppData;
    return {
      units: parsed.units ?? structuredClone(DEFAULT_UNITS),
      exercises: parsed.exercises ?? [],
      sessions: parsed.sessions ?? [],
    };
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
