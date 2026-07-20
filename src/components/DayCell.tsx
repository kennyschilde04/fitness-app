import type { Session, UnitDef } from '../types';
import { getUnitColor } from '../types';
import { isSameDay, weekdayShort } from '../utils/date';
import { useLongPress } from '../utils/useLongPress';

interface DayCellProps {
  date: Date;
  unit: UnitDef | undefined;
  session: Session | undefined;
  active?: boolean;
  onClick: () => void;
  onLongPress?: (x: number, y: number) => void;
}

function countCompletedSets(session: Session | undefined): number {
  if (!session) return 0;
  return session.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.weight !== null || set.reps !== null).length,
    0,
  );
}

export function DayCell({ date, unit, session, active = false, onClick, onLongPress }: DayCellProps) {
  const today = isSameDay(date, new Date());
  const colors = unit ? getUnitColor(unit) : null;
  const longPress = useLongPress((x, y) => onLongPress?.(x, y));
  const completedSets = countCompletedSets(session);

  return (
    <button
      onClick={() => {
        if (longPress.wasLongPress()) return;
        onClick();
      }}
      onPointerDown={longPress.onPointerDown}
      onPointerMove={longPress.onPointerMove}
      onPointerUp={longPress.onPointerUp}
      onPointerLeave={longPress.onPointerLeave}
      onPointerCancel={longPress.onPointerCancel}
      onContextMenu={(event) => event.preventDefault()}
      className={`relative flex h-36 w-29 flex-col overflow-hidden rounded-3xl border p-3 text-left shadow-lg shadow-black/15 transition-all duration-150 active:scale-95 sm:h-36 sm:w-29
        ${colors ? `${colors.bg} ${colors.border}` : 'border-neutral-800 bg-neutral-900/80 hover:border-neutral-700 light:bg-white light:hover:border-neutral-300'}
        ${active ? 'border-lime-300 bg-neutral-900 shadow-[inset_0_0_0_2px_rgba(190,242,100,0.95)] light:border-lime-500 light:shadow-[inset_0_0_0_2px_rgba(132,204,22,0.9)]' : ''}
      `}
    >
      {active && <span className="absolute inset-x-3 top-0 h-1 rounded-b-full bg-lime-300 light:bg-lime-500" />}
      <div className="flex w-full items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase text-neutral-500 light:text-neutral-500">
            {weekdayShort(date)}
          </div>
          <div className={`mt-1 text-3xl font-black leading-none ${today ? 'text-lime-300 light:text-lime-600' : 'text-neutral-100 light:text-neutral-900'}`}>
            {date.getDate()}
          </div>
        </div>
        {today && <span className="mt-0.5 h-2 w-2 rounded-full bg-lime-300 light:bg-lime-500" aria-label="Heute" />}
      </div>

      <div className="mt-auto w-full">
        {unit ? (
          <>
            <span className={`block truncate text-sm font-black leading-tight ${colors!.text}`}>{unit.name}</span>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10 light:bg-neutral-200">
              <div
                className="h-full rounded-full bg-current text-lime-300"
                style={{ width: `${Math.min(100, Math.max(24, completedSets * 8))}%` }}
              />
            </div>
            <span className="mt-1 block truncate text-[11px] font-semibold text-neutral-500 light:text-neutral-500">
              {session?.exercises.length ?? 0} Übungen
            </span>
          </>
        ) : (
          <span className="text-xs font-semibold text-neutral-600 light:text-neutral-400">Planen</span>
        )}
      </div>
    </button>
  );
}
