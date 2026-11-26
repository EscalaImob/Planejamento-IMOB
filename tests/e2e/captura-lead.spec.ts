import { expect, test, type Page } from "@playwright/test";

/**
 * Captura de lead ao exportar. O servidor de teste tem a captura ligada e grava num Apps Script falso
 * (tests/e2e/apps-script-falso.mjs), consultado em /linhas para conferir o que foi "para a planilha".
 */
const FALSO = "http://127.0.0.1:3999";

const PLANO = {
  etapa: 4,
  perfil: "corretor",
  comissao: 120000,
  percentual: 6,
  modoTicket: "ticket",
  ticket: 400000,
  imoveis: null,
  canais: ["trafego", "social", "indicacao", "parcerias"],
  vendasPorCanal: { trafego: 2, indicacao: 1 },
  meta: 300000,
  planoGerado: true,
  // O modal de exportação vale para quem abriu o plano por link compartilhado (sem passar pelo cadastro).
  viaLink: true,
};

async function abrirPlano(page: Page, query = "") {
  await page.addInitScript(() => {
    // Conta chamadas de impressão e registra os eventos de produto, sem abrir o diálogo do sistema.
    (window as unknown as { __prints: number }).__prints = 0;
    window.print = () => {
      (window as unknown as { __prints: number }).__prints++;
    };
    (window as unknown as { __eventos: string[] }).__eventos = [];
    window.addEventListener("escala:evento", (e) =>
      (window as unknown as { __eventos: string[] }).__eventos.push((e as CustomEvent).detail.evento),
    );
  });
  await page.goto(`/${query}`);
  await page.evaluate((respostas) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("escala-imob:planejamento-2027", JSON.stringify({ versao: 1, salvoEm: new Date().toISOString(), respostas }));
  }, PLANO);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: /Para receber R\$ 300 mil/ })).toBeVisible();
}

const prints = (page: Page) => page.evaluate(() => (window as unknown as { __prints: number }).__prints);
const eventos = (page: Page) => page.evaluate(() => (window as unknown as { __eventos: string[] }).__eventos);
const linhasPlanilha = async (page: Page) => (await page.request.get(`${FALSO}/linhas`)).json();
const dialogo = (page: Page) => page.getByRole("dialog");

async function preencher(page: Page, { marketing = false } = {}) {
  const d = dialogo(page);
  await d.getByLabel("Nome completo").fill("Maria Souza");
  await d.getByLabel("WhatsApp", { exact: true }).pressSequentially("11987654321");
  await d.getByLabel("E-mail", { exact: true }).fill("Maria@Exemplo.com");
  if (marketing) await d.getByRole("checkbox", { name: /Quero receber/ }).check();
  await page.waitForTimeout(2100); // tempo mínimo do antispam
}

test.beforeEach(async ({ page }) => {
  await page.request.post(`${FALSO}/limpar`);
});

test("sem cadastro: planejamento e resultados continuam acessíveis; o modal só aparece ao exportar", async ({ page }) => {
  await abrirPlano(page);
  await expect(dialogo(page)).toBeHidden();
  await expect(page.getByText("7 canais para passar de 5 para 13 vendas")).toBeVisible();
});

