"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { Icone } from "@/components/ui/Icone";

/** Campo de texto no padrão do design system: rótulo acima, anel azul em foco, erro abaixo. */
export function CampoTexto({
  id,
  rotulo,
  erro,
  ...props
}: { id: string; rotulo: string; erro?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "id">) {
  const idErro = `${id}-erro`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-semibold">
        {rotulo}
      </label>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idErro : undefined}
        className={`h-12 w-full rounded-xl border bg-white px-4 text-base outline-none transition-[border-color,box-shadow] placeholder:text-[#8f91a6] focus-visible:outline-none read-only:bg-papel ${
          erro
            ? "border-risco focus:shadow-[0_0_0_3px_rgb(192_38_45/0.2)]"
            : "border-fio focus:border-azul focus:shadow-[0_0_0_3px_rgb(1_6_254/0.2)]"
        }`}
        {...props}
      />
      {erro && (
        <p id={idErro} className="mt-1.5 text-sm font-semibold text-risco">
          {erro}
        </p>
      )}
    </div>
  );
}

/** Caixa de seleção acessível no padrão visual (azul quando marcada). */
export function Caixa({
  id,
  marcada,
  onAlterar,
  erro,
  disabled,
  children,
}: {
  id: string;
  marcada: boolean;
  onAlterar: (marcada: boolean) => void;
  erro?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const idErro = `${id}-erro`;
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-tinta-2">
        <span className="relative mt-px grid size-5 flex-none place-items-center">
          <input
            id={id}
            type="checkbox"
            checked={marcada}
            disabled={disabled}
            onChange={(e) => onAlterar(e.target.checked)}
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? idErro : undefined}
            className={`peer size-5 cursor-pointer appearance-none rounded-md border-2 bg-white transition-colors checked:border-azul checked:bg-azul ${
              erro ? "border-risco" : "border-fio"
            }`}
          />
          <span className="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100">
            <Icone nome="check" tamanho={14} espessura={3} />
          </span>
        </span>
        <span>{children}</span>
      </label>
      {erro && (
        <p id={idErro} className="mt-1.5 ml-8 text-sm font-semibold text-risco">
          {erro}
        </p>
      )}
    </div>
  );
}
