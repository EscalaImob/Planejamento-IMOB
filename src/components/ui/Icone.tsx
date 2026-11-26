/**
 * Ícones de traço próprios da Escala IMOB (desenho geométrico simples, traço 1,75).
 * Sem telhados, chaves ou prédios genéricos.
 */
const TRACOS = {
  "seta-direita": <path d="M5 12h14M13 6l6 6-6 6" />,
  "seta-esquerda": <path d="M15 6l-6 6 6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  menos: <path d="M6 12h12" />,
  mais: <path d="M6 12h12M12 6v12" />,
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
    </>
  ),
  baixar: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  externo: <path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" />,
  recomecar: <path d="M4 12a8 8 0 1 0 2.34-5.66M4 4v4h4" />,
  /* etapas */
  diagnostico: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
      <path d="M9 9h6M9 13h6M9 17h3" />
    </>
  ),
  canais: (
    <>
      <circle cx="6" cy="6" r="2.25" />
      <circle cx="18" cy="6" r="2.25" />
      <circle cx="12" cy="18" r="2.25" />
      <path d="M8 7.2l2.8 8.6M16 7.2l-2.8 8.6M8.25 6h7.5" />
    </>
  ),
  meta: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </>
  ),
  plano: <path d="M4 19.5h16M7 16v-4M12 16V7M17 16v-6" />,
} as const;

export type NomeIcone = keyof typeof TRACOS;

export function Icone({
  nome,
  tamanho = 20,
  espessura = 1.75,
  className,
}: {
  nome: NomeIcone;
  tamanho?: number;
  espessura?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth={espessura}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {TRACOS[nome]}
    </svg>
  );
}
