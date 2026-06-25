import { defineConfig } from "@playwright/test"

const providedBaseURL = process.env.PLAYWRIGHT_BASE_URL
const baseURL = providedBaseURL ?? "http://127.0.0.1:3200"

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: providedBaseURL
    ? undefined
    : {
        command: "pnpm exec next dev --hostname 127.0.0.1 --port 3200",
        env: {
          ...process.env,
          NEXT_PUBLIC_APP_URL:
            process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3200",
          NEXT_PUBLIC_MARKETING_URL:
            process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://learnify.academy",
          NEXT_PUBLIC_SUPABASE_URL:
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
          NEXT_PUBLIC_SUPABASE_ANON_KEY:
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "local-e2e-anon-key",
          SUPABASE_SERVICE_ROLE_KEY:
            process.env.SUPABASE_SERVICE_ROLE_KEY ?? "local-e2e-service-role-key",
          LEARNIFY_LUMI_MODE: process.env.LEARNIFY_LUMI_MODE ?? "rule",
        },
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
