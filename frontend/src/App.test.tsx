import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { AUTH_STORAGE_KEY } from './constants/uiText';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/login');
  });

  it('유효한 이메일과 비밀번호로 로그인하면 대시보드로 이동해야 한다', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText('이메일 주소'), 'dev@refentra.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByRole('heading', { name: '아카이브 (Archive)' })).toBeInTheDocument();
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBe('true');
  });

  it('잘못된 이메일로 로그인하면 에러 메시지를 보여주고 이동하지 않아야 한다', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText('이메일 주소'), 'invalid-email');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(screen.getByRole('alert')).toHaveTextContent('올바른 이메일 주소를 입력해 주세요.');
    expect(screen.queryByRole('heading', { name: '아카이브 (Archive)' })).not.toBeInTheDocument();
  });
});
