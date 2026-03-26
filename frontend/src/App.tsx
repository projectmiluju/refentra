import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { isAuthenticated } from './lib/auth';
import { APP_TEXT } from './constants/uiText';
import { fetchHealthStatus } from './lib/health';
import SetupGuide from './pages/SetupGuide';

type AppBootStatus = 'checking' | 'ready' | 'unavailable';

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App: React.FC = () => {
  const authenticated = isAuthenticated();
  const [bootStatus, setBootStatus] = useState<AppBootStatus>('checking');
  const [setupMessage, setSetupMessage] = useState('');
  const [setupSteps, setSetupSteps] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    const loadHealthStatus = async () => {
      const healthStatus = await fetchHealthStatus();
      if (!active) {
        return;
      }

      if (healthStatus.status === 'ready') {
        setBootStatus('ready');
        return;
      }

      setSetupMessage(healthStatus.message);
      setSetupSteps(healthStatus.setup_steps ?? []);
      setBootStatus('unavailable');
    };

    void loadHealthStatus();

    return () => {
      active = false;
    };
  }, []);

  if (bootStatus === 'checking') {
    return (
      <div className="min-h-screen bg-background text-sys-text flex items-center justify-center p-4">
        <p className="text-body-ko text-slate-300">{APP_TEXT.booting}</p>
      </div>
    );
  }

  if (bootStatus === 'unavailable') {
    return <SetupGuide message={setupMessage} setupSteps={setupSteps} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={(
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          )}
        />
        <Route path="/" element={<Navigate to={authenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
