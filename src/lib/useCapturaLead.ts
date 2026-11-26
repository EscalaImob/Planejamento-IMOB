"use client";

import { useCallback, useRef, useState } from "react";
import type { Respostas } from "@/lib/estado";
import {
  errosDoFormulario,
  MENSAGENS,
  mascararTelefone,
  type AcaoExportacao,
  type AcaoLead,
  type CampoLead,
  type EnvioLead,
  type FormularioLead,
} from "@/lib/lead";
import { lerOrigem } from "@/lib/rastreamento";
import { registrarEvento } from "@/lib/eventos";

/**
 * Captura de lead:
 * - etapa de cadastro ("Seu plano"), obrigatória antes de abrir o plano quando a captura está ativa;
 * - modal antes de Baixar PDF / Copiar link, para quem abriu o plano por link compartilhado.
 * "Já salvo nesta sessão" é só conveniência de interface (sessionStorage); não autentica nada.
 * Nada é liberado sem a confirmação de gravação do servidor.
 */
export const CHAVE_SESSAO_LEAD = "escala-imob:lead-salvo-sessao";

const FORM_VAZIO: FormularioLead = { nome: "", whatsapp: "", email: "", marketing: false };

export function salvoNaSessao(): boolean {
  try {
    return window.sessionStorage.getItem(CHAVE_SESSAO_LEAD) === "1";
  } catch {
    return false;
  }
}

function marcarSessao() {
  try {
    window.sessionStorage.setItem(CHAVE_SESSAO_LEAD, "1");
  } catch {
    /* sem efeito */
  }
}

function novaChave(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
      );
}

/* ───────── Formulário (compartilhado pela etapa de cadastro e pelo modal) ───────── */

export type ResultadoEnvio = { ok: true } | { ok: false; campoInvalido?: CampoLead };

export function useFormularioLead(respostas: Respostas) {
  const [form, setForm] = useState<FormularioLead>(FORM_VAZIO);
  const [erros, setErros] = useState<Partial<Record<CampoLead, string>>>({});
  const [tocados, setTocados] = useState<Partial<Record<CampoLead, boolean>>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [site, setSite] = useState(""); // honeypot
  const chave = useRef<string | null>(null);
  const abertoEm = useRef(0);
  const travado = useRef(false);

  /** Marca o início de uma tentativa (gera a chave de idempotência e o relógio do antispam). */
  const iniciar = useCallback(() => {
    if (!chave.current) chave.current = novaChave();
    if (!abertoEm.current) abertoEm.current = Date.now();
    setErroGeral(null);
  }, []);

  const alterar = useCallback(
    <K extends CampoLead>(campo: K, valor: FormularioLead[K]) => {
      const v = (campo === "whatsapp" ? mascararTelefone(String(valor)) : valor) as FormularioLead[K];
      const novo = { ...form, [campo]: v };
      setForm(novo);
      if (tocados[campo]) setErros((e) => ({ ...e, [campo]: errosDoFormulario(novo)[campo] }));
      setErroGeral(null);
    },
    [form, tocados],
  );

  const tocar = useCallback(
    (campo: CampoLead) => {
      setTocados((t) => ({ ...t, [campo]: true }));
      setErros((e) => ({ ...e, [campo]: errosDoFormulario(form)[campo] }));
    },
    [form],
  );

  const enviar = useCallback(
    async (acao: AcaoLead): Promise<ResultadoEnvio> => {
      if (travado.current) return { ok: false };
      const errosLocais = errosDoFormulario(form);
      setTocados({ nome: true, whatsapp: true, email: true });
      setErros(errosLocais);
      const primeiro = (["nome", "whatsapp", "email"] as CampoLead[]).find((c) => errosLocais[c]);
      if (primeiro) return { ok: false, campoInvalido: primeiro };

      travado.current = true;
      setEnviando(true);
      setErroGeral(null);
      if (!abertoEm.current) abertoEm.current = Date.now();
      const corpo: EnvioLead = {
        ...form,
        submission_key: chave.current ?? (chave.current = novaChave()),
        acao,
        tempo_ms: Math.max(0, Date.now() - abertoEm.current),
        site,
        origem: lerOrigem(),
        respostas,
      };

      let motivo = "rede";
      try {
        const resposta = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
          signal: AbortSignal.timeout(25_000),
        });
        const dados = (await resposta.json().catch(() => ({}))) as { ok?: boolean; campos?: Partial<Record<CampoLead, string>> };
        if (resposta.ok && dados.ok === true) {
          marcarSessao();
          chave.current = null;
          abertoEm.current = 0;
          registrarEvento("lead_submitted", { acao });
          travado.current = false;
          setEnviando(false);
          return { ok: true };
        }
        if (resposta.status === 400 && dados.campos) {
          const mapeados: Partial<Record<CampoLead, string>> = {};
          for (const [c, m] of Object.entries(dados.campos) as [CampoLead, string][]) {
            mapeados[c] = MENSAGENS[c as keyof typeof MENSAGENS] ?? m;
          }
          setErros(mapeados);
          motivo = "validacao";
          setErroGeral("Revise os campos destacados.");
        } else if (resposta.status === 429) {
          motivo = "limite";
          setErroGeral("Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.");
        } else {
          motivo = `http_${resposta.status}`;
          setErroGeral("Não foi possível salvar agora. Seus dados continuam aqui: tente novamente em instantes.");
        }
      } catch {
        setErroGeral("Sem conexão com o servidor. Verifique sua internet e tente novamente.");
      }
      travado.current = false;
      setEnviando(false);
      registrarEvento("lead_submission_failed", { acao, motivo });
      return { ok: false };
    },
    [form, respostas, site],
  );

  return { form, erros, erroGeral, enviando, site, setSite, alterar, tocar, iniciar, enviar };
}

