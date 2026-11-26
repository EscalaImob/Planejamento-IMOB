import { afterEach, describe, expect, it, vi } from "vitest";
import { respostasIniciais } from "@/lib/estado";
import { lerConfigLeads, type ConfigLeads } from "@/server/leads/config";
import { LimitadorMemoria, hashIp } from "@/server/leads/antiabuso";
import { GoogleSheetsDestino, type DestinoLead, type ResultadoDestino } from "@/server/leads/destinos";
import { celulaSegura, COLUNAS_PLANILHA, linhaSegura, type LinhaPlanilha } from "@/server/leads/planilha";
import { tratarEnvioLead } from "@/server/leads/tratar";

const CONFIG: ConfigLeads = {
  webhookUrl: "https://script.google.com/macros/s/teste/exec",
  token: "t".repeat(32),
  ipSalt: "s".repeat(20),
  versaoPolitica: "2026-12-01",
  urlPolitica: "https://escalaimob.com.br/privacidade",
  origensPermitidas: [],
  limiteEnvios: 5,
};

const DADOS_PESSOAIS = ["Maria Souza", "maria@exemplo.com", "98765-4321", "+5511987654321", "2000000", "300000"];

function corpoValido(extra: Record<string, unknown> = {}) {
  return {
    nome: "Maria Souza",
    whatsapp: "(11) 98765-4321",
    email: "Maria@Exemplo.com",
    privacidade: true,
    marketing: false,
    submission_key: "6f1c1d7e-2c9a-4c1e-9d43-0a1f2b3c4d5e",
    acao: "pdf",
    tempo_ms: 8000,
    site: "",
    origem: { utm_source: "instagram", referral_id: "parceiro-7" },
    respostas: {
      ...respostasIniciais(),
      perfil: "corretor",
      comissao: 120000,
      percentual: 6,
      ticket: 400000,
      canais: ["trafego"],
      meta: 300000,
      etapa: 4,
      planoGerado: true,
    },
    ...extra,
  };
}

