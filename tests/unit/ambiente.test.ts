import { afterEach, describe, expect, it, vi } from "vitest";

async function urlCom(valor: string | undefined) {
  vi.resetModules();
  if (valor === undefined) vi.stubEnv("NEXT_PUBLIC_DIAGNOSTICO_URL", undefined as unknown as string);
  else vi.stubEnv("NEXT_PUBLIC_DIAGNOSTICO_URL", valor);
  return (await import("@/config/ambiente")).DIAGNOSTICO_URL;
}

afterEach(() => vi.unstubAllEnvs());

describe("link do Diagnóstico", () => {
  it("usa o endereço oficial quando a variável não está definida", async () => {
    expect(await urlCom(undefined)).toBe("https://escalaimob.com.br");
    expect(await urlCom("")).toBe("https://escalaimob.com.br");
  });

  it("a variável substitui o padrão", async () => {
    expect(await urlCom("https://escalaimob.com.br/diagnostico")).toBe("https://escalaimob.com.br/diagnostico");
  });

  it("valor inválido desabilita o botão", async () => {
    expect(await urlCom("nao-e-url")).toBeNull();
  });
});