export type ControleFormularioLead = ReturnType<typeof useFormularioLead>;

/* ───────── Modal antes de exportar ───────── */

export type EstadoModal = "fechado" | "formulario" | "sucesso";

export type Executores = {
  pdf: () => void;
  /** Devolve true se copiou. */
  link: () => Promise<boolean>;
};

export function useCapturaLead({ ativa, respostas, executores }: { ativa: boolean; respostas: Respostas; executores: Executores }) {
  const f = useFormularioLead(respostas);
  const [estado, setEstado] = useState<EstadoModal>("fechado");
  const [acao, setAcao] = useState<AcaoExportacao>("pdf");
  const [copiado, setCopiado] = useState<boolean | null>(null);

  const executar = useCallback(
    async (qual: AcaoExportacao, comCadastro: boolean) => {
      if (qual === "pdf") {
        executores.pdf();
        registrarEvento("planning_exported", { acao: "pdf", com_cadastro: comCadastro });
        return true;
      }
      const ok = await executores.link();
      if (ok) registrarEvento("planning_exported", { acao: "link", com_cadastro: comCadastro });
      return ok;
    },
    [executores],
  );

  /** Clique em Baixar PDF / Copiar link. */
  const solicitar = useCallback(
    (qual: AcaoExportacao) => {
      if (!ativa || salvoNaSessao()) {
        void executar(qual, !ativa ? false : true);
        return;
      }
      setAcao(qual);
      setCopiado(null);
      f.iniciar();
      setEstado("formulario");
      registrarEvento("lead_form_opened", { acao: qual });
    },
    [ativa, executar, f],
  );

  const fechar = useCallback(() => {
    if (f.enviando) return; // não fecha no meio do envio
    setEstado("fechado");
  }, [f.enviando]);

  const enviar = useCallback(async (): Promise<CampoLead | null> => {
    const r = await f.enviar(acao);
    if (!r.ok) return r.campoInvalido ?? null;
    setEstado("sucesso");
    if (acao === "link") {
      setCopiado(await executar("link", true));
    } else {
      // Mostra a confirmação e então abre a impressão (o modal não sai no PDF).
      window.setTimeout(() => {
        setEstado("fechado");
        window.setTimeout(() => void executar("pdf", true), 150);
      }, 900);
    }
    return null;
  }, [acao, executar, f]);

  const copiarDeNovo = useCallback(async () => setCopiado(await executar("link", true)), [executar]);

  return {
    solicitar,
    modal: {
      estado: f.enviando && estado === "formulario" ? ("enviando" as const) : estado,
      acao,
      copiado,
      form: f,
      enviar,
      fechar,
      copiarDeNovo,
    },
  };
}

export type ControleModalLead = ReturnType<typeof useCapturaLead>["modal"];