function requisicao(corpo: unknown, cabecalhos: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000", host: "localhost:3000", "x-forwarded-for": "203.0.113.9", ...cabecalhos },
    body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

class DestinoFalso implements DestinoLead {
  linhas: LinhaPlanilha[] = [];
  constructor(private resultado?: ResultadoDestino) {}
  async registrar(linha: LinhaPlanilha): Promise<ResultadoDestino> {
    if (this.resultado) return this.resultado;
    const existente = this.linhas.find((l) => l.submission_key === linha.submission_key);
    if (existente) return { status: "gravado", id: String(existente.id), duplicado: true };
    this.linhas.push(linha);
    return { status: "gravado", id: String(linha.id), duplicado: false };
  }
}

function montar(opcoes: { destino?: DestinoLead; config?: ConfigLeads | null; limitador?: LimitadorMemoria } = {}) {
  const logs: string[] = [];
  const destino = opcoes.destino ?? new DestinoFalso();
  const deps = {
    config: opcoes.config === undefined ? CONFIG : opcoes.config,
    destino,
    limitador: opcoes.limitador ?? new LimitadorMemoria(5),
    agora: () => new Date("2026-11-26T12:00:00.000Z"),
    gerarId: () => "id-fixo",
    log: (m: string) => logs.push(m),
  };
  return { deps, logs, destino };
}

afterEach(() => vi.restoreAllMocks());

describe("POST /api/leads", () => {
  it("grava a linha completa e normalizada (201)", async () => {
    const { deps, destino } = montar();
    const res = await tratarEnvioLead(requisicao(corpoValido()), deps);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, id: "id-fixo" });
    const linha = (destino as DestinoFalso).linhas[0];
    expect(linha).toMatchObject({
      id: "id-fixo",
      full_name: "Maria Souza",
      email: "maria@exemplo.com",
      whatsapp: "+5511987654321",
      professional_profile: "corretor",
      current_vgv: 2000000,
      target_vgv: 5000000,
      average_ticket: 400000,
      sales_target: 12.5,
      commission_target: 300000,
      planning_year: 2027,
      utm_source: "instagram",
      referral_id: "parceiro-7",
      marketing_consent: false,
      marketing_consent_at: null,
      privacy_policy_version: "2026-12-01",
      privacy_acknowledged_at: "2026-11-26T12:00:00.000Z",
      source_action: "pdf",
      crm_sync_status: "pending",
    });
    expect(linha.ip_hash).toBe(hashIp("203.0.113.9", CONFIG.ipSalt));
    expect(Object.keys(linha).sort()).toEqual([...COLUNAS_PLANILHA].sort());
  });

  it("registra a data do consentimento de marketing só quando marcado", async () => {
    const { deps, destino } = montar();
    await tratarEnvioLead(requisicao(corpoValido({ marketing: true })), deps);
    expect((destino as DestinoFalso).linhas[0].marketing_consent_at).toBe("2026-11-26T12:00:00.000Z");
  });

  it("recalcula os indicadores no servidor (ignora números prontos do cliente)", async () => {
    const { deps, destino } = montar();
    await tratarEnvioLead(requisicao(corpoValido({ current_vgv: 999999999 })), deps);
    expect((destino as DestinoFalso).linhas[0].current_vgv).toBe(2000000);
  });

  it("retentativa com a mesma chave não duplica (200, mesmo id)", async () => {
    const { deps, destino } = montar();
    const a = await tratarEnvioLead(requisicao(corpoValido()), deps);
    const b = await tratarEnvioLead(requisicao(corpoValido()), { ...deps, gerarId: () => "outro-id" });
    expect(a.status).toBe(201);
    expect(b.status).toBe(200);
    expect(await b.json()).toEqual({ ok: true, id: "id-fixo" });
    expect((destino as DestinoFalso).linhas).toHaveLength(1);
  });

  it("mesmo e-mail com outra chave gera nova linha (não sobrescreve)", async () => {
    const { deps, destino } = montar();
    await tratarEnvioLead(requisicao(corpoValido()), deps);
    await tratarEnvioLead(requisicao(corpoValido({ submission_key: "7f1c1d7e-2c9a-4c1e-9d43-0a1f2b3c4d5e" })), { ...deps, gerarId: () => "id-2" });
    expect((destino as DestinoFalso).linhas.map((l) => l.id)).toEqual(["id-fixo", "id-2"]);
  });

  it("valida no servidor e devolve erros por campo (400)", async () => {
    const { deps, destino } = montar();
    const res = await tratarEnvioLead(requisicao(corpoValido({ nome: "M", whatsapp: "123", email: "x", privacidade: false })), deps);
    expect(res.status).toBe(400);
    const corpo = await res.json();
    expect(Object.keys(corpo.campos).sort()).toEqual(["email", "nome", "privacidade", "whatsapp"]);
    expect((destino as DestinoFalso).linhas).toHaveLength(0);
  });

  it("honeypot e envio rápido demais: finge sucesso e não grava", async () => {
    const { deps, destino } = montar();
    const a = await tratarEnvioLead(requisicao(corpoValido({ site: "http://spam" })), deps);
    const b = await tratarEnvioLead(requisicao(corpoValido({ tempo_ms: 300 })), deps);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect((destino as DestinoFalso).linhas).toHaveLength(0);
  });

  it("limita envios por IP (429)", async () => {
    const { deps } = montar({ limitador: new LimitadorMemoria(2) });
    const chaves = ["1", "2", "3"].map((n) => `${n}f1c1d7e-2c9a-4c1e-9d43-0a1f2b3c4d5e`);
    const r1 = await tratarEnvioLead(requisicao(corpoValido({ submission_key: chaves[0] })), deps);
    const r2 = await tratarEnvioLead(requisicao(corpoValido({ submission_key: chaves[1] })), deps);
    const r3 = await tratarEnvioLead(requisicao(corpoValido({ submission_key: chaves[2] })), deps);
    expect([r1.status, r2.status, r3.status]).toEqual([201, 201, 429]);
  });

  it("falha do Google: 503 e nada liberado", async () => {
    const { deps } = montar({ destino: new DestinoFalso({ status: "falha", motivo: "tempo_esgotado" }) });
    const res = await tratarEnvioLead(requisicao(corpoValido()), deps);
    expect(res.status).toBe(503);
    expect((await res.json()).ok).toBe(false);
  });

  it("limite aplicado pela planilha: 429", async () => {
    const { deps } = montar({ destino: new DestinoFalso({ status: "limite" }) });
    expect((await tratarEnvioLead(requisicao(corpoValido()), deps)).status).toBe(429);
  });

  it("recusa origem diferente, formato, tamanho e captura desligada", async () => {
    const { deps } = montar();
    expect((await tratarEnvioLead(requisicao(corpoValido(), { origin: "https://malicioso.com" }), deps)).status).toBe(403);
    expect((await tratarEnvioLead(requisicao(corpoValido(), { origin: "" }), deps)).status).toBe(403);
    expect((await tratarEnvioLead(requisicao(corpoValido(), { "content-type": "text/plain" }), deps)).status).toBe(415);
    expect((await tratarEnvioLead(requisicao("x".repeat(9000)), deps)).status).toBe(413);
    expect((await tratarEnvioLead(requisicao("{json quebrado"), deps)).status).toBe(400);
    expect((await tratarEnvioLead(requisicao(corpoValido()), { ...deps, config: null, destino: null })).status).toBe(503);
  });

  it("aceita origem explicitamente permitida", async () => {
    const { deps } = montar({ config: { ...CONFIG, origensPermitidas: ["https://planejamento.escalaimob.com.br"] } });
    const res = await tratarEnvioLead(requisicao(corpoValido(), { origin: "https://planejamento.escalaimob.com.br" }), deps);
    expect(res.status).toBe(201);
  });

  it("nenhum log ou resposta contém dados pessoais ou financeiros", async () => {
    const { deps, logs } = montar();
    const respostas = [
      await tratarEnvioLead(requisicao(corpoValido()), deps),
      await tratarEnvioLead(requisicao(corpoValido({ nome: "X" })), deps),
      await tratarEnvioLead(requisicao(corpoValido()), { ...deps, destino: new DestinoFalso({ status: "falha", motivo: "rede" }) }),
    ];
    const textos = [...logs, ...(await Promise.all(respostas.map((r) => r.text())))].join("\n");
    for (const d of DADOS_PESSOAIS) expect(textos).not.toContain(d);
  });
});

