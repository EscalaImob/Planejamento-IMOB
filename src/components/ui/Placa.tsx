/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import type { CanalId, PlataformaLogo } from "@/config/canais";
import { canalPorId } from "@/config/canais";

/**
 * Placas: quadrado com fio e sombra contendo um ícone cheio em dois tons de azul (desenho próprio),
 * ou a logomarca oficial da plataforma quando o arquivo existe em public/third-party/.
 */

const A = "var(--color-azul)";
const B = "var(--color-azul-suave)";

const DESENHOS = {
  perfil: (
    <>
      <ellipse cx="12" cy="17.5" rx="7" ry="4" fill={B} />
      <circle cx="12" cy="7" r="4" fill={A} />
    </>
  ),
  comissao: (
    <>
      <rect x="2.5" y="8" width="16" height="10.5" rx="2.5" fill={B} />
      <rect x="5.5" y="5" width="16" height="10.5" rx="2.5" fill={A} />
      <circle cx="13.5" cy="10.25" r="2.4" fill="#fff" />
    </>
  ),
  percentual: (
    <>
      <circle cx="12" cy="12" r="9.5" fill={B} />
      <path d="M8 16 16 8" stroke={A} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="8.6" cy="8.6" r="1.9" fill={A} />
      <circle cx="15.4" cy="15.4" r="1.9" fill={A} />
    </>
  ),
  ticket: (
    <>
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h6.1a2.5 2.5 0 0 1 1.77.73l7.4 7.4a2.5 2.5 0 0 1 0 3.54l-6.1 6.1a2.5 2.5 0 0 1-3.54 0l-7.4-7.4A2.5 2.5 0 0 1 3 11.6Z" fill={B} />
      <circle cx="8" cy="8" r="2" fill={A} />
      <path d="M11 15.5 15.5 11" stroke={A} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  canais: (
    <>
      <path d="M6 6.5 12 17.5 18 6.5Z" stroke={B} strokeWidth="2" strokeLinejoin="round" fill="none" />
      <circle cx="6" cy="6.5" r="3" fill={A} />
      <circle cx="18" cy="6.5" r="3" fill={A} />
      <circle cx="12" cy="17.5" r="3" fill={A} />
    </>
  ),
  meta: (
    <>
      <circle cx="12" cy="12" r="9.5" fill={B} />
      <circle cx="12" cy="12" r="5.5" fill={A} />
      <circle cx="12" cy="12" r="2" fill="#fff" />
    </>
  ),
  indicacao: (
    <>
      <circle cx="8.5" cy="7.5" r="3.2" fill={A} />
      <circle cx="16" cy="9" r="2.6" fill={B} />
      <path d="M2.5 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5Z" fill={A} />
      <path d="M13.5 19c.2-2.4 1-4.2 2.5-4.6 2.6-.6 5.5 1.3 5.5 4.6Z" fill={B} />
    </>
  ),
  prospeccao: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5Z" fill={B} />
      <path d="M8.5 8h7M8.5 11.5h4.5" stroke={A} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  portais: (
    <>
      <rect x="3" y="3.5" width="18" height="17" rx="3" fill={B} />
      <rect x="5.5" y="8" width="5.5" height="5" rx="1.2" fill={A} />
      <rect x="13" y="8" width="5.5" height="5" rx="1.2" fill={A} />
      <rect x="5.5" y="14.5" width="13" height="3" rx="1.2" fill={A} />
      <circle cx="6.2" cy="5.8" r="0.9" fill={A} />
    </>
  ),
  parcerias: (
    <>
      <circle cx="9" cy="12" r="6.5" fill={B} />
      <circle cx="15" cy="12" r="6.5" fill={A} fillOpacity="0.85" />
    </>
  ),
  lancamentos: (
    <>
      <rect x="4" y="14.5" width="16" height="5" rx="1.8" fill={A} />
      <rect x="6" y="9" width="12" height="4.5" rx="1.8" fill={B} />
      <rect x="8" y="4" width="8" height="4" rx="1.8" fill={A} />
    </>
  ),
  trafego: (
    <>
      <path d="M4 10v4a1.5 1.5 0 0 0 1.5 1.5H8l6.5 4V4.5L8 8.5H5.5A1.5 1.5 0 0 0 4 10Z" fill={A} />
      <path d="M17.5 9a4 4 0 0 1 0 6" stroke={B} strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  social: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5.5" fill={B} />
      <circle cx="12" cy="12" r="4" fill={A} />
      <circle cx="17" cy="7" r="1.3" fill={A} />
    </>
  ),
  base: (
    <>
      <path d="M20 17.5c0 2-3.6 3.5-8 3.5s-8-1.5-8-3.5v-11h16Z" fill={B} />
      <ellipse cx="12" cy="6.5" rx="8" ry="3.5" fill={A} />
      <path d="M4 12c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5" stroke={A} strokeWidth="1.6" fill="none" />
    </>
  ),
  google: (
    <>
      <path d="M12 21.5s-7-6.2-7-11.5a7 7 0 0 1 14 0c0 5.3-7 11.5-7 11.5Z" fill={B} />
      <circle cx="12" cy="10" r="3" fill={A} />
    </>
  ),
  ligar: (
    <>
      <circle cx="12" cy="12" r="9.5" fill={B} />
      <path d="M13 4.5 7.5 13h4l-1 6.5L16.5 11h-4Z" fill={A} />
    </>
  ),
  atender: (
    <>
      <path d="M3 6.5A3.5 3.5 0 0 1 6.5 3h11A3.5 3.5 0 0 1 21 6.5v7a3.5 3.5 0 0 1-3.5 3.5H10l-5 4v-4.3A3.5 3.5 0 0 1 3 13.5Z" fill={B} />
      <circle cx="8.5" cy="10" r="1.4" fill={A} />
      <circle cx="12" cy="10" r="1.4" fill={A} />
      <circle cx="15.5" cy="10" r="1.4" fill={A} />
    </>
  ),
  revisar: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="3" fill={B} />
      <path d="m7.5 9 1.6 1.6L12 7.7M7.5 15l1.6 1.6 2.9-2.9" stroke={A} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M14 9h3M14 15h3" stroke={A} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type NomeIconePlaca = keyof typeof DESENHOS;

const TAMANHOS = {
  g: { caixa: "size-14 rounded-2xl shadow-placa", icone: 32 },
  m: { caixa: "size-12 rounded-xl", icone: 28 },
  p: { caixa: "size-10 rounded-[11px]", icone: 23 },
};

/**
 * Logomarcas oficiais (decisão de 25/11/2026). Os arquivos devem ser obtidos nos centros de marca
 * oficiais e salvos em public/third-party/. Enquanto `LOGOS_DISPONIVEIS` não listar a plataforma,
 * a placa usa o ícone próprio equivalente.
 */
export const LOGOS_DISPONIVEIS: Partial<Record<PlataformaLogo, string>> = {};

const ICONE_DO_CANAL: Record<CanalId, NomeIconePlaca> = {
  trafego: "trafego",
  social: "social",
  base: "base",
  indicacao: "indicacao",
  prospeccao: "prospeccao",
  portais: "portais",
  google: "google",
  parcerias: "parcerias",
  lancamentos: "lancamentos",
};

export function Placa({
  icone,
  canal,
  tamanho = "g",
}: {
  icone?: NomeIconePlaca;
  canal?: CanalId;
  tamanho?: keyof typeof TAMANHOS;
}) {
  const t = TAMANHOS[tamanho];
  const logo = canal ? canalPorId(canal).logo : undefined;
  const arquivo = logo ? LOGOS_DISPONIVEIS[logo] : undefined;
  const nome = icone ?? (canal ? ICONE_DO_CANAL[canal] : "canais");
  return (
    <span aria-hidden="true" className={`grid flex-none place-items-center border border-fio bg-white ${t.caixa}`}>
      {arquivo ? (
        <img src={arquivo} alt="" width={t.icone} height={t.icone} className="object-contain" />
      ) : (
        <svg viewBox="0 0 24 24" width={t.icone} height={t.icone}>
          {DESENHOS[nome]}
        </svg>
      )}
    </span>
  );
}
