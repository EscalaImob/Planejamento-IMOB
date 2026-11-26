"use client";

import { useEffect, useRef } from "react";
import { BotaoPrincipal } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { FormularioLead } from "@/components/lead/FormularioLead";
import type { ControleModalLead } from "@/lib/useCapturaLead";

/**
 * Modal de captura de contato (dialog nativo: foco preso, Esc e fundo inerte).
 * Desktop: cartão central. Mobile (< 640 px): painel inferior.
 * Fechar o modal não apaga o planejamento nem o que foi digitado.
 */
export function ModalLead({ c, linkPlano }: { c: ControleModalLead; linkPlano: () => string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const origemFoco = useRef<HTMLElement | null>(null);
  const aberto = c.estado !== "fechado";
  const enviando = c.estado === "enviando";

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) {
      origemFoco.current = document.activeElement as HTMLElement | null;
      d.showModal();
      // O showModal() foca o primeiro elemento (o botão Fechar); o primeiro campo é mais útil.
      d.querySelector<HTMLInputElement>("#lead-nome")?.focus();
    } else if (!aberto && d.open) {
      d.close();
      origemFoco.current?.focus?.();
    }
  }, [aberto]);


  return (
    <dialog
      ref={ref}
      aria-labelledby="lead-titulo"
      aria-describedby="lead-subtitulo"
      onCancel={(e) => {
        e.preventDefault();
        c.fechar();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) c.fechar();
      }}
      className="no-print m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-[28px] border border-fio bg-white p-0 text-tinta shadow-cartao backdrop:bg-noite/60 backdrop:backdrop-blur-[2px] open:animate-entra sm:m-auto sm:max-w-[480px] sm:rounded-cartao"
    >
      <div className="relative px-6 pt-6 pb-[calc(24px+env(safe-area-inset-bottom))] sm:px-8 sm:pt-8 sm:pb-8">
        <button
          type="button"
          onClick={c.fechar}
          disabled={enviando}
          aria-label="Fechar"
          className="absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full text-corpo hover:bg-papel disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        {c.estado === "sucesso" ? (
          <div className="grid gap-5 pt-2 text-center" role="status" aria-live="polite">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-azul text-white">
              <Icone nome="check" tamanho={28} espessura={3} />
            </span>
            <div>
              <h2 id="lead-titulo" className="text-2xl font-semibold tracking-[-0.03em]">
                Planejamento salvo!
              </h2>
              <p id="lead-subtitulo" className="mt-2 text-base text-corpo">
                {c.acao === "pdf"
                  ? "Abrindo o PDF para você salvar no seu dispositivo…"
                  : c.copiado
                    ? "O link do seu planejamento foi copiado. Guarde-o para acessar seus objetivos quando quiser."
                    : "Copie o link abaixo para acessar seus objetivos quando quiser."}
              </p>
            </div>
            {c.acao === "link" && (
              <div className="grid gap-3 text-left">
                <label htmlFor="lead-link" className="text-[15px] font-semibold">
                  Link do seu planejamento
                </label>
                <input
                  id="lead-link"
                  readOnly
                  value={linkPlano()}
                  onFocus={(e) => e.currentTarget.select()}
                  className="h-12 w-full rounded-xl border border-fio bg-papel px-4 text-sm outline-none focus:border-azul"
                />
                <BotaoPrincipal grande cheio onClick={() => void c.copiarDeNovo()}>
                  {c.copiado ? "Copiar novamente" : "Copiar link do planejamento"}
                </BotaoPrincipal>
                {c.copiado === false && (
                  <p className="text-sm text-corpo">Se a cópia automática não funcionar, selecione o link acima e copie manualmente.</p>
                )}
              </div>
            )}
            <button type="button" onClick={c.fechar} className="mx-auto h-11 rounded-full px-5 text-[15px] font-semibold text-azul hover:bg-azul-claro">
              Voltar ao planejamento
            </button>
          </div>
        ) : (
          <>
          <FormularioLead
            f={c.form}
            textoBotao="Salvar meu planejamento"
            onEnviar={c.enviar}
            cabecalho={
              <div className="pr-10">
                <h2 id="lead-titulo" className="text-[clamp(22px,5vw,26px)] leading-tight font-semibold tracking-[-0.03em]">
                  Seu planejamento está pronto!
                </h2>
                <p id="lead-subtitulo" className="mt-2 text-[15px] leading-snug text-corpo">
                  Salve uma cópia do seu Planejamento Estratégico 2027 e tenha seus objetivos sempre à mão.
                </p>
              </div>
            }
          />
          <p className="mt-3 text-center text-xs text-corpo">Fechar esta janela não apaga o seu planejamento.</p>
          </>
        )}
      </div>
    </dialog>
  );
}