test("Baixar PDF: valida, grava na planilha, confirma e só então imprime; segunda vez não pede de novo", async ({ page }) => {
  await abrirPlano(page, "?utm_source=instagram&utm_campaign=lancamento&referral_id=parceiro-7");
  const botao = page.getByRole("button", { name: "Baixar PDF" }).first();
  await botao.click();
  const d = dialogo(page);
  await expect(d).toBeVisible();
  await expect(d.getByLabel("Nome completo")).toBeFocused();
  expect(await prints(page)).toBe(0);

  // validação: mensagens individuais e foco no primeiro campo inválido
  await d.getByRole("button", { name: "Salvar meu planejamento" }).click();
  await expect(d.getByText("Informe seu nome completo (nome e sobrenome).")).toBeVisible();
  await expect(d.getByText(/Informe um WhatsApp válido/)).toBeVisible();
  await expect(d.getByText(/Informe um e-mail válido/)).toBeVisible();
  await expect(d.getByRole("checkbox", { name: /Política de Privacidade/ })).toHaveCount(0);
  await expect(d.getByLabel("Nome completo")).toBeFocused();

  // máscara
  await d.getByLabel("WhatsApp", { exact: true }).pressSequentially("11987654321");
  await expect(d.getByLabel("WhatsApp", { exact: true })).toHaveValue("(11) 98765-4321");
  await d.getByLabel("WhatsApp", { exact: true }).fill("");

  await preencher(page, { marketing: true });
  await d.getByRole("button", { name: "Salvar meu planejamento" }).click();
  await expect(d.getByRole("heading", { name: "Planejamento salvo!" })).toBeVisible();
  await expect.poll(() => prints(page)).toBe(1);
  await expect(d).toBeHidden();

  const linhas = await linhasPlanilha(page);
  expect(linhas).toHaveLength(1);
  expect(linhas[0]).toMatchObject({
    full_name: "Maria Souza",
    email: "maria@exemplo.com",
    whatsapp: "'+5511987654321", // escape de fórmula aplicado antes de ir para a planilha
    professional_profile: "corretor",
    current_vgv: 2000000,
    target_vgv: 5000000,
    average_ticket: 400000,
    sales_target: 12.5,
    commission_target: 300000,
    planning_year: 2027,
    utm_source: "instagram",
    utm_campaign: "lancamento",
    referral_id: "parceiro-7",
    marketing_consent: true,
    source_action: "pdf",
  });
  expect(linhas[0].marketing_consent_at).toBeTruthy();

  const ev = await eventos(page);
  expect(ev).toEqual(["lead_form_opened", "lead_submitted", "planning_exported"]);

  // mesma sessão: exporta direto, sem modal e sem nova linha
  await page.getByRole("button", { name: "Baixar PDF" }).last().click();
  await expect.poll(() => prints(page)).toBe(2);
  await expect(dialogo(page)).toBeHidden();
  expect(await linhasPlanilha(page)).toHaveLength(1);
});

test("Copiar link: grava e mostra o link do planejamento na confirmação", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await abrirPlano(page);
  await page.getByRole("button", { name: "Copiar link" }).first().click();
  await preencher(page);
  await dialogo(page).getByRole("button", { name: "Salvar meu planejamento" }).click();
  await expect(page.getByRole("heading", { name: "Planejamento salvo!" })).toBeVisible();
  await expect(page.getByLabel("Link do seu planejamento")).toHaveValue(/#plano=/);
  const linhas = await linhasPlanilha(page);
  expect(linhas).toHaveLength(1);
  expect(linhas[0]).toMatchObject({ source_action: "link", marketing_consent: false, marketing_consent_at: null });
  await page.getByRole("button", { name: "Voltar ao planejamento" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Para receber/ })).toBeVisible();
});

test("falha na gravação: mantém os dados, não libera a exportação e permite tentar de novo", async ({ page }) => {
  await abrirPlano(page);
  await page.route("**/api/leads", (r) => r.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, erro: "indisponivel" }) }));
  await page.getByRole("button", { name: "Baixar PDF" }).first().click();
  await preencher(page);
  const d = dialogo(page);
  await d.getByRole("button", { name: "Salvar meu planejamento" }).click();
  await expect(d.getByRole("alert")).toContainText("Não foi possível salvar agora");
  await expect(d.getByLabel("Nome completo")).toHaveValue("Maria Souza");
  await expect(d.getByLabel("WhatsApp", { exact: true })).toHaveValue("(11) 98765-4321");
  expect(await prints(page)).toBe(0);
  expect(await eventos(page)).toEqual(["lead_form_opened", "lead_submission_failed"]);

  // sem conexão
  await page.unroute("**/api/leads");
  await page.route("**/api/leads", (r) => r.abort("internetdisconnected"));
  await d.getByRole("button", { name: "Salvar meu planejamento" }).click();
  await expect(d.getByRole("alert")).toContainText("Sem conexão");
  expect(await prints(page)).toBe(0);

  // volta a funcionar
  await page.unroute("**/api/leads");
  await d.getByRole("button", { name: "Salvar meu planejamento" }).click();
  await expect(d.getByRole("heading", { name: "Planejamento salvo!" })).toBeVisible();
  await expect.poll(() => prints(page)).toBe(1);
  expect(await linhasPlanilha(page)).toHaveLength(1);
});

