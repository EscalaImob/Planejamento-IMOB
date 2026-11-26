"use client";

import { CampoMaisMenos } from "@/components/ui/CampoMaisMenos";
import { CartaoPasso } from "@/components/ui/Cartao";
import { Anel, Celula, Chave, COR_FAIXA } from "@/components/ui/Indicadores";
import { Placa } from "@/components/ui/Placa";
import { PainelTopo } from "@/components/etapas/Moldura";
import { CANAIS, type CanalId } from "@/config/canais";
import type { Respostas } from "@/lib/estado";
import {
  concentracao,
  descricaoCanal,
  erroDistribuicao,
  faixaIndice,
  imoveis2026,
  indiceAquisicao,
  nomeCanal,
  oportunidades,
  somaInformada,
  vendasPorCanal2026,
} from "@/lib/calculos";
import { digitos, moeda, numero, quantidade } from "@/lib/formatacao";

type Props = { r: Respostas; atualizar: (p: Partial<Respostas>) => void };

export function CartaoCanais({ r, atualizar }: Props) {
  const mix = vendasPorCanal2026(r);
  const total = imoveis2026(r);
  const erro = erroDistribuicao(r);

  const alternar = (id: CanalId) => {
    if (r.canais.includes(id)) {
      const resto = { ...r.vendasPorCanal };
      delete resto[id];
      atualizar({ canais: r.canais.filter((c) => c !== id), vendasPorCanal: resto });
    } else {
      atualizar({ canais: [...r.canais, id] });
      requestAnimationFrame(() => document.getElementById(`vendas-${id}`)?.focus({ preventScroll: true }));
    }
  };

  const definir = (id: CanalId, valor: number) =>
    atualizar({ vendasPorCanal: { ...r.vendasPorCanal, [id]: Math.max(0, valor) } });

  return (
    <CartaoPasso
      numero={1}
      icone="canais"
      titulo={`De onde vieram as suas ${quantidade(total)} vendas`}
      pergunta="Ative os canais que você usou em 2026 e informe quantos imóveis cada um vendeu. Os canais ativos sem número dividem igualmente o restante."
      rodape={
        <p
          role="alert"
          className={`border-t border-fio-2 px-[clamp(20px,2.2vw,28px)] py-3.5 text-[15px] font-semibold text-risco ${erro ? "" : "hidden"}`}
        >
          {erro}
        </p>
      }
    >
      <p className="-mt-1 text-sm font-semibold tracking-wide text-azul uppercase">Pilar Aquisição</p>
      <ul className="grid gap-3">
        {CANAIS.map((c) => {
          const ativo = r.canais.includes(c.id);
          const nome = nomeCanal(c, r.perfil);
          const pct = ativo && total ? `${numero(((mix[c.id] ?? 0) / total) * 100)}%` : "";
          return (
            <li
              key={c.id}
              className={`grid min-h-24 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 rounded-[20px] border bg-white px-4 py-4 @[480px]:gap-x-5 @[480px]:px-5 transition-[border-color,box-shadow] @[640px]:grid-cols-[minmax(0,1fr)_auto_auto] ${
                ativo ? "border-tinta shadow-[inset_0_0_0_1px_var(--color-tinta)]" : "border-fio hover:border-tinta"
              }`}
            >
              <button
                type="button"
                onClick={() => alternar(c.id)}
                tabIndex={-1}
                aria-hidden="true"
                className="flex min-w-0 items-center gap-3 text-left @[480px]:gap-4"
              >
                <Placa canal={c.id} tamanho="m" />
                <span className="min-w-0">
                  <b className="block text-[17px] leading-tight font-semibold tracking-[-0.02em] @[480px]:text-[19px]">{nome}</b>
                  <span className="mt-0.5 block text-sm leading-snug text-corpo @[480px]:text-[15px]">{descricaoCanal(c, r.perfil)}</span>
                </span>
              </button>
              {ativo ? (
              <div className="order-3 col-span-2 flex items-center gap-3 @[640px]:order-none @[640px]:col-span-1">
                    <CampoMaisMenos
                      id={`vendas-${c.id}`}
                      rotulo={`Imóveis vendidos por ${nome}`}
                      placeholder="0"
                      compacto
                      valor={r.vendasPorCanal[c.id] ? String(r.vendasPorCanal[c.id]) : ""}
                      onTexto={(t) => definir(c.id, digitos(t))}
                      onPasso={(d) => definir(c.id, (r.vendasPorCanal[c.id] ?? 0) + d)}
                      invalido={!!erro && (r.vendasPorCanal[c.id] ?? 0) > 0}
                    />
                    <span className="text-[15px] font-medium text-corpo">imóveis</span>
                    <em className="num ml-auto min-w-16 text-right text-2xl text-azul not-italic">{pct}</em>
              </div>
              ) : (
                <span className="hidden @[640px]:block" aria-hidden="true" />
              )}
              <Chave ligada={ativo} onAlternar={() => alternar(c.id)} rotulo={nome} />
            </li>
          );
        })}
      </ul>
    </CartaoPasso>
  );
}

