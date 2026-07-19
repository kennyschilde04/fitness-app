import type { SetEntry } from '../types';

export function formatSet(set: SetEntry): string {
  if (set.weight === null && set.reps === null) return '–';
  return `${set.weight ?? '–'}×${set.reps ?? '–'}`;
}
