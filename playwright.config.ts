import { defineConfig } from "@playwright/test";

/**
 * Testes de ponta a ponta contra o BUILD DE PRODUÇÃO (porta 3100), com a captura de leads ligada
 * por variáveis de teste e um Apps Script falso local (porta 3999). Usam o Google Chrome instalado.
 * Nenhum dado é enviado ao Google.
 */
const TOKEN_TESTE = "token-de-teste-com-mais-de-24-caracteres";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    channel: "chrome",
    locale: "pt-BR",
    trace: "off",
  },
  webServer: [
    {
      command: "node tests/e2e/apps-script-falso.mjs",
      url: "http://127.0.0.1:3999/saude",
      reuseExistingServer: false,
      env: { FALSO_TOKEN: TOKEN_TESTE, FALSO_PORTA: "3999" },
    },
    {
      command: "npm run build && npx next start -p 3100",
      url: "http://localhost:3100",
      reuseExistingServer: false,
      timeout: 300_000,
      env: {
        LEADS_SHEETS_WEBHOOK_URL: "http://127.0.0.1:3999/",
        LEADS_SHEETS_TOKEN: TOKEN_TESTE,
        LEADS_IP_SALT: "salt-de-teste-1234567890",
        LEADS_RATE_LIMIT: "1000",
      },
    },
  ],
});
