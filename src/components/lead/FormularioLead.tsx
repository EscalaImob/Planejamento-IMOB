"use client";

import type { FormEvent, ReactNode } from "react";
import { BotaoPrincipal } from "@/components/ui/Botao";
import { Aviso } from "@/components/ui/Indicadores";
import { CampoTexto, Caixa } from "@/components/lead/Campos";
import type { CampoLead } from "@/lib/lead";
import type { ControleFormularioLead } from "@/lib/useCapturaLead";

const ID_CAMPO: Record<CampoLead, string> = {
  nome: "lead-nome",
  whatsapp: "lead-whatsapp",
  email: "lead-email",
  privacidade: "lead-privacidade",
  marketing: "lead-marketing",
};

/**
 * Campos do lead (nome, WhatsApp, e-mail, ciência da política, marketing opcional e honeypot),
 * usados na etapa de cadastro e no modal de exportação.
 */
export function FormularioLead({
  f,
  urlPolitica,
  textoBotao,
  onEnviar,
  cabecalho,
}: {
  f: ControleFormularioLead;
  urlPolitica: string;
  textoBotao: string;
  /** Devolve o primeiro campo inválido (para receber o foco), ou null. */
  onEnviar: () => Promise<CampoLead | null>;
  cabecalho?: ReactNode;
}) {
  const aoEnviar = async (e: FormEvent) => {
    e.preventDefault();
    const invalido = await onEnviar();
    if (invalido) document.getElementById(ID_CAMPO[invalido])?.focus();
  };

  return (
    <form onSubmit={aoEnviar} noValidate aria-busy={f.enviando} className="relative grid gap-4">
      {cabecalho}
      {f.erroGeral && <Aviso>{f.erroGeral}</Aviso>}

      <CampoTexto
        id={ID_CAMPO.nome}
        rotulo="Nome completo"
        autoComplete="name"
        value={f.form.nome}
        onFocus={f.iniciar}
        onChange={(e) => f.alterar("nome", e.target.value)}
        onBlur={() => f.tocar("nome")}
        erro={f.erros.nome}
        readOnly={f.enviando}
        maxLength={120}
      />
      <CampoTexto
        id={ID_CAMPO.whatsapp}
        rotulo="WhatsApp"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="(00) 00000-0000"
        value={f.form.whatsapp}
        onFocus={f.iniciar}
        onChange={(e) => f.alterar("whatsapp", e.target.value)}
        onBlur={() => f.tocar("whatsapp")}
        erro={f.erros.whatsapp}
        readOnly={f.enviando}
      />
      <CampoTexto
        id={ID_CAMPO.email}
        rotulo="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={f.form.email}
        onFocus={f.iniciar}
        onChange={(e) => f.alterar("email", e.target.value)}
        onBlur={() => f.tocar("email")}
        erro={f.erros.email}
        readOnly={f.enviando}
        maxLength={254}
      />

      {/* Honeypot: invisível para pessoas; robôs costumam preencher. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="lead-site">Site</label>
        <input id="lead-site" tabIndex={-1} autoComplete="off" value={f.site} onChange={(e) => f.setSite(e.target.value)} />
      </div>

      <p className="rounded-xl bg-papel px-4 py-3 text-[13px] leading-snug text-corpo">
        Junto com seu contato, guardamos os principais números deste planejamento (perfil, VGV, ticket médio e meta) para que a
        Escala IMOB entenda seu cenário caso entre em contato com você.
      </p>

      <Caixa
        id={ID_CAMPO.privacidade}
        marcada={f.form.privacidade}
        onAlterar={(v) => f.alterar("privacidade", v)}
        erro={f.erros.privacidade}
        disabled={f.enviando}
      >
        Li e estou ciente da{" "}
        <a href={urlPolitica} target="_blank" rel="noopener noreferrer" className="font-semibold text-azul underline underline-offset-2">
          Política de Privacidade
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
        .
      </Caixa>
      <Caixa id={ID_CAMPO.marketing} marcada={f.form.marketing} onAlterar={(v) => f.alterar("marketing", v)} disabled={f.enviando}>
        Quero receber conteúdos e ofertas da Escala IMOB por e-mail e WhatsApp. <span className="text-corpo">(opcional)</span>
      </Caixa>

      <BotaoPrincipal type="submit" grande cheio disabled={f.enviando} aria-disabled={f.enviando}>
        {f.enviando ? (
          <span className="inline-flex items-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
            Salvando…
          </span>
        ) : (
          textoBotao
        )}
      </BotaoPrincipal>
    </form>
  );
}
