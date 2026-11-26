import "server-only";
import { lerConfigLeads } from "@/server/leads/config";
import { LimitadorMemoria } from "@/server/leads/antiabuso";
import { GoogleSheetsDestino } from "@/server/leads/destinos";
import { tratarEnvioLead } from "@/server/leads/tratar";

/** Registro de leads da exportação do plano. Grava no Google Sheets via Apps Script. */
let limitador: LimitadorMemoria | null = null;

export async function POST(req: Request) {
  const config = lerConfigLeads();
  if (config && !limitador) limitador = new LimitadorMemoria(config.limiteEnvios);
  const destino = config ? new GoogleSheetsDestino(config.webhookUrl, config.token) : null;
  return tratarEnvioLead(req, { config, destino, limitador: limitador ?? new LimitadorMemoria() });
}

const naoPermitido = () =>
  new Response(JSON.stringify({ ok: false, erro: "metodo" }), {
    status: 405,
    headers: { Allow: "POST", "Content-Type": "application/json; charset=utf-8" },
  });

export const GET = naoPermitido;
export const PUT = naoPermitido;
export const PATCH = naoPermitido;
export const DELETE = naoPermitido;
