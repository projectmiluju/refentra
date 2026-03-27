import { expect, type Page } from '@playwright/test';

const LOGIN_EMAIL = process.env.E2E_LOGIN_EMAIL ?? 'dev@refentra.com';
const LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? 'password123';

const uniqueSuffix = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createUniqueReference = () => {
  const suffix = uniqueSuffix();

  return {
    title: `E2E 저장 검증 ${suffix}`,
    url: `https://example.com/e2e-${suffix}`,
    description: `브라우저 E2E 테스트 설명 ${suffix}`,
  };
};

export const loginFromPage = async (page: Page): Promise<void> => {
  await page.goto('/login');
  await page.getByLabel('이메일 주소').fill(LOGIN_EMAIL);
  await page.getByLabel('비밀번호').fill(LOGIN_PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);
};

export const logoutFromPage = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: '로그아웃' }).click();
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
};

export const loginFromCurrentPage = async (page: Page): Promise<void> => {
  await page.getByLabel('이메일 주소').fill(LOGIN_EMAIL);
  await page.getByLabel('비밀번호').fill(LOGIN_PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();
};

export const loginWithApi = async (page: Page): Promise<void> => {
  const response = await page.request.post('/api/v1/auth/login', {
    data: {
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
    },
  });

  expect(response.ok()).toBeTruthy();
};
