import { useState } from 'react';
import { AppDock } from '../components/AppDock';
import { useAppData } from '../state/useAppData';
import { type Theme, useTheme } from '../state/useTheme';
import { STORAGE_KEY } from '../storage';

const APP_THEMES: { id: Theme; name: string; subtitle: string; colors: string[] }[] = [
  { id: 'dark', name: 'Dunkel', subtitle: 'Gym Mode', colors: ['#0a0a0a', '#bef264', '#fb923c'] },
  { id: 'light', name: 'Hell', subtitle: 'Clean Mode', colors: ['#fafafa', '#84cc16', '#171717'] },
  { id: 'purple', name: 'Deep Purple', subtitle: 'Dunkel, satt, premium', colors: ['#09040f', '#d946ef', '#c084fc'] },
  { id: 'midnight', name: 'Midnight Steel', subtitle: 'Blau, hart, ruhig', colors: ['#050816', '#38bdf8', '#94a3b8'] },
  { id: 'ember', name: 'Iron Ember', subtitle: 'Warm und aggressiv', colors: ['#140704', '#f97316', '#fde68a'] },
  { id: 'mint', name: 'Mint Focus', subtitle: 'Hell, frisch, minimal', colors: ['#ecfdf5', '#10b981', '#064e3b'] },
  { id: 'mono', name: 'Monochrome', subtitle: 'Nur Kontrast', colors: ['#111111', '#f5f5f5', '#737373'] },
];

const WEIGHT_UNIT_KEY = 'gym-tracker-weight-unit';
const LANGUAGE_KEY = 'gym-tracker-language';
const REST_TIMER_ENABLED_KEY = 'gym-tracker-rest-timer-enabled';
const REST_TIMER_SECONDS_KEY = 'gym-tracker-rest-timer-seconds';
const REST_TIMER_OPTIONS = [60, 90, 120, 180];

type SettingsView = 'overview' | 'appearance' | 'storage' | 'demo' | 'weight' | 'restTimer' | 'language';
type WeightUnit = 'kg' | 'lbs';
type AppLanguage = 'de' | 'en' | 'es' | 'fr' | 'it' | 'nl';

const APP_LANGUAGES: { id: AppLanguage; name: string; subtitle: string }[] = [
  { id: 'de', name: 'Deutsch', subtitle: 'Aktuelle App-Sprache' },
  { id: 'en', name: 'English', subtitle: 'Demo-Auswahl, noch ohne Übersetzung' },
  { id: 'es', name: 'Español', subtitle: 'Demo-Auswahl, noch ohne Übersetzung' },
  { id: 'fr', name: 'Français', subtitle: 'Demo-Auswahl, noch ohne Übersetzung' },
  { id: 'it', name: 'Italiano', subtitle: 'Demo-Auswahl, noch ohne Übersetzung' },
  { id: 'nl', name: 'Nederlands', subtitle: 'Demo-Auswahl, noch ohne Übersetzung' },
];

