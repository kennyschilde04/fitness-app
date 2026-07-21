import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppDock } from '../components/AppDock';
import { DayContextMenu } from '../components/DayContextMenu';
import { MonthCalendar } from '../components/MonthCalendar';
import { SessionModal } from '../components/SessionModal';
import { WeekCalendar } from '../components/WeekCalendar';
import { useAppData } from '../state/useAppData';
import { formatDayMonth, fromISODate, getMonthStart, getWeekDays, getWeekStart, toISODate } from '../utils/date';

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
    updateUnitColor,
    createSession,
    deleteUnit,
    deleteSession,
    updateSet,
    addSet,
    removeSet,
    updateExerciseNote,
    addExerciseToSession,
    removeExerciseFromUnit,
    setExerciseOrder,
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

  function handleCreateUnit(name: string, colorIndex?: number) {
    if (!selectedDate) return;
    const unitId = createUnit(name, colorIndex);
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

  function goToToday() {
    const today = new Date();
    setWeekStart(getWeekStart(today));
    setMonthStart(getMonthStart(today));
  }

  const totalSetsThisWeek = getWeekDays(weekStart).reduce((total, date) => {
    const session = getSessionForDate(toISODate(date));
    if (!session) return total;
    return (
      total +
      session.exercises.reduce(
        (sets, exercise) => sets + exercise.sets.filter((set) => set.weight !== null || set.reps !== null).length,
        0,
      )
    );
  }, 0);

  return (
    <div className="app-screen">
      <main className={`app-calendar-scroll flex flex-col ${viewMode === 'month' ? 'max-w-6xl' : 'max-w-5xl'}`}>
        <div className="mb-4 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="app-eyebrow">Trainings-Cockpit</p>
            <h2 className="mt-1 text-3xl font-black leading-none sm:text-4xl">
              Dein Rhythmus
            </h2>
            <p className="app-muted mt-2 text-sm">
              {totalSetsThisWeek > 0 ? `${totalSetsThisWeek} erfasste Sätze diese Woche` : 'Bereit für die erste Einheit der Woche'}
            </p>
          </div>

          <div className="inline-flex w-fit rounded-2xl border border-neutral-800 bg-neutral-950/70 p-1 shadow-2xl shadow-black/20 light:border-neutral-200 light:bg-white/80 light:shadow-neutral-200/60">
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-150 active:scale-95 ${
                viewMode === 'week'
                  ? 'bg-lime-300 text-neutral-950 light:bg-lime-500 light:text-white'
                  : 'text-neutral-400 hover:text-neutral-200 light:text-neutral-500 light:hover:text-neutral-700'
              }`}
            >
              Woche
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-150 active:scale-95 ${
                viewMode === 'month'
                  ? 'bg-lime-300 text-neutral-950 light:bg-lime-500 light:text-white'
                  : 'text-neutral-400 hover:text-neutral-200 light:text-neutral-500 light:hover:text-neutral-700'
              }`}
            >
              Monat
            </button>
          </div>
        </div>

        <div className={`min-h-0 flex-1 ${viewMode === 'week' ? 'pb-[calc(var(--app-safe-bottom)+8rem)]' : 'pb-0'}`}>
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

      <AppDock active="today" onTodayClick={goToToday} />

      {contextMenu && (
        <DayContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          title={formatDayMonth(contextMenu.date)}
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
          onUpdateUnitColor={updateUnitColor}
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
          onReorderExercises={(orderedExerciseIds) =>
            selectedSession && setExerciseOrder(selectedSession.id, orderedExerciseIds)
          }
          getPreviousSessions={(unitId, exerciseId) =>
            selectedSession ? getPreviousSessions(unitId, exerciseId, selectedSession.id) : []
          }
        />
      )}
    </div>
  );
}
