/**
 * PREMISSAS DE CÁLCULO — PROVISÓRIAS
 *
 * Decisão do responsável pelo projeto (25/11/2026): manter, por ora, as mesmas premissas
 * numéricas observadas na aplicação de referência (ver AUDITORIA_REFERENCIA.md §9),
 * até que a Escala IMOB valide premissas próprias.
 *
 * Todas as taxas, pesos e limiares ficam concentrados neste arquivo para que possam ser
 * substituídos sem alterar a lógica de cálculo. Nenhum valor aqui é garantia de resultado.
 */

/** Etapas de um funil "lead → agendamento → visita → venda". */
export type FunilLead = {
  agenda: number;
  comparece: number;
  fecha: number;
};

export const PREMISSAS = {
  versao: "provisoria-2026-11",

  /** Funil comum de leads recebidos (portais e Google). */
  funilLeads: { agenda: 0.15, comparece: 0.3, fecha: 0.2 } satisfies FunilLead,

  /** Funil de tráfego pago: agendamento 30% acima do funil comum. */
  funilTrafego: { agenda: 0.195, comparece: 0.3, fecha: 0.2 } satisfies FunilLead,

  /** Funil de relacionamento (Instagram e base própria): visitam e compram. */
  funilRelacionamento: { visita: 0.015, fecha: 0.1 },

  /** Indicação: % que indicam quando pedidos, % de indicados que visitam, % que compram. */
  funilIndicacao: { indicam: 0.3, visitam: 0.5, fecha: 0.2 },

  /** Prospecção ativa: % de abordados que visitam e % que compram. */
  funilProspeccao: { visita: 0.01, fecha: 0.1 },

  /** Parcerias: produtividade por parceiro e compartilhamentos semanais mínimos. */
  parcerias: { vendasPorParceiro: 0.1, compartilhamentosMinimos: 2, divisaoComissao: 0.5 },

  /** Lançamentos: unidades vendidas por lançamento em parceria. */
  lancamentos: { unidadesPorLancamento: 3 },

  /**
   * Custo por lead (R$) por faixa de ticket médio, antes do fator de eficiência.
   * O fator aplica 30% de redução sobre a tabela.
   */
  custoPorLead: {
    faixas: [
      { ate: 500_000, valor: 12.5 },
      { ate: 800_000, valor: 22.5 },
      { ate: 2_000_000, valor: 45 },
      { ate: Number.POSITIVE_INFINITY, valor: 90 },
    ],
    fatorEficiencia: 0.7,
    arredondarInvestimentoPara: 100,
  },

  /** Dias úteis por mês, para metas diárias. */
  diasUteisMes: 22,

  /** Multiplicador assumido quando não há vendas em 2026. */
  multiplicadorSemHistorico: 3,

  /** Faixas do Índice de Aquisição (0–100). */
  indiceAquisicao: { limiteBaixo: 34, limiteMedio: 67 },

  /** Percentual de comissão: padrão inicial e limites aceitos. */
  percentualComissao: { padrao: 5, minimo: 0.5, maximo: 20 },
} as const;

export function custoPorLead(ticket: number): number {
  const faixa = PREMISSAS.custoPorLead.faixas.find((f) => ticket <= f.ate);
  return (faixa?.valor ?? 0) * PREMISSAS.custoPorLead.fatorEficiencia;
}
