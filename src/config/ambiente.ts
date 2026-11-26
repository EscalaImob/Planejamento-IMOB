/**
 * Link do Diagnóstico da Escala IMOB.
 * Endereço oficial informado pelo responsável em 26/11/2026: https://escalaimob.com.br
 * Pode ser trocado por NEXT_PUBLIC_DIAGNOSTICO_URL (embutida no build). Se a variável for definida
 * com um valor inválido, o botão fica desabilitado, com aviso.
 */
export const DIAGNOSTICO_URL_PADRAO = "https://escalaimob.com.br";

function urlValida(valor: string | undefined): string | null {
  if (valor === undefined || valor.trim() === "") return DIAGNOSTICO_URL_PADRAO;
  try {
    const url = new URL(valor.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export const DIAGNOSTICO_URL = urlValida(process.env.NEXT_PUBLIC_DIAGNOSTICO_URL);
