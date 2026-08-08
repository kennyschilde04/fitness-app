# Gym Tracker

Mobile-first Trainings-Tracker: Einheiten (z.B. "Beine", "Arme/Brust"), Übungen und Sätze (Gewicht × Wiederholungen) pro Tag erfassen, Kalenderansicht (Woche/Monat), Verlauf/Insight pro Einheit. Läuft komplett im Browser als PWA, installierbar auf dem Homescreen.

**Live (Produktion):** https://kennyschilde04.github.io/fitness-app/
**Staging (aktueller Test-Stand):** https://fitness-app-git-staging-ferny.vercel.app

## Tech-Stack

- React 19 + TypeScript, Vite 8
- Tailwind CSS 4 (`@tailwindcss/vite`)
- `react-router-dom` mit `HashRouter` (deshalb kein Server-Rewrite für Routing nötig — funktioniert auf jedem statischen Host ohne Konfiguration)
- `vite-plugin-pwa` (Service Worker, installierbar, `registerType: 'autoUpdate'`)
- **Kein eigenes Backend, keine Datenbank** — führender Speicher ist der `localStorage` des jeweiligen Geräts (siehe `src/storage.ts`), dadurch funktioniert die App offline. `localStorage` ist pro Adresse getrennt: Produktion, Staging und jede Preview haben eigene Daten.
- **Optionaler Abgleich mit Google Drive** (`src/state/driveSync.ts`) — auf Wunsch legt die App den eigenen Plan im versteckten App-Ordner des angemeldeten Google-Kontos ab und holt ihn dort wieder. Damit folgt der Plan über Adressen und Geräte hinweg. Kein eigener Server, die Daten liegen im Konto des Nutzers. Es gibt **kein Zusammenführen**: Wer zuletzt hochlädt, gewinnt; jede Fassung trägt einen Zeitstempel und das Laden fragt immer nach.

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

## Daten sichern und abgleichen

Unter **Einstellungen → Speicher**:

- **Daten exportieren / Sicherung einspielen** — JSON-Datei. Der Weg, um den Stand auf ein anderes Gerät oder eine andere Adresse zu bringen, und die Absicherung gegen gelöschte Browserdaten.
- Beschädigte Daten werden beim Laden **beiseitegelegt statt überschrieben** und können hier wiederhergestellt oder als Datei gesichert werden.
- Vor jedem überschreibenden Vorgang legt die App automatisch einen Sicherungspunkt an (**Stand vor dem Überschreiben**).

Unter **Einstellungen → Demo-Daten**:

- **Eigener Plan** — verbindet sich mit Google Drive und holt den dort abgelegten Plan. Dadurch überleben eigene Daten das Ausprobieren der Demo-Datensätze. Der Upload läuft danach automatisch bei eigenen Änderungen, nie bei geladenen Demo-Daten.

### Google-Anbindung einrichten

Die OAuth-Client-ID steckt als Standardwert in `src/state/driveSync.ts` und ist bei einer Browser-App kein Geheimnis — sie wird ohnehin mit ausgeliefert. Der Schutz kommt aus den autorisierten Quellen. Über `VITE_GOOGLE_CLIENT_ID` lässt sie sich pro Umgebung überschreiben (siehe `.env.example`).

In der [Google Cloud Console](https://console.cloud.google.com/) sind nötig:

1. **Drive-API aktivieren** (`APIs & Dienste → Bibliothek → Google Drive API`). Fehlt das, antwortet Drive mit `403 accessNotConfigured`.
2. **Bereich** `https://www.googleapis.com/auth/drive.appdata` im OAuth-Zustimmungsbildschirm unter *Datenzugriff* hinzufügen **und speichern**.
3. **Testnutzer** eintragen — im Testmodus kann sich sonst niemand anmelden.
4. **Autorisierte JavaScript-Quellen** für jede Adresse, die die App ausliefert. Google erlaubt keine Platzhalter, jede Preview-URL braucht einen eigenen Eintrag:

```
https://kennyschilde04.github.io
https://fitness-app-ferny.vercel.app
https://fitness-app-git-master-ferny.vercel.app
https://fitness-app-git-staging-ferny.vercel.app
http://localhost:5173
```

Fehlt eine Adresse, bricht die Anmeldung mit `origin_mismatch` ab.

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

Die Beispiel-Datensätze stecken in `src/storage.ts` und lassen sich unter **Einstellungen → Demo-Daten** laden: `demoData()` (8 Trainings) und `fullDemoData()` (60 Tage, deterministisch erzeugt, mit absichtlich ausgelassenen Tagen und Übungen zum Testen der Filterlogik). Vor dem Laden wird gefragt, und der vorherige Stand landet im automatischen Sicherungspunkt.
