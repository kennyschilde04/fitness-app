import { useRef, useState } from 'react';
import { AppDock } from '../components/AppDock';
import { useAppData } from '../state/useAppData';
import { useKontoAnmeldung } from '../state/useKontoAnmeldung';
import { type Theme, useTheme } from '../state/useTheme';
import {
  gemerktesKonto,
  istKonfiguriert,
  trennen,
  warVerbunden,
} from '../state/driveSync';
import {
  STORAGE_KEY,
  autoBackupInfo,
  buildExport,
  deletePlanSlot,
  deleteRescue,
  exportFileName,
  listRescueEntries,
  parseImport,
  planSlotInfo,
  readAutoBackup,
  readPlanSlot,
  readRescueRaw,
} from '../storage';

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

interface ConfirmAction {
  titel: string;
  text: string;
  bestaetigen: string;
  ausfuehren: () => void;
  /** Auch bei leerer App fragen — wenn nicht die aktuellen Daten auf dem Spiel stehen. */
  immerFragen?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const {
    units,
    exercises,
    sessions,
    resetToDemoData,
    resetToEmptyData,
    resetToFullDemoData,
    replaceData,
    wechsleKonto,
  } = useAppData();
  const [view, setView] = useState<SettingsView>('overview');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const driveKonfiguriert = istKonfiguriert();
  const [driveVerbunden, setDriveVerbunden] = useState(() => warVerbunden());
  const [driveKonto, setDriveKonto] = useState(() => gemerktesKonto());
  const { anmelden, laeuft: driveLaeuft } = useKontoAnmeldung(wechsleKonto);
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
  const rescueEntries = listRescueEntries();
  const planSlot = planSlotInfo();
  const autoBackup = autoBackupInfo();
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

  /**
   * Fragt nur nach, wenn wirklich etwas verloren gehen kann. Bei leerer App
   * wäre die Rückfrage nur im Weg.
   */
  function mitRueckfrage(action: ConfirmAction) {
    if (sessions.length === 0 && !action.immerFragen) {
      action.ausfuehren();
      return;
    }
    setConfirmAction(action);
  }

