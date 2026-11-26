"use client";

import { useCallback, useEffect, useState } from "react";
import { Casca } from "@/components/casca/Casca";
import { Moldura } from "@/components/etapas/Moldura";
import { CartoesDiagnostico, PainelDiagnostico } from "@/components/etapas/EtapaDiagnostico";
import { CartaoCanais, PainelCanais } from "@/components/etapas/EtapaCanais";
import { CartaoMeta, PainelMeta } from "@/components/etapas/EtapaMeta";
import { Gerando } from "@/components/plano/Gerando";
import { Plano } from "@/components/plano/Plano";
import { Aviso } from "@/components/ui/Indicadores";
import { usePlanejamento } from "@/lib/usePlanejamento";
import { canalPodeAvancar, metaPodeAvancar, oportunidades, validarDiagnostico, vgv2026, vgv2027 } from "@/lib/calculos";
import { moeda } from "@/lib/formatacao";

const SUBTITULOS = [
  "",
  "Seus números de 2026. O resultado aparece ao lado.",
  "De quais canais vieram as suas vendas de 2026.",
  "Quanto você quer receber de comissão em 2027.",
  "Seu plano de aquisição para 2027.",
];

export function Planejador() {
  const { respostas: r, pronto, atualizar, ir, podeIr, recomecar } = usePlanejamento();
  const [aviso, setAviso] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  const atualizarLimpando = (p: Parameters<typeof atualizar>[0]) => {
    setAviso(null);
    atualizar(p);
  };

  const irPara = (etapa: number) => {
    setAviso(null);
    ir(etapa);
  };

  const concluirGeracao = useCallback(() => {
    setGerando(false);
    atualizar({ planoGerado: true, etapa: 4 });
    window.scrollTo({ top: 0 });
  }, [atualizar]);

  // Nunca exibir uma etapa cujos pré-requisitos não estão preenchidos (rascunho antigo ou link incompleto).
  const etapaMaxima = validarDiagnostico(r) ? 1 : !canalPodeAvancar(r) ? 2 : !metaPodeAvancar(r) || !r.planoGerado ? 3 : 4;
  useEffect(() => {
    if (pronto && r.etapa > etapaMaxima) atualizar({ etapa: etapaMaxima });
  }, [pronto, r.etapa, etapaMaxima, atualizar]);

  if (!pronto || r.etapa > etapaMaxima) return <div className="min-h-dvh bg-papel" aria-busy="true" />;

  const base = { subtitulo: SUBTITULOS[r.etapa], podeIr, onIr: irPara };

  if (r.etapa === 1) {
    return (
      <Casca
        {...base}
        etapa={1}
        faixa={{ rotulo: "VGV gerado em 2026", valor: moeda(vgv2026(r)) }}
        seguir={{
          texto: "Próximo",
          onClick: () => {
            const erro = validarDiagnostico(r);
            setAviso(erro);
            if (erro) window.scrollTo({ top: 0, behavior: "smooth" });
            else irPara(2);
          },
        }}
      >
        <Moldura
          aviso={aviso && <Aviso>{aviso}</Aviso>}
          cartoes={<CartoesDiagnostico r={r} atualizar={atualizarLimpando} />}
          painel={<PainelDiagnostico r={r} />}
        />
      </Casca>
    );
  }

  if (r.etapa === 2) {
    const ops = oportunidades(r);
    return (
      <Casca
        {...base}
        etapa={2}
        faixa={{ rotulo: `VGV em aberto · ${ops.length} canais sem uso`, valor: moeda(ops.reduce((a, o) => a + o.vgv, 0)) }}
        seguir={{ texto: "Próximo", onClick: () => irPara(3), desabilitado: !canalPodeAvancar(r) }}
      >
        <Moldura cartoes={<CartaoCanais r={r} atualizar={atualizar} />} painel={<PainelCanais r={r} />} />
      </Casca>
    );
  }

  if (r.etapa === 3) {
    return (
      <>
        <Casca
          {...base}
          etapa={3}
          faixa={{ rotulo: "VGV necessário em 2027", valor: moeda(vgv2027(r)) }}
          seguir={{ texto: "Gerar meu plano", onClick: () => setGerando(true), desabilitado: !metaPodeAvancar(r) || gerando }}
        >
          <Moldura cartoes={<CartaoMeta r={r} atualizar={atualizar} />} painel={<PainelMeta r={r} />} />
        </Casca>
        {gerando && <Gerando onConcluir={concluirGeracao} />}
      </>
    );
  }

  return (
    <Casca {...base} etapa={4} barraEstatica fundoBranco>
      <Plano r={r} onAjustar={() => irPara(1)} onRecomecar={recomecar} />
    </Casca>
  );
}
