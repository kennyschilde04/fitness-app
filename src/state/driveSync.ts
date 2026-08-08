import type { AppData } from '../types';
import { parseImport } from '../storage';

/**
 * Ablage des eigenen Plans im versteckten App-Ordner von Google Drive.
 *
 * Der Ordner ist pro Anwendung getrennt: Die App sieht nur ihre eigenen
 * Dateien, nicht dein übriges Drive. Umgekehrt taucht die Datei in deiner
 * Drive-Oberfläche nicht auf.
 *
 * Lokal bleibt der localStorage der führende Speicher, damit die App im Gym
 * auch ohne Empfang funktioniert. Drive ist der Abgleich darüber.
 *
 * Bewusste Grenze: Es gibt kein Zusammenführen. Wer zuletzt hochlädt, gewinnt.
 * Deshalb trägt jede Fassung einen Zeitstempel, und beim Verbinden wird
 * gemeldet, welche Seite neuer ist, statt stillschweigend zu überschreiben.
 */

// openid/email nur, um zu wissen, wem die lokalen Daten gehören. Ohne das
// kann die App nach einem Kontowechsel nicht unterscheiden, ob der lokale
// Stand zum angemeldeten Konto gehört — und würde fremde Daten hochladen.
const SCOPE = 'openid email https://www.googleapis.com/auth/drive.appdata';
const GSI_SRC = 'https://accounts.google.com/gsi/client';
const DATEI = 'gym-tracker-plan.json';
const FILE_ID_KEY = 'gym-tracker-drive-file-id';
const CONNECTED_KEY = 'gym-tracker-drive-connected';
const ACCOUNT_KEY = 'gym-tracker-drive-account';

/**
 * Die Client-ID ist bei einer Browser-App kein Geheimnis — sie steht ohnehin
 * im ausgelieferten JavaScript. Der Schutz kommt aus den autorisierten
 * JavaScript-Quellen in der Google Cloud Console: Von einer nicht
 * eingetragenen Adresse aus lehnt Google die Anmeldung ab. Deshalb steht sie
 * hier als Standard, damit jede Preview ohne Extra-Konfiguration funktioniert.
 * Über VITE_GOOGLE_CLIENT_ID lässt sie sich pro Umgebung überschreiben.
 */
const STANDARD_CLIENT_ID = '515351087556-qon1v4vnqlqhe4unig3qfgjbdd7sj617.apps.googleusercontent.com';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || STANDARD_CLIENT_ID;

export interface DrivePayload {
  gespeichertAm: string;
  data: AppData;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface OAuth2Api {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: unknown) => void;
  }) => TokenClient;
  revoke: (token: string, done?: () => void) => void;
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: OAuth2Api } };
  }
}

let accessToken: string | null = null;
let tokenAblauf = 0;
let tokenClient: TokenClient | null = null;

export function istKonfiguriert(): boolean {
  return CLIENT_ID.length > 0;
}

export function warVerbunden(): boolean {
  return localStorage.getItem(CONNECTED_KEY) === 'true';
}

function ladeGsi(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  const vorhanden = document.querySelector(`script[src="${GSI_SRC}"]`);
  if (vorhanden) {
    return new Promise((resolve, reject) => {
      vorhanden.addEventListener('load', () => resolve());
      vorhanden.addEventListener('error', () => reject(new Error('Google-Skript nicht ladbar')));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google-Skript nicht ladbar'));
    document.head.appendChild(script);
  });
}

/**
 * Holt ein Zugriffstoken. `stillschweigend` versucht es ohne Dialog — das
 * klappt, solange die Google-Sitzung im Browser noch steht.
 */
/**
 * Der Token-Client wird nur einmal erzeugt, sein Callback ist aber fest
 * verdrahtet. Deshalb liegt die Auflösung der laufenden Anfrage hier daneben
 * und wird pro Aufruf neu gesetzt — sonst bedient der Callback ewig das
 * Versprechen der allerersten Anmeldung, und jede weitere hängt.
 */
let laufendeAnfrage: { fertig: (token: string | null) => void; fehler: (e: Error) => void } | null = null;

function baueClient(api: OAuth2Api): void {
  if (tokenClient) return;
  tokenClient = api.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: (response) => {
      const anfrage = laufendeAnfrage;
      laufendeAnfrage = null;
      if (!anfrage) return;
      if (response.error) {
        anfrage.fehler(new Error(`Google-Anmeldung: ${response.error}`));
        return;
      }
      if (!response.access_token) {
        anfrage.fertig(null);
        return;
      }
      accessToken = response.access_token;
      tokenAblauf = Date.now() + (response.expires_in ?? 3600) * 1000 - 60_000;
      localStorage.setItem(CONNECTED_KEY, 'true');
      anfrage.fertig(accessToken);
    },
    error_callback: () => {
      const anfrage = laufendeAnfrage;
      laufendeAnfrage = null;
      anfrage?.fehler(new Error('Anmeldung abgebrochen'));
    },
  });
}

