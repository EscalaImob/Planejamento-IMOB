import { expect, test, type Page } from "@playwright/test";

/**
 * Regressão responsiva: cada etapa em 1440, 768 e 390 px, sem rolagem horizontal,
 * com capturas salvas em referencias/implementacao/ para comparação com a referência.
 */
const VIEWPORTS = [
  { nome: "desktop-1440", width: 1440, height: 900 },
  { nome: "tablet-768", width: 768, height: 1024 },
  { nome: "mobile-390", width: 390, height: 844 },
] as const;

const BASE = {
  perfil: "corretor",
  comissao: 120000,
  percentual: 6,
  modoTicket: "ticket",
  ticket: 400000,
  imoveis: null,
  canais: ["trafego", "social", "indicacao", "parcerias"],
  vendasPorCanal: { trafego: 2, indicacao: 1 },
  meta: 300000,
  planoGerado: false,
};

const ESTADOS = [
  { nome: "1-diagnostico-vazio", respostas: null, titulo: "Seu perfil" },
  { nome: "2-diagnostico-preenchido", respostas: { ...BASE, etapa: 1 }, titulo: "Seu perfil" },
  { nome: "3-canais", respostas: { ...BASE, etapa: 2 }, titulo: "De onde vieram as suas 5 vendas" },
  { nome: "4-meta", respostas: { ...BASE, etapa: 3 }, titulo: "Meta de 2027" },
  { nome: "5-plano", respostas: { ...BASE, etapa: 4, planoGerado: true }, titulo: null },
] as const;

async function semRolagemHorizontal(page: Page) {
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw, "largura do documento maior que a janela").toBeLessThanOrEqual(cw);
}

for (const vp of VIEWPORTS) {
  for (const estado of ESTADOS) {
    test(`${vp.nome} · ${estado.nome}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await page.evaluate((respostas) => {
        localStorage.clear();
        if (respostas)
          localStorage.setItem(
            "escala-imob:planejamento-2027",
            JSON.stringify({ versao: 1, salvoEm: new Date().toISOString(), respostas }),
          );
      }, estado.respostas);
      await page.reload();
      if (estado.titulo) await expect(page.getByRole("heading", { name: estado.titulo })).toBeVisible();
      else await expect(page.getByRole("heading", { level: 1, name: /Para receber/ })).toBeVisible();
      await page.waitForTimeout(300);
      await semRolagemHorizontal(page);
      await page.screenshot({ path: `referencias/implementacao/${vp.nome}/${estado.nome}.png`, fullPage: true });
    });
  }
}

test("PDF do plano (estilo de impressão)", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((respostas) => {
    localStorage.setItem("escala-imob:planejamento-2027", JSON.stringify({ versao: 1, salvoEm: new Date().toISOString(), respostas }));
  }, { ...BASE, etapa: 4, planoGerado: true });
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: /Para receber/ })).toBeVisible();
  await page.emulateMedia({ media: "print" });
  // Elementos de navegação e botões não aparecem na impressão.
  await expect(page.getByRole("navigation", { name: "Seções do plano" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Recomeçar" })).toBeHidden();
  // Com o link configurado, o PDF leva o endereço do Diagnóstico.
  const temLink = await page.getByRole("link", { name: /Fazer o Diagnóstico/ }).count();
  if (temLink) await expect(page.getByText("Próximo passo: Diagnóstico da Escala IMOB")).toBeVisible();
  await page.pdf({ path: "referencias/implementacao/plano-impressao.pdf", format: "A4", printBackground: true });
});
