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
    <div className="min-h-screen bg-neutral-950 px-4 py-8 sm:px-8">
      <header className="mx-auto mb-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-neutral-100">🏋️ Gym Tracker</h1>
        <p className="text-sm text-neutral-500">Deine Trainingseinheiten im Wochenüberblick</p>
      </header>

      <main className={`mx-auto ${viewMode === 'month' ? 'max-w-6xl' : 'max-w-5xl'}`}>
        <div className="mb-4 flex justify-center">
          <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                viewMode === 'week' ? 'bg-neutral-700 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Woche
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
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
