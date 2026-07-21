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
