import { describe, expect, it } from "vitest";
import { respostasIniciais, type Respostas } from "@/lib/estado";
import {
  erroDistribuicao,
  faixaIndice,
  gerarPlano,
  imoveis2026,
  indiceAquisicao,
  indiceComPlano,
  oportunidades,
  ticketMedio,
  validarDiagnostico,
  vendaInteira,
  vendasPorCanal2026,
  vgv2026,
  vgv2027,
} from "@/lib/calculos";
import { moeda, quantidade } from "@/lib/formatacao";

/**
 * Cenário usado na auditoria (AUDITORIA_REFERENCIA.md §4–§9): os valores esperados abaixo são os que a
 * referência exibiu com as mesmas entradas, garantindo paridade das premissas PROVISÓRIAS.
 */
function cenarioAuditoria(extra: Partial<Respostas> = {}): Respostas {
  return {
    ...respostasIniciais(),
    perfil: "corretor",
    comissao: 120_000,
    percentual: 6,
    modoTicket: "ticket",
    ticket: 400_000,
    canais: ["trafego", "social", "indicacao", "parcerias"],
    vendasPorCanal: { trafego: 2, indicacao: 1 },
    meta: 300_000,
    ...extra,
  };
}

describe("números de 2026", () => {
  it("calcula VGV, imóveis e ticket a partir da comissão", () => {
    const r = cenarioAuditoria();
    expect(vgv2026(r)).toBe(2_000_000);
    expect(imoveis2026(r)).toBe(5);
    const porImoveis = cenarioAuditoria({ modoTicket: "imoveis", imoveis: 8 });
    expect(ticketMedio(porImoveis)).toBe(250_000);
  });

  it("valida o diagnóstico na ordem: perfil, comissão, percentual, ticket", () => {
    expect(validarDiagnostico({ ...respostasIniciais() })).toMatch(/perfil/);
    expect(validarDiagnostico({ ...respostasIniciais(), perfil: "corretor" })).toMatch(/comissão/);
    expect(validarDiagnostico(cenarioAuditoria({ percentual: 25 }))).toMatch(/percentual/);
    expect(validarDiagnostico(cenarioAuditoria({ percentual: 0.2 }))).toMatch(/percentual/);
    expect(validarDiagnostico(cenarioAuditoria({ ticket: null }))).toMatch(/ticket/);
    expect(validarDiagnostico(cenarioAuditoria())).toBeNull();
  });
});

describe("canais de 2026", () => {
  it("divide o restante igualmente entre canais ativos sem número", () => {
    expect(vendasPorCanal2026(cenarioAuditoria())).toEqual({ trafego: 2, social: 1, indicacao: 1, parcerias: 1 });
  });

  it("acusa soma acima do total", () => {
    expect(erroDistribuicao(cenarioAuditoria({ vendasPorCanal: { trafego: 9 } }))).toMatch(/9.*5/);
    expect(erroDistribuicao(cenarioAuditoria())).toBeNull();
  });

  it("calcula o Índice de Aquisição e as faixas", () => {
    expect(indiceAquisicao(1)).toBe(11);
    expect(indiceAquisicao(4)).toBe(44);
    expect(faixaIndice(33).id).toBe("baixo");
    expect(faixaIndice(44).id).toBe("medio");
    expect(faixaIndice(78).id).toBe("alto");
  });

  it("estima o VGV em aberto dos canais sem uso (paridade com a referência)", () => {
    const tudoDesligado = cenarioAuditoria({ canais: [], vendasPorCanal: {} });
    expect(moeda(oportunidades(tudoDesligado).reduce((a, o) => a + o.vgv, 0))).toBe("R$ 1,86 mi");
    expect(moeda(oportunidades(cenarioAuditoria()).reduce((a, o) => a + o.vgv, 0))).toBe("R$ 610 mil");
  });
});

describe("plano 2027 (paridade com a referência)", () => {
  const r = cenarioAuditoria();
  const plano = gerarPlano(r);
  const linha = (id: string) => plano.linhas.find((l) => l.canal.id === id)!;

  it("meta e VGV necessários", () => {
    expect(vgv2027(r)).toBe(5_000_000);
    expect(quantidade(plano.vendas2027)).toBe("13");
  });

  it("seleciona 7 canais: essenciais, usados e extras pelo multiplicador", () => {
    expect(plano.linhas.map((l) => l.canal.id)).toEqual([
      "trafego",
      "social",
      "base",
      "indicacao",
      "prospeccao",
      "google",
      "parcerias",
    ]);
  });

  it("distribui o crescimento por peso e calcula os funis", () => {
    expect(quantidade(linha("trafego").vendas2027)).toBe("5,2");
    expect(linha("trafego").funil.principal.valor).toBe("R$ 400");
    expect(Math.round(plano.investimentoTrafegoMes)).toBe(326);
    expect(linha("trafego").funil.degraus.map((d) => d.valor)).toEqual(["R$ 400", "37", "7,3", "2,2"]);
    expect(linha("social").funil.principal.valor).toBe("123");
    expect(linha("base").funil.principal.valor).toBe("67");
    expect(linha("indicacao").funil.principal.valor).toBe("5");
    expect(linha("prospeccao").funil.principal.valor).toBe("54");
    expect(linha("google").funil.principal.valor).toBe("3");
    expect(linha("google").mesEntrada).toBe(4);
    expect(linha("parcerias").funil.principal.valor).toBe("1");
  });

  it("comissão estimada considera a divisão das parcerias", () => {
    expect(moeda(plano.comissaoPrevista)).toBe("R$ 286 mil");
    expect(plano.temParceriaDividida).toBe(true);
  });

  it("índice com o plano", () => {
    expect(indiceComPlano(r, plano)).toBe(78);
  });
});

describe("venda inteira", () => {
  it("abaixo de 1 venda por mês vira 1 venda a cada N meses", () => {
    expect(vendaInteira(0.4355)).toEqual({ vendas: 1, aCadaMeses: 3 });
    expect(vendaInteira(12.5 / 12).vendas).toBeCloseTo(1.0417, 3);
    expect(vendaInteira(0)).toEqual({ vendas: 0, aCadaMeses: 0 });
  });
});

describe("formatação", () => {
  it("moeda compacta pt-BR", () => {
    expect(moeda(2_000_000)).toBe("R$ 2 mi");
    expect(moeda(36_666)).toBe("R$ 36,7 mil");
    expect(moeda(400)).toBe("R$ 400");
    expect(moeda(416_667)).toBe("R$ 417 mil");
  });
});