test("duplo clique envia uma única vez", async ({ page }) => {
  await abrirPlano(page);
  let posts = 0;
  await page.route("**/api/leads", async (r) => {
    posts++;
    await new Promise((ok) => setTimeout(ok, 600));
    await r.continue();
  });
  await page.getByRole("button", { name: "Baixar PDF" }).first().click();
  await preencher(page);
  const salvar = dialogo(page).getByRole("button", { name: "Salvar meu planejamento" });
  await salvar.dblclick();
  await expect(dialogo(page).getByRole("heading", { name: "Planejamento salvo!" })).toBeVisible();
  expect(posts).toBe(1);
  expect(await linhasPlanilha(page)).toHaveLength(1);
});

test("fechar o modal (Esc, botão e fundo) não apaga o planejamento nem o que foi digitado; foco volta ao botão", async ({ page }) => {
  await abrirPlano(page);
  const botao = page.getByRole("button", { name: "Baixar PDF" }).first();
  await botao.click();
  await dialogo(page).getByLabel("Nome completo").fill("Maria Souza");
  await page.keyboard.press("Escape");
  await expect(dialogo(page)).toBeHidden();
  await expect(botao).toBeFocused();
  await expect(page.getByRole("heading", { level: 1, name: /Para receber R\$ 300 mil/ })).toBeVisible();

  await botao.click();
  await expect(dialogo(page).getByLabel("Nome completo")).toHaveValue("Maria Souza");
  await dialogo(page).getByRole("button", { name: "Fechar" }).click();
  await expect(dialogo(page)).toBeHidden();

  await botao.click();
  await page.mouse.click(5, 5); // fundo
  await expect(dialogo(page)).toBeHidden();
  expect(await prints(page)).toBe(0);
  expect(await page.evaluate(() => !!localStorage.getItem("escala-imob:planejamento-2027"))).toBe(true);
});

test("teclado: foco fica preso no modal", async ({ page }) => {
  await abrirPlano(page);
  await page.getByRole("button", { name: "Baixar PDF" }).first().click();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const dentro = await page.evaluate(() => !!document.activeElement?.closest("dialog") || document.activeElement === document.body);
    expect(dentro).toBe(true);
  }
});

test("mobile 390 px: modal como painel inferior, sem rolagem horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirPlano(page);
  await page.getByRole("button", { name: "Baixar PDF" }).first().click();
  const d = dialogo(page);
  await expect(d).toBeVisible();
  const caixa = await d.boundingBox();
  expect(caixa!.width).toBeGreaterThanOrEqual(388);
  expect(Math.round(caixa!.y + caixa!.height)).toBeGreaterThanOrEqual(843);
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw);
  await page.waitForTimeout(400);
  await page.screenshot({ path: "referencias/implementacao/mobile-390/6-modal-lead.png" });
});

test("desktop 1440 px: captura do modal", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await abrirPlano(page);
  await page.getByRole("button", { name: "Baixar PDF" }).first().click();
  await expect(dialogo(page)).toBeVisible();
  await dialogo(page).getByRole("button", { name: "Salvar meu planejamento" }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "referencias/implementacao/desktop-1440/6-modal-lead-validacao.png" });
});

