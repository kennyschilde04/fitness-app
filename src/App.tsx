import { Route, Routes } from 'react-router-dom';
import { CalendarPage } from './pages/CalendarPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { DebugPage } from './pages/DebugPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<CalendarPage />} />
      <Route path="/day/:date" element={<CalendarPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/history/:unitId" element={<HistoryPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/debug" element={<DebugPage />} />
    </Routes>
  );
}

export default App;
