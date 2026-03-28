import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { LOGIN_TEXT } from '../constants/uiText';
import { login, signup } from '../lib/auth';
import { clearLoginRedirect, resolveLoginRedirect } from '../lib/loginRedirect';

interface LoginProps {
  mode?: 'login' | 'signup';
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

const Login: React.FC<LoginProps> = ({
  mode = 'login',
  sessionMessage,
  redirectTo,
  onLoginSuccess,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignupMode = mode === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(isSignupMode ? '' : sessionMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameInputId = 'auth-name';
  const emailInputId = 'auth-email';
  const passwordInputId = 'auth-password';

  useEffect(() => {
    setErrorMessage(isSignupMode ? '' : sessionMessage);
  }, [isSignupMode, sessionMessage]);

  const resetError = (): void => {
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSuccessRedirect = (): void => {
    const state = location.state as LoginLocationState | null;
    const resolvedRedirect = !isSignupMode && redirectTo && redirectTo !== DEFAULT_REDIRECT_PATH
      ? redirectTo
      : !isSignupMode
        ? state?.redirectTo ?? resolveLoginRedirect(location.search)
        : DEFAULT_REDIRECT_PATH;
    const nextRedirectTarget = resolveRedirectTarget(resolvedRedirect);
    clearLoginRedirect();

    if (
      !isSignupMode
      && !hasExplicitDashboardRedirect(resolvedRedirect)
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
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (isSignupMode && trimmedName.length === 0) {
      setErrorMessage(LOGIN_TEXT.emptyName);
      return;
    }

    if (!trimmedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setErrorMessage(LOGIN_TEXT.invalidEmail);
      return;
    }

    if (trimmedPassword.length === 0) {
      setErrorMessage(LOGIN_TEXT.emptyPassword);
      return;
    }

    if (isSignupMode && trimmedPassword.length < 8) {
      setErrorMessage(LOGIN_TEXT.shortPassword);
      return;
    }

    try {
      setIsSubmitting(true);

      if (isSignupMode) {
        await signup({
          name: trimmedName,
          email: trimmedEmail,
          password: trimmedPassword,
        });
      } else {
        await login({
          email: trimmedEmail,
          password: trimmedPassword,
        });
      }

      setErrorMessage('');
      handleSuccessRedirect();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage(isSignupMode ? LOGIN_TEXT.signupErrorFallback : LOGIN_TEXT.invalidCredentials);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-[440px] rounded-2xl border border-border/70 bg-surface p-8 shadow-float">
        <div className="mb-8">
          <p className="ui-label">{isSignupMode ? LOGIN_TEXT.signUpEyebrow : LOGIN_TEXT.signInEyebrow}</p>
          <h1 className="mt-3 font-pretendard text-4xl font-semibold tracking-[-0.03em] text-sys-text">
            {isSignupMode ? LOGIN_TEXT.signUpTitle : LOGIN_TEXT.signInTitle}
          </h1>
          <p className="mt-4 text-sm leading-7 text-text-muted">
            {isSignupMode ? LOGIN_TEXT.signUpDescription : LOGIN_TEXT.signInDescription}
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          {isSignupMode ? (
            <div>
              <label htmlFor={nameInputId} className="ui-label mb-3 block">
                {LOGIN_TEXT.nameLabel}
              </label>
              <Input
                id={nameInputId}
                type="text"
                placeholder={LOGIN_TEXT.namePlaceholder}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  resetError();
                }}
                isError={errorMessage === LOGIN_TEXT.emptyName}
                disabled={isSubmitting}
                required
              />
            </div>
          ) : null}

          <div>
            <label htmlFor={emailInputId} className="ui-label mb-3 block">
              {LOGIN_TEXT.emailLabel}
            </label>
            <Input
              id={emailInputId}
              type="email"
              placeholder={LOGIN_TEXT.emailPlaceholder}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                resetError();
              }}
              isError={errorMessage === LOGIN_TEXT.invalidEmail}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label htmlFor={passwordInputId} className="ui-label mb-3 block">
              {LOGIN_TEXT.passwordLabel}
            </label>
            <Input
              id={passwordInputId}
              type="password"
              placeholder={LOGIN_TEXT.passwordPlaceholder}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                resetError();
              }}
              isError={
                errorMessage === LOGIN_TEXT.emptyPassword
                || errorMessage === LOGIN_TEXT.invalidCredentials
                || errorMessage === LOGIN_TEXT.shortPassword
              }
              disabled={isSubmitting}
              required
            />
          </div>

          {errorMessage ? (
            <p className="text-body-ko text-sm text-error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <Button type="submit" size="lg" fullWidth className="mt-4" isLoading={isSubmitting}>
            {isSubmitting
              ? (isSignupMode ? LOGIN_TEXT.creatingAccount : LOGIN_TEXT.submitting)
              : (isSignupMode ? LOGIN_TEXT.createAccount : LOGIN_TEXT.submit)}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-start gap-3">
          {!isSignupMode ? (
            <a
              href="#"
              className="inline-flex min-h-6 items-center text-sm text-text-muted transition-colors hover:text-sys-text"
            >
              {LOGIN_TEXT.forgotPassword}
            </a>
          ) : null}
          <Link
            to={isSignupMode ? '/login' : '/signup'}
            className="inline-flex min-h-6 items-center text-sm text-text-muted transition-colors hover:text-sys-text"
          >
            {isSignupMode ? LOGIN_TEXT.switchToSignIn : LOGIN_TEXT.switchToSignUp}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
