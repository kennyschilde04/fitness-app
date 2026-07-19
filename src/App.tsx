import { useState } from 'react';
import { MonthCalendar } from './components/MonthCalendar';
import { SessionModal } from './components/SessionModal';
import { WeekCalendar } from './components/WeekCalendar';
import { useAppData } from './state/useAppData';
import { getMonthStart, getWeekStart, toISODate } from './utils/date';

type ViewMode = 'week' | 'month';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [monthStart, setMonthStart] = useState(() => getMonthStart(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const {
    units,
    getSessionForDate,
    createUnit,
    createSession,
    deleteUnit,
    deleteSession,
    updateSet,
    updateExerciseNote,
    addExerciseToSession,
    removeExerciseFromUnit,
    getPreviousSessions,
  } = useAppData();

  const selectedSession = selectedDate ? getSessionForDate(toISODate(selectedDate)) : undefined;

  function handleSelectUnit(unitId: string) {
    if (!selectedDate) return;
    createSession(toISODate(selectedDate), unitId);
  }

  function handleCreateUnit(name: string) {
    if (!selectedDate) return;
    const unitId = createUnit(name);
    if (unitId) createSession(toISODate(selectedDate), unitId);
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-neutral-950 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
      <header className="mx-auto mb-6 flex w-full max-w-5xl items-center gap-2 sm:mb-8">
        <span className="text-lg leading-none">🏋️</span>
        <h1 className="text-base font-semibold tracking-tight text-neutral-100 sm:text-lg">Gym Tracker</h1>
      </header>

      <main className={`mx-auto w-full flex-1 ${viewMode === 'month' ? 'max-w-6xl' : 'max-w-5xl'}`}>
        <div className="mb-4 flex justify-center">
          <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-95 ${
                viewMode === 'week' ? 'bg-neutral-700 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Woche
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-95 ${
                viewMode === 'month' ? 'bg-neutral-700 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Monat
            </button>
          </div>
        </div>

        {viewMode === 'week' ? (
          <WeekCalendar
            weekStart={weekStart}
            onWeekStartChange={setWeekStart}
            units={units}
            getSessionForDate={getSessionForDate}
            onDayClick={setSelectedDate}
          />
        ) : (
          <MonthCalendar
            monthStart={monthStart}
            onMonthStartChange={setMonthStart}
            units={units}
            getSessionForDate={getSessionForDate}
            onDayClick={setSelectedDate}
          />
        )}
      </main>

      <footer className="mx-auto mt-10 w-full max-w-5xl border-t border-neutral-900 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-xs text-neutral-700">Gym Tracker · lokal auf deinem Gerät gespeichert</p>
      </footer>

      {selectedDate && (
        <SessionModal
          date={selectedDate}
          session={selectedSession}
          units={units}
          onClose={() => setSelectedDate(null)}
          onSelectUnit={handleSelectUnit}
          onCreateUnit={handleCreateUnit}
          onDeleteUnit={deleteUnit}
          onDeleteSession={() => selectedSession && deleteSession(selectedSession.id)}
          onSetChange={(exerciseId, setIndex, patch) =>
            selectedSession && updateSet(selectedSession.id, exerciseId, setIndex, patch)
          }
          onNoteChange={(exerciseId, note) =>
            selectedSession && updateExerciseNote(selectedSession.id, exerciseId, note)
          }
          onAddExercise={(name) => selectedSession && addExerciseToSession(selectedSession.id, name)}
          onRemoveExercise={(exerciseId) =>
            selectedSession && removeExerciseFromUnit(selectedSession.id, exerciseId)
          }
          getPreviousSessions={(unitId, exerciseId) =>
            selectedSession ? getPreviousSessions(unitId, exerciseId, selectedSession.id) : []
          }
        />
      )}
    </div>
  );
}

export default App;
