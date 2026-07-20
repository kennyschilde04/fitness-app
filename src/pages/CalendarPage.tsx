import { type PointerEvent, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DayContextMenu } from '../components/DayContextMenu';
import { MonthCalendar } from '../components/MonthCalendar';
import { SessionModal } from '../components/SessionModal';
import { WeekCalendar } from '../components/WeekCalendar';
import { useAppData } from '../state/useAppData';
import { type Theme, useTheme } from '../state/useTheme';
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

interface SettingsSheetProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onClose: () => void;
}

type SettingsView = 'overview' | 'appearance';

const DEMO_THEMES: { id: string; name: string; subtitle: string; colors: string[]; theme?: Theme }[] = [
  { id: 'dark', name: 'Dunkel', subtitle: 'Gym Mode', colors: ['#0a0a0a', '#bef264', '#fb923c'], theme: 'dark' },
  { id: 'light', name: 'Hell', subtitle: 'Clean Mode', colors: ['#fafafa', '#84cc16', '#171717'], theme: 'light' },
  { id: 'midnight', name: 'Midnight Steel', subtitle: 'Blau, hart, ruhig', colors: ['#050816', '#38bdf8', '#94a3b8'] },
  { id: 'ember', name: 'Iron Ember', subtitle: 'Warm und aggressiv', colors: ['#140704', '#f97316', '#fde68a'] },
  { id: 'mint', name: 'Mint Focus', subtitle: 'Hell, frisch, minimal', colors: ['#ecfdf5', '#10b981', '#064e3b'] },
  { id: 'mono', name: 'Monochrome', subtitle: 'Nur Kontrast', colors: ['#111111', '#f5f5f5', '#737373'] },
];

function SettingsSheet({ theme, onThemeChange, onClose }: SettingsSheetProps) {
  const [view, setView] = useState<SettingsView>('overview');
  const dragStartY = useRef<number | null>(null);
  const activeTheme = DEMO_THEMES.find((item) => item.theme === theme);

  function handlePointerDown(e: PointerEvent<HTMLButtonElement>) {
    dragStartY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(y: number) {
    if (dragStartY.current !== null && y - dragStartY.current > 86) onClose();
  }

  function handlePointerUp() {
    dragStartY.current = null;
  }

  return (
    <div className="app-sheet-backdrop" onClick={onClose}>
      <div
        className="app-bottom-sheet app-bottom-sheet-tall"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          onPointerDown={handlePointerDown}
          onPointerMove={(e) => handlePointerMove(e.clientY)}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="app-sheet-handle touch-none"
          aria-label="Einstellungen nach unten schließen"
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {view === 'overview' ? (
            <>
              <div>
                <p className="app-eyebrow">Einstellungen</p>
                <h2 className="mt-1 text-3xl font-black">App anpassen</h2>
              </div>

              <section className="mt-7">
                <button
                  onClick={() => setView('appearance')}
                  className="app-list-button"
                >
                  <span>
                    <span className="block text-base font-black">Erscheinungsbild</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">
                      {activeTheme?.name ?? 'Theme auswählen'}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {activeTheme?.colors.map((color) => (
                      <span key={color} className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                    ))}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="app-muted h-5 w-5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </button>
              </section>

              <section className="mt-4">
                <button className="app-list-button">
                  <span>
                    <span className="block text-base font-black">Sprache</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">Deutsch</span>
                  </span>
                  <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-bold text-neutral-400 light:bg-neutral-200 light:text-neutral-600">
                    Demo
                  </span>
                </button>
              </section>

              <section className="mt-4">
                <button className="app-list-button">
                  <span>
                    <span className="block text-base font-black">Training</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">Einheiten, Ziele, Anzeige</span>
                  </span>
                  <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-bold text-neutral-400 light:bg-neutral-200 light:text-neutral-600">
                    Bald
                  </span>
                </button>
              </section>
            </>
          ) : (
            <>
              <button
                onClick={() => setView('overview')}
                className="mb-5 flex items-center gap-2 rounded-2xl text-sm font-bold text-neutral-400 active:scale-95 light:text-neutral-600"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Einstellungen
              </button>
              <div>
                <p className="app-eyebrow">Erscheinungsbild</p>
                <h2 className="mt-1 text-3xl font-black">Theme wählen</h2>
              </div>

              <div className="mt-6 grid gap-3">
                {DEMO_THEMES.map((option) => {
                  const active = option.theme === theme;
                  return (
                    <button
                      key={option.id}
                      onClick={() => option.theme && onThemeChange(option.theme)}
                      className={`flex items-center justify-between rounded-3xl border p-4 text-left transition-transform active:scale-95 ${
                        active
                          ? 'border-lime-300 bg-lime-300 text-neutral-950 light:border-lime-500 light:bg-lime-500 light:text-white'
                          : 'border-neutral-800 bg-neutral-900/70 text-neutral-300 light:border-neutral-200 light:bg-neutral-50 light:text-neutral-700'
                      }`}
                    >
                      <span>
                        <span className="block text-base font-black">{option.name}</span>
                        <span className={`mt-1 block text-xs font-semibold ${active ? 'text-neutral-800 light:text-white/80' : 'text-neutral-500'}`}>
                          {option.subtitle}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        {option.colors.map((color) => (
                          <span key={color} className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function CalendarPage() {
  const { date: dateParam } = useParams();
  const navigate = useNavigate();
  const selectedDate = dateParam ? fromISODate(dateParam) : null;

  const [viewMode, setViewModeState] = useState<ViewMode>(loadViewMode);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(selectedDate ?? new Date()));
  const [monthStart, setMonthStart] = useState(() => getMonthStart(selectedDate ?? new Date()));
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

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

        <div className="min-h-0 flex-1 pb-28">
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

      <nav className="app-dock-wrap">
        <div className="app-dock">
          <button
            onClick={goToToday}
            className="app-dock-item app-dock-item-active"
            aria-label="Zu heute springen"
          >
            <span className="text-lg font-black leading-none">{new Date().getDate()}</span>
            <span className="app-dock-label">Heute</span>
          </button>
          <button
            onClick={() => navigate('/history')}
            className="app-dock-item"
            aria-label="Insight öffnen"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M4 19V5" />
              <path d="M8 17v-6" />
              <path d="M13 17V8" />
              <path d="M18 17v-3" />
            </svg>
            <span className="app-dock-label">Insight</span>
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="app-dock-item"
            aria-label="Einstellungen öffnen"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.36a1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.08a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.08a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9c.25.6.84 1 1.56 1H21a2 2 0 1 1 0 4h-.08a1.7 1.7 0 0 0-1.52 1Z" />
            </svg>
            <span className="app-dock-label">Settings</span>
          </button>
        </div>
      </nav>

      {settingsOpen && (
        <SettingsSheet theme={theme} onThemeChange={setTheme} onClose={() => setSettingsOpen(false)} />
      )}

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
          getPreviousSessions={(unitId, exerciseId) =>
            selectedSession ? getPreviousSessions(unitId, exerciseId, selectedSession.id) : []
          }
        />
      )}
    </div>
  );
}
