# CLAUDE.md

Gym Tracker — mobile-first Trainings-Tracker als reine PWA. React 19 + TypeScript, Vite 8, Tailwind 4, `react-router-dom` mit **HashRouter**, `framer-motion` für Animationen. Kein Backend, keine Datenbank, kein Server-Sync: alle Daten liegen im `localStorage` des jeweiligen Geräts.

Allgemeine Projektbeschreibung, Setup und der ausführliche Git-Workflow stehen im [README.md](README.md) — diese Datei ergänzt nur, was man dem Code nicht ansieht.

> **Aktueller Arbeitsstand ist `design/app-redesign`**, nicht `staging`. Der Branch liegt 19 Commits vorn (Settings-Seite, Dock-Navigation, Themes, ausgebaute Insights). `staging` hat genau einen Commit, der hier fehlt (`Show 5 entries per exercise in Insight by default`, #5) — dessen Inhalt ist hier aber bereits unabhängig umgesetzt. Ein späterer Merge meldet einen Konflikt in `HistoryPage.tsx`, der inhaltlich keiner ist.

## Verifikation

Es gibt **keine Tests und kein `test`-Script**. Diese drei Befehle sind das gesamte Gate:

```bash
./node_modules/.bin/oxlint    # Lint
npx tsc --noEmit -p .         # Type-Check
npm run build                 # tsc -b && vite build -> dist/
```

Kein Prettier, kein husky, kein lint-staged. Formatierung folgt dem umgebenden Code.

> **Achtung:** `npm run lint` kann in dieser Umgebung eine irreführende Meldung produzieren (`ESLint output (JSON parse failed: EOF ...)`). Das Projekt nutzt **oxlint**, nicht ESLint — der Token-Proxy interpretiert das Script falsch. Verlässlich ist der direkte Aufruf `./node_modules/.bin/oxlint`; nur dessen Exit-Code zählt.

## Architektur

Routen ([src/App.tsx](src/App.tsx)): `/` und `/day/:date` → `CalendarPage`, `/history` und `/history/:unitId` → `HistoryPage`, `/settings` → `SettingsPage`.

- [src/types.ts](src/types.ts) — Datenmodell: `UnitDef` (Einheit), `ExerciseDef` (Übung), `Session` (ein Tageseintrag), `SessionExercise`, `SetEntry` (`{ weight, reps }`, beide `number | null`). Dazu `DEFAULT_SETS`/`MIN_SETS`/`MAX_SETS` und `UNIT_COLOR_PALETTE` + `getUnitColor()`.
- [src/storage.ts](src/storage.ts) — `loadData()` / `saveData()` gegen `localStorage`-Key `gym-tracker-data-v2` (exportiert als `STORAGE_KEY`). Enthält außerdem die drei Datensatz-Generatoren `emptyData()`, `demoData()` (8 Sessions) und `fullDemoData()` (60 Tage, deterministisch über `seededNoise`, mit absichtlich ausgelassenen Tagen und Übungen zum Testen der Filterlogik).
- [src/state/useAppData.ts](src/state/useAppData.ts) — der einzige State-Hook, enthält **alle** Mutationen und Abfragen.
- [src/state/driveSync.ts](src/state/driveSync.ts) — optionaler Abgleich des eigenen Plans mit dem versteckten App-Ordner in Google Drive. Kein React-Hook, sondern ein Modul mit eigenem Token-Zustand, damit auch `useAppData` es aufrufen kann.
- [src/state/useTheme.ts](src/state/useTheme.ts) — sieben Themes: `dark` (Default), `purple`, `light`, `midnight`, `ember`, `mint`, `mono`. Key `gym-tracker-theme`.
- [src/pages/](src/pages/) — `CalendarPage` (Start, Woche/Monat), `HistoryPage` ("Insight", 768 Zeilen), `SettingsPage` (Theme-Auswahl und Daten-Reset).
- [src/components/](src/components/) — `AppDock` (Bottom-Navigation Heute/Insight/Settings), `Header`, `WeekCalendar`/`DayCell`, `MonthCalendar`/`MonthDayCell`, `SessionModal` (Haupt-Editieroberfläche), `ExerciseRow`, `UnitPicker`, `DayContextMenu`.
- [src/utils/](src/utils/) — `date.ts` (deutsche Labels, ISO `yyyy-mm-dd`, Montag-erste Wochenlogik), `format.ts` (`formatSet` → `"80×10"`), `useLongPress.ts`.

## Styling

[src/index.css](src/index.css) (655 Zeilen) ist der zentrale Ort für alles Visuelle — **Tailwind 4 ist CSS-first konfiguriert, es gibt keine `tailwind.config.js`**.

- **Theme-Tokens** als CSS-Custom-Properties auf `:root` (`--app-bg`, `--app-text`, `--app-accent`, `--app-surface`, `--app-border`, `--app-radius-*`, `--app-safe-top/-bottom`). Jedes Theme überschreibt sie in einem `html.<theme>`-Block. **Neue Farben immer als Token ergänzen und in allen sieben Theme-Blöcken setzen** — nicht hart im Component-Markup.
- **Komponenten-Klassen** mit `app-`-Präfix (`app-screen`, `app-scroll`, `app-scroll-with-dock`, `app-card`, `app-input`, `app-primary-button`, `app-dock`, `app-sheet-backdrop`, `app-exercise-card`, …). Komponenten kombinieren diese mit Tailwind-Utilities.
- Der `light:`-Prefix stammt aus `@custom-variant light (&:where(.light, .light *));`. `useTheme` setzt die Klasse `.light` zusätzlich zum Theme-Namen — aktuell für `light` und `mint`. **Ein neues helles Theme muss in `LIGHT_THEMES` eingetragen werden**, sonst bleiben alle `light:`-Utilities wirkungslos.

## Fallstricke

- **Die Shell-Höhe kommt aus `--app-viewport-height`, nicht aus `dvh`/`vh`/`100%`.** Ein Skript in [index.html](index.html) misst `visualViewport.height` vor dem ersten Paint und hält den Wert bei `resize`/`orientationchange` aktuell; `html`, `body`, `#root` und `.app-screen` beziehen ihre Höhe daraus. Grund: mobile Browser lösen `height: 100%` gegen den *großen* Viewport auf (URL-Leiste eingeklappt), wodurch das Layout höher wird als der sichtbare Bereich und der Inhalt unter das Dock rutscht. Ein früherer `@supports (-webkit-touch-callout: none)`-Fallback mit `-webkit-fill-available` hatte denselben Effekt auf iOS. **Nicht auf `100dvh` oder `height: 100%` zurückbauen** — die stehen nur noch als Fallback dahinter, falls das Skript nicht läuft.
- **Themes werden ebenfalls in [index.html](index.html) vorab gesetzt**, sonst blitzt beim Laden das Default-Theme auf. Die Theme-Liste steht dadurch doppelt — neue Themes an beiden Stellen eintragen (Kommentar in `src/state/useTheme.ts`).
- **Highlight-Farben nie fest kodieren.** Die `app-accent-*`-Klassen speisen aus `--app-accent` / `--app-on-accent` und ziehen dadurch in allen sieben Themes mit.
- **Der Drive-Abgleich darf nie ungefragt ein Anmeldefenster öffnen.** `hochladenWennVerbunden()` läuft ausschließlich mit einem Token, das schon im Speicher liegt, und fordert selbst keines an. Grund: Der entprellte Upload feuerte früher auch nach dem bloßen Seitenaufbau, und mit abgelaufenem Token riss Google sein Fenster mitten in einer beliebigen Bedienung auf. Unveränderte Daten werden über einen Fingerabdruck übersprungen. **Nicht auf „einfach Token nachfordern" umbauen.**
- **Vier localStorage-Bereiche neben den Nutzdaten:** `gym-tracker-slot-plan` (eigener Plan, wird bei eigenen Ständen automatisch gespiegelt), `gym-tracker-auto-backup` (Stand vor dem letzten Überschreiben), `gym-tracker-rescue-*` (unlesbare Daten), `gym-tracker-data-source` (`eigen` | `demo`). Die Quelle entscheidet, ob gespiegelt wird — **ohne sie würde ein geladener Demo-Datensatz den eigenen Plan überschreiben**.
- **Beschädigte Daten niemals überschreiben.** `loadData()` legt unlesbare Rohdaten unter `gym-tracker-rescue-*` ab, bevor es leer zurückgibt. Ohne das schreibt der Speicher-Effect in `useAppData` den leeren Zustand sofort darüber und das Original ist endgültig weg.
- **Die OAuth-Client-ID steht bewusst im Klartext** in `driveSync.ts`. Bei einer Browser-App ist sie kein Geheimnis; der Schutz kommt aus den autorisierten JavaScript-Quellen in der Google Console. **Nicht als Leak behandeln und entfernen** — sonst ist jede Preview ohne Konfiguration tot.
- **Kein globaler Store.** `useAppData()` wird pro Page unabhängig aufgerufen; jede Instanz hält ihre eigene `useState`-Kopie und synchronisiert nur über `localStorage`. Zwei gleichzeitig gemountete Consumer sehen Änderungen des jeweils anderen nicht. Deshalb schreiben die `resetTo*`-Funktionen zusätzlich direkt per `saveData()`, statt sich auf den `useEffect` zu verlassen.
- **`loadData()` seedet keine Default-Einheiten mehr.** Ohne gespeicherte Daten kommt `emptyData()` zurück — die App startet leer, Einheiten legt man selbst an oder lädt Demo-Daten in den Settings. (Die `DEFAULT_UNITS` greifen nur noch als Fallback, wenn ein gespeicherter Datensatz das Feld `units` gar nicht hat.)
- **Eine Session pro Datum.** `createSession` bricht ab, wenn für das Datum schon eine Session existiert. Zwei verschiedene Einheiten am selben Tag sind konstruktionsbedingt nicht möglich.
- **`createSession` befüllt vor:** Notiz aus dem letzten nicht-leeren Eintrag (`lastNoteFor`), Satz-Anzahl aus dem historischen Maximum (`maxSetCountFor`, sonst `DEFAULT_SETS`).
- **`hasSetData()` filtert den Verlauf:** Übungen mit ausschließlich `null`-Sätzen gelten als übersprungen und tauchen in `getPreviousSessions` / `getUnitExerciseHistory` nicht auf.
- **Zwei ähnlich benannte Lösch-Funktionen:** `removeExerciseFromUnit(sessionId, …)` arbeitet von einer Session aus und räumt nur diese eine Session auf; `removeExerciseFromUnitPlan(unitId, …)` entfernt die Übung aus **allen** Sessions der Einheit. Vergangene Sessions behalten im ersten Fall ihre Kopie — der denormalisierte `name` in `SessionExercise` macht das unkritisch.
- **Drag-and-Drop läuft über `framer-motion`s `Reorder`** ([ExerciseRow.tsx:40](src/components/ExerciseRow.tsx#L40), [SessionModal.tsx:196](src/components/SessionModal.tsx#L196)) mit `dragListener={false}` plus `dragControls` — der Drag startet nur am Griff, nicht auf der ganzen Karte. `layout="position"` ist bewusst gesetzt (nicht `layout` oder `layout="size"`): eine Größen-Animation kollidiert mit dem Auf-/Zuklappen der Karte. Ebenso darf auf `.app-exercise-card-animated` **keine CSS-`transition` auf `transform`** liegen — das kämpft mit dem Transform von framer-motion und erzeugt Flackern beim Reordern. Beides waren bereits behobene Bugs.
- **`vite.config.ts`:** `base` ist `/fitness-app/` **nur** wenn die Env-Variable `GITHUB_PAGES` gesetzt ist (GitHub Pages). Lokal und auf Vercel ist es `/`.
- **`"strict": true` ist in `tsconfig.app.json` nicht gesetzt** — aktiv sind u.a. `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax`.
- **`scripts/generate-icons.mjs` importiert `sharp`**, das nicht in den devDependencies steht. Läuft nur mit Ad-hoc-Install.
- **`npm audit` meldet offene Vulnerabilities** (u.a. `react-router` RSC-Mode-CSRF). Für eine statische PWA ohne Server und ohne RSC praktisch nicht ausnutzbar. Kein ungefragtes `npm audit fix` — Dependency-Bumps gehören in einen eigenen PR.

## Git

`master` und `staging` sind protected (PR + 1 Approval, kein Force-Push, `enforce_admins: false`) — **niemals direkt auf diese beiden Branches committen oder pushen**. `design/app-redesign` ist nicht protected, direkte Commits sind dort möglich; da es ein geteilter Remote-Branch ist, vorher `git pull`.

Feature-Branch → PR gegen `staging` (Vercel-Preview) → nach Review Merge → wenn reif: PR `staging` → `master` (deployt GitHub Pages).

**Commit-Konvention:** kurze englische Imperativ-Zeile, wie in der bestehenden History (z.B. `Show 5 entries per exercise in Insight by default`). Die globale `commit-mr-convention`-Skill mit Pflicht-awork-Ticket-ID im Scope gilt hier **nicht** — dies ist ein privates GitHub-Repo ohne awork-/GitLab-Anbindung.
