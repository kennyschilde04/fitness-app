import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import type { ExerciseHistoryEntry } from '../state/useAppData';
import { useAppData } from '../state/useAppData';
import { getUnitColor } from '../types';
import { formatSet } from '../utils/format';

const PAGE_SIZE = 10;
const ALL_LIMIT = 1000;

function ExerciseHistoryCard({ entry }: { entry: ExerciseHistoryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entry.entries : entry.entries.slice(0, PAGE_SIZE);
  const hiddenCount = entry.entries.length - PAGE_SIZE;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 light:border-neutral-200 light:bg-white">
      <p className="mb-2 text-sm font-semibold text-neutral-100 light:text-neutral-900">{entry.name}</p>
      <div className="flex flex-col gap-1">
        {visible.map((sets, i) => (
          <div key={i} className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
            {sets.map((set, j) => (
              <span key={j} className="text-neutral-400">
                <span className="text-neutral-600">S{j + 1}</span> {formatSet(set)}
              </span>
            ))}
          </div>
        ))}
      </div>
      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs text-neutral-500 transition-transform active:scale-95 hover:text-neutral-300"
        >
          {expanded ? 'Weniger anzeigen' : `Mehr anzeigen (${hiddenCount} weitere)`}
        </button>
      )}
    </div>
  );
}

export function HistoryPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { units, getUnitExerciseHistory } = useAppData();

  const sortedUnits = [...units].sort((a, b) => a.order - b.order);
  const activeUnit = (unitId && sortedUnits.find((u) => u.id === unitId)) || sortedUnits[0];
  const exerciseHistory = activeUnit ? getUnitExerciseHistory(activeUnit.id, ALL_LIMIT) : [];

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden bg-neutral-950 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] light:bg-neutral-50 sm:px-8">
      <Header backLabel="Zurück" title="Insight" />

      <main className="mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto pb-12">
        {sortedUnits.length === 0 ? (
          <p className="text-sm text-neutral-500">Noch keine Einheiten angelegt.</p>
        ) : (
          <>
            <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
              {sortedUnits.map((unit) => {
                const colors = getUnitColor(unit);
                const active = unit.id === activeUnit?.id;
                return (
                  <button
                    key={unit.id}
                    onClick={() => navigate(`/history/${unit.id}`, { replace: true })}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-150 active:scale-95 ${
                      active
                        ? `${colors.bg} ${colors.border} ${colors.text}`
                        : 'border-neutral-800 text-neutral-500 hover:text-neutral-300 light:border-neutral-300'
                    }`}
                  >
                    {unit.name}
                  </button>
                );
              })}
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
          </>
        )}
      </main>
    </div>
  );
}
