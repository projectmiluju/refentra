import { AUTH_STORAGE_KEY } from '../constants/uiText';

export const isAuthenticated = (): boolean => {
  return window.localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
};

export const persistAuthSession = (): void => {
  window.localStorage.setItem(AUTH_STORAGE_KEY, 'true');
};

export const clearAuthSession = (): void => {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};
