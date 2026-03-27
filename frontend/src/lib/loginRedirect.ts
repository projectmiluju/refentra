const DEFAULT_DASHBOARD_ROUTE = '/dashboard';
const LOGIN_REDIRECT_PARAM = 'redirect';
const LOGIN_REDIRECT_STORAGE_KEY = 'refentra:login-redirect';
const INITIAL_DASHBOARD_REDIRECT = typeof window === 'undefined'
  ? ''
  : `${window.location.pathname}${window.location.search}`;

const isDashboardRedirect = (value: string | null | undefined): value is string => (
  typeof value === 'string' && value.startsWith(DEFAULT_DASHBOARD_ROUTE)
);

const hasDashboardQuery = (value: string): boolean => value.includes('?');

const readNavigationRedirect = (): string => {
  if (typeof window === 'undefined' || typeof window.performance === 'undefined') {
    return DEFAULT_DASHBOARD_ROUTE;
  }

  const navigationEntry = window.performance.getEntriesByType('navigation')[0];
  if (!navigationEntry || typeof navigationEntry.name !== 'string' || navigationEntry.name.length === 0) {
    return DEFAULT_DASHBOARD_ROUTE;
  }

  try {
    const url = new URL(navigationEntry.name);
    const redirectTo = `${url.pathname}${url.search}`;
    return isDashboardRedirect(redirectTo) ? redirectTo : DEFAULT_DASHBOARD_ROUTE;
  } catch {
    return DEFAULT_DASHBOARD_ROUTE;
  }
};

const selectPreferredRedirect = (...values: Array<string | null | undefined>): string => {
  const validValues = values.filter(isDashboardRedirect);
  const detailedRedirect = validValues.find(hasDashboardQuery);

  if (detailedRedirect) {
    return detailedRedirect;
  }

  return validValues[0] ?? DEFAULT_DASHBOARD_ROUTE;
};

export const writeLoginRedirect = (redirectTo: string): void => {
  if (typeof window === 'undefined' || !isDashboardRedirect(redirectTo)) {
    return;
  }

  const nextRedirect = selectPreferredRedirect(
    redirectTo,
    window.sessionStorage.getItem(LOGIN_REDIRECT_STORAGE_KEY),
  );

  window.sessionStorage.setItem(LOGIN_REDIRECT_STORAGE_KEY, nextRedirect);
};

export const readLoginRedirect = (): string => {
  if (typeof window === 'undefined') {
    return DEFAULT_DASHBOARD_ROUTE;
  }

  const storedRedirect = window.sessionStorage.getItem(LOGIN_REDIRECT_STORAGE_KEY);
  if (isDashboardRedirect(storedRedirect)) {
    return storedRedirect;
  }

  return selectPreferredRedirect(
    INITIAL_DASHBOARD_REDIRECT,
    readNavigationRedirect(),
  );
};

export const clearLoginRedirect = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(LOGIN_REDIRECT_STORAGE_KEY);
};

export const resolveLoginRedirect = (search: string): string => {
  const redirectFromQuery = new URLSearchParams(search).get(LOGIN_REDIRECT_PARAM);
  return selectPreferredRedirect(redirectFromQuery, readLoginRedirect());
};

export const getLoginRedirectSearch = (redirectTo: string): string => {
  const params = new URLSearchParams({
    [LOGIN_REDIRECT_PARAM]: redirectTo,
  });

  return `?${params.toString()}`;
};
