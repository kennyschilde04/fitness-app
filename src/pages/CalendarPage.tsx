import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MonthCalendar } from '../components/MonthCalendar';
import { SessionModal } from '../components/SessionModal';
import { WeekCalendar } from '../components/WeekCalendar';
import { useAppData } from '../state/useAppData';
import { fromISODate, getMonthStart, getWeekStart, toISODate } from '../utils/date';

type ViewMode = 'week' | 'month';

const VIEW_MODE_KEY = 'gym-tracker-view-mode';

function loadViewMode(): ViewMode {
  return localStorage.getItem(VIEW_MODE_KEY) === 'month' ? 'month' : 'week';
}

export function CalendarPage() {
  const { date: dateParam } = useParams();
  const navigate = useNavigate();
  const selectedDate = dateParam ? fromISODate(dateParam) : null;

  const [viewMode, setViewModeState] = useState<ViewMode>(loadViewMode);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(selectedDate ?? new Date()));
  const [monthStart, setMonthStart] = useState(() => getMonthStart(selectedDate ?? new Date()));

  function setViewMode(mode: ViewMode) {
    setViewModeState(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  }

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

  function openDay(date: Date) {
    navigate(`/day/${toISODate(date)}`);
  }

  function closeDay() {
    navigate('/');
  }

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
        <button
          onClick={() => navigate('/history')}
          className="ml-auto rounded-md px-2 py-1 text-xs text-neutral-500 transition-transform active:scale-95 hover:text-neutral-300"
        >
          Verlauf
        </button>
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
            onDayClick={openDay}
          />
        ) : (
          <MonthCalendar
            monthStart={monthStart}
            onMonthStartChange={setMonthStart}
            units={units}
            getSessionForDate={getSessionForDate}
            onDayClick={openDay}
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
          onClose={closeDay}
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
          onViewHistory={(unitId) => navigate(`/history/${unitId}`)}
        />
      )}
    </div>
  );
}
