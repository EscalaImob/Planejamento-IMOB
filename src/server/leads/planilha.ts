/**
 * Linha da aba "planning_leads" do Google Sheets.
 * A ordem abaixo é a do cabeçalho criado pelo script; o script grava pelo NOME da coluna,
 * então uma reordenação manual não desalinha os dados (colunas ausentes fazem o script recusar a gravação).
 */
export const COLUNAS_PLANILHA = [
  "id",
  "submission_key",
  "full_name",
  "email",
  "whatsapp",
  "professional_profile",
  "current_vgv",
  "target_vgv",
  "average_ticket",
  "sales_target",
  "commission_target",
  "planning_year",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "referral_id",
  "marketing_consent",
  "marketing_consent_at",
  "privacy_policy_version",
  "privacy_acknowledged_at",
  "source_action",
  "ip_hash",
  "crm_sync_status",
  "crm_external_id",
  "created_at",
  "updated_at",
] as const;

export type ColunaPlanilha = (typeof COLUNAS_PLANILHA)[number];
export type ValorCelula = string | number | boolean | null;
export type LinhaPlanilha = Record<ColunaPlanilha, ValorCelula>;

/**
 * Neutraliza injeção de fórmula: texto que começa com = + - @ (ou tabulação/retorno) é gravado
 * com apóstrofo na frente, para o Sheets tratar como texto.
 */
export function celulaSegura(valor: ValorCelula): ValorCelula {
  if (typeof valor !== "string") return valor;
  return /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
}

export function linhaSegura(linha: LinhaPlanilha): LinhaPlanilha {
  const saida = {} as LinhaPlanilha;
  for (const c of COLUNAS_PLANILHA) saida[c] = celulaSegura(linha[c] ?? null);
  return saida;
}
