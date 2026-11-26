import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icone } from "./Icone";

/** Seta dupla que desliza no hover (a segunda entra quando a primeira sai). */
function SetaDeslizante({ grande }: { grande?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative grid flex-none place-items-center overflow-hidden rounded-full bg-noite text-white ${
        grande ? "size-[42px]" : "size-9"
      }`}
    >
      <Icone
        nome="seta-direita"
        tamanho={16}
        espessura={2.2}
        className="transition-transform duration-[450ms] ease-mola group-hover:translate-x-[30px]"
      />
      <Icone
        nome="seta-direita"
        tamanho={16}
        espessura={2.2}
        className="absolute -translate-x-[30px] transition-transform duration-[450ms] ease-mola group-hover:translate-x-0"
      />
    </span>
  );
}

type Variante = "primario" | "contorno-escuro";

export function BotaoPrincipal({
  children,
  grande,
  cheio,
  variante = "primario",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  grande?: boolean;
  cheio?: boolean;
  variante?: Variante;
}) {
  const base =
    "group inline-flex items-center gap-3 rounded-full font-semibold whitespace-nowrap transition-[background-color,box-shadow,transform] duration-200 ease-mola hover:-translate-y-px active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45";
  const tamanho = grande ? "h-14 pl-[26px] pr-[7px] text-base" : "h-12 pl-[22px] pr-1.5 text-[15px]";
  const cor =
    variante === "primario"
      ? "bg-azul text-white shadow-cta hover:bg-azul-escuro"
      : "bg-white/10 text-white ring-1 ring-inset ring-white/40 hover:bg-white/15";
  return (
    <button
      type="button"
      className={`${base} ${tamanho} ${cor} ${cheio ? "h-auto min-h-14 w-full justify-between py-[7px] text-left leading-tight whitespace-normal" : ""} ${className}`}
      {...props}
    >
      <span>{children}</span>
      <SetaDeslizante grande={grande} />
    </button>
  );
}

/** Botão secundário em pílula com contorno (ações do plano). */
export function BotaoSecundario({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className={`inline-flex h-10 items-center gap-2 rounded-full border border-fio bg-white px-4 text-sm font-semibold shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-colors hover:border-tinta/40 hover:bg-papel disabled:opacity-45 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
