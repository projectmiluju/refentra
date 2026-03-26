export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

interface ErrorResponse {
  error?: string;
  code?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

type RefreshResult =
  | { ok: true }
  | { ok: false; code?: string; message: string };

const AUTH_API_PATH = '/api/v1/auth';
const SESSION_EXPIRED_EVENT = 'refentra:session-expired';
const SESSION_EXPIRED_MESSAGE = '세션이 만료되었습니다.';

let refreshPromise: Promise<RefreshResult> | null = null;

const withCredentials = (init: RequestInit = {}): RequestInit => ({
  ...init,
  credentials: 'include',
});

const readErrorResponse = async (response: Response): Promise<ErrorResponse> => {
  try {
    return (await response.json()) as ErrorResponse;
  } catch {
    return {};
  }
};

const dispatchSessionExpired = (message: string): void => {
  window.dispatchEvent(new CustomEvent<string>(SESSION_EXPIRED_EVENT, {
    detail: message,
  }));
};

export const getSessionExpiredEventName = (): string => SESSION_EXPIRED_EVENT;

export const getSessionExpiredMessage = (): string => SESSION_EXPIRED_MESSAGE;

export const login = async (request: LoginRequest): Promise<AuthenticatedUser> => {
  const response = await fetch(`${AUTH_API_PATH}/login`, withCredentials({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  }));

  if (!response.ok) {
    const errorBody = await readErrorResponse(response);
    throw new Error(errorBody.error ?? '로그인에 실패했습니다.');
  }

  return (await response.json()) as AuthenticatedUser;
};

export const logout = async (): Promise<void> => {
  await fetch(`${AUTH_API_PATH}/logout`, withCredentials({
    method: 'POST',
  }));
};

export const refreshSession = async (): Promise<RefreshResult> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const response = await fetch(`${AUTH_API_PATH}/refresh`, withCredentials({
      method: 'POST',
    }));

    if (response.ok) {
      return { ok: true };
    }

    const errorBody = await readErrorResponse(response);
    return {
      ok: false,
      code: errorBody.code,
      message: errorBody.error ?? SESSION_EXPIRED_MESSAGE,
    };
  })();

  const result = await refreshPromise;
  refreshPromise = null;
  return result;
};

export const fetchCurrentUser = async (): Promise<{ user: AuthenticatedUser | null; message: string }> => {
  const response = await fetch(`${AUTH_API_PATH}/me`, withCredentials());
  if (response.ok) {
    return { user: (await response.json()) as AuthenticatedUser, message: '' };
  }

  if (response.status !== 401) {
    const errorBody = await readErrorResponse(response);
    throw new Error(errorBody.error ?? '로그인 상태를 확인하지 못했습니다.');
  }

  const refreshResult = await refreshSession();
  if (!refreshResult.ok) {
    if (refreshResult.code === 'SESSION_EXPIRED') {
      return { user: null, message: refreshResult.message };
    }

    return { user: null, message: '' };
  }

  const retryResponse = await fetch(`${AUTH_API_PATH}/me`, withCredentials());
  if (!retryResponse.ok) {
    return { user: null, message: '' };
  }

  return { user: (await retryResponse.json()) as AuthenticatedUser, message: '' };
};

export const fetchWithAuth = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
  const response = await fetch(input, withCredentials(init));
  if (response.status !== 401) {
    return response;
  }

  const refreshResult = await refreshSession();
  if (!refreshResult.ok) {
    if (refreshResult.code === 'SESSION_EXPIRED') {
      dispatchSessionExpired(refreshResult.message);
    }

    return response;
  }

  return fetch(input, withCredentials(init));
};
