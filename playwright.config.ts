import { defineConfig } from "@playwright/test";

/**
 * Testes de ponta a ponta. Usam o Google Chrome instalado no sistema (channel "chrome"),
 * sem baixar navegadores. O servidor de desenvolvimento é reaproveitado se já estiver no ar.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    channel: "chrome",
    locale: "pt-BR",
    trace: "off",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
