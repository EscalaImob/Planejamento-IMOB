import { CANAIS, canalPorId, type Canal, type CanalId } from "@/config/canais";
import { PREMISSAS, custoPorLead } from "@/config/premissas";
import type { Perfil, Respostas } from "@/lib/estado";
import { moedaCheia, quantidade, taxa } from "@/lib/formatacao";

/* ───────── Números de 2026 ───────── */

export function vgv2026(r: Respostas): number {
  return r.comissao && r.percentual ? r.comissao / (r.percentual / 100) : 0;
}

export function ticketMedio(r: Respostas): number {
  if (r.modoTicket === "ticket") return r.ticket ?? 0;
  return r.imoveis ? vgv2026(r) / r.imoveis : 0;
}

export function imoveis2026(r: Respostas): number {
  if (r.modoTicket === "imoveis") return r.imoveis ?? 0;
  return r.ticket ? vgv2026(r) / r.ticket : 0;
}

/* ───────── Meta 2027 ───────── */

export function vgv2027(r: Respostas): number {
  return r.meta && r.percentual ? r.meta / (r.percentual / 100) : 0;
}

export function imoveis2027(r: Respostas): number {
  const t = ticketMedio(r);
  return t ? vgv2027(r) / t : 0;
}

/** Variação da meta sobre a comissão de 2026 (fração; 1,5 = +150%). */
export function variacaoMeta(r: Respostas): number {
  return r.meta && r.comissao ? r.meta / r.comissao - 1 : 0;
}

/* ───────── Nome do canal conforme o perfil ───────── */

export function nomeCanal(canal: Canal, perfil: Perfil | null): string {
  return perfil === "imobiliaria" && canal.nomeImobiliaria ? canal.nomeImobiliaria : canal.nome;
}

export function descricaoCanal(canal: Canal, perfil: Perfil | null): string {
  return perfil === "imobiliaria" && canal.descricaoImobiliaria ? canal.descricaoImobiliaria : canal.descricao;
}

/* ───────── Vendas de 2026 por canal ───────── */

/**
 * Quem informou número mantém o número; o que sobra do total é dividido igualmente entre os canais
 * ligados sem número. Se a soma ainda divergir do total, tudo é reescalado proporcionalmente.
 */
export function vendasPorCanal2026(r: Respostas): Partial<Record<CanalId, number>> {
  const total = imoveis2026(r);
  const saida: Partial<Record<CanalId, number>> = {};
  if (!r.canais.length) return saida;
  const informado = (id: CanalId) => r.vendasPorCanal[id] ?? 0;
  const soma = r.canais.reduce((a, id) => a + informado(id), 0);
  const vazios = r.canais.filter((id) => !(informado(id) > 0));
  const resto = Math.max(0, total - soma);
  r.canais.forEach((id) => {
    saida[id] = informado(id) > 0 ? informado(id) : vazios.length ? resto / vazios.length : 0;
  });
  const soma2 = Object.values(saida).reduce((a, b) => a + (b ?? 0), 0);
  if (soma2 > 0 && Math.abs(soma2 - total) > 0.01) {
    (Object.keys(saida) as CanalId[]).forEach((id) => (saida[id] = ((saida[id] ?? 0) * total) / soma2));
  }
  return saida;
}

export function somaInformada(r: Respostas): number {
  return r.canais.reduce((a, id) => a + (r.vendasPorCanal[id] ?? 0), 0);
}

export function erroDistribuicao(r: Respostas): string | null {
  const total = imoveis2026(r);
  const informado = somaInformada(r);
  if (informado > total + 0.01) {
    return `A soma por canal (${quantidade(informado)}) passou dos ${quantidade(total)} imóveis vendidos em 2026. Revise os números.`;
  }
  return null;
}

/* ───────── Índice de Aquisição ───────── */

export type FaixaIndice = { id: "baixo" | "medio" | "alto"; nome: string; descricao: string };

export function indiceAquisicao(canaisAtivos: number): number {
  return Math.round((canaisAtivos / CANAIS.length) * 100);
}

