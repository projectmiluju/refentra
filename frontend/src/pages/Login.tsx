import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { LOGIN_TEXT } from '../constants/uiText';
import { persistAuthSession } from '../lib/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const emailInputId = 'login-email';
  const passwordInputId = 'login-password';

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

    persistAuthSession();
    setErrorMessage('');
    navigate('/dashboard');
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
              onChange={(event) => setEmail(event.target.value)}
              isError={errorMessage === LOGIN_TEXT.invalidEmail}
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
              onChange={(event) => setPassword(event.target.value)}
              isError={errorMessage === LOGIN_TEXT.emptyPassword}
              required
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-error text-body-ko" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <Button type="submit" size="lg" fullWidth className="mt-4">
            {LOGIN_TEXT.submit}
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
