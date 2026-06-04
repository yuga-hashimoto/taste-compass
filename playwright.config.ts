// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8091',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'ja-JP',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], locale: 'ja-JP' },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'], locale: 'ja-JP' },
    },
  ],
  webServer: {
    command: 'node node_modules/expo/bin/cli start --web --port 8091',
    url: 'http://localhost:8091',
    reuseExistingServer: false,
    timeout: 120 * 1000, // 起動までの最大タイムアウト
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://taste-compass-test.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'dummy-anon-key-value',
      EXPO_PUBLIC_ENABLE_ADS: 'false',
    },
  },
});