function SettingsBadge({ children }: { children: string }) {
  return (
    <span className="shrink-0 rounded-full bg-[var(--app-surface-strong)] px-3 py-1 text-xs font-bold text-[var(--app-text-muted)]">
      {children}
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { resetToDemoData, resetToEmptyData } = useAppData();
  const [view, setView] = useState<SettingsView>('overview');
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return APP_LANGUAGES.some((item) => item.id === saved) ? (saved as AppLanguage) : 'de';
  });
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>(() =>
    localStorage.getItem(WEIGHT_UNIT_KEY) === 'lbs' ? 'lbs' : 'kg',
  );
  const [restTimerEnabled, setRestTimerEnabledState] = useState(() => localStorage.getItem(REST_TIMER_ENABLED_KEY) === 'true');
  const [restTimerSeconds, setRestTimerSecondsState] = useState(() => {
    const saved = Number(localStorage.getItem(REST_TIMER_SECONDS_KEY));
    return REST_TIMER_OPTIONS.includes(saved) ? saved : 90;
  });
  const [toast, setToast] = useState('');
  const [toastLeaving, setToastLeaving] = useState(false);
  const [, refreshStorageStats] = useState(0);
  const activeTheme = APP_THEMES.find((item) => item.id === theme);
  const appDataBytes = new Blob([localStorage.getItem(STORAGE_KEY) ?? '']).size;
  const cacheBytes = new Blob([
    Object.keys(localStorage)
      .filter((key) => key !== STORAGE_KEY)
      .map((key) => `${key}:${localStorage.getItem(key) ?? ''}`)
      .join('|'),
  ]).size;
  const totalBytes = appDataBytes + cacheBytes;
  const activeLanguage = APP_LANGUAGES.find((item) => item.id === language) ?? APP_LANGUAGES[0];

  function showToast(message: string) {
    setToast(message);
    setToastLeaving(false);
    window.setTimeout(() => setToastLeaving(true), 2100);
    window.setTimeout(() => setToast(''), 2450);
  }

  async function clearCache() {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    refreshStorageStats((value) => value + 1);
    showToast('Cache wurde geleert');
  }

  function clearAppData() {
    resetToEmptyData();
    refreshStorageStats((value) => value + 1);
    showToast('Appdaten wurden gelöscht');
  }

  function loadDemoData(message: string) {
    resetToDemoData();
    refreshStorageStats((value) => value + 1);
    showToast(message);
  }

  function loadEmptyApp() {
    resetToEmptyData();
    refreshStorageStats((value) => value + 1);
    showToast('Leere App ist aktiv');
  }

  function setWeightUnit(unit: WeightUnit) {
    setWeightUnitState(unit);
    localStorage.setItem(WEIGHT_UNIT_KEY, unit);
    showToast(`Gewichtseinheit: ${unit}`);
  }

  function setLanguage(nextLanguage: AppLanguage) {
    setLanguageState(nextLanguage);
    localStorage.setItem(LANGUAGE_KEY, nextLanguage);
    showToast(`Sprache: ${APP_LANGUAGES.find((item) => item.id === nextLanguage)?.name ?? nextLanguage}`);
  }

  function setRestTimerEnabled(enabled: boolean) {
    setRestTimerEnabledState(enabled);
    localStorage.setItem(REST_TIMER_ENABLED_KEY, String(enabled));
    showToast(enabled ? 'Pausen-Timer aktiviert' : 'Pausen-Timer deaktiviert');
  }

  function setRestTimerSeconds(seconds: number) {
    setRestTimerSecondsState(seconds);
    localStorage.setItem(REST_TIMER_SECONDS_KEY, String(seconds));
    showToast(`Standardpause: ${seconds / 60 >= 1 ? `${seconds / 60} min` : `${seconds} s`}`);
  }

  return (
    <div className="app-screen">
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <div className={`app-toast ${toastLeaving ? 'app-toast-exit' : 'app-toast-enter'}`}>
            {toast}
          </div>
        </div>
      )}
      <main className="app-scroll app-scroll-with-dock">
        {view === 'overview' ? (
          <>
            <header>
              <p className="app-eyebrow">Einstellungen</p>
              <h1 className="mt-1 text-4xl font-black leading-none">App anpassen</h1>
              <p className="app-muted mt-4 text-sm font-semibold">Look, Sprache und später dein Trainings-Setup.</p>
            </header>

            <section className="mt-8">
              <p className="mb-3 text-sm font-black">Erscheinungsbild</p>
              <button onClick={() => setView('appearance')} className="app-list-button">
                <span>
                  <span className="block text-base font-black">{activeTheme?.name ?? 'Theme wählen'}</span>
                  <span className="app-muted mt-1 block text-xs font-semibold">{activeTheme?.subtitle ?? 'Erscheinungsbild auswählen'}</span>
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

            <section className="mt-6">
              <p className="mb-3 text-sm font-black">Allgemein</p>
              <div className="grid gap-3">
                <button onClick={() => setView('language')} className="app-list-button">
                  <span>
                    <span className="block text-base font-black">Sprache</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">{activeLanguage.name}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <SettingsBadge>{language.toUpperCase()}</SettingsBadge>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="app-muted h-5 w-5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </button>
                <button className="app-list-button">
                  <span>
                    <span className="block text-base font-black">Startansicht</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">Heute öffnen</span>
                  </span>
                  <SettingsBadge>Bald</SettingsBadge>
                </button>
              </div>
            </section>

            <section className="mt-6">
              <p className="mb-3 text-sm font-black">Training</p>
              <div className="grid gap-3">
                <button className="app-list-button">
                  <span>
                    <span className="block text-base font-black">Standard-Sätze</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">3 Sätze pro neuer Übung</span>
                  </span>
                  <SettingsBadge>Demo</SettingsBadge>
                </button>
                <button onClick={() => setView('weight')} className="app-list-button">
                  <span>
                    <span className="block text-base font-black">Gewichtseinheit</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">{weightUnit === 'kg' ? 'Kilogramm' : 'Pfund'}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <SettingsBadge>{weightUnit}</SettingsBadge>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="app-muted h-5 w-5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </button>
                <button onClick={() => setView('restTimer')} className="app-list-button">
                  <span>
                    <span className="block text-base font-black">Pausen-Timer</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">
                      {restTimerEnabled ? `${restTimerSeconds} Sekunden Standardpause` : 'Deaktiviert'}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <SettingsBadge>{restTimerEnabled ? 'An' : 'Aus'}</SettingsBadge>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="app-muted h-5 w-5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </button>
              </div>
            </section>

            <section className="mt-6">
              <p className="mb-3 text-sm font-black">Daten</p>
              <div className="grid gap-3">
                <button onClick={() => setView('storage')} className="app-list-button">
                  <span>
                    <span className="block text-base font-black">Speicher</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">Auf diesem Gerät</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <SettingsBadge>Lokal</SettingsBadge>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="app-muted h-5 w-5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </button>
                <button onClick={() => setView('demo')} className="app-list-button">
                  <span>
                    <span className="block text-base font-black">Demo-Daten</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">Beispieltrainings und Testmodus</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <SettingsBadge>Dev</SettingsBadge>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="app-muted h-5 w-5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </button>
              </div>
            </section>

            <section className="mt-6">
              <p className="mb-3 text-sm font-black">App</p>
              <div className="grid gap-3">
                <div className="app-list-button">
                  <span>
                    <span className="block text-base font-black">Version</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">Gym Tracker Preview</span>
                  </span>
                  <SettingsBadge>v1.0.0</SettingsBadge>
                </div>
                <button className="app-list-button">
                  <span>
                    <span className="block text-base font-black">Feedback</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">Ideen und Bugs sammeln</span>
                  </span>
                  <SettingsBadge>Bald</SettingsBadge>
                </button>
              </div>
            </section>
          </>
        ) : view === 'appearance' ? (
          <>
            <button
              onClick={() => setView('overview')}
              className="app-icon-button mb-8"
              aria-label="Zurück zu Einstellungen"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <header>
              <p className="app-eyebrow">Erscheinungsbild</p>
              <h1 className="mt-1 text-4xl font-black leading-none">Theme wählen</h1>
              <p className="app-muted mt-4 text-sm font-semibold">Aktuell: {activeTheme?.name ?? 'Theme'}</p>
            </header>

            <section className="mt-8 grid gap-3">
              {APP_THEMES.map((option) => {
                const active = option.id === theme;
                return (
                  <button
                    key={option.id}
                    onClick={() => setTheme(option.id)}
                    className={`flex items-center justify-between rounded-3xl border p-4 text-left transition-transform active:scale-95 ${
                      active
                        ? 'border-[var(--app-accent)] bg-[var(--app-accent)] text-neutral-950'
                        : 'border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-text-soft)]'
                    }`}
                  >
                    <span>
                      <span className="block text-base font-black">{option.name}</span>
                      <span className={`mt-1 block text-xs font-semibold ${active ? 'text-neutral-900/75' : 'app-muted'}`}>
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
            </section>
          </>
        ) : view === 'language' ? (
          <>
            <button
              onClick={() => setView('overview')}
              className="app-icon-button mb-8"
              aria-label="Zurück zu Einstellungen"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <header>
              <p className="app-eyebrow">Sprache</p>
              <h1 className="mt-1 text-4xl font-black leading-none">Sprache wählen</h1>
              <p className="app-muted mt-4 text-sm font-semibold">Noch Demo-Auswahl: Texte bleiben vorerst Deutsch.</p>
            </header>

            <section className="mt-8 grid gap-3">
              {APP_LANGUAGES.map((option) => {
                const active = option.id === language;
                return (
                  <button
                    key={option.id}
                    onClick={() => setLanguage(option.id)}
                    className={`flex items-center justify-between rounded-3xl border p-4 text-left transition-transform active:scale-95 ${
                      active
                        ? 'border-[var(--app-accent)] bg-[var(--app-accent)] text-neutral-950'
                        : 'border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-text-soft)]'
                    }`}
                  >
                    <span>
                      <span className="block text-base font-black">{option.name}</span>
                      <span className={`mt-1 block text-xs font-semibold ${active ? 'text-neutral-900/75' : 'app-muted'}`}>
                        {option.subtitle}
                      </span>
                    </span>
                    <span className="text-sm font-black uppercase">{option.id}</span>
                  </button>
                );
              })}
            </section>
          </>
        ) : view === 'weight' ? (
          <>
            <button
              onClick={() => setView('overview')}
              className="app-icon-button mb-8"
              aria-label="Zurück zu Einstellungen"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <header>
              <p className="app-eyebrow">Gewichtseinheit</p>
              <h1 className="mt-1 text-4xl font-black leading-none">Einheit wählen</h1>
              <p className="app-muted mt-4 text-sm font-semibold">Für Gewichte in Trainings und Verlauf.</p>
            </header>

            <section className="mt-8 grid gap-3">
              {[
                { id: 'kg' as const, name: 'Kilogramm', subtitle: 'kg, Standard in Deutschland' },
                { id: 'lbs' as const, name: 'Pfund', subtitle: 'lbs, praktisch für US-Gyms' },
              ].map((option) => {
                const active = option.id === weightUnit;
                return (
                  <button
                    key={option.id}
                    onClick={() => setWeightUnit(option.id)}
                    className={`flex items-center justify-between rounded-3xl border p-5 text-left transition-transform active:scale-95 ${
                      active
                        ? 'border-[var(--app-accent)] bg-[var(--app-accent)] text-neutral-950'
                        : 'border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-text-soft)]'
                    }`}
                  >
                    <span>
                      <span className="block text-lg font-black">{option.name}</span>
                      <span className={`mt-1 block text-xs font-semibold ${active ? 'text-neutral-900/75' : 'app-muted'}`}>
                        {option.subtitle}
                      </span>
                    </span>
                    <span className="text-xl font-black uppercase">{option.id}</span>
                  </button>
                );
              })}
            </section>
          </>
        ) : view === 'restTimer' ? (
          <>
            <button
              onClick={() => setView('overview')}
              className="app-icon-button mb-8"
              aria-label="Zurück zu Einstellungen"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <header>
              <p className="app-eyebrow">Pausen-Timer</p>
              <h1 className="mt-1 text-4xl font-black leading-none">Pause steuern</h1>
              <p className="app-muted mt-4 text-sm font-semibold">Standarddauer für Satzpausen vorbereiten.</p>
            </header>

            <section className="app-card mt-8 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-black">Timer verwenden</p>
                  <p className="app-muted mt-1 text-xs font-semibold">Nach einem Satz automatisch erinnern.</p>
                </div>
                <button
                  onClick={() => setRestTimerEnabled(!restTimerEnabled)}
                  className={`relative h-9 w-16 rounded-full border transition-colors ${
                    restTimerEnabled
                      ? 'border-[var(--app-accent)] bg-[var(--app-accent)]'
                      : 'border-[var(--app-border)] bg-[var(--app-surface-strong)]'
                  }`}
                  aria-label="Pausen-Timer umschalten"
                >
                  <span
                    className={`absolute top-1 h-7 w-7 rounded-full bg-neutral-950 transition-[left] ${
                      restTimerEnabled ? 'left-8' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </section>

            <section className="mt-6">
              <p className="mb-3 text-sm font-black">Standarddauer</p>
              <div className="grid grid-cols-2 gap-3">
                {REST_TIMER_OPTIONS.map((seconds) => {
                  const active = seconds === restTimerSeconds;
                  return (
                    <button
                      key={seconds}
                      onClick={() => setRestTimerSeconds(seconds)}
                      className={`rounded-3xl border p-5 text-left transition-transform active:scale-95 ${
                        active
                          ? 'border-[var(--app-accent)] bg-[var(--app-accent)] text-neutral-950'
                          : 'border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-text-soft)]'
                      }`}
                    >
                      <span className="block text-2xl font-black">{seconds / 60 >= 1 ? `${seconds / 60}` : seconds}</span>
                      <span className={`mt-1 block text-xs font-black uppercase ${active ? 'text-neutral-900/75' : 'app-muted'}`}>
                        {seconds / 60 >= 1 ? 'Minuten' : 'Sekunden'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        ) : view === 'storage' ? (
          <>
            <button
              onClick={() => setView('overview')}
              className="app-icon-button mb-8"
              aria-label="Zurück zu Einstellungen"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <header>
              <p className="app-eyebrow">Speicher</p>
              <h1 className="mt-1 text-4xl font-black leading-none">Deine Daten</h1>
              <p className="app-muted mt-4 text-sm font-semibold">Speicherverbrauch und lokale Datenverwaltung.</p>
            </header>

            <section className="app-card mt-8 p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-lg font-black">App-Speicher</p>
                  <p className="app-muted mt-2 text-sm font-semibold">Geschätzter lokaler Verbrauch</p>
                </div>
                <p className="text-3xl font-black text-[var(--app-accent)]">{formatBytes(totalBytes)}</p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="app-soft-row">
                  <p className="text-xl font-black">{formatBytes(appDataBytes)}</p>
                  <p className="app-muted mt-1 text-[11px] font-black uppercase">Appdaten</p>
                </div>
                <div className="app-soft-row">
                  <p className="text-xl font-black">{formatBytes(cacheBytes)}</p>
                  <p className="app-muted mt-1 text-[11px] font-black uppercase">Cache</p>
                </div>
              </div>
            </section>

            <section className="mt-6">
              <p className="mb-3 text-sm font-black">Speicher-Aktionen</p>
              <div className="grid gap-3">
                <button onClick={clearCache} className="app-list-button">
                  <span>
                    <span className="block text-base font-black">Cache leeren</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">Temporäre App-Dateien entfernen</span>
                  </span>
                  <SettingsBadge>Leeren</SettingsBadge>
                </button>
                <button onClick={clearAppData} className="app-list-button">
                  <span>
                    <span className="block text-base font-black text-red-400">Alle Appdaten löschen</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">Trainings, Splits und Übungen entfernen</span>
                  </span>
                  <SettingsBadge>Löschen</SettingsBadge>
                </button>
              </div>
            </section>

            <section className="mt-6">
              <p className="app-muted text-sm font-semibold">
                Alles wird lokal auf diesem Gerät gespeichert. Dadurch kannst du die App auch offline benutzen.
              </p>
            </section>
          </>
        ) : (
          <>
            <button
              onClick={() => setView('overview')}
              className="app-icon-button mb-8"
              aria-label="Zurück zu Einstellungen"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <header>
              <p className="app-eyebrow">Demo-Daten</p>
              <h1 className="mt-1 text-4xl font-black leading-none">Testmodus</h1>
              <p className="app-muted mt-4 text-sm font-semibold">Beispieldaten für Design, Onboarding und schnelle Tests.</p>
            </header>

            <section className="app-card mt-8 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black">Demo-Profil</p>
                  <p className="app-muted mt-2 text-sm font-semibold">Ein fertiger Trainingsmonat mit Splits, Übungen und Verlauf.</p>
                </div>
                <SettingsBadge>Dev</SettingsBadge>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="app-soft-row">
                  <p className="text-xl font-black">3</p>
                  <p className="app-muted mt-1 text-[11px] font-black uppercase">Splits</p>
                </div>
                <div className="app-soft-row">
                  <p className="text-xl font-black">12</p>
                  <p className="app-muted mt-1 text-[11px] font-black uppercase">Trainings</p>
                </div>
                <div className="app-soft-row">
                  <p className="text-xl font-black">36</p>
                  <p className="app-muted mt-1 text-[11px] font-black uppercase">Sätze</p>
                </div>
              </div>
            </section>

            <section className="mt-6">
              <p className="mb-3 text-sm font-black">Aktionen</p>
              <div className="grid gap-3">
                <button
                  onClick={() => loadDemoData('Beispielplan wurde geladen')}
                  className="app-list-button"
                >
                  <span>
                    <span className="block text-base font-black">Beispielplan laden</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">Splits, Übungen und Trainingsverlauf zum Testen</span>
                  </span>
                  <SettingsBadge>Laden</SettingsBadge>
                </button>
                <button
                  onClick={() => loadDemoData('Demo wurde zurückgesetzt')}
                  className="app-list-button"
                >
                  <span>
                    <span className="block text-base font-black">Demo zurücksetzen</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">Zurück auf den Beispielzustand</span>
                  </span>
                  <SettingsBadge>Dev</SettingsBadge>
                </button>
                <button
                  onClick={loadEmptyApp}
                  className="app-list-button"
                >
                  <span>
                    <span className="block text-base font-black">Leere App testen</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">Onboarding und Empty States prüfen</span>
                  </span>
                  <SettingsBadge>Leeren</SettingsBadge>
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      <AppDock active="settings" />
    </div>
  );
}