/** Nomes e textos das faixas: redação própria, PROVISÓRIA até validação editorial. */
export function faixaIndice(indice: number): FaixaIndice {
  const { limiteBaixo, limiteMedio } = PREMISSAS.indiceAquisicao;
  if (indice < limiteBaixo)
    return {
      id: "baixo",
      nome: "Concentrada",
      descricao: "Poucos canais sustentam quase todo o resultado. Uma queda em um deles afeta o ano inteiro.",
    };
  if (indice < limiteMedio)
    return {
      id: "medio",
      nome: "Em expansão",
      descricao: "Já existe mais de uma fonte de clientes, mas há canais relevantes sem uso.",
    };
  return {
    id: "alto",
    nome: "Distribuída",
    descricao: "As vendas vêm de várias fontes. O próximo passo é ganhar eficiência em cada canal.",
  };
}

export function concentracao(r: Respostas): { canal: Canal; percentual: number } | null {
  const mix = vendasPorCanal2026(r);
  const total = imoveis2026(r);
  let topo: [CanalId, number] | null = null;
  (Object.entries(mix) as [CanalId, number][]).forEach(([id, v]) => {
    if (!topo || v > topo[1]) topo = [id, v];
  });
  if (!topo || !total) return null;
  const [id, v] = topo as [CanalId, number];
  return { canal: canalPorId(id), percentual: (v / total) * 100 };
}

/** VGV que cada canal desligado poderia somar no ano (estimativa pelas premissas provisórias). */
export function oportunidades(r: Respostas): { canal: Canal; vgv: number }[] {
  const t = ticketMedio(r);
  const v26 = imoveis2026(r) || 1;
  return CANAIS.filter((c) => !r.canais.includes(c.id))
    .map((c) => ({ canal: c, vgv: (v26 * c.peso) / 100 * t * ((13 - c.mesEntrada) / 12) }))
    .sort((a, b) => b.vgv - a.vgv);
}

/* ───────── Venda inteira ───────── */

/** Ninguém vende fração de imóvel: abaixo de 1 venda/mês vira "1 venda a cada N meses". */
export function vendaInteira(vendasMes: number): { vendas: number; aCadaMeses: number } {
  if (!(vendasMes > 1e-9)) return { vendas: 0, aCadaMeses: 0 };
  if (vendasMes >= 1) return { vendas: vendasMes, aCadaMeses: 1 };
  return { vendas: 1, aCadaMeses: Math.ceil(1 / vendasMes - 1e-9) };
}

/* ───────── Funil do mês de cada canal ───────── */

export type Medida = { rotulo: string; valor: string; unidade: string };
export type DegrauFunil = { rotulo: string; valor: string; detalhe?: string };

export type FunilCanal = {
  /** Medida que o canal exige por mês (ou no ano). */
  principal: Medida;
  /** Segunda medida (normalmente visitas). */
  secundaria: Medida;
  /** Degraus antes da venda. */
  degraus: DegrauFunil[];
  /** Taxa de fechamento exibida no degrau de vendas. */
  fecha?: number;
  /** Investimento mensal estimado (apenas tráfego pago). */
  investimento?: number;
};

function porMes(rotulo: string, valor: number): Medida {
  return { rotulo, valor: quantidade(valor), unidade: "por mês" };
}

