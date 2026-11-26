import { expect, test, type Page } from "@playwright/test";

const proximo = (page: Page) => page.getByRole("banner").getByRole("button", { name: /Próximo/ });

/** Coleta erros de página e de console durante cada teste. */
function vigiarErros(page: Page) {
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") erros.push(`console: ${m.text()}`);
  });
  return erros;
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole("heading", { name: "Seu perfil" })).toBeVisible();
});

test("fluxo completo: validação, voltar, avançar e conclusão", async ({ page }) => {
  const erros = vigiarErros(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Etapa 1 — validação na ordem
  await proximo(page).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("perfil");
  await page.getByRole("button", { name: "Corretor autônomo" }).click();
  await expect(page.getByRole("button", { name: "Corretor autônomo" })).toHaveAttribute("aria-pressed", "true");
  await proximo(page).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("comissão");

  await page.getByRole("textbox", { name: "Comissão recebida em 2026" }).fill("120000");
  await expect(page.getByRole("textbox", { name: "Comissão recebida em 2026" })).toHaveValue("120.000");

  // percentual: padrão 5, botões andam 0,5
  const pct = page.getByRole("textbox", { name: "Percentual de comissão" });
  await expect(pct).toHaveValue("5");
  await page.getByRole("button", { name: "Aumentar Percentual de comissão" }).click();
  await page.getByRole("button", { name: "Aumentar Percentual de comissão" }).click();
  await expect(pct).toHaveValue("6");
  await pct.fill("25");
  await proximo(page).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("percentual");
  await pct.fill("6");

  await proximo(page).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("ticket");

  // ticket ↔ imóveis
  await page.getByRole("textbox", { name: "Imóveis vendidos em 2026" }).fill("8");
  await expect(page.getByRole("textbox", { name: "Ticket médio" })).toHaveValue("250.000");
  await page.getByRole("textbox", { name: "Ticket médio" }).fill("400000");
  await expect(page.getByRole("textbox", { name: "Imóveis vendidos em 2026" })).toHaveValue("5");
  const painel = page.getByRole("complementary", { name: "Resultado" });
  await expect(painel).toContainText("R$ 2 mi");

  await proximo(page).click();

  // Etapa 2 — canais
  await expect(page.getByRole("heading", { name: "De onde vieram as suas 5 vendas" })).toBeVisible();
  await expect(proximo(page)).toBeDisabled();
  await page.getByRole("switch", { name: "Tráfego pago" }).click();
  await expect(page.getByRole("textbox", { name: "Imóveis vendidos por Tráfego pago" })).toBeFocused();
  await page.keyboard.type("9");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("passou dos 5");
  await expect(proximo(page)).toBeDisabled();
  await page.getByRole("textbox", { name: "Imóveis vendidos por Tráfego pago" }).fill("2");
  await page.getByRole("switch", { name: "Social Selling" }).click();
  await page.getByRole("switch", { name: "Indicação" }).click();
  await page.getByRole("textbox", { name: "Imóveis vendidos por Indicação" }).fill("1");
  await page.getByRole("switch", { name: "Imobiliária" }).click();
  await expect(painel).toContainText("44");
  await expect(painel).toContainText("R$ 610 mil");
  await expect(proximo(page)).toBeEnabled();
  await proximo(page).click();

  // Etapa 3 — meta; voltar preserva respostas
  await expect(page.getByRole("heading", { name: "Meta de 2027" })).toBeVisible();
  const gerar = page.getByRole("banner").getByRole("button", { name: /Gerar meu plano/ });
  await expect(gerar).toBeDisabled();
  await page.getByRole("banner").getByRole("button", { name: "Canais" }).first().click();
  await expect(page.getByRole("switch", { name: "Tráfego pago" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("textbox", { name: "Imóveis vendidos por Tráfego pago" })).toHaveValue("2");
  await proximo(page).click();
  await page.getByRole("textbox", { name: "Comissão desejada em 2027" }).fill("300000");
  await expect(painel).toContainText("R$ 5 mi");
  await expect(painel).toContainText("+150%");
  await gerar.click();

  // Etapa 4 — cadastro obrigatório antes do plano (captura ligada no servidor de teste)
  await expect(page.getByRole("heading", { name: "Para quem é o plano?" })).toBeVisible();
  await page.getByLabel("Nome completo").fill("Maria Souza");
  await page.getByLabel("WhatsApp", { exact: true }).pressSequentially("11987654321");
  await page.getByLabel("E-mail", { exact: true }).fill("maria@exemplo.com");
  await page.getByRole("checkbox", { name: /Política de Privacidade/ }).check();
  await page.waitForTimeout(2100); // tempo mínimo do antispam
  await page.getByRole("button", { name: "Gerar meu Plano 2027" }).click();

  // Transição e plano
  await expect(page.getByRole("status")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Para receber R\$ 300 mil/ })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("7 canais para passar de 5 para 13 vendas")).toBeVisible();
  await expect(page.getByText("R$ 286 mil", { exact: true })).toBeVisible();

  // CTA do Diagnóstico: link externo quando NEXT_PUBLIC_DIAGNOSTICO_URL está configurada; senão, desabilitado com aviso
  const ctaLink = page.getByRole("link", { name: /Fazer o Diagnóstico/ });
  if (await ctaLink.count()) {
    await expect(ctaLink).toHaveAttribute("href", /^https:\/\//);
    await expect(ctaLink).toHaveAttribute("target", "_blank");
    await expect(ctaLink).toHaveAttribute("rel", /noopener/);
  } else {
    await expect(page.getByRole("button", { name: /Fazer o Diagnóstico/ })).toBeDisabled();
    await expect(page.getByText(/Link do Diagnóstico ainda não configurado/)).toBeVisible();
  }

  // Ajustar e voltar ao plano pela trilha
  await page.getByRole("button", { name: "Ajustar os números" }).click();
  await expect(page.getByRole("textbox", { name: "Comissão recebida em 2026" })).toHaveValue("120.000");
  await page.getByRole("button", { name: "Ir para Seu plano" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Para receber/ })).toBeVisible();

  // Persistência após recarregar
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: /Para receber R\$ 300 mil/ })).toBeVisible();

  // Âncoras internas resolvem
  const hrefs = await page.locator('nav[aria-label="Seções do plano"] a').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  for (const h of hrefs) expect(await page.locator(h!).count(), `âncora ${h}`).toBe(1);

  expect(erros, erros.join("\n")).toEqual([]);
});

