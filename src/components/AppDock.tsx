import { useNavigate } from 'react-router-dom';

type DockItem = 'today' | 'insight' | 'settings';

interface AppDockProps {
  active: DockItem;
  onTodayClick?: () => void;
}

export function AppDock({ active, onTodayClick }: AppDockProps) {
  const navigate = useNavigate();

  function openToday() {
    if (onTodayClick) {
      onTodayClick();
      return;
    }
    navigate('/');
  }

  return (
    <nav className="app-dock-wrap">
      <div className="app-dock">
        <button
          onClick={openToday}
          className={`app-dock-item ${active === 'today' ? 'app-dock-item-active' : ''}`}
          aria-label="Zu heute springen"
        >
          <span className="text-lg font-black leading-none">{new Date().getDate()}</span>
          <span className="app-dock-label">Heute</span>
        </button>
        <button
          onClick={() => navigate('/history')}
          className={`app-dock-item ${active === 'insight' ? 'app-dock-item-active' : ''}`}
          aria-label="Insight öffnen"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M4 19V5" />
            <path d="M8 17v-6" />
            <path d="M13 17V8" />
            <path d="M18 17v-3" />
          </svg>
          <span className="app-dock-label">Insight</span>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={`app-dock-item ${active === 'settings' ? 'app-dock-item-active' : ''}`}
          aria-label="Einstellungen öffnen"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.36a1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.08a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.08a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9c.25.6.84 1 1.56 1H21a2 2 0 1 1 0 4h-.08a1.7 1.7 0 0 0-1.52 1Z" />
          </svg>
          <span className="app-dock-label">Settings</span>
        </button>
      </div>
    </nav>
  );
}
