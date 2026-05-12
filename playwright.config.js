// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/specs',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,   // testes de chat dependem de ordem/estado compartilhado
  retries: 1,
  reporter: [
    ['html', { outputFolder: 'tests/report', open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:9876',
    headless: false,            // mostra o browser — útil para acompanhar os testes
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    locale: 'pt-BR',
  },
  webServer: {
    command: 'npx http-server src -p 9876 -c-1 --cors -s',
    url: 'http://localhost:9876',
    reuseExistingServer: true,
    timeout: 15_000,
  },
  projects: [
    {
      name: 'Chat UI – Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
