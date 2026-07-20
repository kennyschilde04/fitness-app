import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import type { ExerciseHistoryEntry } from '../state/useAppData';
import { useAppData } from '../state/useAppData';
import { getUnitColor } from '../types';
import { formatSet } from '../utils/format';

const PAGE_SIZE = 5;
const ALL_LIMIT = 1000;

function SetRows({ entries }: { entries: ExerciseHistoryEntry['entries'] }) {
  return (
    <div className="flex flex-col gap-1">
      {entries.map((sets, i) => (
        <div key={i} className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          {sets.map((set, j) => (
            <span key={j} className="text-neutral-400">
              <span className="text-neutral-600">S{j + 1}</span> {formatSet(set)}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function ExerciseHistoryCard({ entry }: { entry: ExerciseHistoryEntry }) {
  const [open, setOpen] = useState(false);
  const preview = entry.entries.slice(0, PAGE_SIZE);
  const hiddenCount = entry.entries.length - PAGE_SIZE;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-left transition-transform active:scale-[0.99] light:border-neutral-200 light:bg-white"
      >
        <p className="mb-2 text-sm font-semibold text-neutral-100 light:text-neutral-900">{entry.name}</p>
        <SetRows entries={preview} />
        {hiddenCount > 0 && (
          <p className="mt-2 text-xs text-neutral-500">Alle {entry.entries.length} anzeigen →</p>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full flex-col rounded-t-2xl bg-neutral-950 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:border sm:border-neutral-800 light:bg-white light:sm:border-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-4 light:border-neutral-200">
              <p className="text-lg font-semibold text-neutral-100 light:text-neutral-900">{entry.name}</p>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-neutral-500 transition-transform active:scale-90 hover:text-neutral-200"
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <SetRows entries={entry.entries} />
            </div>
          </div>
        </div>
      )}
    </>
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
