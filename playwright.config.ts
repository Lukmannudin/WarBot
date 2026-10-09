import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  timeout: 60_000,

  expect: {
    timeout: 5_000,
  },

  fullyParallel: false,

  forbidOnly: Boolean(process.env.CI),

  retries: 0,

  workers: 1,

  reporter: "list",

  use: {
    baseURL: "http://127.0.0.1:3000",

    headless: true,

    viewport: {
      width: 1440,
      height: 900,
    },

    actionTimeout: 10_000,

    navigationTimeout: 15_000,

    screenshot: "only-on-failure",

    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",

      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
      },
    },
  ],

  webServer: {
    command: "npm run bot:simulator",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});