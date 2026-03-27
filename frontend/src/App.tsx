import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { APP_TEXT } from './constants/uiText';
import { fetchHealthStatus } from './lib/health';
import SetupGuide from './pages/SetupGuide';
import {
  fetchCurrentUser,
  getSessionExpiredEventName,
  getSessionExpiredMessage,
  logout,
} from './lib/auth';

type AppBootStatus = 'checking' | 'ready' | 'unavailable';
type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

const DEFAULT_DASHBOARD_ROUTE = '/dashboard';
const LOGIN_REDIRECT_PARAM = 'redirect';

const resolveRedirectTarget = (search: string): string => {
  const redirectTo = new URLSearchParams(search).get(LOGIN_REDIRECT_PARAM);
  return redirectTo?.startsWith(DEFAULT_DASHBOARD_ROUTE) ? redirectTo : DEFAULT_DASHBOARD_ROUTE;
};

const RequireAuth: React.FC<{ authenticated: boolean; children: React.ReactElement }> = ({
  authenticated,
  children,
}) => {
  const location = useLocation();

  if (!authenticated) {
    const redirectSearch = new URLSearchParams({
      [LOGIN_REDIRECT_PARAM]: `${location.pathname}${location.search}`,
    }).toString();

    return (
      <Navigate
        to={{
          pathname: '/login',
          search: `?${redirectSearch}`,
        }}
        replace
      />
    );
  }

  return children;
};

const LoginRoute: React.FC<{
  authenticated: boolean;
  sessionMessage: string;
  onLoginSuccess: () => void;
}> = ({ authenticated, sessionMessage, onLoginSuccess }) => {
  const location = useLocation();
  const redirectTo = resolveRedirectTarget(location.search);

  if (authenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <Login
      sessionMessage={sessionMessage}
      redirectTo={redirectTo}
      onLoginSuccess={onLoginSuccess}
    />
  );
};

const App: React.FC = () => {
  const [bootStatus, setBootStatus] = useState<AppBootStatus>('checking');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [setupMessage, setSetupMessage] = useState('');
  const [setupSteps, setSetupSteps] = useState<string[]>([]);
  const [sessionMessage, setSessionMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadHealthStatus = async () => {
      const healthStatus = await fetchHealthStatus();
      if (!active) {
        return;
      }

      if (healthStatus.status === 'ready') {
        setBootStatus('ready');
        try {
          const authResult = await fetchCurrentUser();
          if (!active) {
            return;
          }

          setSessionMessage(authResult.message);
          setAuthStatus(authResult.user ? 'authenticated' : 'unauthenticated');
        } catch {
          if (!active) {
            return;
          }

          setAuthStatus('unauthenticated');
        }
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

  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const nextMessage = event instanceof CustomEvent
        ? event.detail
        : getSessionExpiredMessage();
      setSessionMessage(nextMessage);
      setAuthStatus('unauthenticated');
    };

    window.addEventListener(getSessionExpiredEventName(), handleSessionExpired);
    return () => {
      window.removeEventListener(getSessionExpiredEventName(), handleSessionExpired);
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

  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-background text-sys-text flex items-center justify-center p-4">
        <p className="text-body-ko text-slate-300">{APP_TEXT.authChecking}</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={(
            <LoginRoute
              authenticated={authStatus === 'authenticated'}
              sessionMessage={sessionMessage}
              onLoginSuccess={() => {
                setSessionMessage('');
                setAuthStatus('authenticated');
              }}
            />
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <RequireAuth authenticated={authStatus === 'authenticated'}>
              <Dashboard
                onLoggedOut={async () => {
                  await logout();
                  setSessionMessage('');
                  setAuthStatus('unauthenticated');
                }}
              />
            </RequireAuth>
          )}
        />
        <Route
          path="/"
          element={<Navigate to={authStatus === 'authenticated' ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
