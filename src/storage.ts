import type { AppData, UnitDef } from './types';

const STORAGE_KEY = 'gym-tracker-data-v2';

const DEFAULT_UNITS: UnitDef[] = [
  { id: 'unit-schulter-ruecken', name: 'Schulter/Rücken', colorIndex: 0, order: 0 },
  { id: 'unit-arme-brust', name: 'Arme/Brust', colorIndex: 1, order: 1 },
  { id: 'unit-beine', name: 'Beine', colorIndex: 2, order: 2 },
];

function emptyData(): AppData {
  return { units: structuredClone(DEFAULT_UNITS), exercises: [], sessions: [] };
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
