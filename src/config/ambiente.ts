/**
 * Link do Diagnóstico da Escala IMOB.
 * Lido de NEXT_PUBLIC_DIAGNOSTICO_URL (embutido no build). Sem valor válido, o CTA fica desabilitado.
 * Nunca definir um endereço padrão aqui.
 */
function urlValida(valor: string | undefined): string | null {
  if (!valor) return null;
  try {
    const url = new URL(valor.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export const DIAGNOSTICO_URL = urlValida(process.env.NEXT_PUBLIC_DIAGNOSTICO_URL);
