import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { LOGIN_TEXT } from '../constants/uiText';
import { login } from '../lib/auth';
import { clearLoginRedirect, resolveLoginRedirect } from '../lib/loginRedirect';

interface LoginProps {
  sessionMessage: string;
  redirectTo?: string;
  onLoginSuccess: () => void;
}

interface LoginLocationState {
  redirectTo?: string;
}

const DEFAULT_REDIRECT_PATH = '/dashboard';

const resolveRedirectTarget = (redirectTo?: string): string => (
  redirectTo?.startsWith('/dashboard') ? redirectTo : DEFAULT_REDIRECT_PATH
);

const hasExplicitDashboardRedirect = (value?: string): boolean => (
  typeof value === 'string' && value.startsWith('/dashboard') && value !== DEFAULT_REDIRECT_PATH
);

const Login: React.FC<LoginProps> = ({ sessionMessage, redirectTo, onLoginSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(sessionMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailInputId = 'login-email';
  const passwordInputId = 'login-password';

  useEffect(() => {
    setErrorMessage(sessionMessage);
  }, [sessionMessage]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setErrorMessage(LOGIN_TEXT.invalidEmail);
      return;
    }

    if (password.trim().length === 0) {
      setErrorMessage(LOGIN_TEXT.emptyPassword);
      return;
    }

    try {
      setIsSubmitting(true);
      await login({
        email: trimmedEmail,
        password: password.trim(),
      });
      setErrorMessage('');
      const state = location.state as LoginLocationState | null;
      const resolvedRedirect = redirectTo && redirectTo !== DEFAULT_REDIRECT_PATH
        ? redirectTo
        : state?.redirectTo ?? resolveLoginRedirect(location.search);
      const nextRedirectTarget = resolveRedirectTarget(resolvedRedirect);
      clearLoginRedirect();

      if (
        !hasExplicitDashboardRedirect(resolvedRedirect)
        && typeof window !== 'undefined'
        && typeof window.history.state?.idx === 'number'
        && window.history.state.idx > 0
      ) {
        navigate(-1);
        onLoginSuccess();
        return;
      }

      navigate(nextRedirectTarget, { replace: true });
      onLoginSuccess();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage(LOGIN_TEXT.invalidCredentials);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-surface rounded-lg shadow-xl p-8 border border-slate-800">
        <h1 className="text-3xl font-pretendard font-bold text-center text-sys-text mb-8">
          {LOGIN_TEXT.brand}
        </h1>
        
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor={emailInputId} className="block text-sm font-medium text-text-muted text-body-ko mb-2">
              {LOGIN_TEXT.emailLabel}
            </label>
            <Input 
              id={emailInputId}
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
              isError={errorMessage === LOGIN_TEXT.invalidEmail}
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div>
            <label htmlFor={passwordInputId} className="block text-sm font-medium text-text-muted text-body-ko mb-2">
              {LOGIN_TEXT.passwordLabel}
            </label>
            <Input 
              id={passwordInputId}
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
              isError={errorMessage === LOGIN_TEXT.emptyPassword || errorMessage === LOGIN_TEXT.invalidCredentials}
              disabled={isSubmitting}
              required
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-error text-body-ko" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <Button type="submit" size="lg" fullWidth className="mt-4" isLoading={isSubmitting}>
            {isSubmitting ? LOGIN_TEXT.submitting : LOGIN_TEXT.submit}
          </Button>
        </form>

        <div className="mt-6 flex justify-center">
          <a href="#" className="inline-flex min-h-6 items-center text-sm text-text-muted text-body-ko hover:text-sys-text transition-colors">
            {LOGIN_TEXT.forgotPassword}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
