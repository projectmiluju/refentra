import { defineConfig, devices } from '@playwright/test';

const ROOT_DIR = '..';
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8080';
const REFENTRA_HTML_REPORT = process.env.REFENTRA_PLAYWRIGHT_HTML_REPORT === 'true';
const REFENTRA_TRACE_ON_FAILURE =
  process.env.REFENTRA_PLAYWRIGHT_TRACE_MODE === 'retain-on-failure';
const MANAGED_SERVER = process.env.REFENTRA_PLAYWRIGHT_MANAGED_SERVER === 'true';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: 1,
  reporter: REFENTRA_HTML_REPORT
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : 'list',
  use: {
    baseURL: BASE_URL,
    trace: REFENTRA_TRACE_ON_FAILURE ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: MANAGED_SERVER
    ? undefined
    : {
        command: 'go run .',
        url: BASE_URL,
        reuseExistingServer: false,
        cwd: ROOT_DIR,
        timeout: 120_000,
      },
});
