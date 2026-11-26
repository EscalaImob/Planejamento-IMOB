import { createHash } from "node:crypto";

/** Tempo mínimo entre abrir o modal e enviar (abaixo disso, tratamos como robô). */
export const TEMPO_MINIMO_MS = 2000;
/** Limite por IP: no máximo 5 envios a cada 10 minutos. */
export const LIMITE_ENVIOS = 5;
export const JANELA_MS = 10 * 60 * 1000;

/** IP do visitante a partir dos cabeçalhos do proxy (Cloudflare primeiro; Vercel e similares depois). */
export function ipDaRequisicao(req: Request): string {
  const cloudflare = req.headers.get("cf-connecting-ip")?.trim();
  if (cloudflare) return cloudflare;
  const encaminhado = req.headers.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "desconhecido";
}

/** Hash do IP com segredo: permite limitar envios sem guardar o IP. */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Limite em memória (por instância do servidor). É uma primeira barreira; o script do Google aplica
 * o mesmo limite de forma centralizada (CacheService), o que vale também em ambiente serverless.
 */
export class LimitadorMemoria {
  private registros = new Map<string, number[]>();
  constructor(
    private limite = LIMITE_ENVIOS,
    private janela = JANELA_MS,
  ) {}

  permitir(chave: string, agora = Date.now()): boolean {
    const recentes = (this.registros.get(chave) ?? []).filter((t) => agora - t < this.janela);
    if (recentes.length >= this.limite) {
      this.registros.set(chave, recentes);
      return false;
    }
    recentes.push(agora);
    this.registros.set(chave, recentes);
    if (this.registros.size > 5000) this.registros.clear();
    return true;
  }
}

/** Robô: preencheu o campo invisível ou enviou rápido demais. */
export function pareceRobo(site: string, tempoMs: number): boolean {
  return site.trim() !== "" || tempoMs < TEMPO_MINIMO_MS;
}
