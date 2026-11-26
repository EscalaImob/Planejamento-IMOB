"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BotaoPrincipal, BotaoSecundario } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { Anel, BarraH, COR_FAIXA } from "@/components/ui/Indicadores";
import { Placa, type NomeIconePlaca } from "@/components/ui/Placa";
import { Rede } from "@/components/ui/Rede";
import { Funil } from "@/components/plano/Funil";
import { CANAIS } from "@/config/canais";
import { DIAGNOSTICO_URL } from "@/config/ambiente";
import { gerarLinkPlano, ROTULO_PERFIL, type Respostas } from "@/lib/estado";
import {
  faixaIndice,
  gerarPlano,
  imoveis2026,
  indiceAquisicao,
  indiceComPlano,
  nomeCanal,
  ticketMedio,
  variacaoMeta,
  vendaInteira,
  vendasPorCanal2026,
  vgv2026,
  vgv2027,
  type LinhaPlano,
} from "@/lib/calculos";
import { moeda, numero, percentual, quantidade, taxa } from "@/lib/formatacao";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type Props = {
  r: Respostas;
  onAjustar: () => void;
  onRecomecar: () => void;
};

/* ───────── Peças ───────── */

function Secao({ n, id, titulo, children }: { n: number; id: string; titulo: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="escuro grid min-w-0 grid-cols-[minmax(0,1fr)] scroll-mt-[calc(var(--topo)+84px)] gap-4 rounded-painel bg-noite p-[clamp(12px,2vw,28px)]">
      <header className="flex items-center gap-[clamp(14px,2vw,22px)] px-[clamp(6px,1vw,8px)] pt-[clamp(8px,1.4vw,12px)] pb-[clamp(10px,1.6vw,16px)] text-white">
        <i className="num grid size-[clamp(52px,6vw,72px)] flex-none place-items-center rounded-[clamp(14px,1.6vw,20px)] bg-white text-[clamp(28px,3.4vw,40px)] text-tinta not-italic">
          {n}
        </i>
        <div>
          <small className="block text-base font-semibold text-white/85">Seção {n} de 5</small>
          <h2 id={`${id}-t`} className="text-[clamp(28px,2.8vw,40px)] leading-[1.08] font-semibold tracking-[-0.04em] text-balance">
            {titulo}
          </h2>
        </div>
      </header>
      {children}
    </section>
  );
}

function Bloco({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`quebra-evitar overflow-hidden rounded-cartao border border-fio bg-white text-tinta [container-type:inline-size] ${className}`}>
      {children}
    </div>
  );
}

function CabecalhoBloco({ titulo, extra, children }: { titulo?: string; extra?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-fio-2 px-[clamp(20px,2.4vw,32px)] py-5">
      {children}
      {titulo && <h3 className="min-w-0 flex-[1_1_12rem] text-[22px] font-semibold tracking-[-0.03em]">{titulo}</h3>}
      {extra}
    </header>
  );
}

function Metrica({ rotulo, valor, unidade, destaque }: { rotulo: string; valor: string; unidade?: string; destaque?: boolean }) {
  return (
    <div className={`-mr-px -mb-px flex min-h-[104px] min-w-0 flex-col justify-center border-r border-b border-fio-2 px-6 py-4 ${destaque ? "bg-azul-claro" : ""}`}>
      <dt className={`text-[15px] font-semibold ${destaque ? "text-azul" : "text-corpo"}`}>{rotulo}</dt>
      <dd className={`num mt-0.5 text-[clamp(24px,2.4vw,32px)] leading-[1.2] whitespace-nowrap ${destaque ? "text-azul" : ""}`}>{valor}</dd>
      {unidade !== undefined && <small className="mt-0.5 text-sm text-corpo">{unidade || " "}</small>}
    </div>
  );
}

function ListaCheck({ itens }: { itens: string[] }) {
  return (
    <ul className="grid gap-3">
      {itens.map((t) => (
        <li key={t} className="flex items-start gap-3 text-[17px] leading-snug">
          <i className="mt-px grid size-6 flex-none place-items-center rounded-full bg-azul text-white not-italic">
            <Icone nome="check" tamanho={12} espessura={3} />
          </i>
          {t}
        </li>
      ))}
    </ul>
  );
}