test("recomeçar apaga o rascunho local", async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem(
      "escala-imob:planejamento-2027",
      JSON.stringify({
        versao: 1,
        salvoEm: new Date().toISOString(),
        respostas: {
          etapa: 4, perfil: "corretor", comissao: 120000, percentual: 6, modoTicket: "ticket", ticket: 400000, imoveis: null,
          canais: ["trafego"], vendasPorCanal: {}, meta: 300000, planoGerado: true, cadastrado: true,
        },
      }),
    );
  });
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: /Para receber/ })).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Recomeçar" }).click();
  await expect(page.getByRole("heading", { name: "Seu perfil" })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("escala-imob:planejamento-2027")!).respostas.comissao)).toBeNull();
});

test("rascunho inválido ou de outra versão é descartado", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("escala-imob:planejamento-2027", JSON.stringify({ versao: 99, respostas: { etapa: 4 } })));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Seu perfil" })).toBeVisible();
});

test("teclado: navegação por Tab e ativação por Espaço", async ({ page }) => {
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Ir para o conteúdo" })).toBeFocused();
  // avança até o primeiro botão de perfil
  for (let i = 0; i < 15; i++) {
    if (await page.getByRole("button", { name: "Corretor autônomo" }).evaluate((el) => el === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(page.getByRole("button", { name: "Corretor autônomo" })).toBeFocused();
  const contorno = await page.getByRole("button", { name: "Corretor autônomo" }).evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(contorno).toBe("solid");
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Corretor autônomo" })).toHaveAttribute("aria-pressed", "true");
});
