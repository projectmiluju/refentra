import { expect, type Page } from '@playwright/test';

const LOGIN_EMAIL = process.env.E2E_LOGIN_EMAIL ?? 'dev@refentra.com';
const LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? 'password123';
const LOGIN_NAME = process.env.E2E_LOGIN_NAME ?? 'Kim Dev';

const uniqueSuffix = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createUniqueUser = () => {
  const suffix = uniqueSuffix();

  return {
    name: `E2E User ${suffix}`,
    email: `e2e-${suffix}@refentra.com`,
    password: 'password123',
  };
};

export const createUniqueReference = () => {
  const suffix = uniqueSuffix();

  return {
    title: `E2E reference ${suffix}`,
    url: `https://example.com/e2e-${suffix}`,
    description: `Browser E2E description ${suffix}`,
  };
};

interface CreateReferenceInput {
  title: string;
  url: string;
  description: string;
  tags?: string[];
}

const ensureDefaultUserExists = async (page: Page): Promise<void> => {
  const signupResponse = await page.request.post('/api/v1/auth/signup', {
    data: {
      name: LOGIN_NAME,
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
    },
  });

  if (signupResponse.ok() || signupResponse.status() === 409) {
    return;
  }

  throw new Error(`Failed to prepare the default E2E user: ${signupResponse.status()}`);
};

export const loginFromPage = async (page: Page): Promise<void> => {
  await ensureDefaultUserExists(page);
  await page.goto('/login');
  await page.getByLabel('Email address').fill(LOGIN_EMAIL);
  await page.getByLabel('Password').fill(LOGIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);
};

export const signupFromPage = async (
  page: Page,
  user = createUniqueUser(),
): Promise<typeof user> => {
  await page.goto('/signup');
  await page.getByLabel('Name').fill(user.name);
  await page.getByLabel('Email address').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);
  return user;
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
  await ensureDefaultUserExists(page);
  const response = await page.request.post('/api/v1/auth/login', {
    data: {
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
    },
  });

  expect(response.ok()).toBeTruthy();
};

export const createReferenceWithApi = async (
  page: Page,
  input: CreateReferenceInput,
): Promise<void> => {
  const response = await page.request.post('/api/v1/references', {
    data: {
      title: input.title,
      url: input.url,
      description: input.description,
      tags: input.tags ?? [],
    },
  });

  expect(response.ok()).toBeTruthy();
};