/* ───────── Cartão de cada canal ───────── */

function CartaoCanal({ l, i, r }: { l: LinhaPlano; i: number; r: Respostas }) {
  const t = ticketMedio(r);
  const v = vendaInteira(l.vendasMesCruzeiro);
  const pct = (r.percentual ?? 0) / 100;
  const divide = l.canal.divisaoComissao;
  const degraus = [
    ...l.funil.degraus,
    {
      rotulo: "Vendas",
      valor: quantidade(v.vendas),
      detalhe: v.aCadaMeses > 1 ? `uma a cada ${numero(v.aCadaMeses)} meses` : l.funil.fecha ? `${taxa(l.funil.fecha)} compram` : "por mês",
    },
    { rotulo: "VGV", valor: moeda(v.vendas * t), detalhe: `imóvel de ${moeda(t)}` },
    {
      rotulo: "Comissão",
      valor: moeda(v.vendas * t * pct * (divide ?? 1)),
      detalhe: `${percentual(r.percentual ?? 0)}${divide ? ", dividida" : ""}`,
    },
  ];
  const nome = nomeCanal(l.canal, r.perfil);
  return (
    <article id={`canal-${l.canal.id}`} aria-labelledby={`canal-${l.canal.id}-t`} className="scroll-mt-[calc(var(--topo)+84px)]">
      <Bloco className="bg-papel">
        <CabecalhoBloco
          extra={
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap ${
                l.jaUsa ? "bg-white text-tinta ring-1 ring-fio ring-inset" : "bg-azul text-white"
              }`}
            >
              {l.jaUsa ? "Você já usa" : `Canal novo · começa em ${MESES[l.mesEntrada - 1]}`}
            </span>
          }
        >
          <Placa canal={l.canal.id} />
          <div className="min-w-0 flex-[1_1_12rem]">
            <small className="block text-[15px] font-semibold text-azul">Canal {i + 1}</small>
            <h3 id={`canal-${l.canal.id}-t`} className="text-[clamp(24px,2.4vw,32px)] leading-[1.1] font-semibold tracking-[-0.035em]">
              {nome}
            </h3>
          </div>
        </CabecalhoBloco>
        <div className="grid bg-white @[880px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="px-[clamp(16px,2vw,32px)] py-7">
            <h4 className="mb-6 text-center text-[26px] leading-tight font-semibold tracking-[-0.03em]">Funil do mês</h4>
            <Funil degraus={degraus} />
          </div>
          <dl className="grid auto-rows-fr grid-cols-2 border-t border-fio-2 @[880px]:border-t-0 @[880px]:border-l">
            <Metrica rotulo={l.funil.principal.rotulo} valor={l.funil.principal.valor} unidade={l.funil.principal.unidade} />
            <Metrica rotulo={l.funil.secundaria.rotulo} valor={l.funil.secundaria.valor} unidade={l.funil.secundaria.unidade} />
            <Metrica rotulo="Vendas em 2026" valor={quantidade(l.vendas2026)} unidade={l.jaUsa ? "no ano" : "canal novo"} />
            <Metrica rotulo="Vendas em 2027" valor={quantidade(l.vendas2027)} unidade="no ano" />
            <Metrica rotulo="VGV em 2027" valor={moeda(l.vgv2027)} unidade="no ano" />
            <Metrica rotulo="Comissão em 2027" valor={moeda(l.comissao2027)} unidade={divide ? "dividida com o parceiro" : "no ano"} destaque />
          </dl>
        </div>
        <div className="border-t border-fio-2 bg-white px-[clamp(20px,2.4vw,32px)] py-[clamp(20px,2.4vw,28px)]">
          <h4 className="mb-3.5 text-lg font-semibold tracking-[-0.02em]">Como executar</h4>
          <ListaCheck itens={l.canal.acoes} />
        </div>
        <p className="border-t border-fio-2 px-[clamp(20px,2.4vw,32px)] py-4 text-base text-corpo">
          Indicador de acompanhamento: <b className="font-semibold text-tinta">{l.canal.indicador}</b>
        </p>
      </Bloco>
    </article>
  );
}

/* ───────── Plano ───────── */

export function Plano({ r, onAjustar, onRecomecar }: Props) {
  const plano = useMemo(() => gerarPlano(r), [r]);
  const t = ticketMedio(r);
  const total26 = imoveis2026(r);
  const mix = vendasPorCanal2026(r);
  const maiorMix = Math.max(...r.canais.map((id) => mix[id] ?? 0), 0.0001);
  const indiceHoje = indiceAquisicao(r.canais.length);
  const indiceDepois = indiceComPlano(r, plano);
  const fHoje = faixaIndice(indiceHoje);
  const fDepois = faixaIndice(indiceDepois);
  const variacao = variacaoMeta(r);
  const trafego = plano.linhas.find((l) => l.canal.id === "trafego");

  const novosCedo = plano.linhas.filter((l) => l.mesEntrada <= 2 && !l.jaUsa);
  const semana2 = (novosCedo.length ? novosCedo : [...plano.linhas].sort((a, b) => b.crescimento - a.crescimento)).slice(0, 4);
  const vm = vendaInteira(plano.vendas2027 / 12);
  const quando = vm.aCadaMeses > 1 ? `a cada ${numero(vm.aCadaMeses)} meses` : "por mês";

  /* Navegação por seções com destaque da seção visível */
  const navRef = useRef<HTMLElement>(null);
  const [ativa, setAtiva] = useState(0);
  const ancoras = useMemo(
    () => [
      { id: "secao-meta", rotulo: "Planejamento", n: 1 },
      { id: "secao-diagnostico", rotulo: "Diagnóstico", n: 2 },
      { id: "secao-canais", rotulo: "Gestão de canais", n: 3 },
      ...plano.linhas.map((l) => ({ id: `canal-${l.canal.id}`, rotulo: nomeCanal(l.canal, r.perfil), n: 0 })),
      { id: "secao-calendario", rotulo: "Calendário", n: 4 },
      { id: "secao-30-dias", rotulo: "Próximos passos", n: 5 },
    ],
    [plano, r.perfil],
  );

  useEffect(() => {
    let quadro = 0;
    const ler = () => {
      quadro = 0;
      let i = 0;
      ancoras.forEach((a, k) => {
        const el = document.getElementById(a.id);
        if (el && el.getBoundingClientRect().top <= 160) i = k;
      });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) i = ancoras.length - 1;
      setAtiva(i);
    };
    const aoRolar = () => {
      if (!quadro) quadro = requestAnimationFrame(ler);
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    ler();
    return () => {
      window.removeEventListener("scroll", aoRolar);
      cancelAnimationFrame(quadro);
    };
  }, [ancoras]);

  useEffect(() => {
    const nav = navRef.current;
    const a = nav?.querySelectorAll("a")[ativa] as HTMLElement | undefined;
    if (nav && a) nav.scrollTo({ left: Math.max(0, a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2), behavior: "smooth" });
  }, [ativa]);

  /* Copiar link */
  const [copia, setCopia] = useState<"idle" | "ok" | "erro">("idle");
  const copiar = async () => {
    const link = gerarLinkPlano(r);
    try {
      await navigator.clipboard.writeText(link);
      setCopia("ok");
    } catch {
      // Alternativa para navegadores que bloqueiam a API de área de transferência.
      const area = document.createElement("textarea");
      area.value = link;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      area.remove();
      setCopia(ok ? "ok" : "erro");
    }
    setTimeout(() => setCopia("idle"), 3500);
  };
  const textoCopia = copia === "ok" ? "Link copiado" : copia === "erro" ? "Não foi possível copiar" : "Copiar link";

  const recomecar = () => {
    if (window.confirm("Apagar todas as respostas salvas neste navegador e começar um novo planejamento?")) onRecomecar();
  };

  const semanas: { titulo: string; dias: string; icone: NomeIconePlaca; corpo: ReactNode }[] = [
    {
      dias: "Dias 1 a 7",
      icone: "base",
      titulo: "Organizar a operação",
      corpo: <ListaCheck itens={["Base de contatos inteira no CRM", "Imóvel de destaque definido para cada canal"]} />,
    },
    {
      dias: "Dias 8 a 14",
      icone: "ligar",
      titulo: novosCedo.length ? "Ativar os canais" : "Ajustar os canais",
      corpo: (
        <ul>
          {semana2.map((l) => (
            <li key={l.canal.id} className="flex items-center gap-3 border-t border-fio-2 py-2.5 first:border-t-0">
              <Placa canal={l.canal.id} tamanho="p" />
              <span className="min-w-0 flex-1">
                <b className="block text-base leading-tight font-semibold">{nomeCanal(l.canal, r.perfil)}</b>
                <small className="block text-[13px] text-corpo">{l.funil.principal.rotulo}</small>
              </span>
              <span className="text-right whitespace-nowrap">
                <b className="num block text-xl">{l.funil.principal.valor}</b>
                <small className="block text-[13px] text-corpo">{l.funil.principal.unidade}</small>
              </span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      dias: "Dias 15 a 21",
      icone: "atender",
      titulo: "Rotina de atendimento",
      corpo: <ListaCheck itens={["Primeira resposta a todo contato no mesmo dia", "Acompanhamento até uma resposta definitiva"]} />,
    },
    {
      dias: "Dias 22 a 30",
      icone: "revisar",
      titulo: "Primeira revisão",
      corpo: (
        <>
          <ListaCheck itens={["Comparar os números de cada canal com este plano"]} />
          <dl className="-mx-5 mt-4 -mb-5 grid grid-cols-2 border-t border-fio-2 bg-azul-claro">
            <div className="px-5 py-3.5">
              <dt className="text-[15px] font-semibold text-azul">Vendas</dt>
              <dd className="num text-2xl text-azul">{quantidade(vm.vendas)}</dd>
              <small className="text-[13px] text-corpo">{quando}</small>
            </div>
            <div className="border-l border-fio-2 px-5 py-3.5">
              <dt className="text-[15px] font-semibold text-azul">VGV</dt>
              <dd className="num text-2xl whitespace-nowrap text-azul">{moeda(vm.vendas * t)}</dd>
              <small className="text-[13px] text-corpo">{quando}</small>
            </div>
          </dl>
        </>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1344px] px-[clamp(16px,2.4vw,32px)] pt-4 pb-24">
      <nav
        ref={navRef}
        aria-label="Seções do plano"
        className="no-print sticky top-[calc(var(--topo)+12px)] z-15 -mx-2 mb-4 flex items-center gap-0.5 overflow-x-auto rounded-2xl border border-fio bg-white/95 p-1.5 shadow-[0_10px_30px_-18px_rgb(4_6_31/0.45)] backdrop-blur-md [scrollbar-width:none]"
      >
        {ancoras.map((a, k) => (
          <a
            key={a.id}
            href={`#${a.id}`}
            aria-current={k === ativa ? "location" : undefined}
            className={`flex flex-none items-center gap-1.5 rounded-xl px-2 font-semibold whitespace-nowrap transition-colors ${
              a.n ? "h-10 text-sm" : "h-8 text-[13px]"
            } ${k === ativa ? "bg-tinta text-white" : "text-corpo hover:bg-papel-2 hover:text-tinta"}`}
          >
            {a.n > 0 && (
              <i className={`grid h-6 min-w-6 place-items-center rounded-md text-[13px] font-bold not-italic ${k === ativa ? "bg-white text-tinta" : "bg-[#e4e6ef] text-tinta"}`}>
                {a.n}
              </i>
            )}
            {a.rotulo}
          </a>
        ))}
      </nav>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10">
        {/* 1. Abertura */}
        <header
          id="secao-meta"
          className="quebra-evitar relative isolate animate-entra scroll-mt-[calc(var(--topo)+84px)] overflow-hidden rounded-[32px] border border-fio bg-[linear-gradient(180deg,#fff_0%,var(--color-azul-claro)_100%)] shadow-cartao"
        >
          <Rede className="pointer-events-none absolute inset-y-0 right-0 -z-10 h-full w-[70%] text-azul opacity-50" />
          <div className="p-[clamp(24px,4vw,56px)]">
            <div className="mb-9 flex flex-wrap items-center justify-between gap-x-3 gap-y-4">
              <p className="text-[15px] font-semibold">
                Seu plano <span className="font-normal text-corpo">· {r.perfil ? ROTULO_PERFIL[r.perfil] : "Corretor autônomo"}</span>
              </p>
              <div className="no-print flex flex-wrap gap-3">
                <BotaoSecundario onClick={copiar} aria-live="polite">
                  <Icone nome="link" tamanho={16} espessura={2} />
                  {textoCopia}
                </BotaoSecundario>
                <BotaoSecundario onClick={() => window.print()}>
                  <Icone nome="baixar" tamanho={16} espessura={2} />
                  Baixar PDF
                </BotaoSecundario>
                <BotaoSecundario onClick={onAjustar}>Ajustar os números</BotaoSecundario>
                <BotaoSecundario onClick={recomecar}>
                  <Icone nome="recomecar" tamanho={16} espessura={2} />
                  Recomeçar
                </BotaoSecundario>
              </div>
            </div>
            <p className="flex items-center gap-3 text-base font-semibold">
              <i className="num grid size-10 place-items-center rounded-[10px] bg-tinta text-lg text-white not-italic">1</i>
              Seção 1 de 5 <span className="font-normal text-corpo">· Seu planejamento</span>
            </p>
            <h1 aria-label={`Para receber ${moeda(r.meta)} de comissão em 2027, com ${moeda(vgv2027(r))} de VGV estimado`}>
              <span aria-hidden="true" className="mt-6 block text-[clamp(22px,2.4vw,32px)] font-semibold tracking-[-0.03em] text-tinta-2">
                Para receber em 2027
              </span>
              <span aria-hidden="true" className="num my-3 block text-[clamp(48px,7.4vw,104px)] leading-[0.92] font-bold">
                {moeda(r.meta)}
              </span>
              <span aria-hidden="true" className="block text-[clamp(22px,2.4vw,32px)] font-semibold tracking-[-0.03em] text-tinta-2">
                de comissão, com {moeda(vgv2027(r))} de VGV estimado
              </span>
            </h1>
            <p className="mt-7 inline-flex flex-wrap items-baseline gap-x-5 gap-y-1.5 rounded-2xl border border-azul-suave bg-white/90 px-5 py-3.5 text-[17px] font-medium text-tinta-2">
              <strong className="num text-[28px] text-azul">
                {variacao >= 0 ? "+" : ""}
                {numero(variacao * 100)}% sobre 2026
              </strong>
              <span>
                {quantidade(plano.vendas2027)} imóveis no ano · ticket de {moeda(t)} · comissão de {percentual(r.percentual ?? 0)}
              </span>
            </p>
          </div>
        </header>

        {/* 2. Diagnóstico */}
        <Secao n={2} id="secao-diagnostico" titulo="Diagnóstico de 2026">
          <Bloco>
            <dl className="grid grid-cols-1 @[600px]:grid-cols-3">
              <Metrica rotulo="Comissão em 2026" valor={moeda(r.comissao)} />
              <Metrica rotulo="VGV em 2026" valor={moeda(vgv2026(r))} />
              <Metrica rotulo="Imóveis vendidos" valor={quantidade(total26)} />
            </dl>
          </Bloco>
          <Bloco>
            <CabecalhoBloco titulo="Origem das vendas" />
            <ul className="px-[clamp(20px,2.4vw,32px)] py-2">
              {r.canais.map((id) => {
                const c = CANAIS.find((x) => x.id === id)!;
                const v = mix[id] ?? 0;
                return (
                  <li
                    key={id}
                    className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-fio-2 py-3 text-[17px] font-semibold first:border-t-0 @[600px]:grid-cols-[40px_minmax(0,1.1fr)_minmax(0,1.6fr)_auto]"
                  >
                    <Placa canal={id} tamanho="p" />
                    <span>{nomeCanal(c, r.perfil)}</span>
                    <span className="order-last col-span-full @[600px]:order-none @[600px]:col-span-1">
                      <BarraH valor={(v / maiorMix) * 100} />
                    </span>
                    <em className="min-w-24 text-right text-[15px] font-medium whitespace-nowrap text-corpo not-italic">
                      <b className="num text-[22px] text-tinta">{quantidade(v)}</b> · {total26 ? numero((v / total26) * 100) : 0}%
                    </em>
                  </li>
                );
              })}
            </ul>
          </Bloco>
          <Bloco>
            <CabecalhoBloco
              titulo="Índice de Aquisição"
              extra={<p className="text-base font-medium text-corpo">Você usa {r.canais.length} de {CANAIS.length} canais</p>}
            />
            <div className="flex flex-wrap items-center gap-x-[clamp(16px,3vw,40px)] gap-y-4 p-[clamp(20px,2.4vw,32px)]">
              <div className="flex items-center gap-[18px]">
                <Anel valor={indiceHoje} cor={COR_FAIXA[fHoje.id]} legenda="hoje" />
                <div>
                  <p className="text-sm text-corpo">Hoje</p>
                  <h4 className="text-xl font-semibold" style={{ color: COR_FAIXA[fHoje.id] }}>{fHoje.nome}</h4>
                </div>
              </div>
              <Icone nome="seta-direita" tamanho={28} className="flex-none text-corpo" />
              <div className="flex items-center gap-[18px]">
                <Anel valor={indiceDepois} cor={COR_FAIXA[fDepois.id]} legenda="com o plano" />
                <div>
                  <p className="text-sm text-corpo">Com o plano</p>
                  <h4 className="text-xl font-semibold" style={{ color: COR_FAIXA[fDepois.id] }}>{fDepois.nome}</h4>
                </div>
              </div>
              <p className="basis-full text-sm text-corpo">
                O índice mede só a diversificação dos canais de aquisição, não o desempenho do negócio como um todo.
              </p>
            </div>
          </Bloco>
        </Secao>

        {/* 3. Gestão de canais */}
        <Secao n={3} id="secao-canais" titulo="Gestão de canais · pilar Aquisição">
          <Bloco>
            <CabecalhoBloco
              titulo={`${plano.linhas.length} canais para passar de ${quantidade(plano.vendas2026)} para ${quantidade(plano.vendas2027)} vendas`}
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[660px] border-collapse text-base">
                <caption className="sr-only">Vendas por canal em 2026 e 2027, mês de início e meta mensal</caption>
                <thead>
                  <tr className="bg-papel text-left text-[15px] font-semibold text-corpo">
                    <th scope="col" className="border-b border-fio-2 py-3.5 pr-4 pl-[clamp(20px,2.4vw,32px)]">Canal</th>
                    <th scope="col" className="border-b border-fio-2 px-4 py-3.5 text-right">2026</th>
                    <th scope="col" className="border-b border-fio-2 px-4 py-3.5 text-right">2027</th>
                    <th scope="col" className="border-b border-fio-2 px-4 py-3.5 text-right">Começa em</th>
                    <th scope="col" className="border-b border-fio-2 py-3.5 pr-[clamp(20px,2.4vw,32px)] pl-4">Meta do mês</th>
                  </tr>
                </thead>
                <tbody>
                  {plano.linhas.map((l) => (
                    <tr key={l.canal.id}>
                      <th scope="row" className="border-b border-fio-2 py-3 pr-4 pl-[clamp(20px,2.4vw,32px)] text-left">
                        <span className="flex items-center gap-3 text-[17px] font-semibold whitespace-nowrap">
                          <Placa canal={l.canal.id} tamanho="p" />
                          {nomeCanal(l.canal, r.perfil)}
                        </span>
                      </th>
                      <td className="num border-b border-fio-2 px-4 py-3 text-right text-xl text-corpo">{quantidade(l.vendas2026)}</td>
                      <td className="num border-b border-fio-2 px-4 py-3 text-right text-xl">{quantidade(l.vendas2027)}</td>
                      <td className="border-b border-fio-2 px-4 py-3 text-right font-semibold text-corpo">{MESES[l.mesEntrada - 1]}</td>
                      <td className="border-b border-fio-2 py-3 pr-[clamp(20px,2.4vw,32px)] pl-4">
                        {l.funil.principal.rotulo}: <b className="font-semibold">{l.funil.principal.valor}</b>
                        {l.funil.principal.unidade === "no ano" ? " no ano" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-noite font-semibold text-white">
                    <th scope="row" className="py-[18px] pr-4 pl-[clamp(20px,2.4vw,32px)] text-left">Total</th>
                    <td className="num px-4 py-[18px] text-right text-2xl">{quantidade(plano.vendas2026)}</td>
                    <td className="num px-4 py-[18px] text-right text-2xl text-vivo">{quantidade(plano.vendas2027)}</td>
                    <td />
                    <td className="py-[18px] pr-[clamp(20px,2.4vw,32px)] pl-4">
                      {trafego ? `Investimento em tráfego: ${trafego.funil.principal.valor} por mês` : ""}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="border-t border-fio-2 bg-papel px-[clamp(20px,2.4vw,32px)] py-4 text-base text-corpo">
              Comissão estimada em 2027 com estes canais: <b className="font-semibold text-tinta">{moeda(plano.comissaoPrevista)}</b>
              {plano.temParceriaDividida &&
                plano.comissaoPrevista < (r.meta ?? 0) &&
                ". Fica abaixo da meta porque a comissão das parcerias é dividida com o parceiro."}
            </p>
          </Bloco>
          {plano.linhas.map((l, i) => (
            <CartaoCanal key={l.canal.id} l={l} i={i} r={r} />
          ))}
        </Secao>

        {/* 4. Calendário */}
        <Secao n={4} id="secao-calendario" titulo="Quando cada canal começa">
          <Bloco>
            <div className="overflow-x-auto">
              <div className="grid min-w-[720px] grid-cols-[minmax(170px,240px)_repeat(12,minmax(36px,1fr))] text-sm" role="table" aria-label="Calendário de início dos canais em 2027">
                <div role="row" className="contents">
                  <div role="columnheader" className="border-b border-fio-2 bg-papel py-3.5 pl-[clamp(20px,2.4vw,32px)] text-[15px] font-semibold text-corpo">Canal</div>
                  {MESES.map((m) => (
                    <div key={m} role="columnheader" className="border-b border-fio-2 bg-papel py-3.5 text-center text-[15px] font-semibold text-corpo">
                      {m}
                    </div>
                  ))}
                </div>
                {plano.linhas.map((l) => (
                  <div key={l.canal.id} role="row" className="contents">
                    <div role="rowheader" className="flex items-center gap-3 overflow-hidden border-b border-fio-2 py-3 pr-3 pl-[clamp(20px,2.4vw,32px)] text-[17px] font-semibold whitespace-nowrap">
                      <Placa canal={l.canal.id} tamanho="p" />
                      <span className="truncate">{nomeCanal(l.canal, r.perfil)}</span>
                    </div>
                    <div
                      role="cell"
                      className="col-span-12 grid grid-cols-12 items-center border-b border-fio-2 bg-[linear-gradient(90deg,var(--color-fio-2)_1px,transparent_1px)] bg-size-[calc(100%/12)_100%]"
                    >
                      <i
                        className={`mx-1 flex h-[30px] items-center overflow-hidden rounded-full px-3 text-[13px] font-bold whitespace-nowrap not-italic ${
                          l.jaUsa ? "bg-tinta text-white" : "bg-azul text-white"
                        }`}
                        style={{ gridColumn: `${l.mesEntrada} / 13` }}
                      >
                        {l.jaUsa ? "Já em andamento" : `Começa em ${MESES[l.mesEntrada - 1]}`}
                      </i>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Bloco>
        </Secao>

        {/* 5. Primeiros 30 dias e fecho */}
        <Secao n={5} id="secao-30-dias" titulo="Os primeiros 30 dias">
          <ol className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2 xl:grid-cols-4">
            {semanas.map((s, i) => (
              <li key={s.titulo} className="quebra-evitar flex min-w-0 flex-col">
                <div className="mb-3.5 flex items-center gap-3 text-[15px] font-semibold whitespace-nowrap text-white/85">
                  <i className={`num grid size-11 flex-none place-items-center rounded-[14px] text-[22px] not-italic ${i === 0 ? "bg-vivo text-noite" : "bg-white text-tinta"}`}>
                    {i + 1}
                  </i>
                  <span>{s.dias}</span>
                  <span className="hidden h-0.5 flex-1 rounded bg-white/20 sm:block" aria-hidden="true" />
                </div>
                <div className="flex flex-1 flex-col overflow-hidden rounded-3xl bg-white text-tinta">
                  <header className="flex items-center gap-3.5 px-5 py-[18px]">
                    <Placa icone={s.icone} tamanho="m" />
                    <div>
                      <small className="block text-[15px] font-semibold text-azul">Semana {i + 1}</small>
                      <h3 className="text-xl leading-tight font-semibold tracking-[-0.03em]">{s.titulo}</h3>
                    </div>
                  </header>
                  <div className="flex-1 border-t border-fio-2 px-5 pt-4 pb-5 [&_li]:text-base">{s.corpo}</div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-t border-white/15 px-[clamp(6px,1vw,8px)] pt-[clamp(20px,2.6vw,32px)] pb-[clamp(8px,1.2vw,12px)] text-white">
            <div>
              <p className="text-base font-semibold text-white/85">Comissão, de 2026 para 2027</p>
              <p className="my-2.5 flex flex-wrap items-center gap-x-[clamp(12px,1.6vw,22px)] gap-y-2">
                <span className="num text-[clamp(26px,3vw,40px)] text-white/85">{moeda(r.comissao)}</span>
                <Icone nome="seta-direita" tamanho={28} className="text-white/60" />
                <strong className="num text-[clamp(44px,6vw,84px)] tracking-[-0.05em] text-vivo">{moeda(r.meta)}</strong>
              </p>
              <p className="text-[17px] text-white/85">
                {quantidade(plano.vendas2027)} imóveis no ano · {moeda(vgv2027(r))} de VGV · {plano.linhas.length} canais
              </p>
              {DIAGNOSTICO_URL && (
                <p className="mt-6 hidden rounded-2xl border border-white/25 px-5 py-4 text-base text-white print:block">
                  <b className="block font-semibold">Próximo passo: Diagnóstico da Escala IMOB</b>
                  Este plano cobre o pilar Aquisição. Para uma análise da operação como um todo, acesse{" "}
                  <a href={DIAGNOSTICO_URL} className="font-semibold text-vivo underline">
                    {DIAGNOSTICO_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                </p>
              )}
            </div>
            <div className="no-print grid w-full min-w-0 max-w-md gap-3">
              <p className="text-[15px] leading-snug text-white/85">
                Este plano cobre o pilar Aquisição. O Diagnóstico da Escala IMOB analisa a sua operação como um todo antes de qualquer recomendação.
              </p>
              {DIAGNOSTICO_URL ? (
                <a
                  href={DIAGNOSTICO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex min-h-14 items-center justify-between gap-3 rounded-full bg-azul py-[7px] pr-[7px] pl-[26px] text-left text-base leading-tight font-semibold text-white shadow-cta transition-[background-color,transform] duration-200 ease-mola hover:-translate-y-px hover:bg-azul-escuro active:scale-[0.97]"
                >
                  Fazer o Diagnóstico da Escala IMOB
                  <span className="grid size-[42px] place-items-center rounded-full bg-white text-azul">
                    <Icone nome="externo" tamanho={18} espessura={2} />
                  </span>
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              ) : (
                <>
                  <BotaoPrincipal grande cheio disabled aria-describedby="aviso-diagnostico">
                    Fazer o Diagnóstico da Escala IMOB
                  </BotaoPrincipal>
                  <p id="aviso-diagnostico" role="note" className="rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white/90">
                    Link do Diagnóstico ainda não configurado (NEXT_PUBLIC_DIAGNOSTICO_URL).
                  </p>
                </>
              )}
              <div className="flex flex-wrap gap-3">
                <BotaoPrincipal variante="contorno-escuro" onClick={() => window.print()}>
                  Baixar PDF
                </BotaoPrincipal>
                <button
                  type="button"
                  onClick={copiar}
                  className="h-12 rounded-full bg-white/10 px-[22px] text-[15px] font-semibold text-white ring-1 ring-white/40 ring-inset hover:bg-white/15"
                >
                  {textoCopia}
                </button>
              </div>
            </div>
          </div>
        </Secao>

        <p className="px-4 text-center text-sm text-corpo">
          Estimativas calculadas a partir dos números informados e de premissas médias provisórias. Não são garantia de vendas, contatos, VGV ou
          comissão.
        </p>
      </div>
    </div>
  );
}
