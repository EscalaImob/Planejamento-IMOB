import { randomUUID } from "node:crypto";
import { esquemaEnvioLead, indicadoresDoPlano, normalizarEmail, normalizarTelefone, type CampoLead } from "@/lib/lead";
import type { ConfigLeads } from "@/server/leads/config";
import { hashIp, ipDaRequisicao, LimitadorMemoria, pareceRobo } from "@/server/leads/antiabuso";
import type { DestinoLead } from "@/server/leads/destinos";
import type { LinhaPlanilha } from "@/server/leads/planilha";

/**
 * Tratamento do POST /api/leads, separado da rota para ser testável.
 * Regras de privacidade: nenhuma resposta ecoa dados enviados e nenhum log contém dados pessoais
 * ou valores financeiros — só o resultado e o id.
 */
export const TAMANHO_MAXIMO = 8 * 1024;

type Dependencias = {
  config: ConfigLeads | null;
  destino: DestinoLead | null;
  limitador: LimitadorMemoria;
  agora?: () => Date;
  gerarId?: () => string;
  log?: (mensagem: string) => void;
};

const json = (status: number, corpo: Record<string, unknown>) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

function origemPermitida(req: Request, config: ConfigLeads): boolean {
  const origem = req.headers.get("origin");
  if (!origem) return false;
  let host: string;
  try {
    host = new URL(origem).host;
  } catch {
    return false;
  }
  if (host === req.headers.get("host")) return true;
  return config.origensPermitidas.some((o) => o === origem.replace(/\/$/, ""));
}

export async function tratarEnvioLead(req: Request, deps: Dependencias): Promise<Response> {
  const log = deps.log ?? ((m: string) => console.info(m));
  const agora = (deps.agora ?? (() => new Date()))();
  const { config, destino } = deps;

  if (!config || !destino) {
    log("[leads] recusado: captura nao configurada");
    return json(503, { ok: false, erro: "indisponivel" });
  }
  if (!origemPermitida(req, config)) {
    log("[leads] recusado: origem");
    return json(403, { ok: false, erro: "origem" });
  }
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    return json(415, { ok: false, erro: "formato" });
  }

  const bruto = await req.text();
  if (bruto.length > TAMANHO_MAXIMO) return json(413, { ok: false, erro: "tamanho" });

  let dados: unknown;
  try {
    dados = JSON.parse(bruto);
  } catch {
    return json(400, { ok: false, erro: "validacao" });
  }

  const validado = esquemaEnvioLead.safeParse(dados);
  if (!validado.success) {
    const campos: Partial<Record<CampoLead, string>> = {};
    for (const issue of validado.error.issues) {
      const campo = issue.path[0] as CampoLead;
      if (["nome", "whatsapp", "email", "privacidade"].includes(campo) && !campos[campo]) campos[campo] = issue.message;
    }
    log("[leads] recusado: validacao");
    return json(400, { ok: false, erro: "validacao", campos });
  }
  const envio = validado.data;

  // Robô: responde como sucesso para não ensinar o atacante, mas não grava nada.
  if (pareceRobo(envio.site, envio.tempo_ms)) {
    log("[leads] descartado: antispam");
    return json(200, { ok: true, id: (deps.gerarId ?? randomUUID)() });
  }

  const ipHash = hashIp(ipDaRequisicao(req), config.ipSalt);
  if (!deps.limitador.permitir(ipHash, agora.getTime())) {
    log("[leads] recusado: limite");
    return json(429, { ok: false, erro: "limite" });
  }

  const whatsapp = normalizarTelefone(envio.whatsapp);
  if (!whatsapp) return json(400, { ok: false, erro: "validacao", campos: { whatsapp: "invalido" } });

  const momento = agora.toISOString();
  const id = (deps.gerarId ?? randomUUID)();
  const linha: LinhaPlanilha = {
    id,
    submission_key: envio.submission_key,
    full_name: envio.nome.trim().replace(/\s+/g, " "),
    email: normalizarEmail(envio.email),
    whatsapp,
    ...indicadoresDoPlano(envio.respostas),
    utm_source: envio.origem.utm_source ?? null,
    utm_medium: envio.origem.utm_medium ?? null,
    utm_campaign: envio.origem.utm_campaign ?? null,
    utm_content: envio.origem.utm_content ?? null,
    utm_term: envio.origem.utm_term ?? null,
    referral_id: envio.origem.referral_id ?? null,
    marketing_consent: envio.marketing,
    marketing_consent_at: envio.marketing ? momento : null,
    privacy_policy_version: config.versaoPolitica,
    privacy_acknowledged_at: momento,
    source_action: envio.acao,
    ip_hash: ipHash,
    crm_sync_status: "pending",
    crm_external_id: null,
    created_at: momento,
    updated_at: momento,
  };

  const resultado = await destino.registrar(linha);
  if (resultado.status === "gravado") {
    log(`[leads] gravado id=${resultado.id}${resultado.duplicado ? " (retentativa)" : ""}`);
    return json(resultado.duplicado ? 200 : 201, { ok: true, id: resultado.id });
  }
  if (resultado.status === "limite") {
    log("[leads] recusado: limite (planilha)");
    return json(429, { ok: false, erro: "limite" });
  }
  log(`[leads] falha ao gravar: ${resultado.motivo}`);
  return json(503, { ok: false, erro: "indisponivel" });
}
