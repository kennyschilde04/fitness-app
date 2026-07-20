# Gym Tracker

Mobile-first Trainings-Tracker: Einheiten (z.B. "Beine", "Arme/Brust"), Übungen und Sätze (Gewicht × Wiederholungen) pro Tag erfassen, Kalenderansicht (Woche/Monat), Verlauf/Insight pro Einheit. Läuft komplett im Browser als PWA, installierbar auf dem Homescreen.

**Live (Produktion):** https://kennyschilde04.github.io/fitness-app/
**Staging (aktueller Test-Stand):** https://fitness-app-git-staging-ferny.vercel.app

## Tech-Stack

- React 19 + TypeScript, Vite 8
- Tailwind CSS 4 (`@tailwindcss/vite`)
- `react-router-dom` mit `HashRouter` (deshalb kein Server-Rewrite für Routing nötig — funktioniert auf jedem statischen Host ohne Konfiguration)
- `vite-plugin-pwa` (Service Worker, installierbar, `registerType: 'autoUpdate'`)
- **Keine Backend/Datenbank** — alle Daten liegen ausschließlich in `localStorage` des jeweiligen Geräts/Browsers (siehe `src/storage.ts`). Kein Server-Sync zwischen Geräten oder Nutzern.

## Setup

Voraussetzung: Node.js 20+.

```bash
npm install
npm run dev       # Dev-Server (Vite), Standardport 5173
```

Weitere Scripts (`package.json`):

```bash
npm run build      # tsc -b && vite build -> dist/
npm run preview    # gebauten dist/-Output lokal servieren
npm run lint       # oxlint
```

Type-Check ohne Build: `npx tsc --noEmit -p .`

## Projektstruktur (Kurzüberblick)

- `src/types.ts` — Datenmodell: `UnitDef` (Einheit), `ExerciseDef` (Übung), `Session` (Tageseintrag), `SetEntry` (Gewicht/Wdh je Satz)
- `src/storage.ts` — liest/schreibt `AppData` aus/in `localStorage` (Key `gym-tracker-data-v2`)
- `src/state/useAppData.ts` — zentraler State-Hook mit allen Mutations- und Abfrage-Funktionen (Sessions anlegen, Sätze ändern, Verlauf abfragen, historisches Max an Sätzen ermitteln, ...)
- `src/pages/` — `CalendarPage` (Start, Wochen-/Monatsansicht), `HistoryPage` ("Insight")
- `src/components/` — UI-Komponenten (Header, Kalenderzellen, SessionModal, ExerciseRow, ...)
- `vite.config.ts` — `base` ist `/fitness-app/` nur wenn `GITHUB_PAGES` env gesetzt ist (für GitHub Pages), sonst `/` (für Vercel/lokal)

## Git-Workflow

Zwei geschützte Branches (kein direkter Push erlaubt, kein Force-Push/Löschen, PR + **mindestens 1 Freigabe** vom jeweils anderen Collaborator nötig):

- **`master`** — Produktion. Push löst automatisch das GitHub-Pages-Deployment aus (`.github/workflows/deploy.yml`).
- **`staging`** — gemeinsamer Testbereich. Push löst automatisch ein Vercel-Deployment auf einer festen URL aus (siehe oben).

Ablauf für jede Änderung:

```bash
git checkout staging
git pull
git checkout -b feature/dein-branch-name
# ... Änderungen, commit, push ...
gh pr create --base staging --head feature/dein-branch-name
```

1. Feature-Branch von `staging` abzweigen
2. Pull Request **gegen `staging`** öffnen — jeder PR/Branch bekommt automatisch eine eigene Vercel-Preview-URL (postet Vercel als Kommentar im PR)
3. Der jeweils andere schaut sich die Preview an und approved den PR
4. Merge nach `staging` → feste Staging-URL aktualisiert sich automatisch
5. Wenn `staging` reif für Produktion ist: PR `staging` → `master` öffnen, review, merge → GitHub Pages aktualisiert sich automatisch

Da beide Branches Review-Pflicht haben: als Repo-Admin kann man einen PR notfalls per `gh pr merge <nr> --squash --admin` ohne Freigabe mergen (Admins sind von der Regel ausgenommen), sollte aber die Ausnahme bleiben.

## Vercel-Setup (Preview-Deployments)

Projekt ist unter [vercel.com/ferny/fitness-app](https://vercel.com/ferny/fitness-app) mit dem GitHub-Repo verbunden. Framework-Preset **Vite**, keine weitere Konfiguration nötig (kein `vercel.json`, da `HashRouter` verwendet wird).

Wichtig: **Settings → Deployment Protection** muss auf **"No Protection"** stehen (nicht "Vercel Authentication"), sonst muss für jede Preview-URL einzeln Zugriff angefragt/freigegeben werden. Ohne Vercel-Pro-Plan kann Team-Mitgliedschaft nicht vergeben werden — das ist aber nicht nötig: alle Preview-URLs sind bei "No Protection" ohnehin öffentlich per Link erreichbar, unabhängig vom Vercel-Account.

## Demo-/Testdaten

Branch `test/demo-data` enthält einen deterministischen Beispiel-Datensatz (30 Tage Trainingshistorie, rotierender Rhythmus, inkl. seltener übersprungener Sätze/Übungen zum Testen der entsprechenden Logik) — nur zum Anschauen, nicht für `staging`/`master` gedacht. Siehe `src/devSeed.ts` auf diesem Branch.
