import { linhaSegura, type LinhaPlanilha } from "@/server/leads/planilha";

/**
 * Destino de gravação dos leads. Hoje: Google Sheets (via Google Apps Script).
 * Futuro: outra implementação (ex.: Pipedrive, banco de dados) sem mudar a rota nem o modal.
 */
export type ResultadoDestino =
  | { status: "gravado"; id: string; duplicado: boolean }
  | { status: "limite" }
  | { status: "falha"; motivo: string };

export interface DestinoLead {
  registrar(linha: LinhaPlanilha): Promise<ResultadoDestino>;
}

export class GoogleSheetsDestino implements DestinoLead {
  constructor(
    private url: string,
    private token: string,
    private tempoLimiteMs = 15_000,
    private fetcher: typeof fetch = fetch,
  ) {}

  async registrar(linha: LinhaPlanilha): Promise<ResultadoDestino> {
    let resposta: Response;
    try {
      resposta = await this.fetcher(this.url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        // text/plain evita preflight e é o formato que o Apps Script lê em e.postData.contents
        body: JSON.stringify({ token: this.token, lead: linhaSegura(linha) }),
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(this.tempoLimiteMs),
      });
    } catch (e) {
      return { status: "falha", motivo: e instanceof Error && e.name === "TimeoutError" ? "tempo_esgotado" : "rede" };
    }
    if (!resposta.ok) return { status: "falha", motivo: `http_${resposta.status}` };
    let corpo: { ok?: unknown; id?: unknown; duplicado?: unknown; erro?: unknown };
    try {
      corpo = await resposta.json();
    } catch {
      return { status: "falha", motivo: "resposta_invalida" };
    }
    if (corpo.ok === true && typeof corpo.id === "string" && corpo.id) {
      return { status: "gravado", id: corpo.id, duplicado: corpo.duplicado === true };
    }
    if (corpo.erro === "limite") return { status: "limite" };
    return { status: "falha", motivo: typeof corpo.erro === "string" ? corpo.erro.slice(0, 40) : "desconhecido" };
  }
}
