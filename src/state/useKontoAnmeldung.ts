import { useCallback, useState } from 'react';
import { emptyData } from '../storage';
import {
  gemerktesKonto,
  herunterladen,
  istKonfiguriert,
  merkeKonto,
  merkeStand,
  verbinden,
} from './driveSync';
import type { AppData } from '../types';

/**
 * Anmelden und den Stand des gewählten Kontos übernehmen.
 *
 * Liegt hier und nicht in der Settings-Seite, weil der Hinweis im Kalender
 * denselben Weg braucht — zwei Fassungen davon würden früher oder später
 * auseinanderlaufen.
 */

export type AnmeldeErgebnis =
  | { ok: true; konto: string; sessions: number; hatteDrive: boolean }
  | { ok: false; grund: string };

export function useKontoAnmeldung(
  wechsleKonto: (email: string, stand: AppData, vorherigesKonto: string | null) => void,
) {
  const [laeuft, setLaeuft] = useState(false);

  const anmelden = useCallback(async (): Promise<AnmeldeErgebnis> => {
    if (!istKonfiguriert()) return { ok: false, grund: 'Keine Google-Client-ID hinterlegt' };

    setLaeuft(true);
    try {
      // Vor dem Verbinden merken, wessen Daten auf dem Gerät liegen — danach
      // ist der Wert bereits überschrieben.
      const vorherigesKonto = gemerktesKonto();

      const verbindung = await verbinden();
      if (!verbindung.verbunden || !verbindung.konto) {
        return { ok: false, grund: 'Anmeldung abgebrochen' };
      }
      const konto = verbindung.konto;
      merkeKonto(konto);

      const ausDrive = await herunterladen();
      const stand = ausDrive ? ausDrive.data : emptyData();

      wechsleKonto(konto, stand, vorherigesKonto);
      merkeStand(stand);

      return { ok: true, konto, sessions: stand.sessions.length, hatteDrive: Boolean(ausDrive) };
    } catch (fehler) {
      return { ok: false, grund: fehler instanceof Error ? fehler.message : 'Drive nicht erreichbar' };
    } finally {
      setLaeuft(false);
    }
  }, [wechsleKonto]);

  return { anmelden, laeuft };
}
