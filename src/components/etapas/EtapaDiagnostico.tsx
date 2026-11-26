"use client";

import { useState } from "react";
import { CampoMaisMenos } from "@/components/ui/CampoMaisMenos";
import { CartaoPasso, Rotulo } from "@/components/ui/Cartao";
import { Celula } from "@/components/ui/Indicadores";
import { PainelTopo } from "@/components/etapas/Moldura";
import { PREMISSAS } from "@/config/premissas";
import { PERFIS, ROTULO_PERFIL, type Respostas } from "@/lib/estado";
import { imoveis2026, ticketMedio, vgv2026 } from "@/lib/calculos";
import { decimal, digitos, moeda, numero, percentual, quantidade } from "@/lib/formatacao";

/** Quanto cada clique de − / + anda em cada campo. */
const PASSO = { comissao: 10_000, percentual: 0.5, ticket: 50_000, imoveis: 1 } as const;

type Props = { r: Respostas; atualizar: (p: Partial<Respostas>) => void };

function textoMoeda(v: number | null) {
  return v ? numero(v) : "";
}

export function CartoesDiagnostico({ r, atualizar }: Props) {
  // Texto livre do percentual, para permitir digitar "5," antes do decimal.
  const [textoPct, setTextoPct] = useState<string | null>(null);
  const pctExibido = textoPct ?? (r.percentual ? String(r.percentual).replace(".", ",") : "");

  const ticketCalc = r.modoTicket === "imoveis";
  const imoveisCalc = r.modoTicket === "ticket";

  const passoMoeda = (campo: "comissao" | "ticket", dir: 1 | -1) => {
    const novo = Math.max(0, (r[campo] ?? 0) + PASSO[campo] * dir);
    atualizar(campo === "ticket" ? { ticket: novo || null, modoTicket: "ticket" } : { comissao: novo || null });
  };

  const definirPct = (v: number) => {
    const { maximo } = PREMISSAS.percentualComissao;
    atualizar({ percentual: v > 0 && v <= maximo ? v : null });
  };

  return (
    <>
      <CartaoPasso numero={1} icone="perfil" titulo="Seu perfil" pergunta="Como você atua no mercado imobiliário?">
        <div role="group" aria-label="Perfil" className="flex flex-wrap gap-2">
          {PERFIS.map((p) => {
            const ativo = r.perfil === p;
            return (
              <button
                key={p}
                type="button"
                aria-pressed={ativo}
                onClick={() => atualizar({ perfil: p })}
                className={`h-14 rounded-campo border px-4 text-[17px] font-semibold whitespace-nowrap transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] ${
                  ativo ? "border-tinta bg-tinta text-white" : "border-fio bg-white hover:border-tinta"
                }`}
              >
                {ROTULO_PERFIL[p]}
              </button>
            );
          })}
        </div>
      </CartaoPasso>

      <CartaoPasso numero={2} icone="comissao" titulo="Comissão de 2026" pergunta="Quanto você recebeu de comissão ao longo de 2026?">
        <div>
          <Rotulo htmlFor="comissao">Comissão recebida em 2026</Rotulo>
          <CampoMaisMenos
            id="comissao"
            rotulo="Comissão recebida em 2026"
            prefixo="R$"
            placeholder="100.000"
            valor={textoMoeda(r.comissao)}
            onTexto={(t) => atualizar({ comissao: digitos(t) || null })}
            onPasso={(d) => passoMoeda("comissao", d)}
          />
        </div>
      </CartaoPasso>

      <CartaoPasso numero={3} icone="percentual" titulo="Percentual de comissão" pergunta="Qual é, em média, o seu percentual de comissão por venda?">
        <div className="w-[190px] max-w-full">
          <Rotulo htmlFor="percentual">% de comissão</Rotulo>
          <CampoMaisMenos
            id="percentual"
            rotulo="Percentual de comissão"
            sufixo="%"
            placeholder={String(PREMISSAS.percentualComissao.padrao)}
            modo="decimal"
            valor={pctExibido}
            onTexto={(t) => {
              const limpo = t.replace(/[^0-9,.]/g, "");
              setTextoPct(limpo);
              definirPct(decimal(limpo));
            }}
            onPasso={(d) => {
              setTextoPct(null);
              definirPct(Math.max(0, Math.round(((r.percentual ?? 0) + PASSO.percentual * d) * 10) / 10));
            }}
          />
        </div>
      </CartaoPasso>

      <CartaoPasso
        numero={4}
        icone="ticket"
        titulo="Ticket médio ou imóveis vendidos"
        pergunta="Informe um dos dois. O outro é calculado a partir da sua comissão."
      >
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <div className="min-w-0 flex-[1_1_240px] sm:max-w-[300px]">
            <Rotulo htmlFor="ticket">
              <span className={ticketCalc ? "text-corpo" : ""}>Ticket médio</span>
              {ticketCalc && <SeloCalculado />}
            </Rotulo>
            <CampoMaisMenos
              id="ticket"
              rotulo="Ticket médio"
              prefixo="R$"
              placeholder="350.000"
              calculado={ticketCalc}
              valor={ticketCalc ? (ticketMedio(r) ? numero(Math.round(ticketMedio(r))) : "") : textoMoeda(r.ticket)}
              onTexto={(t) => atualizar({ ticket: digitos(t) || null, modoTicket: "ticket" })}
              onPasso={(d) => {
                const atual = ticketCalc ? Math.round(ticketMedio(r)) : (r.ticket ?? 0);
                const novo = Math.max(0, atual + PASSO.ticket * d);
                atualizar({ ticket: novo || null, modoTicket: "ticket" });
              }}
            />
          </div>
          <span aria-hidden="true" className="grid h-auto basis-full text-[17px] font-semibold text-corpo sm:h-14 sm:basis-auto sm:place-items-center">
            ou
          </span>
          <div className="min-w-0 flex-[1_1_240px] sm:max-w-[300px]">
            <Rotulo htmlFor="imoveis">
              <span className={imoveisCalc ? "text-corpo" : ""}>Imóveis vendidos em 2026</span>
              {imoveisCalc && <SeloCalculado />}
            </Rotulo>
            <CampoMaisMenos
              id="imoveis"
              rotulo="Imóveis vendidos em 2026"
              placeholder="15"
              calculado={imoveisCalc}
              valor={imoveisCalc ? (imoveis2026(r) ? quantidade(imoveis2026(r)) : "") : r.imoveis ? String(r.imoveis) : ""}
              onTexto={(t) => atualizar({ imoveis: digitos(t) || null, modoTicket: "imoveis" })}
              onPasso={(d) => {
                const atual = imoveisCalc ? Math.round(imoveis2026(r)) : (r.imoveis ?? 0);
                const novo = Math.max(0, atual + PASSO.imoveis * d);
                atualizar({ imoveis: novo || null, modoTicket: "imoveis" });
              }}
            />
          </div>
        </div>
      </CartaoPasso>
    </>
  );
}

function SeloCalculado() {
  return (
    <em className="ml-1.5 inline-block rounded-lg border border-fio px-2 py-px text-[13px] font-semibold text-corpo not-italic">
      calculado
    </em>
  );
}

export function PainelDiagnostico({ r }: { r: Respostas }) {
  const im = imoveis2026(r);
  return (
    <>
      <PainelTopo rotulo="VGV gerado em 2026" valor={moeda(vgv2026(r))} />
      <dl className="grid grid-cols-2 overflow-hidden">
        <Celula rotulo="Imóveis vendidos" valor={im ? quantidade(im) : "0"} />
        <Celula rotulo="Ticket médio" valor={moeda(ticketMedio(r))} />
      </dl>
      <dl className="grid grid-cols-2 overflow-hidden border-t border-fio-2">
        <Celula rotulo="Comissão em 2026" valor={moeda(r.comissao)} />
        <Celula rotulo="% de comissão" valor={r.percentual ? percentual(r.percentual) : "0%"} />
      </dl>
    </>
  );
}
