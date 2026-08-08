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

const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const GSI_SRC = 'https://accounts.google.com/gsi/client';
const DATEI = 'gym-tracker-plan.json';
const FILE_ID_KEY = 'gym-tracker-drive-file-id';
const CONNECTED_KEY = 'gym-tracker-drive-connected';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

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
async function holeToken(stillschweigend: boolean): Promise<string | null> {
  if (!istKonfiguriert()) throw new Error('Keine Google-Client-ID hinterlegt');
  if (accessToken && Date.now() < tokenAblauf) return accessToken;

  await ladeGsi();
  const api = window.google?.accounts?.oauth2;
  if (!api) throw new Error('Google-Anmeldung nicht verfügbar');

  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      tokenClient = api.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (response) => {
          if (response.error || !response.access_token) {
            resolve(null);
            return;
          }
          accessToken = response.access_token;
          tokenAblauf = Date.now() + (response.expires_in ?? 3600) * 1000 - 60_000;
          localStorage.setItem(CONNECTED_KEY, 'true');
          resolve(accessToken);
        },
        error_callback: () => reject(new Error('Anmeldung abgebrochen')),
      });
    }
    tokenClient.requestAccessToken({ prompt: stillschweigend ? '' : 'consent' });
  });
}

async function api(pfad: string, init: RequestInit = {}): Promise<Response> {
  const token = await holeToken(true);
  if (!token) throw new Error('Nicht angemeldet');
  const response = await fetch(pfad, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) {
    accessToken = null;
    throw new Error('Anmeldung abgelaufen');
  }
  if (!response.ok) throw new Error(`Drive antwortete mit ${response.status}`);
  return response;
}

async function findeDatei(): Promise<string | null> {
  const gemerkt = localStorage.getItem(FILE_ID_KEY);
  if (gemerkt) return gemerkt;
  const response = await api(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name)&q=name='${DATEI}'`,
  );
  const json = (await response.json()) as { files?: { id: string }[] };
  const id = json.files?.[0]?.id ?? null;
  if (id) localStorage.setItem(FILE_ID_KEY, id);
  return id;
}

export async function verbinden(): Promise<boolean> {
  const token = await holeToken(false);
  return token !== null;
}

export function trennen(): void {
  const token = accessToken;
  accessToken = null;
  tokenAblauf = 0;
  localStorage.removeItem(CONNECTED_KEY);
  localStorage.removeItem(FILE_ID_KEY);
  if (token) window.google?.accounts?.oauth2?.revoke(token);
}

export async function herunterladen(): Promise<DrivePayload | null> {
  const id = await findeDatei();
  if (!id) return null;
  const response = await api(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`);
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
    await api(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: koerper,
    });
    return payload.gespeichertAm;
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
export function hochladenWennVerbunden(data: AppData): void {
  if (!istKonfiguriert() || !warVerbunden()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void hochladen(data).catch(() => {
      // Offline oder Token abgelaufen: der lokale Stand bleibt führend,
      // der nächste Versuch läuft bei der nächsten Änderung.
    });
  }, 2000);
}