export function PainelCanais({ r }: { r: Respostas }) {
  const ops = oportunidades(r);
  const totalOps = ops.reduce((a, o) => a + o.vgv, 0);
  const indice = indiceAquisicao(r.canais.length);
  const faixa = faixaIndice(indice);
  const conc = concentracao(r);
  return (
    <>
      <PainelTopo
        rotulo={`VGV em aberto · ${ops.length} ${ops.length === 1 ? "canal sem uso" : "canais sem uso"}`}
        valor={moeda(totalOps)}
      />
      <dl className="grid grid-cols-2 overflow-hidden">
        <Celula rotulo="Canais ativos" valor={`${r.canais.length} de ${CANAIS.length}`} />
        <Celula rotulo="Imóveis distribuídos" valor={`${quantidade(somaInformada(r))} de ${quantidade(imoveis2026(r))}`} />
      </dl>
      {!r.canais.length ? (
        <p className="border-t border-fio-2 px-6 py-7 text-base font-medium text-corpo">
          Ative ao menos um canal para calcular o seu Índice de Aquisição.
        </p>
      ) : (
        <>
          <div className="border-t border-fio-2 px-6 py-5">
            <div className="flex items-center gap-[18px]">
              <Anel valor={indice} cor={COR_FAIXA[faixa.id]} legenda="de 100" />
              <div>
                <p className="text-sm text-corpo">Índice de Aquisição</p>
                <h3 className="text-xl font-semibold tracking-[-0.02em]" style={{ color: COR_FAIXA[faixa.id] }}>
                  {faixa.nome}
                </h3>
                <p className="text-sm text-corpo">
                  {r.canais.length} de {CANAIS.length} canais
                  {conc && conc.percentual >= 50 ? ` · ${numero(conc.percentual)}% das vendas em ${nomeCanal(conc.canal, r.perfil)}` : ""}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-snug text-corpo">{faixa.descricao}</p>
          </div>
          {ops.length > 0 && (
            <div className="border-t border-fio-2 px-6 py-5">
              <h3 className="mb-3 text-lg font-semibold tracking-[-0.02em]">Potencial dos canais sem uso</h3>
              <ul>
                {ops.map((o) => (
                  <li key={o.canal.id} className="flex items-center gap-3 border-t border-fio-2 py-2.5 text-base font-semibold first:border-t-0">
                    <Placa canal={o.canal.id} tamanho="p" />
                    <span className="min-w-0 flex-1">{nomeCanal(o.canal, r.perfil)}</span>
                    <b className="num text-xl whitespace-nowrap text-risco">{moeda(o.vgv)}</b>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-snug text-corpo">Estimativa por premissas provisórias. Não é garantia de resultado.</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
