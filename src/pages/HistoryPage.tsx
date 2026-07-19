import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ExerciseHistoryEntry } from '../state/useAppData';
import { useAppData } from '../state/useAppData';
import type { UnitDef } from '../types';
import { getUnitColor, MAX_SETS } from '../types';
import { formatSet } from '../utils/format';

const OVERVIEW_LIMIT = 3;
const FOCUSED_LIMIT = 10;

function ExerciseHistoryCard({ entry }: { entry: ExerciseHistoryEntry }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      <p className="mb-2 text-sm font-semibold text-neutral-100">{entry.name}</p>
      <div className="mb-1 grid grid-cols-4 gap-2">
        {Array.from({ length: MAX_SETS }, (_, i) => (
          <span key={i} className="text-center text-[10px] uppercase tracking-wide text-neutral-600">
            Satz {i + 1}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {entry.entries.map((sets, i) => (
          <div key={i} className="grid grid-cols-4 gap-2">
            {sets.map((set, j) => (
              <span key={j} className="text-center text-xs text-neutral-400">
                {formatSet(set)}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function UnitSection({
  unit,
  exerciseHistory,
  focused,
}: {
  unit: UnitDef;
  exerciseHistory: ExerciseHistoryEntry[];
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

      {exerciseHistory.length === 0 ? (
        <p className="text-xs italic text-neutral-600">Noch keine Einheiten erfasst.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {exerciseHistory.map((entry) => (
            <ExerciseHistoryCard key={entry.exerciseId} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}

export function HistoryPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { units, getUnitExerciseHistory } = useAppData();

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
          <UnitSection
            unit={focusedUnit}
            exerciseHistory={getUnitExerciseHistory(focusedUnit.id, FOCUSED_LIMIT)}
            focused
          />
        ) : sortedUnits.length === 0 ? (
          <p className="text-sm text-neutral-500">Noch keine Einheiten angelegt.</p>
        ) : (
          sortedUnits.map((unit) => (
            <UnitSection
              key={unit.id}
              unit={unit}
              exerciseHistory={getUnitExerciseHistory(unit.id, OVERVIEW_LIMIT)}
              focused={false}
            />
          ))
        )}
      </main>
    </div>
  );
}
