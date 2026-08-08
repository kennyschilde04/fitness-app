import { useCallback, useEffect, useState } from 'react';

// Temporäre Diagnose-Seite für das iOS-Höhenproblem. Erreichbar unter /#/debug.
// Wird entfernt, sobald die Ursache gefunden ist.

interface Row {
  label: string;
  value: string;
}

function heights(selector: string): string {
  const el = document.querySelector(selector);
  if (!el) return 'fehlt';
  const cs = getComputedStyle(el);
  return `h ${cs.height} min ${cs.minHeight}`;
}

function collect(): Row[] {
  const doc = document.documentElement;
  const vv = window.visualViewport;
  const cssLink = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map((l) => (l as HTMLLinkElement).href.split('/').pop())
    .join(', ');
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;height:100dvh;width:0;pointer-events:none';
  document.body.appendChild(probe);
  const dvhPx = probe.getBoundingClientRect().height;
  probe.style.height = '-webkit-fill-available';
  const fillPx = probe.getBoundingClientRect().height;
  probe.remove();

  // Sonde mit der echten Shell-Klasse: auf dieser Seite gibt es kein
  // .app-screen, die Werte wären sonst leer.
  const shell = document.createElement('div');
  shell.className = 'app-screen';
  shell.style.cssText = 'position:absolute;top:0;left:0;width:1px;visibility:hidden;pointer-events:none';
  document.body.appendChild(shell);
  const shellCs = getComputedStyle(shell);
  const shellCss = `h ${shellCs.height} min ${shellCs.minHeight}`;
  const shellRect = shell.getBoundingClientRect();
  const shellSize = `h ${shellRect.height.toFixed(0)} vs viewport ${window.innerHeight}`;
  shell.remove();

  return [
    { label: 'BUILD (css)', value: cssLink || 'inline/dev' },
    { label: 'Service Worker', value: navigator.serviceWorker?.controller ? 'aktiv (Cache!)' : 'keiner' },
    { label: 'innerHeight', value: String(window.innerHeight) },
    { label: 'visualViewport.h', value: vv ? vv.height.toFixed(0) : 'n/a' },
    { label: 'visualViewport.offsetTop', value: vv ? vv.offsetTop.toFixed(0) : 'n/a' },
    { label: 'doc.clientHeight', value: String(doc.clientHeight) },
    { label: 'doc.scrollHeight', value: String(doc.scrollHeight) },
    { label: 'scrollY', value: String(Math.round(window.scrollY)) },
    {
      label: '--app-viewport-height',
      value: getComputedStyle(doc).getPropertyValue('--app-viewport-height').trim() || 'NICHT GESETZT',
    },
    { label: '100dvh ergibt', value: `${dvhPx.toFixed(0)}px` },
    { label: 'fill-available ergibt', value: `${fillPx.toFixed(0)}px` },
    { label: 'dvh unterstützt', value: String(CSS.supports('height', '100dvh')) },
    { label: 'touch-callout match', value: String(CSS.supports('-webkit-touch-callout', 'none')) },
    { label: 'html', value: heights('html') },
    { label: 'body', value: heights('body') },
    { label: '#root', value: heights('#root') },
    { label: 'app-screen css', value: shellCss },
    { label: 'app-screen real', value: shellSize },
    { label: 'safe-top', value: getComputedStyle(doc).getPropertyValue('--app-safe-top').trim() },
    { label: 'safe-bottom', value: getComputedStyle(doc).getPropertyValue('--app-safe-bottom').trim() },
    { label: 'env safe-bottom', value: `${dvhPx - (vv?.height ?? dvhPx)}px diff dvh/visual` },
  ];
}

export function DebugPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [kopiert, setKopiert] = useState(false);

  const refresh = useCallback(() => setRows(collect()), []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    window.visualViewport?.addEventListener('resize', onChange);
    window.visualViewport?.addEventListener('scroll', onChange);
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
      window.visualViewport?.removeEventListener('resize', onChange);
      window.visualViewport?.removeEventListener('scroll', onChange);
    };
  }, [refresh]);

  async function kopieren() {
    const text = rows.map((r) => `${r.label}: ${r.value}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 1500);
    } catch {
      setKopiert(false);
    }
  }

  return (
    <div style={{ padding: '1rem', fontFamily: 'ui-monospace, monospace', fontSize: '12px', lineHeight: 1.5 }}>
      <h1 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '0.5rem' }}>Viewport-Diagnose</h1>
      <p style={{ opacity: 0.7, marginBottom: '0.75rem' }}>
        Werte aktualisieren sich live. Einmal direkt nach dem Laden ansehen, dann scrollen und erneut ansehen.
      </p>
      <button
        onClick={kopieren}
        style={{
          marginBottom: '0.75rem',
          padding: '0.6rem 1rem',
          borderRadius: '0.75rem',
          border: '1px solid currentColor',
          fontWeight: 700,
        }}
      >
        {kopiert ? 'Kopiert' : 'Alles kopieren'}
      </button>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td style={{ padding: '2px 8px 2px 0', opacity: 0.7, whiteSpace: 'nowrap' }}>{r.label}</td>
              <td style={{ padding: '2px 0', fontWeight: 700 }}>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
