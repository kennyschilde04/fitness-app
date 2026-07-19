import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DayContextMenu } from '../components/DayContextMenu';
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

interface ContextMenuState {
  date: Date;
  x: number;
  y: number;
}

export function CalendarPage() {
  const { date: dateParam } = useParams();
  const navigate = useNavigate();
  const selectedDate = dateParam ? fromISODate(dateParam) : null;

  const [viewMode, setViewModeState] = useState<ViewMode>(loadViewMode);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(selectedDate ?? new Date()));
  const [monthStart, setMonthStart] = useState(() => getMonthStart(selectedDate ?? new Date()));
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

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
    addSet,
    removeSet,
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

  function handleDayLongPress(date: Date, x: number, y: number) {
    if (!getSessionForDate(toISODate(date))) return;
    setContextMenu({ date, x, y });
  }

  function handleDeleteFromContextMenu() {
    if (!contextMenu) return;
    const session = getSessionForDate(toISODate(contextMenu.date));
    if (session) deleteSession(session.id);
  }

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden bg-neutral-950 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] light:bg-neutral-50 sm:px-8">
      <Header />

      <main className={`mx-auto flex w-full min-h-0 flex-1 flex-col ${viewMode === 'month' ? 'max-w-6xl' : 'max-w-5xl'}`}>
        <div className="mb-3 flex shrink-0 justify-center">
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

        <div className="min-h-0 flex-1 pb-3">
          {viewMode === 'week' ? (
            <WeekCalendar
              weekStart={weekStart}
              onWeekStartChange={setWeekStart}
              units={units}
              getSessionForDate={getSessionForDate}
              onDayClick={openDay}
              onDayLongPress={handleDayLongPress}
            />
          ) : (
            <MonthCalendar
              monthStart={monthStart}
              onMonthStartChange={setMonthStart}
              units={units}
              getSessionForDate={getSessionForDate}
              onDayClick={openDay}
              onDayLongPress={handleDayLongPress}
            />
          )}
        </div>
      </main>

      <footer className="mx-auto w-full shrink-0 max-w-5xl border-t border-neutral-900 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center light:border-neutral-200">
        <p className="text-xs text-neutral-700 light:text-neutral-400">Gym Tracker · lokal auf deinem Gerät gespeichert</p>
      </footer>

      {contextMenu && (
        <DayContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onDelete={handleDeleteFromContextMenu}
          onClose={() => setContextMenu(null)}
        />
      )}

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
