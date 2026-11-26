import { useId } from "react";

/**
 * Isotipo oficial da Escala IMOB, convertido das curvas do arquivo vetorial
 * (assets/brand/vetor/escala-imob-vetor.pdf). Usa `currentColor`: a cor vem do texto do elemento pai.
 * Manual de marca: redução mínima de 40 px.
 */
const ANEL_EXTERNO =
  "M181.468 162.340 L146.021 162.340 C137.807 162.340 131.149 155.681 131.149 147.468 L131.149 111.478 C131.149 103.265 137.807 96.606 146.021 96.606 L181.468 96.606 C189.682 96.606 196.340 103.265 196.340 111.478 L196.340 147.468 C196.340 155.681 189.682 162.340 181.468 162.340 Z";
const ANEL_INTERNO =
  "M145.915 107.058 C143.316 107.058 141.202 109.172 141.202 111.770 L141.202 147.430 C141.202 150.029 143.316 152.143 145.915 152.143 L181.575 152.143 C184.173 152.143 186.287 150.029 186.287 147.430 L186.287 111.770 C186.287 109.172 184.173 107.058 181.575 107.058 Z M181.575 159.143 L145.915 159.143 C139.457 159.143 134.202 153.889 134.202 147.430 L134.202 111.770 C134.202 105.312 139.457 100.058 145.915 100.058 L181.575 100.058 C188.033 100.058 193.287 105.312 193.287 111.770 L193.287 147.430 C193.287 153.889 188.033 159.143 181.575 159.143 Z";
const TELHADO =
  "M197.353 141.018 C197.353 141.018 197.337 133.694 197.337 133.694 C197.337 133.694 185.650 125.552 163.828 110.350 C163.799 110.393 163.769 110.435 163.740 110.478 C163.710 110.435 163.680 110.393 163.651 110.350 C145.330 123.113 130.149 133.689 130.147 133.690 C130.147 133.690 130.136 141.011 130.136 141.011 C130.137 141.011 141.759 132.913 163.740 117.601 C185.644 132.861 197.353 141.018 197.353 141.018 Z";

export function Isotipo({ tamanho = 32, className, titulo }: { tamanho?: number; className?: string; titulo?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="129.6 95.1 68.3 68.8"
      width={tamanho}
      height={tamanho}
      className={className}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
    >
      <defs>
        {/* Recorte do telhado sobre os anéis (no original, um traço branco de 4,5 pt). */}
        <mask id={`recorte-${id}`} maskUnits="userSpaceOnUse" x="120" y="85" width="90" height="90">
          <rect x="120" y="85" width="90" height="90" fill="#fff" />
          <path d={TELHADO} fill="#000" stroke="#000" strokeWidth="4.5" strokeLinejoin="miter" />
        </mask>
      </defs>
      <g mask={`url(#recorte-${id})`}>
        <path d={ANEL_EXTERNO} fill="none" stroke="currentColor" strokeWidth="2" />
        <path d={ANEL_INTERNO} fill="currentColor" fillRule="evenodd" />
      </g>
      <path d={TELHADO} fill="currentColor" />
    </svg>
  );
}
