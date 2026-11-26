import { describe, expect, it } from "vitest";
import { respostasIniciais, type Respostas } from "@/lib/estado";
import {
  errosDoFormulario,
  esquemaEnvioLead,
  indicadoresDoPlano,
  mascararTelefone,
  normalizarEmail,
  normalizarTelefone,
} from "@/lib/lead";
import { origemDaUrl } from "@/lib/rastreamento";

const cenario: Respostas = {
  ...respostasIniciais(),
  perfil: "corretor",
  comissao: 120_000,
  percentual: 6,
  ticket: 400_000,
  canais: ["trafego", "social", "indicacao", "parcerias"],
  vendasPorCanal: { trafego: 2, indicacao: 1 },
  meta: 300_000,
  etapa: 4,
  planoGerado: true,
};

describe("telefone", () => {
  it("aplica a máscara progressiva", () => {
    expect(mascararTelefone("1")).toBe("(1");
    expect(mascararTelefone("119")).toBe("(11) 9");
    expect(mascararTelefone("11987654321")).toBe("(11) 98765-4321");
    expect(mascararTelefone("1134567890")).toBe("(11) 3456-7890");
    expect(mascararTelefone("+55 (11) 98765-4321")).toBe("(11) 98765-4321");
    expect(mascararTelefone("119876543210000")).toBe("(11) 98765-4321");
  });

  it("normaliza para E.164 e valida DDD e formato", () => {
    expect(normalizarTelefone("(11) 98765-4321")).toBe("+5511987654321");
    expect(normalizarTelefone("5511987654321")).toBe("+5511987654321");
    expect(normalizarTelefone("(48) 3333-4444")).toBe("+554833334444");
    expect(normalizarTelefone("(00) 98765-4321")).toBeNull(); // DDD inexistente
    expect(normalizarTelefone("(20) 98765-4321")).toBeNull(); // DDD inexistente
    expect(normalizarTelefone("(11) 88765-4321")).toBeNull(); // celular sem o 9
    expect(normalizarTelefone("(11) 1234-5678")).toBeNull(); // fixo inválido
    expect(normalizarTelefone("119876")).toBeNull();
  });
});

describe("formulário", () => {
  const valido = { nome: "Maria Souza", whatsapp: "(11) 98765-4321", email: "Maria@Exemplo.com ", marketing: false };

  it("aceita dados válidos", () => {
    expect(errosDoFormulario(valido)).toEqual({});
    expect(normalizarEmail(valido.email)).toBe("maria@exemplo.com");
  });

  it("dá uma mensagem por campo", () => {
    const erros = errosDoFormulario({ nome: "Maria", whatsapp: "123", email: "maria@", marketing: false });
    expect(Object.keys(erros).sort()).toEqual(["email", "nome", "whatsapp"]);
    expect(erros.nome).toMatch(/nome completo/);
  });

  it("marketing é opcional", () => {
    expect(errosDoFormulario({ ...valido, marketing: true })).toEqual({});
  });

  it("envio completo exige chave, ação e respostas válidas", () => {
    const envio = {
      ...valido,
      submission_key: "6f1c1d7e-2c9a-4c1e-9d43-0a1f2b3c4d5e",
      acao: "pdf",
      tempo_ms: 5000,
      site: "",
      origem: { utm_source: "instagram" },
      respostas: cenario,
    };
    expect(esquemaEnvioLead.safeParse(envio).success).toBe(true);
    expect(esquemaEnvioLead.safeParse({ ...envio, acao: "csv" }).success).toBe(false);
    expect(esquemaEnvioLead.safeParse({ ...envio, submission_key: "x" }).success).toBe(false);
  });
});

describe("indicadores do planejamento", () => {
  it("reproduz os números do cenário da auditoria", () => {
    expect(indicadoresDoPlano(cenario)).toEqual({
      professional_profile: "corretor",
      current_vgv: 2_000_000,
      target_vgv: 5_000_000,
      average_ticket: 400_000,
      sales_target: 12.5,
      commission_target: 300_000,
      planning_year: 2027,
    });
  });

  it("não inventa valores ausentes", () => {
    const vazio = indicadoresDoPlano(respostasIniciais());
    expect(vazio.current_vgv).toBeNull();
    expect(vazio.target_vgv).toBeNull();
    expect(vazio.average_ticket).toBeNull();
    expect(vazio.sales_target).toBeNull();
    expect(vazio.commission_target).toBeNull();
    expect(vazio.professional_profile).toBeNull();
  });
});

describe("origem da visita", () => {
  it("lê apenas os parâmetros previstos, sanitizados", () => {
    const o = origemDaUrl("?utm_source=instagram&utm_medium=bio&referral_id=abc123&outro=x&utm_term=%00%01ok");
    expect(o).toEqual({ utm_source: "instagram", utm_medium: "bio", referral_id: "abc123", utm_term: "ok" });
  });

  it("limita o tamanho", () => {
    expect(origemDaUrl(`?utm_campaign=${"a".repeat(500)}`).utm_campaign).toHaveLength(200);
  });
});
