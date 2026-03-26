import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { isAuthenticated } from './lib/auth';

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App: React.FC = () => {
  const authenticated = isAuthenticated();

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
