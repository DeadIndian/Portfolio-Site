import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3111";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    launchOptions: {
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
    baseURL,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        deviceScaleFactor: 1,
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "firefox",
      testMatch: "**/release.spec.ts",
      use: {
        ...devices["Desktop Firefox"],
        launchOptions: { args: [] },
      },
    },
    {
      name: "webkit",
      testMatch: "**/release.spec.ts",
      use: {
        ...devices["Desktop Safari"],
        launchOptions: { args: [] },
      },
    },
    {
      name: "mobile-webkit",
      testMatch: "**/release.spec.ts",
      use: {
        ...devices["iPhone 13"],
        deviceScaleFactor: 1,
        launchOptions: { args: [] },
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start -- --port 3111",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
      },
});
