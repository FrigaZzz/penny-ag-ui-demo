import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 300000,
  expect: { timeout: 90000 },
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5174",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "uv run uvicorn server.main:app --host 127.0.0.1 --port 8001",
      url: "http://127.0.0.1:8001/api/health",
      env: { PENNY_DB: "/tmp/penny-playwright.sqlite" },
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -- --port 5174",
      url: "http://127.0.0.1:5174",
      env: { PENNY_API_URL: "http://127.0.0.1:8001" },
      reuseExistingServer: false,
    },
  ],
});