  function downloadJson(inhalt: string, dateiname: string) {
    const blob = new Blob([inhalt], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = dateiname;
    link.click();
    URL.revokeObjectURL(url);
  }

  function restoreRescue(key: string) {
    const raw = readRescueRaw(key);
    const eingelesen = raw ? parseImport(raw) : null;
    if (!eingelesen) {
      showToast('Nicht automatisch wiederherstellbar');
      return;
    }
    mitRueckfrage({
      titel: 'Gerettete Daten einspielen?',
      text: `Ersetzt deine aktuellen ${sessions.length} Trainings durch ${eingelesen.sessions.length} aus der Rettung.`,
      bestaetigen: 'Einspielen',
      ausfuehren: () => {
        replaceData(eingelesen);
        deleteRescue(key);
        refreshStorageStats((value) => value + 1);
        showToast(`${eingelesen.sessions.length} Trainings wiederhergestellt`);
      },
    });
  }

  function saveRescueToFile(key: string) {
    const raw = readRescueRaw(key);
    if (!raw) return;
    downloadJson(raw, `gym-tracker-rettung-${key.slice(-24, -5)}.json`);
    showToast('Rettung als Datei gesichert');
  }

  function discardRescue(key: string) {
    mitRueckfrage({
      titel: 'Rettung verwerfen?',
      text: 'Die beschädigten Daten werden endgültig entfernt. Vorher als Datei sichern, falls du sie noch brauchst.',
      bestaetigen: 'Verwerfen',
      immerFragen: true,
      ausfuehren: () => {
        deleteRescue(key);
        refreshStorageStats((value) => value + 1);
        showToast('Rettung verworfen');
      },
    });
  }

  /**
   * Ohne Verbindung: erst mit Google verbinden. Mit Verbindung: den Plan aus
   * Drive holen. Ist die lokale Fassung neuer, wird das gemeldet statt sie
   * stillschweigend zu überschreiben.
   */
  async function planAntippen() {
    if (!driveKonfiguriert) {
      showToast('Keine Google-Client-ID hinterlegt');
      return;
    }
    try {
      const ergebnis = await anmelden();
      if (!ergebnis.ok) {
        if (ergebnis.grund === 'Anmeldung abgebrochen' || ergebnis.grund.startsWith('Keine Google')) {
          showToast(ergebnis.grund);
          return;
        }
        throw new Error(ergebnis.grund);
      }
      setDriveVerbunden(true);
      setDriveKonto(ergebnis.konto);
      refreshStorageStats((value) => value + 1);
      showToast(
        ergebnis.hatteDrive
          ? `${ergebnis.sessions} Trainings von ${ergebnis.konto}`
          : `${ergebnis.konto}: noch kein Plan, leer gestartet`,
      );
    } catch (fehler) {
      // Offline oder Anmeldung abgelaufen: die lokale Spiegelung ist dann der
      // beste verfügbare Stand, statt den Nutzer mit einem Fehler stehenzulassen.
      const meldung = fehler instanceof Error ? fehler.message : 'Drive nicht erreichbar';
      if (planSlot) {
        mitRueckfrage({
          titel: 'Drive nicht erreichbar',
          text: `${meldung}. Stattdessen die lokale Kopie laden? ${planSlot.sessions} Trainings, Stand vom ${new Date(planSlot.gespeichertAm).toLocaleString('de-DE')}.`,
          bestaetigen: 'Lokal laden',
          immerFragen: true,
          ausfuehren: loadPlan,
        });
        return;
      }
      showToast(meldung);
    }
  }

  function driveTrennen() {
    mitRueckfrage({
      titel: 'Google-Konto trennen?',
      text: 'Die App greift danach nicht mehr auf Drive zu. Deine Daten auf diesem Gerät und in Drive bleiben erhalten.',
      bestaetigen: 'Trennen',
      immerFragen: true,
      ausfuehren: () => {
        trennen();
        setDriveVerbunden(false);
        setDriveKonto(null);
        showToast('Google-Konto getrennt');
      },
    });
  }

  function loadPlan() {
    const geladen = readPlanSlot();
    if (!geladen) {
      showToast('Kein gesicherter Plan vorhanden');
      return;
    }
    mitRueckfrage({
      titel: 'Eigener Plan laden?',
      text: `Ersetzt die aktuellen ${sessions.length} Trainings durch ${geladen.sessions.length} aus deinem Plan.`,
      bestaetigen: 'Laden',
      ausfuehren: () => {
        replaceData(geladen);
        refreshStorageStats((value) => value + 1);
        showToast(`${geladen.sessions.length} Trainings geladen`);
      },
    });
  }

  function restoreAutoBackup() {
    const geladen = readAutoBackup();
    if (!geladen) {
      showToast('Kein Sicherungspunkt vorhanden');
      return;
    }
    mitRueckfrage({
      titel: 'Stand vor dem Überschreiben zurückholen?',
      text: `Ersetzt die aktuellen ${sessions.length} Trainings durch ${geladen.sessions.length} aus dem Sicherungspunkt.`,
      bestaetigen: 'Zurückholen',
      ausfuehren: () => {
        replaceData(geladen);
        refreshStorageStats((value) => value + 1);
        showToast(`${geladen.sessions.length} Trainings zurückgeholt`);
      },
    });
  }

  function forgetPlan() {
    mitRueckfrage({
      titel: 'Eigener Plan löschen?',
      text: 'Der gesicherte Plan wird entfernt. Deine aktuellen Daten bleiben unberührt.',
      bestaetigen: 'Löschen',
      immerFragen: true,
      ausfuehren: () => {
        deletePlanSlot();
        refreshStorageStats((value) => value + 1);
        showToast('Eigener Plan gelöscht');
      },
    });
  }

  function exportData() {
    downloadJson(buildExport({ units, exercises, sessions }), exportFileName());
    showToast(`${sessions.length} Trainings gesichert`);
  }

  async function importFile(file: File) {
    const eingelesen = parseImport(await file.text());
    if (!eingelesen) {
      showToast('Datei nicht lesbar — nichts geändert');
      return;
    }
    mitRueckfrage({
      titel: 'Sicherung einspielen?',
      text: `Ersetzt deine aktuellen ${sessions.length} Trainings durch ${eingelesen.sessions.length} aus der Datei.`,
      bestaetigen: 'Einspielen',
      ausfuehren: () => {
        replaceData(eingelesen);
        refreshStorageStats((value) => value + 1);
        showToast(`${eingelesen.sessions.length} Trainings geladen`);
      },
    });
  }

  function clearAppData() {
    mitRueckfrage({
      titel: 'Alle Appdaten löschen?',
      text: `${sessions.length} Trainings, ${exercises.length} Übungen und ${units.length} Einheiten werden entfernt. Vorher exportieren, wenn du sie behalten willst.`,
      bestaetigen: 'Löschen',
      ausfuehren: () => {
        resetToEmptyData();
        refreshStorageStats((value) => value + 1);
        showToast('Appdaten wurden gelöscht');
      },
    });
  }

  function loadDemoData(message: string) {
    mitRueckfrage({
      titel: 'Demo-Daten laden?',
      text: `Deine ${sessions.length} eigenen Trainings werden dabei überschrieben.`,
      bestaetigen: 'Überschreiben',
      ausfuehren: () => {
        resetToDemoData();
        refreshStorageStats((value) => value + 1);
        showToast(message);
      },
    });
  }

  function loadFullDemoData() {
    mitRueckfrage({
      titel: '2 Monate Demo laden?',
      text: `Deine ${sessions.length} eigenen Trainings werden dabei überschrieben.`,
      bestaetigen: 'Überschreiben',
      ausfuehren: () => {
        resetToFullDemoData();
        refreshStorageStats((value) => value + 1);
        showToast('2 Monate Demo wurden geladen');
      },
    });
  }

  function loadEmptyApp() {
    mitRueckfrage({
      titel: 'Leere App testen?',
      text: `Deine ${sessions.length} eigenen Trainings werden dabei entfernt.`,
      bestaetigen: 'Leeren',
      ausfuehren: () => {
        resetToEmptyData();
        refreshStorageStats((value) => value + 1);
        showToast('Leere App ist aktiv');
      },
    });
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

            {rescueEntries.length > 0 && (
              <section className="app-card mt-6 border-red-400/40 p-5">
                <p className="text-lg font-black text-red-400">Beschädigte Daten gefunden</p>
                <p className="app-muted mt-2 text-sm font-semibold">
                  Beim Laden waren die gespeicherten Daten unlesbar. Sie wurden beiseitegelegt, statt überschrieben
                  zu werden.
                </p>
                {rescueEntries.map((entry) => (
                  <div key={entry.key} className="app-soft-row mt-4 text-left">
                    <p className="text-sm font-black">
                      {new Date(entry.gespeichertAm).toLocaleString('de-DE')}
                    </p>
                    <p className="app-muted mt-1 text-xs font-semibold">
                      {formatBytes(entry.bytes)}
                      {entry.wiederherstellbar
                        ? ` · ${entry.sessions} Trainings lesbar`
                        : ' · nicht automatisch lesbar'}
                    </p>
                    <div className="mt-3 grid gap-2">
                      {entry.wiederherstellbar && (
                        <button onClick={() => restoreRescue(entry.key)} className="app-primary-button">
                          Wiederherstellen
                        </button>
                      )}
                      <button onClick={() => saveRescueToFile(entry.key)} className="app-secondary-button">
                        Als Datei sichern
                      </button>
                      <button onClick={() => discardRescue(entry.key)} className="app-danger-button">
                        Verwerfen
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}

            <section className="mt-6">
              <p className="mb-3 text-sm font-black">Sicherung</p>
              <div className="grid gap-3">
                <button onClick={exportData} className="app-list-button">
                  <span>
                    <span className="block text-base font-black">Daten exportieren</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">
                      {sessions.length} Trainings als Datei sichern
                    </span>
                  </span>
                  <SettingsBadge>Export</SettingsBadge>
                </button>
                <button onClick={() => importInputRef.current?.click()} className="app-list-button">
                  <span>
                    <span className="block text-base font-black">Sicherung einspielen</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">
                      Ersetzt die Daten auf diesem Gerät
                    </span>
                  </span>
                  <SettingsBadge>Import</SettingsBadge>
                </button>
                {autoBackup && (
                  <button onClick={restoreAutoBackup} className="app-list-button">
                    <span>
                      <span className="block text-base font-black">Stand vor dem Überschreiben</span>
                      <span className="app-muted mt-1 block text-xs font-semibold">
                        {autoBackup.sessions} Trainings · automatisch gesichert am{' '}
                        {new Date(autoBackup.gespeichertAm).toLocaleString('de-DE')}
                      </span>
                    </span>
                    <SettingsBadge>Zurück</SettingsBadge>
                  </button>
                )}
                {planSlot && (
                  <button onClick={forgetPlan} className="app-list-button">
                    <span>
                      <span className="block text-base font-black text-red-400">Eigener Plan löschen</span>
                      <span className="app-muted mt-1 block text-xs font-semibold">
                        Entfernt nur die lokale Sicherung, nicht deine aktuellen Daten
                      </span>
                    </span>
                    <SettingsBadge>Löschen</SettingsBadge>
                  </button>
                )}
                {driveVerbunden && (
                  <button onClick={driveTrennen} className="app-list-button">
                    <span>
                      <span className="block text-base font-black">Google-Konto trennen</span>
                      <span className="app-muted mt-1 block text-xs font-semibold">
                        Kein Abgleich mehr mit Drive; Daten bleiben erhalten
                      </span>
                    </span>
                    <SettingsBadge>Trennen</SettingsBadge>
                  </button>
                )}
              </div>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  // Wert zurücksetzen, sonst löst dieselbe Datei kein change mehr aus.
                  event.target.value = '';
                  if (file) void importFile(file);
                }}
              />
              <p className="app-muted mt-3 text-xs font-semibold">
                Die Daten liegen pro Adresse getrennt. Beim Testen auf einer anderen URL ist die App leer — über
                Export und Import nimmst du deinen Stand mit.
              </p>
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
              <p className="app-muted mt-4 text-sm font-semibold">Beispieldaten für Design, Onboarding und echte Verlaufsansichten.</p>
            </header>

            <section className="app-card mt-8 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black">Demo-Profil</p>
                  <p className="app-muted mt-2 text-sm font-semibold">Realistische 3er-Split-Daten mit Pausen, Schwankungen und Progression.</p>
                </div>
                <SettingsBadge>Dev</SettingsBadge>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="app-soft-row">
                  <p className="text-xl font-black">3</p>
                  <p className="app-muted mt-1 text-[11px] font-black uppercase">Splits</p>
                </div>
                <div className="app-soft-row">
                  <p className="text-xl font-black">48</p>
                  <p className="app-muted mt-1 text-[11px] font-black uppercase">Trainings</p>
                </div>
                <div className="app-soft-row">
                  <p className="text-xl font-black">~400</p>
                  <p className="app-muted mt-1 text-[11px] font-black uppercase">Sätze</p>
                </div>
              </div>
            </section>

            <section className="mt-6">
              <p className="mb-3 text-sm font-black">Aktionen</p>
              <div className="grid gap-3">
                <button
                  onClick={loadFullDemoData}
                  className="app-list-button"
                >
                  <span>
                    <span className="block text-base font-black">2 Monate voll</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">3er Split, meist 6x/Woche, mit zufälligen Pausen</span>
                  </span>
                  <SettingsBadge>Laden</SettingsBadge>
                </button>
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
                <button onClick={() => void planAntippen()} disabled={driveLaeuft} className="app-list-button">
                  <span>
                    <span className="block text-base font-black">Eigener Plan</span>
                    <span className="app-muted mt-1 block text-xs font-semibold">
                      {driveLaeuft
                        ? 'Verbinde mit Google Drive …'
                        : driveVerbunden
                          ? `Aus Google Drive laden${driveKonto ? ` · ${driveKonto}` : ''}`
                          : 'Einmalig mit Google verbinden'}
                    </span>
                  </span>
                  <SettingsBadge>{driveVerbunden ? 'Laden' : 'Google'}</SettingsBadge>
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      {confirmAction && (
        <div className="app-sheet-backdrop" onClick={() => setConfirmAction(null)}>
          <div className="app-card w-full max-w-md p-6" onClick={(event) => event.stopPropagation()}>
            <p className="text-xl font-black">{confirmAction.titel}</p>
            <p className="app-muted mt-3 text-sm font-semibold">{confirmAction.text}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmAction(null)} className="app-secondary-button">
                Abbrechen
              </button>
              <button
                onClick={() => {
                  confirmAction.ausfuehren();
                  setConfirmAction(null);
                }}
                className="app-danger-button"
              >
                {confirmAction.bestaetigen}
              </button>
            </div>
          </div>
        </div>
      )}

      <AppDock active="settings" />
    </div>
  );
}
