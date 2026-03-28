import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const createListResponse = (items: unknown[]) => ({
  items,
  page: 1,
  limit: 10,
  total_count: items.length,
  total_pages: items.length > 0 ? 1 : 0,
  available_tags: ['Go'],
});

describe('App', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    window.history.pushState({}, '', '/login');
    window.sessionStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('navigates to the dashboard after a successful sign in', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', message: 'ok' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Authentication required' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: 'AUTH_REQUIRED', error: 'Authentication required' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'user-1234', name: 'Kim Dev', email: 'dev@refentra.com' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createListResponse([]),
      });

    render(<App />);

    await user.type(await screen.findByLabelText('Email address'), 'dev@refentra.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Reference Library' })).toBeInTheDocument();
  });

  it('restores the protected dashboard query after sign in', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/dashboard?search=react&tags=Go&page=2');

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', message: 'ok' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Authentication required' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: 'AUTH_REQUIRED', error: 'Authentication required' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'user-1234', name: 'Kim Dev', email: 'dev@refentra.com' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{
            id: 'ref-2',
            title: 'React docs',
            url: 'https://example.com/react',
            description: 'Description',
            tags: ['Go'],
            uploader_id: 'user-1234',
            created_at: '2026-03-26T00:00:00Z',
          }],
          page: 2,
          limit: 10,
          total_count: 11,
          total_pages: 2,
          available_tags: ['Go'],
        }),
      });

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'A reference system built for recall.' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Go to sign in' }));
    await user.type(await screen.findByLabelText('Email address'), 'dev@refentra.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'React docs' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
    expect(window.location.search).toBe('?search=react&tags=Go&page=2');
    expect(fetchMock.mock.calls[4]?.[0]).toContain('search=react');
    expect(fetchMock.mock.calls[4]?.[0]).toContain('tags=Go');
    expect(fetchMock.mock.calls[4]?.[0]).toContain('page=2');
  });

  it('shows an inline error for an invalid email before sign in', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ready', message: 'ok' }),
    }).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Authentication required' }),
    }).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ code: 'AUTH_REQUIRED', error: 'Authentication required' }),
    });

    render(<App />);

    await user.type(await screen.findByLabelText('Email address'), 'invalid-email');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
    expect(screen.queryByRole('heading', { name: 'Reference Library' })).not.toBeInTheDocument();
  });

  it('creates an account and lands in the empty dashboard state', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/signup');

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', message: 'ok' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Authentication required' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: 'AUTH_REQUIRED', error: 'Authentication required' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'user-5678', name: 'Alex Kim', email: 'alex@refentra.com' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createListResponse([]),
      });

    render(<App />);

    await user.type(await screen.findByLabelText('Name'), 'Alex Kim');
    await user.type(screen.getByLabelText('Email address'), 'alex@refentra.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'No references yet.' })).toBeInTheDocument();
    expect(fetchMock.mock.calls[3]?.[0]).toContain('/api/v1/auth/signup');
  });

  it('validates signup fields before sending the request', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/signup');

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', message: 'ok' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Authentication required' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: 'AUTH_REQUIRED', error: 'Authentication required' }),
      });

    render(<App />);

    await user.type(await screen.findByLabelText('Name'), 'Alex Kim');
    await user.type(screen.getByLabelText('Email address'), 'invalid-email');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
    expect(fetchMock).toHaveBeenCalledTimes(3);

    await user.clear(screen.getByLabelText('Email address'));
    await user.type(screen.getByLabelText('Email address'), 'alex@refentra.com');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use at least 8 characters.');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('shows the setup guide when the database is unavailable', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        status: 'unavailable',
        message: 'The database is not ready.',
        setup_steps: ['docker compose up -d postgres'],
      }),
    });

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Database setup is required.' })).toBeInTheDocument();
    expect(screen.getByText('The database is not ready.')).toBeInTheDocument();
    expect(screen.getByText('docker compose up -d postgres')).toBeInTheDocument();
  });
});