/**
 * `interaktiv: false` öffnet unter keinen Umständen ein Google-Fenster und
 * nutzt nur ein bereits vorliegendes Token. Das ist wichtig, weil auch ein
 * vermeintlich stiller Token-Abruf den Kontoauswahl-Dialog aufreißen kann —
 * mitten im Navigieren oder direkt nach einem Abbruch.
 */
async function holeToken(interaktiv: boolean): Promise<string | null> {
  if (!istKonfiguriert()) throw new Error('Keine Google-Client-ID hinterlegt');
  if (accessToken && Date.now() < tokenAblauf) return accessToken;
  if (!interaktiv) return null;
  if (laufendeAnfrage) throw new Error('Anmeldung läuft bereits');

  await ladeGsi();
  const api = window.google?.accounts?.oauth2;
  if (!api) throw new Error('Google-Anmeldung nicht verfügbar');
  baueClient(api);

  return new Promise((resolve, reject) => {
    laufendeAnfrage = { fertig: resolve, fehler: reject };
    // select_account statt consent: Kontowechsel ohne jedes Mal die
    // Berechtigungsabfrage erneut durchlaufen zu müssen.
    tokenClient!.requestAccessToken({ prompt: 'select_account' });
  });
}

async function api(pfad: string, init: RequestInit = {}): Promise<Response> {
  // Nicht interaktiv: ein Drive-Aufruf darf keinen Anmeldedialog auslösen.
  const token = await holeToken(false);
  if (!token) throw new Error('Nicht angemeldet');
  const response = await fetch(pfad, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) {
    accessToken = null;
    throw new Error('Anmeldung abgelaufen');
  }
  if (!response.ok) {
    // Googles eigener Grund ist für die Fehlersuche entscheidend: eine nicht
    // aktivierte Drive-API, ein fehlender Bereich und ein gesperrtes Konto
    // liefern alle 403, brauchen aber völlig verschiedene Gegenmaßnahmen.
    let grund = '';
    try {
      const fehler = (await response.clone().json()) as {
        error?: { message?: string; errors?: { reason?: string }[]; status?: string };
      };
      grund = [fehler.error?.status, fehler.error?.errors?.[0]?.reason, fehler.error?.message]
        .filter(Boolean)
        .join(' · ');
    } catch {
      grund = (await response.clone().text()).slice(0, 200);
    }
    throw new Error(`Drive ${response.status}: ${grund || 'ohne Begründung'}`);
  }
  return response;
}

/**
 * Die gemerkte Datei-ID gilt nur für das Konto, mit dem sie gefunden wurde.
 * Nach einem Kontowechsel zeigt sie in einen fremden App-Ordner und Drive
 * antwortet mit 404 — deshalb ist `frisch` nötig, um sie zu verwerfen und neu
 * zu suchen.
 */
