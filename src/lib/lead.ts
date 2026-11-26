import { z } from "zod";
import { esquemaRespostas, type Respostas } from "@/lib/estado";
import { imoveis2027, ticketMedio, vgv2026, vgv2027 } from "@/lib/calculos";

/**
 * Captura de lead: validação compartilhada entre o modal (cliente) e a rota /api/leads (servidor).
 * Nenhuma regra aqui depende de navegador ou de servidor.
 */

/* ───────── Telefone (Brasil) ───────── */

/** DDDs em uso no Brasil (Anatel). */
const DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91,
  92, 93, 94, 95, 96, 97, 98, 99,
]);

/** Só os dígitos nacionais (DDD + número), sem o 55 do país quando colado com ele. */
export function digitosTelefone(texto: string): string {
  let d = String(texto).replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  return d.slice(0, 11);
}

/** Máscara progressiva: "(11) 98765-4321" ou "(11) 3456-7890". */
export function mascararTelefone(texto: string): string {
  const d = digitosTelefone(texto);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const corte = d.length === 11 ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

/** Valida e devolve o telefone em E.164 (+55DDNNNNNNNNN), ou null. */
export function normalizarTelefone(texto: string): string | null {
  const d = digitosTelefone(texto);
  if (d.length !== 10 && d.length !== 11) return null;
  if (!DDDS.has(Number(d.slice(0, 2)))) return null;
  const numero = d.slice(2);
  if (d.length === 11 && numero[0] !== "9") return null;
  if (d.length === 10 && !/[2-8]/.test(numero[0])) return null;
  return `+55${d}`;
}

export function normalizarEmail(texto: string): string {
  return String(texto).trim().toLowerCase();
}

/* ───────── Formulário do modal ───────── */

export const MENSAGENS = {
  nome: "Informe seu nome completo (nome e sobrenome).",
  whatsapp: "Informe um WhatsApp válido com DDD, por exemplo (11) 98765-4321.",
  email: "Informe um e-mail válido, por exemplo nome@empresa.com.br.",
} as const;

export const esquemaFormularioLead = z.object({
  nome: z
    .string()
    .trim()
    .min(2, MENSAGENS.nome)
    .max(120, MENSAGENS.nome)
    .refine((n) => n.split(/\s+/).filter((p) => p.length >= 1).length >= 2, MENSAGENS.nome),
  whatsapp: z.string().refine((t) => normalizarTelefone(t) !== null, MENSAGENS.whatsapp),
  email: z
    .string()
    .trim()
    .max(254, MENSAGENS.email)
    .pipe(z.email(MENSAGENS.email)),
  marketing: z.boolean(),
});

/** Estado do formulário (autorização de marketing opcional, começa desmarcada). */
export type FormularioLead = { nome: string; whatsapp: string; email: string; marketing: boolean };
export type CampoLead = keyof FormularioLead;

/** Erros por campo (primeira mensagem de cada um). */
export function errosDoFormulario(dados: FormularioLead): Partial<Record<CampoLead, string>> {
  const r = esquemaFormularioLead.safeParse(dados);
  if (r.success) return {};
  const erros: Partial<Record<CampoLead, string>> = {};
  for (const issue of r.error.issues) {
    const campo = issue.path[0] as CampoLead;
    if (campo && !erros[campo]) erros[campo] = issue.message;
  }
  return erros;
}

/* ───────── Origem da visita ───────── */

export const CHAVES_ORIGEM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "referral_id"] as const;
export type ChaveOrigem = (typeof CHAVES_ORIGEM)[number];
export type Origem = Partial<Record<ChaveOrigem, string>>;

const textoOrigem = z.string().max(200);
export const esquemaOrigem = z.object(Object.fromEntries(CHAVES_ORIGEM.map((k) => [k, textoOrigem.optional()])) as Record<ChaveOrigem, z.ZodOptional<typeof textoOrigem>>);

/* ───────── Envio completo (cliente → rota) ───────── */

/** De onde veio o lead: etapa de cadastro antes do plano, ou exportação (PDF / link) de um plano aberto por link. */
export const ACOES_LEAD = ["cadastro", "pdf", "link"] as const;
export type AcaoLead = (typeof ACOES_LEAD)[number];
export type AcaoExportacao = Exclude<AcaoLead, "cadastro">;

export const esquemaEnvioLead = esquemaFormularioLead.extend({
  submission_key: z.uuid(),
  acao: z.enum(ACOES_LEAD),
  /** Tempo entre a abertura do modal e o envio (antispam). */
  tempo_ms: z.number().int().min(0).max(86_400_000),
  /** Honeypot: precisa chegar vazio. */
  site: z.string().max(200),
  origem: esquemaOrigem,
  respostas: esquemaRespostas,
});

export type EnvioLead = z.input<typeof esquemaEnvioLead>;

/* ───────── Indicadores do planejamento (só campos existentes na aplicação) ───────── */

export type IndicadoresLead = {
  professional_profile: string | null;
  current_vgv: number | null;
  target_vgv: number | null;
  average_ticket: number | null;
  sales_target: number | null;
  commission_target: number | null;
  planning_year: number;
};

const valorOuNulo = (n: number, casas = 2) => (Number.isFinite(n) && n > 0 ? Math.round(n * 10 ** casas) / 10 ** casas : null);

/** Recalcula os indicadores a partir das respostas (o servidor não aceita números prontos do cliente). */
export function indicadoresDoPlano(r: Respostas): IndicadoresLead {
  return {
    professional_profile: r.perfil,
    current_vgv: valorOuNulo(vgv2026(r)),
    target_vgv: valorOuNulo(vgv2027(r)),
    average_ticket: valorOuNulo(ticketMedio(r)),
    sales_target: valorOuNulo(imoveis2027(r)),
    commission_target: valorOuNulo(r.meta ?? 0),
    planning_year: 2027,
  };
}
