"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { Rede } from "@/components/ui/Rede";

const FRASES = ["Lendo os seus números de 2026", "Distribuindo a meta entre os canais", "Calculando o funil de cada canal"];
const DURACAO = 1900;

/**
 * Transição visual antes do plano. Não faz nenhuma requisição: apenas sinaliza a montagem do plano.
 * Com "reduzir movimento" ativado, conclui imediatamente.
 */
export function Gerando({ onConcluir }: { onConcluir: () => void }) {
  const [frase, setFrase] = useState(0);
  const [cheio, setCheio] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onConcluir();
      return;
    }
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setCheio(true)));
    const t1 = setTimeout(() => setFrase(1), 620);
    const t2 = setTimeout(() => setFrase(2), 1240);
    const fim = setTimeout(onConcluir, DURACAO);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(fim);
    };
  }, [onConcluir]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="escuro fixed inset-0 z-50 grid animate-entra place-content-center justify-items-center gap-6 overflow-hidden bg-noite p-6 text-center text-white"
    >
      <Rede className="pointer-events-none absolute inset-0 size-full text-azul opacity-60" />
      <img src="/brand/escala-imob-logo-branco.png" alt="Escala IMOB" width={140} height={49} className="relative h-12 w-auto" />
      <p className="relative min-h-7 text-xl font-semibold tracking-[-0.02em]">{FRASES[frase]}</p>
      <span className="relative block h-2 w-[min(320px,70vw)] overflow-hidden rounded-full bg-white/15" aria-hidden="true">
        <i
          className="block h-full rounded-full bg-vivo transition-[width] duration-[1700ms] ease-[cubic-bezier(.3,.6,.2,1)]"
          style={{ width: cheio ? "100%" : "0%" }}
        />
      </span>
    </div>
  );
}
