import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Google-Login als Sperre vor dem eigenen Plan.
 *
 * ACHTUNG — bewusste Grenze: Das ist eine reine Oberflächen-Sperre. Die Daten
 * liegen unverschlüsselt im localStorage desselben Geräts und sind über die
 * Entwicklertools auch ohne Login lesbar. Das ID-Token wird hier nur dekodiert,
 * nicht kryptografisch geprüft — dafür bräuchte es einen Server. Die Sperre
 * versteckt die Option, sie schützt die Daten nicht.
 */

const UNLOCK_KEY = 'gym-tracker-plan-unlocked';
const GSI_SRC = 'https://accounts.google.com/gsi/client';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const OWNER_EMAIL = (import.meta.env.VITE_PLAN_OWNER_EMAIL ?? '').toLowerCase();

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdApi {
  initialize: (config: { client_id: string; callback: (r: GoogleCredentialResponse) => void }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdApi } };
  }
}

function decodeEmail(credential: string): string | null {
  try {
    const payload = credential.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(json) as { email?: string };
    return parsed.email ? parsed.email.toLowerCase() : null;
  } catch {
    return null;
  }
}

function loadGsi(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  const vorhanden = document.querySelector(`script[src="${GSI_SRC}"]`);
  if (vorhanden) {
    return new Promise((resolve, reject) => {
      vorhanden.addEventListener('load', () => resolve());
      vorhanden.addEventListener('error', () => reject(new Error('GSI nicht ladbar')));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('GSI nicht ladbar'));
    document.head.appendChild(script);
  });
}

export function useGoogleGate() {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(UNLOCK_KEY) === 'true');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const buttonHost = useRef<HTMLDivElement | null>(null);
  const onUnlock = useRef<(() => void) | null>(null);

  const configured = CLIENT_ID.length > 0;

  const setHost = useCallback((el: HTMLDivElement | null) => {
    buttonHost.current = el;
  }, []);

  const handleCredential = useCallback((response: GoogleCredentialResponse) => {
    const email = response.credential ? decodeEmail(response.credential) : null;
    if (!email) {
      setError('Anmeldung nicht lesbar');
      setPending(false);
      return;
    }
    if (OWNER_EMAIL && email !== OWNER_EMAIL) {
      setError(`${email} ist nicht freigeschaltet`);
      setPending(false);
      return;
    }
    localStorage.setItem(UNLOCK_KEY, 'true');
    setUnlocked(true);
    setPending(false);
    setError('');
    onUnlock.current?.();
    onUnlock.current = null;
  }, []);

  /** Öffnet den Google-Button im übergebenen Container. */
  const startSignIn = useCallback(
    async (danach?: () => void) => {
      onUnlock.current = danach ?? null;
      if (!configured) {
        setError('Kein Google-Client konfiguriert (VITE_GOOGLE_CLIENT_ID fehlt)');
        return;
      }
      setPending(true);
      setError('');
      try {
        await loadGsi();
        const api = window.google?.accounts?.id;
        if (!api) throw new Error('GSI nicht verfügbar');
        api.initialize({ client_id: CLIENT_ID, callback: handleCredential });
        if (buttonHost.current) {
          buttonHost.current.innerHTML = '';
          api.renderButton(buttonHost.current, { theme: 'filled_black', size: 'large', text: 'signin_with', width: 260 });
        }
      } catch {
        setError('Google-Anmeldung nicht erreichbar. Ist diese Adresse in der Google Cloud Console freigegeben?');
        setPending(false);
      }
    },
    [configured, handleCredential],
  );

  const lock = useCallback(() => {
    localStorage.removeItem(UNLOCK_KEY);
    setUnlocked(false);
  }, []);

  useEffect(() => () => {
    onUnlock.current = null;
  }, []);

  return { unlocked, pending, error, configured, startSignIn, setHost, lock };
}
