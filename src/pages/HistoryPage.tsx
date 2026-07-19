import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Session, UnitDef } from '../types';
import { getUnitColor } from '../types';
import { useAppData } from '../state/useAppData';
import { formatDayMonth, fromISODate } from '../utils/date';
import { formatSet } from '../utils/format';

const OVERVIEW_LIMIT = 5;
const FOCUSED_LIMIT = 10;

function SessionCard({ session }: { session: Session }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      <p className="mb-2 text-sm font-medium text-neutral-300">{formatDayMonth(fromISODate(session.date))}</p>
      {session.exercises.length === 0 ? (
        <p className="text-xs italic text-neutral-600">Keine Übungen erfasst.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {session.exercises.map((exercise) => (
            <div key={exercise.exerciseId} className="text-xs">
              <span className="font-medium text-neutral-300">{exercise.name}</span>
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-neutral-500">
                {exercise.sets.map((set, i) => (
                  <span key={i}>
                    <span className="text-neutral-600">S{i + 1}</span> {formatSet(set)}
                  </span>
                ))}
              </div>
              {exercise.note && <p className="mt-0.5 italic text-neutral-600">{exercise.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UnitSection({
  unit,
  sessions,
  focused,
}: {
  unit: UnitDef;
  sessions: Session[];
  focused: boolean;
}) {
  const colors = getUnitColor(unit);

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${colors.bg} ${colors.text}`}>
          {unit.name}
        </span>
        {!focused && (
          <Link
            to={`/history/${unit.id}`}
            className="rounded-md px-2 py-1 text-xs text-neutral-500 transition-transform active:scale-95 hover:text-neutral-300"
          >
            Alle anzeigen →
          </Link>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="text-xs italic text-neutral-600">Noch keine Einheiten erfasst.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </section>
  );
}

export function HistoryPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { units, getRecentSessions } = useAppData();

  const sortedUnits = [...units].sort((a, b) => a.order - b.order);
  const focusedUnit = unitId ? sortedUnits.find((u) => u.id === unitId) : undefined;

  return (
    <div className="min-h-[100dvh] bg-neutral-950 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
      <header className="mx-auto mb-6 flex w-full max-w-3xl items-center gap-3 sm:mb-8">
        <button
          onClick={() => navigate(-1)}
          className="rounded-md px-2 py-1 text-sm text-neutral-400 transition-transform active:scale-95 hover:text-neutral-200"
        >
          ← Zurück
        </button>
        <h1 className="text-base font-semibold tracking-tight text-neutral-100 sm:text-lg">
          {focusedUnit ? `Verlauf · ${focusedUnit.name}` : 'Verlauf'}
        </h1>
      </header>

      <main className="mx-auto w-full max-w-3xl pb-12">
        {unitId && !focusedUnit ? (
          <p className="text-sm text-neutral-500">Diese Einheit existiert nicht (mehr).</p>
        ) : focusedUnit ? (
          <UnitSection unit={focusedUnit} sessions={getRecentSessions(focusedUnit.id, FOCUSED_LIMIT)} focused />
        ) : sortedUnits.length === 0 ? (
          <p className="text-sm text-neutral-500">Noch keine Einheiten angelegt.</p>
        ) : (
          sortedUnits.map((unit) => (
            <UnitSection
              key={unit.id}
              unit={unit}
              sessions={getRecentSessions(unit.id, OVERVIEW_LIMIT)}
              focused={false}
            />
          ))
        )}
      </main>
    </div>
  );
}