/* ───────── Etapa de cadastro obrigatória antes do plano ───────── */

async function abrirMeta(page: Page, query = "") {
  await page.addInitScript(() => {
    (window as unknown as { __prints: number }).__prints = 0;
    window.print = () => {
      (window as unknown as { __prints: number }).__prints++;
    };
    (window as unknown as { __eventos: string[] }).__eventos = [];
    window.addEventListener("escala:evento", (e) =>
      (window as unknown as { __eventos: string[] }).__eventos.push((e as CustomEvent).detail.evento),
    );
  });
  await page.goto(`/${query}`);
  await page.evaluate((respostas) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("escala-imob:planejamento-2027", JSON.stringify({ versao: 1, salvoEm: new Date().toISOString(), respostas }));
  }, { ...PLANO, etapa: 3, planoGerado: false, viaLink: false, cadastrado: false });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Meta de 2027" })).toBeVisible();
}

async function preencherCadastro(page: Page) {
  await page.getByLabel("Nome completo").fill("Maria Souza");
  await page.getByLabel("WhatsApp", { exact: true }).pressSequentially("11987654321");
  await page.getByLabel("E-mail", { exact: true }).fill("maria@exemplo.com");
  await page.waitForTimeout(2100);
}

test("cadastro obrigatório: grava na planilha e só então abre o plano; exportar não pede de novo", async ({ page }) => {
  await abrirMeta(page, "?utm_source=google&utm_medium=cpc");
  await page.getByRole("banner").getByRole("button", { name: /Gerar meu plano/ }).click();
  await expect(page.getByRole("heading", { name: "Para quem é o plano?" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Para receber/ })).toHaveCount(0);

  // validação individual
  await page.getByRole("button", { name: "Gerar meu Plano 2027" }).click();
  await expect(page.getByText("Informe seu nome completo (nome e sobrenome).")).toBeVisible();
  await expect(page.getByLabel("Nome completo")).toBeFocused();
  expect(await linhasPlanilha(page)).toHaveLength(0);

  await preencherCadastro(page);
  await page.getByRole("button", { name: "Gerar meu Plano 2027" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Para receber R\$ 300 mil/ })).toBeVisible({ timeout: 10_000 });

  const linhas = await linhasPlanilha(page);
  expect(linhas).toHaveLength(1);
  expect(linhas[0]).toMatchObject({
    full_name: "Maria Souza",
    email: "maria@exemplo.com",
    source_action: "cadastro",
    utm_source: "google",
    utm_medium: "cpc",
    current_vgv: 2000000,
    commission_target: 300000,
    marketing_consent: false,
  });
  expect(await eventos(page)).toEqual(expect.arrayContaining(["lead_form_opened", "lead_submitted"]));

  // exportar depois do cadastro: direto, sem modal e sem nova linha
  await page.getByRole("button", { name: "Baixar PDF" }).first().click();
  await expect.poll(() => prints(page)).toBe(1);
  await expect(dialogo(page)).toHaveCount(0);
  expect(await linhasPlanilha(page)).toHaveLength(1);

  // recarregar mantém o plano liberado
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: /Para receber/ })).toBeVisible();
});

test("cadastro com falha na gravação: o plano não abre e os dados ficam no formulário", async ({ page }) => {
  await abrirMeta(page);
  await page.route("**/api/leads", (r) => r.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, erro: "indisponivel" }) }));
  await page.getByRole("banner").getByRole("button", { name: /Gerar meu plano/ }).click();
  await preencherCadastro(page);
  await page.getByRole("button", { name: "Gerar meu Plano 2027" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Não foi possível salvar agora");
  await expect(page.getByLabel("Nome completo")).toHaveValue("Maria Souza");
  await expect(page.getByRole("heading", { level: 1, name: /Para receber/ })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Para quem é o plano?" })).toBeVisible();
});
