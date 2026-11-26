import type { ReactNode } from "react";
import { Placa } from "./Placa";
import type { NomeIconePlaca } from "./Placa";

/** Cartão branco base (raio 28, fio e sombra longa). */
export function Cartao({
  children,
  className = "",
  as: Tag = "section",
  atraso = 0,
  ...props
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "aside" | "article" | "div";
  atraso?: number;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={`quebra-evitar animate-entra overflow-hidden rounded-cartao border border-fio bg-white shadow-cartao [container-type:inline-size] ${className}`}
      style={{ animationDelay: `${atraso}ms` }}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Cartão de pergunta: placa, "Passo N", título e pergunta; abaixo os campos. */
export function CartaoPasso({
  numero,
  icone,
  titulo,
  pergunta,
  children,
  rodape,
  tituloId,
}: {
  numero: number;
  icone: NomeIconePlaca;
  titulo: string;
  pergunta: string;
  children?: ReactNode;
  rodape?: ReactNode;
  tituloId?: string;
}) {
  const idTitulo = tituloId ?? `passo-${numero}-${icone}`;
  return (
    <Cartao atraso={numero * 50} aria-labelledby={idTitulo}>
      <header className="flex items-center gap-4 px-[clamp(20px,2.2vw,28px)] py-5">
        <Placa icone={icone} />
        <div className="min-w-0">
          <small className="block text-[15px] font-semibold text-azul">Passo {numero}</small>
          <h2 id={idTitulo} className="text-[clamp(22px,2.2vw,28px)] leading-[1.1] font-semibold tracking-[-0.035em]">
            {titulo}
          </h2>
          <p className="mt-1 text-base leading-[1.35] text-corpo">{pergunta}</p>
        </div>
      </header>
      {children && (
        <div className="grid gap-5 border-t border-fio-2 px-[clamp(20px,2.2vw,28px)] py-6">{children}</div>
      )}
      {rodape}
    </Cartao>
  );
}

/** Rótulo de campo em negrito, acima do controle. */
export function Rotulo({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block w-fit text-base font-semibold">
      {children}
    </label>
  );
}
