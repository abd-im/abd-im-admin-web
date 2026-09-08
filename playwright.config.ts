import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://127.0.0.1:3103", trace: "retain-on-failure" },
  webServer: {
    command: "pnpm dev --port 3103 --strictPort",
    url: "http://127.0.0.1:3103",
    reuseExistingServer: !process.env.CI,
  },
});
