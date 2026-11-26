import "server-only";

/**
 * Configuração da captura de leads (somente servidor).
 * A funcionalidade fica DESLIGADA enquanto qualquer variável obrigatória estiver ausente.
 * Desligada, o site funciona como antes (sem etapa de cadastro e exportação direta, sem modal).
 */
export type ConfigLeads = {
  webhookUrl: string;
  token: string;
  ipSalt: string;
  origensPermitidas: string[];
  /** Envios por IP a cada 10 min (padrão 5). */
  limiteEnvios: number;
};

function urlHttps(valor: string | undefined): string | null {
  if (!valor) return null;
  try {
    const u = new URL(valor.trim());
    return u.protocol === "https:" || (u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname)) ? u.toString() : null;
  } catch {
    return null;
  }
}

export function lerConfigLeads(env: NodeJS.ProcessEnv = process.env): ConfigLeads | null {
  const webhookUrl = urlHttps(env.LEADS_SHEETS_WEBHOOK_URL);
  const token = env.LEADS_SHEETS_TOKEN?.trim();
  const ipSalt = env.LEADS_IP_SALT?.trim();
  if (!webhookUrl || !token || token.length < 24 || !ipSalt || ipSalt.length < 16) return null;
  const origensPermitidas = (env.LEADS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const limite = Number(env.LEADS_RATE_LIMIT);
  const limiteEnvios = Number.isInteger(limite) && limite > 0 ? limite : 5;
  return { webhookUrl, token, ipSalt, origensPermitidas, limiteEnvios };
}

/** O que o cliente pode saber: só se a captura está ativa. Nunca expõe segredos. */
export function capturaPublica(): { ativa: boolean } {
  return { ativa: !!lerConfigLeads() };
}
