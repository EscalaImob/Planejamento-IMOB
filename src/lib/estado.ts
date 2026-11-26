import { z } from "zod";
import { CANAL_IDS } from "@/config/canais";
import { PREMISSAS } from "@/config/premissas";

/**
 * Estado do planejamento. Fica apenas no navegador (localStorage), em formato versionado.
 * Nenhum dado é enviado a servidores.
 */

export const PERFIS = ["corretor", "imobiliaria", "incorporadora"] as const;
export type Perfil = (typeof PERFIS)[number];

export const ROTULO_PERFIL: Record<Perfil, string> = {
  corretor: "Corretor autônomo",
  imobiliaria: "Imobiliária",
  incorporadora: "Incorporador",
};

const canalId = z.enum(CANAL_IDS);
const positivo = z.number().finite().positive();

export const esquemaRespostas = z.object({
  etapa: z.number().int().min(1).max(4),
  perfil: z.enum(PERFIS).nullable(),
  comissao: positivo.nullable(),
  percentual: positivo.nullable(),
  modoTicket: z.enum(["ticket", "imoveis"]),
  ticket: positivo.nullable(),
  imoveis: positivo.nullable(),
  canais: z.array(canalId),
  vendasPorCanal: z.partialRecord(canalId, z.number().int().min(0)),
  meta: positivo.nullable(),
  /** Indica que o plano já foi gerado ao menos uma vez (permite voltar a ele). */
  planoGerado: z.boolean(),
  /** Cadastro (etapa "Seu plano") confirmado pelo servidor. Conveniência de interface, não autentica nada. */
  cadastrado: z.boolean().default(false),
  /** Plano aberto por link compartilhado: quem recebeu o link vê o plano sem a etapa de cadastro. */
  viaLink: z.boolean().default(false),
});

export type Respostas = z.infer<typeof esquemaRespostas>;

export function respostasIniciais(): Respostas {
  return {
    etapa: 1,
    perfil: null,
    comissao: null,
    percentual: PREMISSAS.percentualComissao.padrao,
    modoTicket: "ticket",
    ticket: null,
    imoveis: null,
    canais: [],
    vendasPorCanal: {},
    meta: null,
    planoGerado: false,
    cadastrado: false,
    viaLink: false,
  };
}

/* ───────── Rascunho local versionado ───────── */

export const CHAVE_RASCUNHO = "escala-imob:planejamento-2027";
export const VERSAO_RASCUNHO = 1;

const esquemaRascunho = z.object({
  versao: z.literal(VERSAO_RASCUNHO),
  salvoEm: z.string(),
  respostas: esquemaRespostas,
});

export function carregarRascunho(): Respostas | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(CHAVE_RASCUNHO);
    if (!bruto) return null;
    const lido = esquemaRascunho.safeParse(JSON.parse(bruto));
    return lido.success ? lido.data.respostas : null;
  } catch {
    return null;
  }
}

export function salvarRascunho(respostas: Respostas): void {
  try {
    window.localStorage.setItem(
      CHAVE_RASCUNHO,
      JSON.stringify({ versao: VERSAO_RASCUNHO, salvoEm: new Date().toISOString(), respostas }),
    );
  } catch {
    /* armazenamento indisponível (modo privado, cota): segue sem rascunho */
  }
}

export function apagarRascunho(): void {
  try {
    window.localStorage.removeItem(CHAVE_RASCUNHO);
  } catch {
    /* sem efeito */
  }
}

/* ───────── Link compartilhável (somente respostas, sem dados pessoais) ───────── */

const esquemaLink = esquemaRespostas.omit({ etapa: true, planoGerado: true, cadastrado: true, viaLink: true });

function base64Url(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64Url(codigo: string): string {
  const bin = atob(codigo.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function gerarLinkPlano(respostas: Respostas): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { etapa, planoGerado, cadastrado, viaLink, ...dados } = respostas;
  return `${window.location.origin}${window.location.pathname}#plano=${base64Url(JSON.stringify(dados))}`;
}

export function lerLinkPlano(hash: string): Respostas | null {
  const achado = hash.match(/plano=([\w-]+)/);
  if (!achado) return null;
  try {
    const lido = esquemaLink.safeParse(JSON.parse(deBase64Url(achado[1])));
    if (!lido.success) return null;
    return { ...lido.data, etapa: 4, planoGerado: true, cadastrado: false, viaLink: true };
  } catch {
    return null;
  }
}
