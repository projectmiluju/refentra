import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { APP_TEXT } from './constants/uiText';
import { fetchHealthStatus } from './lib/health';
import {
  clearLoginRedirect,
  getLoginRedirectSearch,
  resolveLoginRedirect,
  writeLoginRedirect,
} from './lib/loginRedirect';
import SetupGuide from './pages/SetupGuide';
import {
  fetchCurrentUser,
  getSessionExpiredEventName,
  getSessionExpiredMessage,
  logout,
} from './lib/auth';

type AppBootStatus = 'checking' | 'ready' | 'unavailable';
type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';
type LoginLocationState = {
  redirectTo?: string;
};

const persistDashboardRedirectIfNeeded = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const currentLocation = `${window.location.pathname}${window.location.search}`;
  if (currentLocation.startsWith('/dashboard')) {
    writeLoginRedirect(currentLocation);
  }
};

const RequireAuth: React.FC<{ authenticated: boolean; children: React.ReactElement }> = ({
  authenticated,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated) {
      return;
    }

    const redirectTo = `${location.pathname}${location.search}`;
    writeLoginRedirect(redirectTo);
    navigate({
      pathname: '/login',
      search: getLoginRedirectSearch(redirectTo),
    }, {
      replace: false,
      state: { redirectTo } satisfies LoginLocationState,
    });
  }, [authenticated, location.pathname, location.search, navigate]);

  if (!authenticated) {
    return null;
  }

  return children;
};

const LoginRoute: React.FC<{
  authenticated: boolean;
  sessionMessage: string;
  fallbackRedirectTo?: string;
  onLoginSuccess: () => void;
}> = ({ authenticated, sessionMessage, fallbackRedirectTo, onLoginSuccess }) => {
  const location = useLocation();
  const redirectTo = (() => {
    const state = location.state as LoginLocationState | null;
    if (state?.redirectTo) {
      return state.redirectTo;
    }

    const resolvedRedirect = resolveLoginRedirect(location.search);
    if (resolvedRedirect !== '/dashboard' || !fallbackRedirectTo) {
      return resolvedRedirect;
    }

    return fallbackRedirectTo;
  })();

  if (authenticated) {
    clearLoginRedirect();
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

const BootingScreen: React.FC = () => (
  <div className="min-h-screen bg-background text-sys-text flex items-center justify-center p-4">
    <p className="text-body-ko text-slate-300">{APP_TEXT.booting}</p>
  </div>
);

const AuthCheckingScreen: React.FC = () => (
  <div className="min-h-screen bg-background text-sys-text flex items-center justify-center p-4">
    <p className="text-body-ko text-slate-300">{APP_TEXT.authChecking}</p>
  </div>
);

const AppShell: React.FC = () => {
  const initialLocationRef = useRef(
    typeof window === 'undefined'
      ? ''
      : `${window.location.pathname}${window.location.search}`,
  );
  const initialDashboardRedirect = initialLocationRef.current.startsWith('/dashboard')
    ? initialLocationRef.current
    : undefined;
  const [bootStatus, setBootStatus] = useState<AppBootStatus>('checking');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [setupMessage, setSetupMessage] = useState('');
  const [setupSteps, setSetupSteps] = useState<string[]>([]);
  const [sessionMessage, setSessionMessage] = useState('');

  useEffect(() => {
    if (initialLocationRef.current.startsWith('/dashboard')) {
      writeLoginRedirect(initialLocationRef.current);
    }
  }, []);

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
          if (!authResult.user) {
            persistDashboardRedirectIfNeeded();
          }
          setAuthStatus(authResult.user ? 'authenticated' : 'unauthenticated');
        } catch {
          if (!active) {
            return;
          }

          persistDashboardRedirectIfNeeded();
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
      persistDashboardRedirectIfNeeded();
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

  const renderLoginElement = (): React.ReactElement => {
    if (bootStatus === 'checking') {
      return <BootingScreen />;
    }

    if (bootStatus === 'unavailable') {
      return <SetupGuide message={setupMessage} setupSteps={setupSteps} />;
    }

    if (authStatus === 'checking') {
      return <AuthCheckingScreen />;
    }

    return (
      <LoginRoute
        authenticated={authStatus === 'authenticated'}
        sessionMessage={sessionMessage}
        fallbackRedirectTo={initialDashboardRedirect}
        onLoginSuccess={() => {
          setSessionMessage('');
          setAuthStatus('authenticated');
        }}
      />
    );
  };

  const renderDashboardElement = (): React.ReactElement => {
    if (bootStatus === 'checking') {
      return <BootingScreen />;
    }

    if (bootStatus === 'unavailable') {
      return <SetupGuide message={setupMessage} setupSteps={setupSteps} />;
    }

    if (authStatus === 'checking') {
      return <AuthCheckingScreen />;
    }

    return (
      <RequireAuth authenticated={authStatus === 'authenticated'}>
        <Dashboard
          onLoggedOut={async () => {
            await logout();
            setSessionMessage('');
            setAuthStatus('unauthenticated');
          }}
        />
      </RequireAuth>
    );
  };

  const renderRootElement = (): React.ReactElement => {
    if (bootStatus === 'checking') {
      return <BootingScreen />;
    }

    if (bootStatus === 'unavailable') {
      return <SetupGuide message={setupMessage} setupSteps={setupSteps} />;
    }

    if (authStatus === 'checking') {
      return <AuthCheckingScreen />;
    }

    return <Navigate to={authStatus === 'authenticated' ? '/dashboard' : '/login'} replace />;
  };

  return (
    <Routes>
      <Route path="/login" element={renderLoginElement()} />
      <Route path="/dashboard" element={renderDashboardElement()} />
      <Route path="/" element={renderRootElement()} />
    </Routes>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>
);

export default App;
