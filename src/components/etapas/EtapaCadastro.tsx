"use client";

import { useEffect } from "react";
import { FormularioLead } from "@/components/lead/FormularioLead";
import { Icone } from "@/components/ui/Icone";
import { Rede } from "@/components/ui/Rede";
import type { Respostas } from "@/lib/estado";
import { registrarEvento } from "@/lib/eventos";
import { useFormularioLead } from "@/lib/useCapturaLead";

/** O que o plano entrega (só o que a aplicação gera de fato; nada é enviado por e-mail ou WhatsApp). */
const ENTREGAS = [
  "Meta de vendas de cada canal de aquisição",
  "Funil mensal de cada canal, do contato à venda",
  "Calendário de início dos canais em 2027",
  "Plano de ação para os primeiros 30 dias",
  "PDF para baixar e link para consultar quando quiser",
];

/**
 * Etapa 4 · Seu plano: cadastro obrigatório antes de abrir o plano (quando a captura está ativa).
 * O plano só é liberado depois que o servidor confirma a gravação do lead na planilha.
 */
export function EtapaCadastro({
  r,
  urlPolitica,
  onConcluir,
}: {
  r: Respostas;
  urlPolitica: string;
  onConcluir: () => void;
}) {
  const f = useFormularioLead(r);

  useEffect(() => {
    registrarEvento("lead_form_opened", { acao: "cadastro" });
  }, []);

  return (
    <div className="mx-auto max-w-[1320px] px-[clamp(16px,2.4vw,32px)] pt-6 pb-16">
      <div className="mx-auto grid max-w-[1080px] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-stretch lg:gap-8">
        <section
          aria-labelledby="cadastro-titulo"
          className="escuro relative isolate flex animate-entra flex-col justify-center overflow-hidden rounded-cartao bg-noite p-[clamp(24px,3.4vw,40px)] text-white"
        >
          <Rede className="pointer-events-none absolute inset-0 -z-10 size-full text-azul opacity-40" />
          <small className="text-[15px] font-semibold text-white/85">Etapa 4 de 4 · Seu plano</small>
          <h2 id="cadastro-titulo" className="mt-1.5 text-[clamp(26px,3vw,38px)] leading-[1.08] font-semibold tracking-[-0.04em] text-balance">
            Seu Planejamento Estratégico 2027 <span className="text-vivo">já pode ser gerado</span>
          </h2>
          <ul className="mt-6 grid gap-2.5">
            {ENTREGAS.map((item) => (
              <li key={item} className="flex items-center gap-3.5 rounded-2xl bg-white px-4 py-3.5 text-[17px] leading-tight font-semibold tracking-[-0.02em] text-tinta">
                <i className="grid size-7 flex-none place-items-center rounded-full bg-azul text-white not-italic">
                  <Icone nome="check" tamanho={14} espessura={3} />
                </i>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="cadastro-form-titulo"
          className="animate-entra overflow-hidden rounded-cartao border border-fio bg-white p-[clamp(20px,2.4vw,28px)] shadow-cartao"
          style={{ animationDelay: "80ms" }}
        >
          <FormularioLead
            f={f}
            urlPolitica={urlPolitica}
            textoBotao="Gerar meu Plano 2027"
            onEnviar={async () => {
              const resultado = await f.enviar("cadastro");
              if (resultado.ok) onConcluir();
              return resultado.ok ? null : (resultado.campoInvalido ?? null);
            }}
            cabecalho={
              <h3 id="cadastro-form-titulo" className="text-[22px] font-semibold tracking-[-0.03em]">
                Para quem é o plano?
              </h3>
            }
          />
        </section>
      </div>
    </div>
  );
}
