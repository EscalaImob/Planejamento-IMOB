import type { ReactNode } from "react";

/** Chave liga/desliga (role="switch"). */
export function Chave({
  ligada,
  onAlternar,
  rotulo,
}: {
  ligada: boolean;
  onAlternar: () => void;
  rotulo: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligada}
      aria-label={rotulo}
      onClick={onAlternar}
      className="grid h-12 flex-none place-items-center rounded-full transition-transform active:scale-[0.97]"
    >
      <span
        aria-hidden="true"
        className={`flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-200 ${
          ligada ? "bg-azul" : "bg-fio"
        }`}
      >
        <span
          className={`size-6 rounded-full bg-white shadow-[0_1px_3px_rgb(4_6_31/0.35)] transition-transform duration-[250ms] ease-mola ${
            ligada ? "translate-x-6" : ""
          }`}
        />
      </span>
    </button>
  );
}

export const COR_FAIXA = {
  baixo: "var(--color-risco)",
  medio: "var(--color-atencao)",
  alto: "var(--color-azul)",
} as const;

/** Anel de progresso 0–100 com o número no centro. */
export function Anel({ valor, cor, legenda }: { valor: number; cor: string; legenda: string }) {
  const C = 2 * Math.PI * 50;
  return (
    <div className="relative size-28 flex-none">
      <svg viewBox="0 0 112 112" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="56" cy="56" r="50" fill="none" strokeWidth="11" stroke="#e4e6ef" />
        <circle
          cx="56"
          cy="56"
          r="50"
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
          stroke={cor}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - Math.min(100, Math.max(0, valor)) / 100)}
          className="transition-[stroke-dashoffset,stroke] duration-[600ms] ease-mola"
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <strong className="num text-[34px]">{valor}</strong>
        <small className="text-xs font-semibold text-corpo">{legenda}</small>
      </div>
    </div>
  );
}

/** Régua de comparação: barra até `valor` e marcador vertical em `marca` (0–100). */
export function Regua({ valor, marca }: { valor: number; marca: number }) {
  return (
    <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-papel-2" aria-hidden="true">
      <i
        className="absolute inset-y-0 left-0 rounded-full bg-azul transition-[width] duration-500 ease-mola"
        style={{ width: `${valor}%` }}
      />
      <u
        className="absolute inset-y-0 w-[3px] bg-tinta transition-[left] duration-500 ease-mola"
        style={{ left: `calc(${marca}% - 3px)` }}
      />
    </div>
  );
}

/** Barra horizontal simples (proporção 0–100). */
export function BarraH({ valor, clara }: { valor: number; clara?: boolean }) {
  return (
    <span className={`block h-3 overflow-hidden rounded-full ${clara ? "bg-white/15" : "bg-[#e4e6ef]"}`} aria-hidden="true">
      <i className="block h-full rounded-full bg-azul" style={{ width: `${valor}%` }} />
    </span>
  );
}

/** Aviso de erro no topo do conteúdo. */
export function Aviso({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="mb-4 rounded-2xl border border-[#f0c4c6] bg-risco-claro px-5 py-3.5 text-[15px] font-semibold text-[#8c1c21]"
    >
      {children}
    </p>
  );
}

/** Célula de indicador (rótulo, valor, unidade). */
export function Celula({
  rotulo,
  valor,
  unidade,
  destaque,
  corValor,
  className = "",
}: {
  rotulo: string;
  valor: ReactNode;
  unidade?: string;
  destaque?: boolean;
  corValor?: string;
  className?: string;
}) {
  return (
    <div
      className={`-mr-px -mb-px min-w-0 border-r border-b border-fio-2 px-6 py-4 ${destaque ? "bg-azul-claro" : ""} ${className}`}
    >
      <dt className={`block text-[15px] font-semibold ${destaque ? "text-azul" : "text-corpo"}`}>{rotulo}</dt>
      <dd className="num mt-0.5 block text-[28px] leading-[1.2] whitespace-nowrap" style={corValor ? { color: corValor } : undefined}>
        <span className={destaque ? "text-azul" : undefined}>{valor}</span>
      </dd>
      {unidade !== undefined && <small className="mt-0.5 block text-sm text-corpo">{unidade || " "}</small>}
    </div>
  );
}
