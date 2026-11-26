/**
 * Canais de aquisição (pilar Aquisição do Método Escala).
 *
 * Pesos, mês de entrada e limiares ("acima") são PREMISSAS PROVISÓRIAS (ver src/config/premissas.ts
 * e AUDITORIA_REFERENCIA.md §9.4). Descrições, ações e indicadores são redação própria da Escala IMOB.
 */

export const CANAL_IDS = [
  "trafego",
  "social",
  "base",
  "indicacao",
  "prospeccao",
  "portais",
  "google",
  "parcerias",
  "lancamentos",
] as const;

export type CanalId = (typeof CANAL_IDS)[number];

/** Canais representados pela logomarca oficial da plataforma (arquivos em public/third-party). */
export type PlataformaLogo = "meta" | "instagram" | "whatsapp" | "google-maps";

export type Canal = {
  id: CanalId;
  nome: string;
  /** Nome alternativo quando o perfil é Imobiliária. */
  nomeImobiliaria?: string;
  descricao: string;
  descricaoImobiliaria?: string;
  /** Parte do crescimento que o canal assume (PROVISÓRIO). */
  peso: number;
  /** Canais que entram em todo plano, mesmo sem uso em 2026. */
  essencial: boolean;
  /** Mês (1–12) em que um canal novo começa (PROVISÓRIO). */
  mesEntrada: number;
  /** Canal não essencial entra quando a meta multiplica as vendas por mais de (acima + 1). */
  acima?: number;
  /** Fração da comissão que fica com o usuário (parcerias dividem). */
  divisaoComissao?: number;
  logo?: PlataformaLogo;
  acoes: [string, string, string];
  indicador: string;
};

export const CANAIS: readonly Canal[] = [
  {
    id: "trafego",
    nome: "Tráfego pago",
    descricao: "Anúncios patrocinados que geram contatos",
    peso: 40,
    essencial: true,
    mesEntrada: 2,
    logo: "meta",
    acoes: [
      "Anunciar poucos imóveis por vez, cada um com vídeo e público definido",
      "Responder todo contato no mesmo dia e oferecer horário de visita",
      "Comparar toda semana custo por contato, visitas e propostas de cada anúncio",
    ],
    indicador: "Custo por contato e visitas marcadas na semana",
  },
  {
    id: "social",
    nome: "Social Selling",
    descricao: "Conversas iniciadas a partir do Instagram",
    peso: 15,
    essencial: true,
    mesEntrada: 2,
    logo: "instagram",
    acoes: [
      "Iniciar conversa com cada novo seguidor que tenha perfil de comprador",
      "Manter no perfil conteúdos fixos sobre atuação, região e clientes atendidos",
      "Levar a conversa para o WhatsApp assim que houver interesse concreto",
    ],
    indicador: "Conversas iniciadas por dia e quantas viram visita",
  },
  {
    id: "base",
    nome: "Lista Fria",
    descricao: "Contatos antigos da sua própria base",
    peso: 15,
    essencial: true,
    mesEntrada: 1,
    logo: "whatsapp",
    acoes: [
      "Organizar a base por interesse, região e faixa de valor",
      "Enviar uma seleção de oportunidades para a base uma vez por mês",
      "Retomar cada contato que respondeu até ter uma resposta definitiva",
    ],
    indicador: "Respostas por envio e visitas originadas da base",
  },
  {
    id: "indicacao",
    nome: "Indicação",
    descricao: "Clientes e parceiros que recomendam você",
    peso: 10,
    essencial: true,
    mesEntrada: 1,
    acoes: [
      "Pedir indicação ao final de cada atendimento bem avaliado",
      "Agradecer e dar retorno a quem indicou, sempre",
      "Listar quem já comprou ou vendeu com você e retomar o contato",
    ],
    indicador: "Indicações recebidas no mês",
  },
  {
    id: "prospeccao",
    nome: "Prospecção Ativa",
    descricao: "Contato direto com proprietários e investidores",
    peso: 8,
    essencial: false,
    mesEntrada: 1,
    acima: 1,
    acoes: [
      "Montar uma lista de proprietários e investidores da sua região",
      "Reservar um horário fixo de prospecção em todos os dias úteis",
      "Abordar sempre com uma oportunidade concreta, não com apresentação genérica",
    ],
    indicador: "Abordagens feitas e visitas marcadas na semana",
  },
  {
    id: "portais",
    nome: "Portais",
    descricao: "Contatos vindos de portais de anúncios imobiliários",
    peso: 6,
    essencial: false,
    mesEntrada: 4,
    acima: 2,
    acoes: [
      "Publicar anúncios completos, com fotos e vídeo de qualidade",
      "Destacar os imóveis com mais procura na sua região",
      "Responder o contato do portal com a mesma agilidade do tráfego pago",
    ],
    indicador: "Contatos por anúncio e tempo de primeira resposta",
  },
  {
    id: "google",
    nome: "Google Meu Negócio",
    descricao: "Contatos pelo seu perfil no Google e no Maps",
    peso: 3,
    essencial: false,
    mesEntrada: 4,
    acima: 1,
    logo: "google-maps",
    acoes: [
      "Completar o perfil e atualizar as fotos com frequência",
      "Pedir avaliação a cada cliente atendido e responder todas",
      "Publicar com regularidade imóveis e regiões em que você atua",
    ],
    indicador: "Avaliações novas e contatos pelo perfil",
  },
  {
    id: "parcerias",
    nome: "Imobiliária",
    nomeImobiliaria: "Parcerias",
    descricao: "Vendas feitas em parceria",
    descricaoImobiliaria: "Vendas feitas com outras imobiliárias",
    peso: 2,
    essencial: false,
    mesEntrada: 2,
    acima: 2,
    divisaoComissao: 0.5,
    acoes: [
      "Formalizar por escrito a divisão de comissão de cada parceria",
      "Trocar carteira com os parceiros toda semana",
      "Ter parceiros para as regiões e padrões que você não atende",
    ],
    indicador: "Negócios fechados em parceria",
  },
  {
    id: "lancamentos",
    nome: "Construtora",
    descricao: "Vendas de lançamentos em parceria com construtoras",
    peso: 1,
    essencial: false,
    mesEntrada: 4,
    acima: 2,
    acoes: [
      "Mapear as construtoras com lançamentos previstos na sua região",
      "Propor parceria com meta de unidades e material de divulgação",
      "Apresentar cada lançamento primeiro para a sua base e seus seguidores",
    ],
    indicador: "Unidades de lançamento vendidas",
  },
];

export function canalPorId(id: CanalId): Canal {
  const canal = CANAIS.find((c) => c.id === id);
  if (!canal) throw new Error(`Canal desconhecido: ${id}`);
  return canal;
}
