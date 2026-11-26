import type { ReactNode } from "react";

/** Grade das etapas 1–3: coluna de cartões e painel de resultado fixo ao lado (abaixo, no mobile). */
export function Moldura({ aviso, cartoes, painel }: { aviso?: ReactNode; cartoes: ReactNode; painel: ReactNode }) {
  return (
    <div className="mx-auto max-w-[1320px] px-[clamp(16px,2.4vw,32px)] pt-6 pb-16">
      {aviso}
      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <div className="grid min-w-0 gap-4">{cartoes}</div>
        <aside
          aria-label="Resultado"
          aria-live="polite"
          className="quebra-evitar animate-entra overflow-hidden rounded-cartao border border-fio bg-white shadow-cartao lg:sticky lg:top-[92px]"
        >
          {painel}
        </aside>
      </div>
    </div>
  );
}

/** Topo escuro do painel com o indicador principal. */
export function PainelTopo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="escuro bg-noite p-6 text-white">
      <p className="text-[15px] font-semibold text-white/85">{rotulo}</p>
      <strong className="num mt-2 block text-5xl whitespace-nowrap text-vivo">{valor}</strong>
    </div>
  );
}
