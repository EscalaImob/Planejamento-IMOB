"use client";

import { Icone } from "./Icone";

type Props = {
  id: string;
  /** Nome acessível do campo e dos botões. */
  rotulo: string;
  valor: string;
  onTexto: (texto: string) => void;
  onPasso: (direcao: 1 | -1) => void;
  prefixo?: string;
  sufixo?: string;
  placeholder?: string;
  modo?: "numeric" | "decimal";
  /** Estado "calculado": campo derivado de outro, visualmente rebaixado. */
  calculado?: boolean;
  compacto?: boolean;
  invalido?: boolean;
  onFocus?: () => void;
  descricaoId?: string;
};

/** Campo numérico com botões de diminuir e aumentar. */
export function CampoMaisMenos({
  id,
  rotulo,
  valor,
  onTexto,
  onPasso,
  prefixo,
  sufixo,
  placeholder,
  modo = "numeric",
  calculado,
  compacto,
  invalido,
  onFocus,
  descricaoId,
}: Props) {
  const altura = compacto ? "h-[52px]" : "h-14";
  const largura = compacto ? "w-40" : "w-full max-w-[300px]";
  const botao = `grid flex-none place-items-center text-tinta transition-colors hover:bg-papel active:bg-papel-2 ${
    compacto ? "w-[42px]" : "w-[46px]"
  } ${calculado ? "border-fio-2" : "border-fio"}`;
  const borda = invalido ? "border-risco" : calculado ? "border-fio bg-papel" : "border-tinta bg-white";

  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-campo border-2 transition-shadow focus-within:shadow-[0_0_0_4px_rgb(1_6_254/0.2)] ${altura} ${largura} ${borda}`}
    >
      <button type="button" className={`${botao} border-r`} aria-label={`Diminuir ${rotulo}`} onClick={() => onPasso(-1)}>
        <Icone nome="menos" tamanho={16} espessura={2} />
      </button>
      <label htmlFor={id} className="flex min-w-0 flex-1 cursor-text items-baseline justify-center gap-[5px] px-1.5">
        {prefixo && <span className="self-center text-sm font-medium text-corpo">{prefixo}</span>}
        <input
          id={id}
          inputMode={modo}
          autoComplete="off"
          placeholder={placeholder}
          aria-label={rotulo}
          aria-invalid={invalido || undefined}
          aria-describedby={descricaoId}
          value={valor}
          onFocus={(e) => {
            if (calculado) e.currentTarget.select();
            onFocus?.();
          }}
          onChange={(e) => onTexto(e.target.value)}
          className={`campo-auto num w-[9ch] max-w-full self-center border-0 bg-transparent p-0 text-center text-[22px] font-bold outline-none focus-visible:outline-none placeholder:font-semibold placeholder:text-[#a9abbd] ${
            calculado ? "text-corpo" : "text-tinta"
          }`}
        />
        {sufixo && <span className="self-center text-base font-semibold text-tinta">{sufixo}</span>}
      </label>
      <button type="button" className={`${botao} border-l`} aria-label={`Aumentar ${rotulo}`} onClick={() => onPasso(1)}>
        <Icone nome="mais" tamanho={16} espessura={2} />
      </button>
    </div>
  );
}
