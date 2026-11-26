"use client";

import { CampoMaisMenos } from "@/components/ui/CampoMaisMenos";
import { CartaoPasso, Rotulo } from "@/components/ui/Cartao";
import { Celula, Regua } from "@/components/ui/Indicadores";
import { PainelTopo } from "@/components/etapas/Moldura";
import type { Respostas } from "@/lib/estado";
import { imoveis2027, variacaoMeta, vgv2027 } from "@/lib/calculos";
import { digitos, moeda, numero, quantidade } from "@/lib/formatacao";

const PASSO_META = 10_000;

type Props = { r: Respostas; atualizar: (p: Partial<Respostas>) => void };

export function CartaoMeta({ r, atualizar }: Props) {
  return (
    <CartaoPasso numero={1} icone="meta" titulo="Meta de 2027" pergunta="Quanto você quer receber de comissão em 2027?">
      <div>
        <Rotulo htmlFor="meta">Comissão desejada em 2027</Rotulo>
        <CampoMaisMenos
          id="meta"
          rotulo="Comissão desejada em 2027"
          prefixo="R$"
          placeholder="0"
          valor={r.meta ? numero(r.meta) : ""}
          onTexto={(t) => atualizar({ meta: digitos(t) || null })}
          onPasso={(d) => atualizar({ meta: Math.max(0, (r.meta ?? 0) + PASSO_META * d) || null })}
        />
      </div>
      {r.meta !== null && r.comissao !== null && r.meta < r.comissao && (
        <p className="text-sm font-medium text-atencao">
          A meta está abaixo da comissão de 2026. O plano será gerado mesmo assim, mantendo os canais atuais.
        </p>
      )}
    </CartaoPasso>
  );
}

export function PainelMeta({ r }: { r: Respostas }) {
  const v = variacaoMeta(r);
  const maior = Math.max(r.comissao ?? 0, r.meta ?? 0, 1);
  return (
    <>
      <PainelTopo rotulo="VGV necessário em 2027" valor={moeda(vgv2027(r))} />
      <dl className="grid grid-cols-2 overflow-hidden">
        <Celula rotulo="Imóveis no ano" valor={r.meta ? quantidade(imoveis2027(r)) : "0"} />
        <Celula
          rotulo="Sobre 2026"
          valor={r.meta ? `${v >= 0 ? "+" : ""}${numero(v * 100)}%` : "0%"}
          corValor={v < 0 ? "var(--color-atencao)" : "var(--color-azul)"}
        />
      </dl>
      <div className="border-t border-fio-2 px-6 py-5">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-[15px] font-semibold text-corpo">Comissão em 2026</dt>
            <dd className="num text-2xl">{moeda(r.comissao)}</dd>
          </div>
          <div>
            <dt className="text-[15px] font-semibold text-corpo">Meta 2027</dt>
            <dd className="num text-2xl text-azul">{moeda(r.meta)}</dd>
          </div>
        </dl>
        <Regua valor={((r.meta ?? 0) / maior) * 100} marca={((r.comissao ?? 0) / maior) * 100} />
      </div>
    </>
  );
}
