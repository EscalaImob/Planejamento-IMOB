import "server-only";
import { connection } from "next/server";
import { capturaPublica } from "@/server/leads/config";

/** Informa ao navegador apenas se a captura de leads está ativa. Nenhum segredo sai do servidor. */
export async function GET() {
  await connection(); // sempre em tempo de execução: os segredos só existem no runtime
  return Response.json(capturaPublica(), { headers: { "Cache-Control": "no-store" } });
}