export function funilDoCanal(id: CanalId, vendasMes: number, ticket: number): FunilCanal {
  const P = PREMISSAS;
  switch (id) {
    case "trafego": {
      const f = P.funilTrafego;
      const visitas = vendasMes / f.fecha;
      const agendam = visitas / f.comparece;
      const leads = agendam / f.agenda;
      const cpl = custoPorLead(ticket);
      const passo = P.custoPorLead.arredondarInvestimentoPara;
      const investimento = Math.ceil((leads * cpl) / passo) * passo;
      return {
        principal: { rotulo: "Investimento", valor: moedaCheia(investimento), unidade: "por mês" },
        secundaria: porMes("Visitas", visitas),
        degraus: [
          { rotulo: "Investimento", valor: moedaCheia(investimento) },
          { rotulo: "Contatos", valor: quantidade(leads), detalhe: `${moedaCheia(cpl)} por contato` },
          { rotulo: "Agendam visita", valor: quantidade(agendam), detalhe: `${taxa(f.agenda)} agendam` },
          { rotulo: "Comparecem", valor: quantidade(visitas), detalhe: `${taxa(f.comparece)} comparecem` },
        ],
        fecha: f.fecha,
        investimento: leads * cpl,
      };
    }
    case "social": {
      const f = P.funilRelacionamento;
      const visitas = vendasMes / f.fecha;
      const conversas = visitas / f.visita;
      return {
        principal: porMes("Conversas no direct", conversas),
        secundaria: porMes("Visitas", visitas),
        degraus: [
          { rotulo: "Conversas iniciadas", valor: quantidade(conversas) },
          { rotulo: "Visitas", valor: quantidade(visitas), detalhe: `${taxa(f.visita)} visitam` },
        ],
        fecha: f.fecha,
      };
    }
    case "base": {
      const f = P.funilRelacionamento;
      const visitas = vendasMes / f.fecha;
      const contatos = visitas / f.visita;
      return {
        principal: porMes("Contatos da base", contatos),
        secundaria: porMes("Visitas", visitas),
        degraus: [
          { rotulo: "Contatos trabalhados", valor: quantidade(contatos) },
          { rotulo: "Visitas", valor: quantidade(visitas), detalhe: `${taxa(f.visita)} visitam` },
        ],
        fecha: f.fecha,
      };
    }
    case "indicacao": {
      const f = P.funilIndicacao;
      const visitas = vendasMes / f.fecha;
      const recebidas = visitas / f.visitam;
      const pedidas = recebidas / f.indicam;
      return {
        principal: porMes("Indicações pedidas", pedidas),
        secundaria: porMes("Visitas", visitas),
        degraus: [
          { rotulo: "Indicações pedidas", valor: quantidade(pedidas) },
          { rotulo: "Indicações recebidas", valor: quantidade(recebidas), detalhe: `${taxa(f.indicam)} indicam` },
          { rotulo: "Visitas", valor: quantidade(visitas), detalhe: `${taxa(f.visitam)} visitam` },
        ],
        fecha: f.fecha,
      };
    }
    case "prospeccao": {
      const f = P.funilProspeccao;
      const visitas = vendasMes / f.fecha;
      const abordagens = visitas / f.visita;
      return {
        principal: porMes("Abordagens", abordagens),
        secundaria: porMes("Visitas", visitas),
        degraus: [
          { rotulo: "Abordagens", valor: quantidade(abordagens) },
          { rotulo: "Visitas", valor: quantidade(visitas), detalhe: `${taxa(f.visita)} visitam` },
        ],
        fecha: f.fecha,
      };
    }
    case "portais":
    case "google": {
      const f = P.funilLeads;
      const visitas = vendasMes / f.fecha;
      const agendam = visitas / f.comparece;
      const contatos = agendam / f.agenda;
      const rotulo = id === "portais" ? "Contatos de portal" : "Contatos pelo Google";
      return {
        principal: porMes(rotulo, contatos),
        secundaria: porMes("Visitas", visitas),
        degraus: [
          { rotulo, valor: quantidade(contatos) },
          { rotulo: "Agendam visita", valor: quantidade(agendam), detalhe: `${taxa(f.agenda)} agendam` },
          { rotulo: "Comparecem", valor: quantidade(visitas), detalhe: `${taxa(f.comparece)} comparecem` },
        ],
        fecha: f.fecha,
      };
    }
    case "parcerias": {
      const p = P.parcerias;
      const parceiros = Math.max(1, vendasMes / p.vendasPorParceiro);
      const compartilhados = Math.max(p.compartilhamentosMinimos, Math.ceil(vendasMes / p.vendasPorParceiro));
      return {
        principal: porMes("Parceiros ativos", parceiros),
        secundaria: { rotulo: "Imóveis compartilhados", valor: quantidade(compartilhados), unidade: "por semana" },
        degraus: [
          { rotulo: "Parceiros ativos", valor: quantidade(parceiros) },
          { rotulo: "Imóveis compartilhados", valor: quantidade(compartilhados), detalhe: "por semana" },
        ],
      };
    }
    case "lancamentos": {
      const u = P.lancamentos.unidadesPorLancamento;
      const lancamentos = Math.max(1, Math.ceil((vendasMes * 12) / u));
      return {
        principal: { rotulo: "Lançamentos em parceria", valor: quantidade(lancamentos), unidade: "no ano" },
        secundaria: { rotulo: "Unidades por lançamento", valor: String(u), unidade: "" },
        degraus: [
          { rotulo: "Lançamentos em parceria", valor: quantidade(lancamentos), detalhe: "no ano" },
          { rotulo: "Unidades por lançamento", valor: String(u) },
        ],
      };
    }
  }
}

