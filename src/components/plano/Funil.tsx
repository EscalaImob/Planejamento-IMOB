import type { DegrauFunil } from "@/lib/calculos";

/**
 * Funil em faixas: cada degrau é uma faixa centralizada que estreita de cima para baixo,
 * em tons de azul crescentes, com o número dentro e o nome e a taxa ao lado.
 */
export function Funil({ degraus }: { degraus: DegrauFunil[] }) {
  const n = degraus.length;
  return (
    <ol className="mx-auto grid max-w-[40rem] gap-1.5" aria-label="Funil do mês">
      {degraus.map((d, i) => {
        const largura = 100 - (i * 55) / Math.max(1, n - 1);
        const tom = 18 + Math.round((i / Math.max(1, n - 1)) * 82);
        return (
          <li key={`${d.rotulo}-${i}`} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center gap-3 @[560px]:grid-cols-[20rem_minmax(0,1fr)]">
            <div className="flex justify-center">
              <div
                className="flex h-14 min-w-fit items-center justify-center rounded-xl px-3 shadow-[0_10px_18px_-14px_rgb(4_6_31/0.6)]"
                style={{
                  width: `${largura}%`,
                  background: `color-mix(in oklab, var(--color-azul) ${tom}%, var(--color-azul-claro))`,
                  color: tom > 55 ? "#fff" : "var(--color-tinta)",
                }}
              >
                <b className={`num whitespace-nowrap ${d.valor.length >= 8 ? "text-[min(22px,5cqw)]" : "text-[26px]"}`}>{d.valor}</b>
              </div>
            </div>
            <div className="min-w-0 border-l border-fio pl-3">
              <p className="text-[15px] leading-tight font-semibold @[560px]:text-[17px]">{d.rotulo}</p>
              {d.detalhe && <p className="mt-0.5 text-[13px] font-medium text-azul @[560px]:text-[15px]">{d.detalhe}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
