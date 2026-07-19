import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
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

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
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
    sessions,
    getSessionForDate,
    createUnit,
    createSession,
    deleteUnit,
    deleteSession,
    updateSet,
    addSet,
    removeSet,
    updateExerciseNote,
    addExerciseToSession,
    removeExerciseFromUnit,
    getPreviousSessions,
  } = useAppData();

  const selectedSession = selectedDate ? getSessionForDate(toISODate(selectedDate)) : undefined;

  const { weekCount, monthCount } = useMemo(() => {
    const now = new Date();
    const thisWeekStart = toISODate(getWeekStart(now));
    const weekEnd = new Date(getWeekStart(now));
    weekEnd.setDate(weekEnd.getDate() + 6);
    const thisWeekEnd = toISODate(weekEnd);
    const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return {
      weekCount: sessions.filter((s) => s.date >= thisWeekStart && s.date <= thisWeekEnd).length,
      monthCount: sessions.filter((s) => s.date.startsWith(thisMonthPrefix)).length,
    };
  }, [sessions]);

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

  function handleLongPressDelete(date: Date) {
    const session = getSessionForDate(toISODate(date));
    if (!session) return;
    if (window.confirm('Diese Einheit für den Tag wirklich löschen? Alle erfassten Sätze gehen verloren.')) {
      deleteSession(session.id);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-neutral-950 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] light:bg-neutral-50 sm:px-8">
      <Header />

      <main className={`mx-auto w-full flex-1 ${viewMode === 'month' ? 'max-w-6xl' : 'max-w-5xl'}`}>
        <p className="mb-4 text-xs text-neutral-500">
          {greeting()} — {weekCount}x diese Woche · {monthCount}x diesen Monat
        </p>

        <div className="mb-4 flex justify-center">
          <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-1 light:border-neutral-200 light:bg-neutral-100">
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-95 ${
                viewMode === 'week'
                  ? 'bg-neutral-700 text-neutral-100 light:bg-white light:text-neutral-900'
                  : 'text-neutral-400 hover:text-neutral-200 light:text-neutral-500 light:hover:text-neutral-700'
              }`}
            >
              Woche
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-95 ${
                viewMode === 'month'
                  ? 'bg-neutral-700 text-neutral-100 light:bg-white light:text-neutral-900'
                  : 'text-neutral-400 hover:text-neutral-200 light:text-neutral-500 light:hover:text-neutral-700'
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
            onDayLongPress={handleLongPressDelete}
          />
        ) : (
          <MonthCalendar
            monthStart={monthStart}
            onMonthStartChange={setMonthStart}
            units={units}
            getSessionForDate={getSessionForDate}
            onDayClick={openDay}
            onDayLongPress={handleLongPressDelete}
          />
        )}
      </main>

      <footer className="mx-auto mt-10 w-full max-w-5xl border-t border-neutral-900 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center light:border-neutral-200">
        <p className="text-xs text-neutral-700 light:text-neutral-400">Gym Tracker · lokal auf deinem Gerät gespeichert</p>
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
          onAddSet={(exerciseId) => selectedSession && addSet(selectedSession.id, exerciseId)}
          onRemoveSet={(exerciseId) => selectedSession && removeSet(selectedSession.id, exerciseId)}
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
