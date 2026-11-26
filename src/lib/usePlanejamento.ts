"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  apagarRascunho,
  carregarRascunho,
  lerLinkPlano,
  respostasIniciais,
  salvarRascunho,
  type Respostas,
} from "@/lib/estado";
import { canalPodeAvancar, metaPodeAvancar, validarDiagnostico } from "@/lib/calculos";

/**
 * Estado do planejamento com rascunho local versionado.
 * Carrega após a montagem (evita divergência de hidratação) e salva a cada alteração.
 */
export function usePlanejamento() {
  const [respostas, setRespostas] = useState<Respostas>(respostasIniciais);
  const [pronto, setPronto] = useState(false);
  const carregado = useRef(false);

  useEffect(() => {
    if (carregado.current) return;
    carregado.current = true;
    const doLink = lerLinkPlano(window.location.hash);
    const inicial = doLink ?? carregarRascunho();
    // Carga única do armazenamento local após a montagem.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (inicial) setRespostas(inicial);
    setPronto(true);
  }, []);

  useEffect(() => {
    if (pronto) salvarRascunho(respostas);
  }, [respostas, pronto]);

  const atualizar = useCallback((parcial: Partial<Respostas>) => {
    setRespostas((r) => ({ ...r, ...parcial }));
  }, []);

  /** Etapas acessíveis: as anteriores à atual e, depois do plano gerado, todas as que estiverem válidas. */
  const podeIr = useCallback(
    (destino: number) => {
      if (destino <= respostas.etapa) return true;
      if (!respostas.planoGerado) return false;
      if (validarDiagnostico(respostas)) return false;
      if (destino >= 3 && !canalPodeAvancar(respostas)) return false;
      if (destino >= 4 && !metaPodeAvancar(respostas)) return false;
      return true;
    },
    [respostas],
  );

  const ir = useCallback(
    (etapa: number) => {
      setRespostas((r) => ({ ...r, etapa }));
      if (window.location.hash) history.replaceState(null, "", window.location.pathname + window.location.search);
      window.scrollTo({ top: 0 });
    },
    [],
  );

  const recomecar = useCallback(() => {
    apagarRascunho();
    if (window.location.hash) history.replaceState(null, "", window.location.pathname + window.location.search);
    setRespostas(respostasIniciais());
    window.scrollTo({ top: 0 });
  }, []);

  return { respostas, pronto, atualizar, ir, podeIr, recomecar };
}