describe("destino Google Sheets (Apps Script)", () => {
  const linha = { ...Object.fromEntries(COLUNAS_PLANILHA.map((c) => [c, null])), id: "abc", submission_key: "k", full_name: "=HYPERLINK(\"x\")" } as LinhaPlanilha;

  it("envia token e linha com fórmulas neutralizadas; aceita ok do script", async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const corpo = JSON.parse(String(init?.body));
      expect(corpo.token).toBe("t".repeat(32));
      expect(corpo.lead.full_name).toBe("'=HYPERLINK(\"x\")");
      return new Response(JSON.stringify({ ok: true, id: "abc", duplicado: false }));
    });
    const d = new GoogleSheetsDestino("https://script.google.com/x/exec", "t".repeat(32), 1000, fetcher as unknown as typeof fetch);
    expect(await d.registrar(linha)).toEqual({ status: "gravado", id: "abc", duplicado: false });
  });

  it("traduz erros do script, HTTP, JSON inválido e rede", async () => {
    const com = (r: Response | Error) =>
      new GoogleSheetsDestino("https://x", "t".repeat(32), 1000, (async () => {
        if (r instanceof Error) throw r;
        return r;
      }) as unknown as typeof fetch);
    expect(await com(new Response(JSON.stringify({ ok: false, erro: "limite" }))).registrar(linha)).toEqual({ status: "limite" });
    expect(await com(new Response(JSON.stringify({ ok: false, erro: "cabecalho" }))).registrar(linha)).toEqual({ status: "falha", motivo: "cabecalho" });
    expect(await com(new Response("x", { status: 500 })).registrar(linha)).toEqual({ status: "falha", motivo: "http_500" });
    expect(await com(new Response("<html>")).registrar(linha)).toEqual({ status: "falha", motivo: "resposta_invalida" });
    expect(await com(new TypeError("fetch failed")).registrar(linha)).toEqual({ status: "falha", motivo: "rede" });
  });
});

describe("planilha", () => {
  it("neutraliza injeção de fórmula só em texto", () => {
    expect(celulaSegura("=1+1")).toBe("'=1+1");
    expect(celulaSegura("+5511987654321")).toBe("'+5511987654321");
    expect(celulaSegura("-x")).toBe("'-x");
    expect(celulaSegura("@x")).toBe("'@x");
    expect(celulaSegura("Maria")).toBe("Maria");
    expect(celulaSegura(-5)).toBe(-5);
    expect(celulaSegura(null)).toBeNull();
    expect(Object.keys(linhaSegura({} as LinhaPlanilha))).toEqual([...COLUNAS_PLANILHA]);
  });
});

describe("configuração", () => {
  const base = {
    LEADS_SHEETS_WEBHOOK_URL: "https://script.google.com/macros/s/abc/exec",
    LEADS_SHEETS_TOKEN: "t".repeat(32),
    LEADS_IP_SALT: "s".repeat(20),
    PRIVACY_POLICY_VERSION: "2026-12-01",
    NEXT_PUBLIC_PRIVACY_POLICY_URL: "https://escalaimob.com.br/privacidade",
  } as unknown as NodeJS.ProcessEnv;

  it("ativa só com todas as variáveis válidas", () => {
    expect(lerConfigLeads(base)).not.toBeNull();
    for (const k of Object.keys(base)) expect(lerConfigLeads({ ...base, [k]: "" })).toBeNull();
    expect(lerConfigLeads({ ...base, LEADS_SHEETS_TOKEN: "curto" })).toBeNull();
    expect(lerConfigLeads({ ...base, LEADS_SHEETS_WEBHOOK_URL: "http://script.google.com/x" })).toBeNull();
  });

  it("limite configurável com padrão 5", () => {
    expect(lerConfigLeads(base)?.limiteEnvios).toBe(5);
    expect(lerConfigLeads({ ...base, LEADS_RATE_LIMIT: "50" })?.limiteEnvios).toBe(50);
  });
});
