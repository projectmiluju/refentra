import { expect, type Page } from '@playwright/test';

const LOGIN_EMAIL = process.env.E2E_LOGIN_EMAIL ?? 'dev@refentra.com';
const LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? 'password123';

const uniqueSuffix = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createUniqueReference = () => {
  const suffix = uniqueSuffix();

  return {
    title: `E2E reference ${suffix}`,
    url: `https://example.com/e2e-${suffix}`,
    description: `Browser E2E description ${suffix}`,
  };
};

export const loginFromPage = async (page: Page): Promise<void> => {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(LOGIN_EMAIL);
  await page.getByLabel('Password').fill(LOGIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);
};

export const logoutFromPage = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/$/);
};

export const loginFromCurrentPage = async (page: Page): Promise<void> => {
  await page.getByLabel('Email address').fill(LOGIN_EMAIL);
  await page.getByLabel('Password').fill(LOGIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
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
