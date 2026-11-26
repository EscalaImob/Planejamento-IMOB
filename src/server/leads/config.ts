import "server-only";

/**
 * Configuração da captura de leads (somente servidor).
 * A funcionalidade fica DESLIGADA enquanto qualquer variável obrigatória estiver ausente — inclusive a
 * Política de Privacidade. Desligada, o site funciona como antes (exportação direta, sem modal).
 */
export type ConfigLeads = {
  webhookUrl: string;
  token: string;
  ipSalt: string;
  versaoPolitica: string;
  urlPolitica: string;
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
  const versaoPolitica = env.PRIVACY_POLICY_VERSION?.trim();
  const urlPolitica = urlHttps(env.NEXT_PUBLIC_PRIVACY_POLICY_URL);
  if (!webhookUrl || !token || token.length < 24 || !ipSalt || ipSalt.length < 16 || !versaoPolitica || !urlPolitica) return null;
  const origensPermitidas = (env.LEADS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const limite = Number(env.LEADS_RATE_LIMIT);
  const limiteEnvios = Number.isInteger(limite) && limite > 0 ? limite : 5;
  return { webhookUrl, token, ipSalt, versaoPolitica, urlPolitica, origensPermitidas, limiteEnvios };
}

/** O que o cliente pode saber: se está ativa e qual o link da política. Nunca expõe segredos. */
export function capturaPublica(): { ativa: boolean; urlPolitica: string | null } {
  const c = lerConfigLeads();
  return { ativa: !!c, urlPolitica: c?.urlPolitica ?? null };
}