/* ───────── Plano 2027 ───────── */

export type LinhaPlano = {
  canal: Canal;
  jaUsa: boolean;
  vendas2026: number;
  crescimento: number;
  vendas2027: number;
  mesEntrada: number;
  vendasMesCruzeiro: number;
  funil: FunilCanal;
  vgv2027: number;
  comissao2027: number;
};

export type Plano = {
  linhas: LinhaPlano[];
  vendas2026: number;
  vendas2027: number;
  investimentoTrafegoMes: number;
  comissaoPrevista: number;
  temParceriaDividida: boolean;
};

/** Mantém o que cada canal fez em 2026 e distribui o crescimento pelos canais do plano, por peso. */
export function gerarPlano(r: Respostas): Plano {
  const t = ticketMedio(r);
  const v26 = imoveis2026(r);
  const v27 = t ? vgv2027(r) / t : 0;
  const crescimento = Math.max(0, v27 - v26);
  const mult = v26 ? v27 / v26 : PREMISSAS.multiplicadorSemHistorico;
  const base = vendasPorCanal2026(r);
  const pct = (r.percentual ?? 0) / 100;

  const escolhidos = CANAIS.filter(
    (c) => c.essencial || r.canais.includes(c.id) || (c.acima !== undefined && mult > c.acima + 1),
  );
  const somaPesos = escolhidos.reduce((a, c) => a + c.peso, 0);

  const linhas = escolhidos.map<LinhaPlano>((canal) => {
    const jaUsa = r.canais.includes(canal.id);
    const vendas2026 = base[canal.id] ?? 0;
    const cresc = (crescimento * canal.peso) / somaPesos;
    const mesEntrada = jaUsa ? 1 : canal.mesEntrada;
    const mesesAtivos = 13 - mesEntrada;
    const vendas2027 = vendas2026 + cresc;
    const vendasMesCruzeiro = vendas2026 / 12 + cresc / mesesAtivos;
    const vgv = vendas2027 * t;
    return {
      canal,
      jaUsa,
      vendas2026,
      crescimento: cresc,
      vendas2027,
      mesEntrada,
      vendasMesCruzeiro,
      funil: funilDoCanal(canal.id, vendasMesCruzeiro, t),
      vgv2027: vgv,
      comissao2027: vgv * pct * (canal.divisaoComissao ?? 1),
    };
  });

  return {
    linhas,
    vendas2026: v26,
    vendas2027: v27,
    investimentoTrafegoMes: linhas.reduce((a, l) => a + (l.funil.investimento ?? 0), 0),
    comissaoPrevista: linhas.reduce((a, l) => a + l.comissao2027, 0),
    temParceriaDividida: linhas.some((l) => l.canal.divisaoComissao !== undefined),
  };
}

/** Índice "com o plano": canais usados mais canais do plano. */
export function indiceComPlano(r: Respostas, plano: Plano): number {
  const ids = new Set<CanalId>([...r.canais, ...plano.linhas.map((l) => l.canal.id)]);
  return indiceAquisicao(ids.size);
}

/* ───────── Validações por etapa ───────── */

export function validarDiagnostico(r: Respostas): string | null {
  const { minimo, maximo } = PREMISSAS.percentualComissao;
  if (!r.perfil) return "Selecione o seu perfil: corretor autônomo, imobiliária ou incorporador.";
  if (!(r.comissao && r.comissao > 0)) return "Informe quanto você recebeu de comissão em 2026.";
  if (!(r.percentual && r.percentual >= minimo && r.percentual <= maximo))
    return `Informe um percentual médio de comissão entre ${String(minimo).replace(".", ",")}% e ${maximo}%.`;
  if (!(ticketMedio(r) > 0)) return "Informe o ticket médio ou a quantidade de imóveis vendidos.";
  return null;
}

export function canalPodeAvancar(r: Respostas): boolean {
  return r.canais.length > 0 && !erroDistribuicao(r);
}

export function metaPodeAvancar(r: Respostas): boolean {
  return !!(r.meta && r.meta > 0);
}
