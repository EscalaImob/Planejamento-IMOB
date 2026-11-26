/** Formatação numérica pt-BR usada em toda a interface. */

export function numero(n: number, casas = 0): string {
  return Number(n).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/** Moeda compacta: "R$ 1,86 mi", "R$ 36,7 mil", "R$ 400". */
export function moeda(valor: number | null | undefined): string {
  const n = Math.round(valor || 0);
  const abs = Math.abs(n);
  if (abs >= 1e6) {
    const v = n / 1e6;
    const casas = Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2;
    return `R$ ${numero(v, casas).replace(/,0+$/, "")} mi`;
  }
  if (abs >= 1e3) {
    const v = n / 1e3;
    const casas = Math.abs(v) >= 100 ? 0 : 1;
    return `R$ ${numero(v, casas).replace(/,0$/, "")} mil`;
  }
  return `R$ ${numero(n)}`;
}

/** Moeda sem abreviação: "R$ 400". */
export function moedaCheia(valor: number | null | undefined): string {
  return `R$ ${numero(Math.round(valor || 0))}`;
}

/** Quantidade: inteiro a partir de 10; uma casa abaixo disso ("5,2"). */
export function quantidade(n: number): string {
  if (n >= 10) return numero(Math.round(n));
  return numero(n, 1).replace(/,0$/, "");
}

/** Percentual de comissão: "6%" ou "5,5%". */
export function percentual(p: number): string {
  return `${numero(p, p % 1 ? 1 : 0)}%`;
}

/** Taxa de funil (0–1): "20%", "1,5%". */
export function taxa(fracao: number): string {
  const p = fracao * 100;
  const fracionaria = p < 10 && Math.abs(p - Math.round(p)) > 1e-9;
  return `${numero(p, fracionaria ? 1 : 0)}%`;
}

/** Extrai apenas dígitos de um texto digitado. */
export function digitos(texto: string): number {
  return Number(String(texto).replace(/\D/g, "")) || 0;
}

/** Converte "5,5" ou "5.5" em número. */
export function decimal(texto: string): number {
  const n = parseFloat(String(texto).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