async function findeDatei(frisch = false): Promise<string | null> {
  if (!frisch) {
    const gemerkt = localStorage.getItem(FILE_ID_KEY);
    if (gemerkt) return gemerkt;
  }
  const response = await api(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name)&q=name='${DATEI}'`,
  );
  const json = (await response.json()) as { files?: { id: string }[] };
  const id = json.files?.[0]?.id ?? null;
  if (id) localStorage.setItem(FILE_ID_KEY, id);
  else localStorage.removeItem(FILE_ID_KEY);
  return id;
}

function istNichtGefunden(fehler: unknown): boolean {
  return fehler instanceof Error && fehler.message.startsWith('Drive 404');
}

/** Adresse, der die lokal gespeicherten Daten zugeordnet sind. */
export function gemerktesKonto(): string | null {
  return localStorage.getItem(ACCOUNT_KEY);
}

export function merkeKonto(email: string): void {
  localStorage.setItem(ACCOUNT_KEY, email);
}

async function holeKonto(): Promise<string | null> {
  try {
    const response = await api('https://www.googleapis.com/oauth2/v3/userinfo');
    const json = (await response.json()) as { email?: string };
    return json.email ?? null;
  } catch {
    return null;
  }
}

export interface Verbindung {
  verbunden: boolean;
  konto: string | null;
  /** true, wenn die lokalen Daten einem anderen Konto gehören. */
  kontoGewechselt: boolean;
}

/**
 * Versuch beim App-Start, ohne Dialog an ein Token zu kommen. Gelingt das
 * nicht — kein Netz, abgelaufene Google-Sitzung, nie verbunden — bleibt die
 * App bewusst ohne Konto und damit leer.
 */
export async function stillAnmelden(): Promise<string | null> {
  if (!istKonfiguriert() || !warVerbunden()) return null;
  try {
    // Ausdrücklich nicht interaktiv: beim Start und bei jedem Seitenwechsel
    // darf niemals ungefragt ein Anmeldefenster aufgehen.
    const token = await holeToken(false);
    if (!token) return null;
    return await holeKonto();
  } catch {
    return null;
  }
}

export async function verbinden(): Promise<Verbindung> {
  // Beim bewussten Verbinden kann ein anderes Konto gewählt werden. Die
  // gemerkte Datei-ID des vorigen Kontos wäre dann falsch.
  localStorage.removeItem(FILE_ID_KEY);
  zuletztHochgeladen = null;
  // Der einzige Ort, an dem ein Google-Fenster aufgehen darf.
  const token = await holeToken(true);
  if (!token) return { verbunden: false, konto: null, kontoGewechselt: false };

  const konto = await holeKonto();
  const vorher = gemerktesKonto();
  return {
    verbunden: true,
    konto,
    kontoGewechselt: Boolean(konto && vorher && konto !== vorher),
  };
}

export function trennen(): void {
  const token = accessToken;
  accessToken = null;
  tokenAblauf = 0;
  localStorage.removeItem(CONNECTED_KEY);
  localStorage.removeItem(FILE_ID_KEY);
  // ACCOUNT_KEY bleibt bewusst stehen: Er sagt nicht aus, ob eine Verbindung
  // besteht, sondern wem die Daten auf diesem Gerät gehören. Nach dem Trennen
  // gehören sie weiterhin demselben Konto — ohne diese Information würde der
  // nächste Login mit einem anderen Konto nicht als Wechsel erkannt.
  zuletztHochgeladen = null;
  if (token) window.google?.accounts?.oauth2?.revoke(token);
}

export async function herunterladen(): Promise<DrivePayload | null> {
  let id = await findeDatei();
  if (!id) return null;
  let response: Response;
  try {
    response = await api(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`);
  } catch (fehler) {
    if (!istNichtGefunden(fehler)) throw fehler;
    // Gemerkte ID gehört zu einem anderen Konto oder die Datei wurde gelöscht:
    // neu suchen. Findet sich auch dann nichts, ist das kein Fehler, sondern
    // schlicht "noch kein Plan" — ein 404 darf den Nutzer nicht erreichen.
    localStorage.removeItem(FILE_ID_KEY);
    id = await findeDatei(true);
    if (!id) return null;
    try {
      response = await api(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`);
    } catch (zweiterFehler) {
      if (istNichtGefunden(zweiterFehler)) {
        localStorage.removeItem(FILE_ID_KEY);
        return null;
      }
      throw zweiterFehler;
    }
  }
  const roh = await response.text();
  try {
    const payload = JSON.parse(roh) as DrivePayload;
    const data = parseImport(JSON.stringify(payload.data));
    if (!data) return null;
    return { gespeichertAm: payload.gespeichertAm, data };
  } catch {
    return null;
  }
}

export async function hochladen(data: AppData): Promise<string> {
  const payload: DrivePayload = { gespeichertAm: new Date().toISOString(), data };
  const koerper = JSON.stringify(payload);
  const id = await findeDatei();

  if (id) {
    try {
      await api(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: koerper,
      });
      return payload.gespeichertAm;
    } catch (fehler) {
      if (!istNichtGefunden(fehler)) throw fehler;
      // Gemerkte ID gehört zu einem anderen Konto: unten neu anlegen.
      localStorage.removeItem(FILE_ID_KEY);
    }
  }

  const grenze = 'gymtracker';
  const multipart =
    `--${grenze}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify({ name: DATEI, parents: ['appDataFolder'] })}\r\n` +
    `--${grenze}\r\nContent-Type: application/json\r\n\r\n${koerper}\r\n--${grenze}--`;

  const response = await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${grenze}` },
    body: multipart,
  });
  const json = (await response.json()) as { id?: string };
  if (json.id) localStorage.setItem(FILE_ID_KEY, json.id);
  return payload.gespeichertAm;
}

/**
 * Wird nach eigenen Datenänderungen aufgerufen. Tut nichts, solange keine
 * Verbindung besteht — die App bleibt dadurch offline voll benutzbar.
 */
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let zuletztHochgeladen: string | null = null;

/** Gültiges Token im Speicher? Nur dann läuft ein Upload im Hintergrund. */
function tokenLiegtVor(): boolean {
  return accessToken !== null && Date.now() < tokenAblauf;
}

export function hochladenWennVerbunden(data: AppData): void {
  if (!istKonfiguriert() || !warVerbunden()) return;

  // Unverändert? Dann nichts tun. Verhindert einen Upload direkt beim Laden
  // der Seite, obwohl der Nutzer gar nichts geändert hat.
  const fingerabdruck = JSON.stringify(data);
  if (fingerabdruck === zuletztHochgeladen) return;

  // Ohne gültiges Token wird hier NICHT nachgefordert: das würde mitten in
  // einer beliebigen Bedienung ein Google-Fenster aufreißen. Der Abgleich
  // holt das beim nächsten bewussten Antippen des Plans nach.
  if (!tokenLiegtVor()) return;

  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void hochladen(data)
      .then(() => {
        zuletztHochgeladen = fingerabdruck;
      })
      .catch(() => {
        // Offline: der lokale Stand bleibt führend, der nächste Versuch
        // läuft bei der nächsten Änderung.
      });
  }, 2000);
}

/** Nach einem bewussten Abgleich: verhindert einen sofortigen Nach-Upload. */
export function merkeStand(data: AppData): void {
  zuletztHochgeladen = JSON.stringify(data);
}
