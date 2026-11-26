"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { BotaoPrincipal } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { Aviso } from "@/components/ui/Indicadores";
import { CampoTexto, Caixa } from "@/components/lead/Campos";
import type { ControleModalLead } from "@/lib/useCapturaLead";

/**
 * Modal de captura de contato (dialog nativo: foco preso, Esc e fundo inerte).
 * Desktop: cartão central. Mobile (< 640 px): painel inferior.
 * Fechar o modal não apaga o planejamento nem o que foi digitado.
 */
export function ModalLead({ c, urlPolitica, linkPlano }: { c: ControleModalLead; urlPolitica: string; linkPlano: () => string }) {
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

  const aoEnviar = async (e: FormEvent) => {
    e.preventDefault();
    const invalido = await c.enviar();
    if (invalido) {
      const alvo = invalido === "privacidade" ? "lead-privacidade" : `lead-${invalido}`;
      document.getElementById(alvo)?.focus();
    }
  };

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
          className="absolute top-4 right-4 grid size-10 place-items-center rounded-full text-corpo hover:bg-papel disabled:opacity-40"
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
          <form onSubmit={aoEnviar} noValidate aria-busy={enviando} className="grid gap-4">
            <div className="pr-10">
              <h2 id="lead-titulo" className="text-[clamp(22px,5vw,26px)] leading-tight font-semibold tracking-[-0.03em]">
                Seu planejamento está pronto!
              </h2>
              <p id="lead-subtitulo" className="mt-2 text-[15px] leading-snug text-corpo">
                Salve uma cópia do seu Planejamento Estratégico 2027 e tenha seus objetivos sempre à mão.
              </p>
            </div>

            {c.erroGeral && <Aviso>{c.erroGeral}</Aviso>}

            <CampoTexto
              id="lead-nome"
              rotulo="Nome completo"
              autoComplete="name"
              value={c.form.nome}
              onChange={(e) => c.alterar("nome", e.target.value)}
              onBlur={() => c.tocar("nome")}
              erro={c.erros.nome}
              readOnly={enviando}
              maxLength={120}
            />
            <CampoTexto
              id="lead-whatsapp"
              rotulo="WhatsApp"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(00) 00000-0000"
              value={c.form.whatsapp}
              onChange={(e) => c.alterar("whatsapp", e.target.value)}
              onBlur={() => c.tocar("whatsapp")}
              erro={c.erros.whatsapp}
              readOnly={enviando}
            />
            <CampoTexto
              id="lead-email"
              rotulo="E-mail"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={c.form.email}
              onChange={(e) => c.alterar("email", e.target.value)}
              onBlur={() => c.tocar("email")}
              erro={c.erros.email}
              readOnly={enviando}
              maxLength={254}
            />

            {/* Honeypot: invisível para pessoas; robôs costumam preencher. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="lead-site">Site</label>
              <input id="lead-site" tabIndex={-1} autoComplete="off" value={c.site} onChange={(e) => c.setSite(e.target.value)} />
            </div>

            <p className="rounded-xl bg-papel px-4 py-3 text-[13px] leading-snug text-corpo">
              Junto com seu contato, guardamos os principais números deste planejamento (perfil, VGV, ticket médio e meta) para que a
              Escala IMOB entenda seu cenário caso entre em contato com você.
            </p>

            <Caixa
              id="lead-privacidade"
              marcada={c.form.privacidade}
              onAlterar={(v) => c.alterar("privacidade", v)}
              erro={c.erros.privacidade}
              disabled={enviando}
            >
              Li e estou ciente da{" "}
              <a href={urlPolitica} target="_blank" rel="noopener noreferrer" className="font-semibold text-azul underline underline-offset-2">
                Política de Privacidade
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
              .
            </Caixa>
            <Caixa id="lead-marketing" marcada={c.form.marketing} onAlterar={(v) => c.alterar("marketing", v)} disabled={enviando}>
              Quero receber conteúdos e ofertas da Escala IMOB por e-mail e WhatsApp. <span className="text-corpo">(opcional)</span>
            </Caixa>

            <BotaoPrincipal type="submit" grande cheio disabled={enviando} aria-disabled={enviando}>
              {enviando ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                  Salvando…
                </span>
              ) : (
                "Salvar meu planejamento"
              )}
            </BotaoPrincipal>
            <p className="text-center text-xs text-corpo">Fechar esta janela não apaga o seu planejamento.</p>
          </form>
        )}
      </div>
    </dialog>
  );
}
