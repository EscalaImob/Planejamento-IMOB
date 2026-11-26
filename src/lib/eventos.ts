/**
 * Eventos de produto, preparados para um futuro gerenciador de tags.
 * Regras: nunca enviar dados pessoais (nome, e-mail, telefone) nem valores financeiros.
 * Hoje o evento é publicado como CustomEvent("escala:evento") e, se existir, em window.dataLayer.
 */
export type NomeEvento = "lead_form_opened" | "lead_submitted" | "lead_submission_failed" | "planning_exported";

export type DadosEvento = {
  acao?: "pdf" | "link";
  motivo?: string;
  com_cadastro?: boolean;
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function registrarEvento(nome: NomeEvento, dados: DadosEvento = {}): void {
  if (typeof window === "undefined") return;
  const detalhe = { evento: nome, ...dados };
  window.dispatchEvent(new CustomEvent("escala:evento", { detail: detalhe }));
  window.dataLayer?.push({ event: nome, ...dados });
}
