"use client";

import type { ReactNode } from "react";
import { BotaoPrincipal } from "@/components/ui/Botao";
import { Isotipo } from "@/components/ui/Isotipo";
import { Icone, type NomeIcone } from "@/components/ui/Icone";

export const ETAPAS: { nome: string; icone: NomeIcone }[] = [
  { nome: "Diagnóstico", icone: "diagnostico" },
  { nome: "Canais", icone: "canais" },
  { nome: "Meta 2027", icone: "meta" },
  { nome: "Seu plano", icone: "plano" },
];

type Props = {
  etapa: number;
  subtitulo: string;
  podeIr: (etapa: number) => boolean;
  onIr: (etapa: number) => void;
  seguir?: { texto: string; onClick: () => void; desabilitado?: boolean };
  /** Valor principal fixo no rodapé em telas menores que 1024 px. */
  faixa?: { rotulo: string; valor: string };
  /** Oculta a barra da ferramenta (tela do plano). */
  semBarra?: boolean;
  /** Barra rola com a página (no plano, a navegação de seções é que fica fixa). */
  barraEstatica?: boolean;
  fundoBranco?: boolean;
  children: ReactNode;
};

export function Casca({ etapa, subtitulo, podeIr, onIr, seguir, faixa, semBarra, barraEstatica, fundoBranco, children }: Props) {
  const anterior = etapa >= 2 && etapa <= 4 ? ETAPAS[etapa - 2] : null;

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-full bg-tinta px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Ir para o conteúdo
      </a>

      {/* Trilho lateral (desktop) / barra superior (mobile) */}
      <aside className="no-print fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-fio-2 bg-white px-3 lg:inset-y-0 lg:right-auto lg:h-auto lg:w-[76px] lg:flex-col lg:border-r lg:border-b-0 lg:px-0">
        <button
          type="button"
          onClick={() => etapa > 1 && podeIr(1) && onIr(1)}
          aria-label="Escala IMOB — voltar ao início do planejamento"
          className="grid h-14 place-items-center lg:h-16"
        >
          <Isotipo tamanho={40} className="text-azul" />
        </button>
        <nav aria-label="Etapas" className="ml-auto flex gap-1 lg:ml-0 lg:grid lg:w-full lg:gap-0.5 lg:px-3 lg:pt-4">
          {ETAPAS.map((e, i) => {
            const n = i + 1;
            const atual = n === etapa;
            const classe = `grid h-10 w-10 place-items-center rounded-[10px] lg:w-full ${
              atual ? "bg-papel text-azul" : "text-[#55586f]"
            }`;
            return podeIr(n) && !atual ? (
              <button key={e.nome} type="button" className={`${classe} hover:text-tinta`} title={e.nome} aria-label={e.nome} onClick={() => onIr(n)}>
                <Icone nome={e.icone} tamanho={18} />
              </button>
            ) : (
              <span key={e.nome} className={`${classe} ${atual ? "" : "opacity-45"}`} title={e.nome} aria-current={atual ? "step" : undefined}>
                <Icone nome={e.icone} tamanho={18} />
                <span className="sr-only">{e.nome}</span>
              </span>
            );
          })}
        </nav>
      </aside>

      <div className="conteudo flex min-h-dvh flex-col pt-14 lg:pt-0 lg:pl-[76px]">
        {!semBarra && (
          <header className={`no-print ${barraEstatica ? "relative" : "sticky top-14 lg:top-0"} z-20 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-fio-2 bg-white px-[clamp(16px,2.4vw,32px)] py-3.5`}>
            {anterior && (
              <>
                <button
                  type="button"
                  onClick={() => onIr(etapa - 1)}
                  className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-[15px] font-semibold hover:bg-papel"
                >
                  <Icone nome="seta-esquerda" tamanho={20} espessura={2} />
                  <span className="sr-only sm:not-sr-only">{anterior.nome}</span>
                  <span className="sr-only">(voltar)</span>
                </button>
                <span className="hidden h-8 w-px bg-fio-2 sm:block" aria-hidden="true" />
              </>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold tracking-[-0.02em]">Planejamento Estratégico 2027</h1>
              <p className="truncate text-sm text-corpo">{subtitulo}</p>
            </div>

            <ol aria-label="Progresso" className="hidden items-center gap-2 text-sm font-semibold min-[1180px]:flex">
              {ETAPAS.map((e, i) => {
                const n = i + 1;
                const feita = n < etapa;
                const atual = n === etapa;
                const pilula = `flex h-9 items-center gap-2 rounded-full border px-3.5 whitespace-nowrap ${
                  atual ? "border-tinta bg-tinta text-white" : "border-fio bg-white text-corpo"
                }`;
                const marcador = (
                  <i
                    className={`grid size-[22px] place-items-center rounded-full text-[13px] font-bold not-italic ${
                      atual ? "bg-white text-tinta" : feita ? "bg-azul text-white" : "bg-[#e4e6ef] text-corpo"
                    }`}
                  >
                    {feita ? <Icone nome="check" tamanho={12} espessura={3} /> : n}
                  </i>
                );
                return (
                  <li key={e.nome} className="flex items-center gap-2">
                    {i > 0 && <span className="h-px w-6 bg-[#8e90a3]" aria-hidden="true" />}
                    {podeIr(n) && !atual ? (
                      <button type="button" className={`${pilula} hover:border-tinta`} onClick={() => onIr(n)} aria-label={`Ir para ${e.nome}`}>
                        {marcador}
                        {e.nome}
                      </button>
                    ) : (
                      <span className={pilula} aria-current={atual ? "step" : undefined}>
                        {marcador}
                        {e.nome}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>

            {seguir && (
              <BotaoPrincipal onClick={seguir.onClick} disabled={seguir.desabilitado}>
                {seguir.texto}
              </BotaoPrincipal>
            )}
          </header>
        )}

        <main id="conteudo" tabIndex={-1} className={`flex-1 outline-none ${fundoBranco ? "bg-white" : "bg-papel"} ${faixa ? "pb-16 lg:pb-0" : ""}`}>
          {children}
        </main>
      </div>

      {faixa && (
        <div
          aria-hidden="true"
          className="no-print fixed inset-x-0 bottom-0 z-25 flex items-baseline justify-between gap-3 bg-noite px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] text-white lg:hidden"
        >
          <span className="text-sm font-semibold text-white/85">{faixa.rotulo}</span>
          <b className="num text-2xl text-vivo">{faixa.valor}</b>
        </div>
      )}
    </>
  );
}
