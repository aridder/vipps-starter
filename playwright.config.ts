import { defineConfig, devices } from "@playwright/test";

// E2E config. Locally: `npm run build && npm run test:e2e` (Playwright starts
// `next start` for you). In CI a Postgres service + migrations run first.
// Set BASE_URL to test an already-running server and skip the built-in one.
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // One worker: the app shares a single seeded DB and a shared test user.
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL,
    screenshot: "on",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run start",
        url: baseURL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
});
