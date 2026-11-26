import { CHAVES_ORIGEM, type Origem } from "@/lib/lead";

/**
 * Origem da visita (UTMs e referral_id): capturada da URL na primeira carga da sessão e mantida em
 * sessionStorage durante toda a navegação. Não entra no link compartilhável do plano.
 */
export const CHAVE_ORIGEM = "escala-imob:origem";

function sanitizar(valor: string | null): string | undefined {
  if (!valor) return undefined;
  const limpo = valor.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 200);
  return limpo || undefined;
}

/** Lê os parâmetros de uma query string. */
export function origemDaUrl(search: string): Origem {
  const q = new URLSearchParams(search);
  const origem: Origem = {};
  for (const k of CHAVES_ORIGEM) {
    const v = sanitizar(q.get(k));
    if (v) origem[k] = v;
  }
  return origem;
}

/** Primeiro toque da sessão: só grava se ainda não houver origem salva e a URL trouxer parâmetros. */
export function capturarOrigem(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(CHAVE_ORIGEM)) return;
    const origem = origemDaUrl(window.location.search);
    if (Object.keys(origem).length) window.sessionStorage.setItem(CHAVE_ORIGEM, JSON.stringify(origem));
  } catch {
    /* armazenamento indisponível */
  }
}

export function lerOrigem(): Origem {
  if (typeof window === "undefined") return {};
  try {
    const bruto = window.sessionStorage.getItem(CHAVE_ORIGEM);
    const salvo = bruto ? (JSON.parse(bruto) as Record<string, unknown>) : {};
    const origem: Origem = {};
    for (const k of CHAVES_ORIGEM) {
      const v = typeof salvo[k] === "string" ? sanitizar(salvo[k] as string) : undefined;
      if (v) origem[k] = v;
    }
    // Se a sessão começou sem parâmetros, ainda vale o que estiver na URL atual.
    return Object.keys(origem).length ? origem : origemDaUrl(window.location.search);
  } catch {
    return {};
  }
}
