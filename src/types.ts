export const DEFAULT_SETS = 3;
export const MIN_SETS = 1;
export const MAX_SETS = 6;

export interface UnitDef {
  id: string;
  name: string;
  colorIndex: number;
  order: number;
}

export const UNIT_COLOR_PALETTE: { bg: string; border: string; text: string; ring: string }[] = [
  { bg: 'bg-sky-500/15', border: 'border-sky-500/50', text: 'text-sky-400', ring: 'ring-sky-500' },
  { bg: 'bg-orange-500/15', border: 'border-orange-500/50', text: 'text-orange-400', ring: 'ring-orange-500' },
  { bg: 'bg-emerald-500/15', border: 'border-emerald-500/50', text: 'text-emerald-400', ring: 'ring-emerald-500' },
  { bg: 'bg-purple-500/15', border: 'border-purple-500/50', text: 'text-purple-400', ring: 'ring-purple-500' },
  { bg: 'bg-pink-500/15', border: 'border-pink-500/50', text: 'text-pink-400', ring: 'ring-pink-500' },
  { bg: 'bg-amber-500/15', border: 'border-amber-500/50', text: 'text-amber-400', ring: 'ring-amber-500' },
  { bg: 'bg-rose-500/15', border: 'border-rose-500/50', text: 'text-rose-400', ring: 'ring-rose-500' },
  { bg: 'bg-teal-500/15', border: 'border-teal-500/50', text: 'text-teal-400', ring: 'ring-teal-500' },
];

export function getUnitColor(unit: UnitDef) {
  return UNIT_COLOR_PALETTE[unit.colorIndex % UNIT_COLOR_PALETTE.length];
}

export interface ExerciseDef {
  id: string;
  unitId: string;
  name: string;
  order: number;
}

export interface SetEntry {
  weight: number | null;
  reps: number | null;
}

export interface SessionExercise {
  exerciseId: string;
  name: string;
  note: string;
  sets: SetEntry[];
}

export interface Session {
  id: string;
  date: string; // ISO yyyy-mm-dd
  unitId: string;
  exercises: SessionExercise[];
}

export interface AppData {
  units: UnitDef[];
  exercises: ExerciseDef[];
  sessions: Session[];
}
